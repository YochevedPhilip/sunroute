import { describe, expect, it } from "vitest";
import { filterByLine, parseBusOptions } from "./bus";

// "_p~iF~ps|U_ulLnnqC_mqNvxq`@" is a valid encoded polyline (3 points)
const POLY = "_p~iF~ps|U_ulLnnqC_mqNvxq`@";

const sample = {
  routes: [
    {
      legs: [
        {
          steps: [
            { travelMode: "WALK", polyline: { encodedPolyline: POLY } },
            {
              travelMode: "TRANSIT",
              polyline: { encodedPolyline: POLY },
              transitDetails: {
                stopDetails: {
                  departureStop: { name: "תחנה א" },
                  arrivalStop: { name: "תחנה ב" },
                  departureTime: "2026-11-15T12:00:00Z",
                  arrivalTime: "2026-11-15T12:40:00Z",
                },
                headsign: "חיפה",
                transitLine: {
                  name: "תל אביב - חיפה",
                  nameShort: "921",
                  vehicle: { type: "BUS" },
                },
              },
            },
            { travelMode: "WALK", polyline: { encodedPolyline: POLY } },
          ],
        },
      ],
    },
    {
      legs: [
        {
          steps: [
            {
              travelMode: "TRANSIT",
              polyline: { encodedPolyline: POLY },
              transitDetails: {
                stopDetails: {
                  departureStop: { name: "ג" },
                  arrivalStop: { name: "ד" },
                  departureTime: "2026-11-15T13:00:00Z",
                  arrivalTime: "2026-11-15T13:30:00Z",
                },
                transitLine: { name: "קו ארוך", vehicle: { type: "BUS" } },
              },
            },
          ],
        },
      ],
    },
  ],
};

describe("parseBusOptions", () => {
  it("keeps only the transit rides, with line, stops, times and shape", () => {
    const opts = parseBusOptions(sample);
    expect(opts).toHaveLength(2);
    const leg = opts[0].legs[0];
    expect(opts[0].legs).toHaveLength(1); // walking steps are dropped
    expect(leg.line).toBe("921");
    expect(leg.headsign).toBe("חיפה");
    expect(leg.fromStop).toBe("תחנה א");
    expect(leg.toStop).toBe("תחנה ב");
    expect(leg.points).toHaveLength(3);
    expect(leg.arrival.getTime() - leg.departure.getTime()).toBe(40 * 60_000);
    expect(opts[0].departure).toEqual(leg.departure);
  });

  it("falls back to the long name when there is no short name", () => {
    expect(parseBusOptions(sample)[1].legs[0].line).toBe("קו ארוך");
  });

  it("returns an empty list for an empty or odd response", () => {
    expect(parseBusOptions({})).toEqual([]);
    expect(parseBusOptions(null)).toEqual([]);
    expect(parseBusOptions({ routes: [{ legs: [{ steps: [{}] }] }] })).toEqual([]);
  });

  it("skips rides with bad times", () => {
    const bad = JSON.parse(JSON.stringify(sample));
    bad.routes[0].legs[0].steps[1].transitDetails.stopDetails.arrivalTime = "oops";
    expect(parseBusOptions(bad)).toHaveLength(1);
  });
});

describe("filterByLine", () => {
  it("keeps options that use the line, or everything for an empty filter", () => {
    const opts = parseBusOptions(sample);
    expect(filterByLine(opts, "921")).toHaveLength(1);
    expect(filterByLine(opts, " 921 ")).toHaveLength(1);
    expect(filterByLine(opts, "5")).toHaveLength(0);
    expect(filterByLine(opts, "")).toHaveLength(2);
  });
});
