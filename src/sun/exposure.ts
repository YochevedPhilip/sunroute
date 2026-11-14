import { SUN_CONFIG } from "./config";
import {
  bearingDeg,
  distanceMeters,
  interpolate,
  normalizeAngle,
  type LatLng,
} from "./geo";
import { getSunPosition } from "./sunPosition";

export type SunClass = "right" | "left" | "front" | "behind" | "night";
export type Recommendation = "right" | "left" | "none" | "night";

export interface RouteStep {
  from: LatLng;
  to: LatLng;
  /** Heading of travel, degrees clockwise from north. */
  headingDeg: number;
  lengthMeters: number;
  /** Seconds since departure at the middle of the step. */
  midTimeSec: number;
  durationSec: number;
  sunAzimuthDeg: number;
  sunElevationDeg: number;
  /** Sun azimuth minus heading, in (-180, 180]. Positive = sun on the right. */
  relativeAngleDeg: number;
  sunClass: SunClass;
  /** Estimated exposure weight 0..1 for the side the sun is on (0 for other classes). */
  weight: number;
}

export interface RouteAnalysis {
  steps: RouteStep[];
  totalDurationSec: number;
  /** Seconds spent in each class. */
  secondsByClass: Record<SunClass, number>;
  /** Share (0..1) of the journey time in each class. */
  shareByClass: Record<SunClass, number>;
  /** Weighted exposure in "full sun seconds" for each side. */
  exposureSec: { right: number; left: number };
  recommendation: Recommendation;
}

export function classifySun(
  relativeAngleDeg: number,
  elevationDeg: number,
): SunClass {
  if (elevationDeg < SUN_CONFIG.horizonElevationDeg) return "night";
  const abs = Math.abs(relativeAngleDeg);
  if (abs <= SUN_CONFIG.frontHalfAngleDeg) return "front";
  if (abs >= SUN_CONFIG.behindFromAngleDeg) return "behind";
  return relativeAngleDeg > 0 ? "right" : "left";
}

/** Exposure weight for a side window: cos(elevation) * |sin(relative angle)|. */
export function exposureWeight(
  relativeAngleDeg: number,
  elevationDeg: number,
): number {
  const rad = Math.PI / 180;
  return (
    Math.max(0, Math.cos(elevationDeg * rad)) *
    Math.abs(Math.sin(relativeAngleDeg * rad))
  );
}

/** Cut a polyline into small pieces (<= maxMeters) with their lengths. */
export function resampleRoute(
  points: LatLng[],
  maxMeters: number,
): { from: LatLng; to: LatLng; lengthMeters: number }[] {
  const pieces: { from: LatLng; to: LatLng; lengthMeters: number }[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const len = distanceMeters(a, b);
    if (len < 0.5) continue; // skip duplicate points
    const n = Math.max(1, Math.ceil(len / maxMeters));
    for (let k = 0; k < n; k++) {
      const from = interpolate(a, b, k / n);
      const to = interpolate(a, b, (k + 1) / n);
      pieces.push({ from, to, lengthMeters: len / n });
    }
  }
  return pieces;
}

/**
 * Analyze a route.
 * @param points polyline of the route (at least 2 points)
 * @param departure departure date and time
 * @param totalDurationSec travel time of the whole route in seconds;
 *        time is spread over the route in proportion to distance.
 */
export function analyzeRoute(
  points: LatLng[],
  departure: Date,
  totalDurationSec: number,
): RouteAnalysis {
  const pieces = resampleRoute(points, SUN_CONFIG.stepMeters);
  const totalLength = pieces.reduce((s, p) => s + p.lengthMeters, 0);

  const secondsByClass: Record<SunClass, number> = {
    right: 0,
    left: 0,
    front: 0,
    behind: 0,
    night: 0,
  };
  const exposureSec = { right: 0, left: 0 };
  const steps: RouteStep[] = [];

  let distSoFar = 0;
  for (const piece of pieces) {
    const durationSec =
      totalLength > 0 ? (piece.lengthMeters / totalLength) * totalDurationSec : 0;
    const midTimeSec =
      totalLength > 0
        ? ((distSoFar + piece.lengthMeters / 2) / totalLength) * totalDurationSec
        : 0;
    distSoFar += piece.lengthMeters;

    const headingDeg = bearingDeg(piece.from, piece.to);
    const mid = interpolate(piece.from, piece.to, 0.5);
    const when = new Date(departure.getTime() + midTimeSec * 1000);
    const sun = getSunPosition(mid, when);

    const relativeAngleDeg = normalizeAngle(sun.azimuthDeg - headingDeg);
    const sunClass = classifySun(relativeAngleDeg, sun.elevationDeg);
    const weight =
      sunClass === "right" || sunClass === "left"
        ? exposureWeight(relativeAngleDeg, sun.elevationDeg)
        : 0;

    secondsByClass[sunClass] += durationSec;
    if (sunClass === "right") exposureSec.right += durationSec * weight;
    if (sunClass === "left") exposureSec.left += durationSec * weight;

    steps.push({
      from: piece.from,
      to: piece.to,
      headingDeg,
      lengthMeters: piece.lengthMeters,
      midTimeSec,
      durationSec,
      sunAzimuthDeg: sun.azimuthDeg,
      sunElevationDeg: sun.elevationDeg,
      relativeAngleDeg,
      sunClass,
      weight,
    });
  }

  const shareByClass = { ...secondsByClass };
  for (const key of Object.keys(shareByClass) as SunClass[]) {
    shareByClass[key] =
      totalDurationSec > 0 ? secondsByClass[key] / totalDurationSec : 0;
  }

  return {
    steps,
    totalDurationSec,
    secondsByClass,
    shareByClass,
    exposureSec,
    recommendation: recommend(exposureSec, secondsByClass.night, totalDurationSec),
  };
}

/** The recommended side is the one with LESS sun. */
export function recommend(
  exposure: { right: number; left: number },
  nightSeconds: number,
  totalSeconds: number,
): Recommendation {
  if (totalSeconds > 0 && nightSeconds / totalSeconds > 0.99) return "night";
  const total = exposure.right + exposure.left;
  if (total <= 0) return "none";
  const diff = Math.abs(exposure.right - exposure.left) / total;
  if (diff < SUN_CONFIG.clearDifferenceRatio) return "none";
  return exposure.right > exposure.left ? "left" : "right";
}
