import type { LatLng } from "../sun/geo";

export interface PlaceRef {
  /** Text shown to the user. */
  text: string;
  /** Google place id (from the search list). */
  placeId?: string;
  /** Coordinates (for "my location"). */
  location?: LatLng;
  isMyLocation?: boolean;
}

export interface RouteResult {
  points: LatLng[];
  durationSec: number;
  distanceMeters: number;
}

/** The app only talks to this interface, so the provider can be replaced. */
export interface RouteProvider {
  getRoute(from: PlaceRef, to: PlaceRef, departure: Date): Promise<RouteResult>;
}

export class RouteError extends Error {
  constructor(
    public kind: "no-route" | "network" | "api" | "bad-input",
    message: string,
  ) {
    super(message);
  }
}
