import { decodePolyline } from "./polyline";
import type { BusLeg, BusOption } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Turn a Google computeRoutes (TRANSIT) response into bus options. */
export function parseBusOptions(data: any): BusOption[] {
  const options: BusOption[] = [];
  for (const route of data?.routes ?? []) {
    const legs: BusLeg[] = [];
    for (const leg of route?.legs ?? []) {
      for (const step of leg?.steps ?? []) {
        const t = step?.transitDetails;
        const encoded: string | undefined = step?.polyline?.encodedPolyline;
        if (!t || !encoded) continue; // walking steps have no transit details
        const departure = new Date(t.stopDetails?.departureTime ?? "");
        const arrival = new Date(t.stopDetails?.arrivalTime ?? "");
        const points = decodePolyline(encoded);
        if (
          Number.isNaN(departure.getTime()) ||
          Number.isNaN(arrival.getTime()) ||
          arrival <= departure ||
          points.length < 2
        ) {
          continue;
        }
        legs.push({
          vehicle: t.transitLine?.vehicle?.type ?? "BUS",
          line: String(t.transitLine?.nameShort ?? t.transitLine?.name ?? "").trim(),
          headsign: t.headsign ?? "",
          fromStop: t.stopDetails?.departureStop?.name ?? "",
          toStop: t.stopDetails?.arrivalStop?.name ?? "",
          departure,
          arrival,
          points,
        });
      }
    }
    if (legs.length > 0) {
      options.push({
        legs,
        departure: legs[0].departure,
        arrival: legs[legs.length - 1].arrival,
      });
    }
  }
  return options;
}

/** Keep only the options that use the given line number (empty filter keeps all). */
export function filterByLine(options: BusOption[], line: string): BusOption[] {
  const wanted = line.trim();
  if (!wanted) return options;
  return options.filter((o) => o.legs.some((l) => l.line === wanted));
}
