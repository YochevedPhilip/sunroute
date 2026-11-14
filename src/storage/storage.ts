import type { PlaceRef } from "../routing/types";

const RECENT_KEY = "sunroute.recentPlaces";
const SAVED_KEY = "sunroute.savedPlaces";
const TRIPS_KEY = "sunroute.recentTrips";
const MAX_RECENT = 8;

export interface TripRef {
  from: PlaceRef;
  to: PlaceRef;
}

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage may be blocked (private mode); the app still works */
  }
}

/** Stable identity of a place: Google place id, or rounded coordinates. */
export function placeKey(p: PlaceRef): string {
  if (p.placeId) return p.placeId;
  if (p.location)
    return `${p.location.lat.toFixed(4)},${p.location.lng.toFixed(4)}`;
  return p.text;
}

export const loadRecentPlaces = () => read<PlaceRef>(RECENT_KEY);
export const loadSavedPlaces = () => read<PlaceRef>(SAVED_KEY);
export const loadRecentTrips = () => read<TripRef>(TRIPS_KEY);

export function addRecentPlace(place: PlaceRef): void {
  if (place.isMyLocation) return;
  const list = loadRecentPlaces().filter((p) => placeKey(p) !== placeKey(place));
  list.unshift(place);
  write(RECENT_KEY, list.slice(0, MAX_RECENT));
}

export function addRecentTrip(trip: TripRef): void {
  const same = (t: TripRef) =>
    placeKey(t.from) === placeKey(trip.from) && placeKey(t.to) === placeKey(trip.to);
  const list = loadRecentTrips().filter((t) => !same(t));
  list.unshift(trip);
  write(TRIPS_KEY, list.slice(0, 5));
}

export function isSaved(place: PlaceRef): boolean {
  return loadSavedPlaces().some((p) => placeKey(p) === placeKey(place));
}

/** Add or remove a place from the saved list. Returns the new list. */
export function toggleSaved(place: PlaceRef): PlaceRef[] {
  const list = loadSavedPlaces();
  const exists = list.some((p) => placeKey(p) === placeKey(place));
  const next = exists
    ? list.filter((p) => placeKey(p) !== placeKey(place))
    : [place, ...list];
  write(SAVED_KEY, next);
  return next;
}
