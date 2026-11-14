import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DEMO_FROM, DEMO_TO, demoBusOptions } from "../routing/demo";
import { BusResultsScreen } from "./BusResultsScreen";

describe("BusResultsScreen (demo)", () => {
  it("shows the options, the line, the stops and the answer", () => {
    const options = demoBusOptions(new Date("2026-11-14T12:55:00Z"));
    const html = renderToString(
      <BusResultsScreen from={DEMO_FROM} to={DEMO_TO} options={options} onBack={() => {}} />,
    );
    expect(html).toContain("אפשרויות נסיעה");
    expect(html).toContain("אקספרס 1");
    expect(html).toContain("אקספרס 2");
    expect(html).toContain("ת. מרכזית תל אביב");
    // northbound in the afternoon: sit on the right
    expect(html).toContain("שבו בצד ימין");
    expect(html).toContain("סיכום הנסיעה");
  });
});
