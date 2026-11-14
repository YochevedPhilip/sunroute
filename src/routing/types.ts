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

/** One ride on one public transport line (walking parts are left out). */
export interface BusLeg {
  /** Google vehicle type, for example BUS or HEAVY_RAIL. */
  vehicle: string;
  /** Line number or short name, for example "480". */
  line: string;
  headsign: string;
  fromStop: string;
  toStop: string;
  departure: Date;
  arrival: Date;
  points: LatLng[];
}

export interface BusOption {
  legs: BusLeg[];
  /** Departure of the first ride and arrival of the last ride. */
  departure: Date;
  arrival: Date;
}

export class RouteError extends Error {
  constructor(
    public kind: "no-route" | "no-line" | "network" | "api" | "bad-input",
    message: string,
  ) {
    super(message);
  }
}
