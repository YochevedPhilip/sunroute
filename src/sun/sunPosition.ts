import SunCalc from "suncalc";
import type { LatLng } from "./geo";

export interface SunPosition {
  /** Degrees clockwise from north (0 = N, 90 = E, 180 = S, 270 = W). */
  azimuthDeg: number;
  /** Degrees above the horizon. Negative = below the horizon. */
  elevationDeg: number;
}

/**
 * The ONLY place that talks to SunCalc.
 * SunCalc returns azimuth in radians measured from SOUTH, positive towards WEST.
 * We convert it to the usual compass convention (clockwise from north).
 */
export function getSunPosition(point: LatLng, when: Date): SunPosition {
  const p = SunCalc.getPosition(when, point.lat, point.lng);
  const azimuthDeg = (((p.azimuth * 180) / Math.PI + 180) % 360 + 360) % 360;
  const elevationDeg = (p.altitude * 180) / Math.PI;
  return { azimuthDeg, elevationDeg };
}
