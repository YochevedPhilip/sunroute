import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DEMO_FROM, DEMO_ROUTE, DEMO_TO } from "../routing/demo";
import { ResultsScreen } from "./ResultsScreen";

describe("ResultsScreen (demo trip)", () => {
  it("renders the answer, the map and the summary in Hebrew", () => {
    const html = renderToString(
      <ResultsScreen
        from={DEMO_FROM}
        to={DEMO_TO}
        route={DEMO_ROUTE}
        departure={new Date("2026-11-14T13:00:00Z")}
        onBack={() => {}}
      />,
    );
    // northbound in the afternoon: sit on the right
    expect(html).toContain("שבו בצד ימין");
    expect(html).toContain("<svg");
    expect(html).toContain("סיכום הנסיעה");
    expect(html).toContain("השוואת שעות יציאה");
    expect(html).toContain("זו הערכה");
  });

  it("says it is night when the sun is down", () => {
    const html = renderToString(
      <ResultsScreen
        from={DEMO_FROM}
        to={DEMO_TO}
        route={DEMO_ROUTE}
        departure={new Date("2026-11-14T22:00:00Z")}
        onBack={() => {}}
      />,
    );
    expect(html).toContain("הנסיעה בלילה");
  });
});
