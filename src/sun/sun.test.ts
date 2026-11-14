import { describe, expect, it } from "vitest";
import {
  analyzeRoute,
  classifySun,
  exposureWeight,
  recommend,
  resampleRoute,
} from "./exposure";
import { bearingDeg, distanceMeters, normalizeAngle } from "./geo";
import { getSunPosition } from "./sunPosition";

const TEL_AVIV = { lat: 32.0853, lng: 34.7818 };
const HAIFA = { lat: 32.794, lng: 34.9896 };

describe("geo", () => {
  it("bearing on the four directions", () => {
    const o = { lat: 32, lng: 35 };
    expect(bearingDeg(o, { lat: 33, lng: 35 })).toBeCloseTo(0, 1);
    expect(bearingDeg(o, { lat: 32, lng: 36 })).toBeCloseTo(90, 0);
    expect(bearingDeg(o, { lat: 31, lng: 35 })).toBeCloseTo(180, 1);
    expect(bearingDeg(o, { lat: 32, lng: 34 })).toBeCloseTo(270, 0);
  });

  it("normalizeAngle wraps to (-180, 180]", () => {
    expect(normalizeAngle(190)).toBeCloseTo(-170);
    expect(normalizeAngle(-190)).toBeCloseTo(170);
    expect(normalizeAngle(360)).toBeCloseTo(0);
    expect(normalizeAngle(180)).toBeCloseTo(180);
  });

  it("distance Tel Aviv - Haifa is about 80 km", () => {
    const d = distanceMeters(TEL_AVIV, HAIFA) / 1000;
    expect(d).toBeGreaterThan(75);
    expect(d).toBeLessThan(90);
  });
});

describe("sun position (compass convention)", () => {
  it("summer solar noon: high in the south", () => {
    // 2026-06-21 09:40 UTC is about solar noon in Tel Aviv
    const s = getSunPosition(TEL_AVIV, new Date("2026-06-21T09:40:00Z"));
    expect(s.elevationDeg).toBeGreaterThan(78);
    expect(s.elevationDeg).toBeLessThan(83);
  });

  it("winter solar noon: sun in the south, medium height", () => {
    const s = getSunPosition(TEL_AVIV, new Date("2026-12-21T09:45:00Z"));
    expect(Math.abs(s.azimuthDeg - 180)).toBeLessThan(10);
    expect(s.elevationDeg).toBeGreaterThan(30);
    expect(s.elevationDeg).toBeLessThan(40);
  });

  it("morning sun is in the east, afternoon sun in the west", () => {
    const am = getSunPosition(TEL_AVIV, new Date("2026-11-14T05:00:00Z"));
    const pm = getSunPosition(TEL_AVIV, new Date("2026-11-14T13:00:00Z"));
    expect(am.azimuthDeg).toBeGreaterThan(90);
    expect(am.azimuthDeg).toBeLessThan(150);
    expect(pm.azimuthDeg).toBeGreaterThan(210);
    expect(pm.azimuthDeg).toBeLessThan(270);
  });

  it("is below the horizon at night", () => {
    const s = getSunPosition(TEL_AVIV, new Date("2026-11-14T22:00:00Z"));
    expect(s.elevationDeg).toBeLessThan(0);
  });
});

describe("classifySun", () => {
  it("class borders", () => {
    expect(classifySun(0, 30)).toBe("front");
    expect(classifySun(30, 30)).toBe("front");
    expect(classifySun(31, 30)).toBe("right");
    expect(classifySun(-31, 30)).toBe("left");
    expect(classifySun(149, 30)).toBe("right");
    expect(classifySun(150, 30)).toBe("behind");
    expect(classifySun(-150, 30)).toBe("behind");
    expect(classifySun(180, 30)).toBe("behind");
    expect(classifySun(90, -5)).toBe("night");
  });
});

describe("exposureWeight", () => {
  it("low side sun is strong, high sun is weak", () => {
    expect(exposureWeight(90, 0)).toBeCloseTo(1);
    expect(exposureWeight(90, 80)).toBeLessThan(0.2);
    expect(exposureWeight(0, 20)).toBeCloseTo(0);
  });
});

describe("resampleRoute", () => {
  it("cuts a long segment into steps of at most the max length", () => {
    const pieces = resampleRoute([TEL_AVIV, HAIFA], 200);
    expect(pieces.length).toBeGreaterThan(300);
    for (const p of pieces) expect(p.lengthMeters).toBeLessThanOrEqual(200.001);
  });

  it("ignores duplicate points", () => {
    expect(resampleRoute([TEL_AVIV, TEL_AVIV], 200)).toHaveLength(0);
  });
});

describe("analyzeRoute", () => {
  it("driving north in the winter afternoon: sun on the left, sit on the right", () => {
    // 15:00 local (13:00 UTC), 1 hour drive Tel Aviv -> Haifa
    const r = analyzeRoute(
      [TEL_AVIV, HAIFA],
      new Date("2026-11-14T13:00:00Z"),
      3600,
    );
    expect(r.secondsByClass.left + r.secondsByClass.behind).toBeGreaterThan(3000);
    expect(r.secondsByClass.right).toBeLessThan(60);
    expect(r.recommendation).toBe("right");
  });

  it("driving south in the winter afternoon: sun on the right, sit on the left", () => {
    const r = analyzeRoute(
      [HAIFA, TEL_AVIV],
      new Date("2026-11-14T12:30:00Z"),
      3600,
    );
    expect(r.recommendation).toBe("left");
  });

  it("driving west towards the afternoon sun: sun in front, no clear side", () => {
    const west = { lat: 32.0, lng: 34.0 };
    const east = { lat: 32.0, lng: 35.0 };
    // Near the equinox the sun sets due west, so driving west it is straight ahead.
    const r = analyzeRoute([east, west], new Date("2026-03-20T14:30:00Z"), 3000);
    expect(r.shareByClass.front).toBeGreaterThan(0.8);
    expect(r.recommendation).toBe("none");
  });

  it("night trip", () => {
    const r = analyzeRoute(
      [TEL_AVIV, HAIFA],
      new Date("2026-11-14T22:00:00Z"),
      3600,
    );
    expect(r.shareByClass.night).toBeGreaterThan(0.99);
    expect(r.recommendation).toBe("night");
  });

  it("shares add up to 1", () => {
    const r = analyzeRoute(
      [TEL_AVIV, HAIFA],
      new Date("2026-11-14T14:30:00Z"), // crosses sunset
      3600,
    );
    const sum = Object.values(r.shareByClass).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
  });
});

describe("recommend", () => {
  it("picks the side with less sun, or none if similar", () => {
    expect(recommend({ right: 100, left: 300 }, 0, 1000)).toBe("right");
    expect(recommend({ right: 300, left: 100 }, 0, 1000)).toBe("left");
    expect(recommend({ right: 100, left: 105 }, 0, 1000)).toBe("none");
    expect(recommend({ right: 0, left: 0 }, 0, 1000)).toBe("none");
  });
});
