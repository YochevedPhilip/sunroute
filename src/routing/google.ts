import { filterByLine, parseBusOptions } from "./bus";
import { decodePolyline } from "./polyline";
import {
  RouteError,
  type BusOption,
  type PlaceRef,
  type RouteProvider,
  type RouteResult,
} from "./types";

const ENDPOINT = "https://routes.googleapis.com/directions/v2:computeRoutes";

export const GOOGLE_KEY: string =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? "";

function waypoint(p: PlaceRef) {
  if (p.placeId) return { placeId: p.placeId };
  if (p.location)
    return {
      location: { latLng: { latitude: p.location.lat, longitude: p.location.lng } },
    };
  throw new RouteError("bad-input", "place has no id or location");
}

/** POST to the Routes API and return the parsed JSON, or throw a RouteError. */
async function postRoutes(body: Record<string, unknown>, fieldMask: string) {
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_KEY,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new RouteError("network", "network error");
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      message = err?.error?.message ?? message;
    } catch {
      /* ignore */
    }
    if (res.status === 404 || /no route/i.test(message)) {
      throw new RouteError("no-route", message);
    }
    throw new RouteError("api", message);
  }
  return res.json();
}

/** Google Routes API (REST). Traffic-aware when the departure is in the future. */
export const googleRouteProvider: RouteProvider = {
  async getRoute(from, to, departure): Promise<RouteResult> {
    const body: Record<string, unknown> = {
      origin: waypoint(from),
      destination: waypoint(to),
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      languageCode: "he",
      regionCode: "IL",
      units: "METRIC",
    };
    // Google rejects a departure time in the past.
    if (departure.getTime() > Date.now() + 60_000) {
      body.departureTime = departure.toISOString();
    }

    const data = await postRoutes(
      body,
      "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
    );
    const route = data?.routes?.[0];
    const encoded: string | undefined = route?.polyline?.encodedPolyline;
    if (!route || !encoded) throw new RouteError("no-route", "empty response");

    return {
      points: decodePolyline(encoded),
      durationSec: parseInt(String(route.duration ?? "0"), 10) || 0,
      distanceMeters: route.distanceMeters ?? 0,
    };
  },
};

/**
 * Public transport (bus) options between two places, with the shape and the
 * times of every ride. Google returns up to 4 options. `line` is an optional
 * line number: only options that use it are kept.
 */
export async function getBusOptions(
  from: PlaceRef,
  to: PlaceRef,
  departure: Date,
  line = "",
): Promise<BusOption[]> {
  const data = await postRoutes(
    {
      origin: waypoint(from),
      destination: waypoint(to),
      travelMode: "TRANSIT",
      computeAlternativeRoutes: true,
      transitPreferences: { allowedTravelModes: ["BUS"] },
      departureTime: departure.toISOString(),
      languageCode: "he",
      regionCode: "IL",
    },
    "routes.legs.steps.polyline.encodedPolyline,routes.legs.steps.transitDetails",
  );
  const all = parseBusOptions(data);
  if (all.length === 0) throw new RouteError("no-route", "no transit options");
  const kept = filterByLine(all, line);
  if (kept.length === 0) throw new RouteError("no-line", "line not found");
  return kept;
}
