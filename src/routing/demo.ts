import type { BusOption, PlaceRef, RouteResult } from "./types";

/** A rough Tel Aviv -> Haifa route along the coast, used for demo mode only. */
export const DEMO_FROM: PlaceRef = {
  text: "תל אביב-יפו",
  location: { lat: 32.0853, lng: 34.7818 },
};
export const DEMO_TO: PlaceRef = {
  text: "חיפה",
  location: { lat: 32.794, lng: 34.9896 },
};

export const DEMO_ROUTE: RouteResult = {
  points: [
    { lat: 32.0853, lng: 34.7818 },
    { lat: 32.1624, lng: 34.8447 },
    { lat: 32.2693, lng: 34.8581 },
    { lat: 32.4341, lng: 34.9196 },
    { lat: 32.5, lng: 34.9 },
    { lat: 32.6, lng: 34.93 },
    { lat: 32.7, lng: 34.96 },
    { lat: 32.794, lng: 34.9896 },
  ],
  durationSec: 4200,
  distanceMeters: 95000,
};

/** Demo bus options: the same road, as a made-up line. */
export function demoBusOptions(departure: Date): BusOption[] {
  const mk = (offsetMin: number, line: string): BusOption => {
    const dep = new Date(departure.getTime() + offsetMin * 60_000);
    const arr = new Date(dep.getTime() + 4800 * 1000);
    return {
      departure: dep,
      arrival: arr,
      legs: [
        {
          vehicle: "BUS",
          line,
          headsign: "חיפה",
          fromStop: "ת. מרכזית תל אביב",
          toStop: "חיפה מרכז השמונה",
          departure: dep,
          arrival: arr,
          points: DEMO_ROUTE.points,
        },
      ],
    };
  };
  return [mk(5, "אקספרס 1"), mk(35, "אקספרס 2")];
}
