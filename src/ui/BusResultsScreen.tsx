import { useMemo, useState } from "react";
import { he } from "../i18n/he";
import type { BusLeg, BusOption, PlaceRef } from "../routing/types";
import { analyzeRoute } from "../sun/exposure";
import { AnalysisView } from "./AnalysisView";
import { formatClock, formatDayTime, formatDuration } from "./format";
import { headline } from "./headline";

interface Props {
  from: PlaceRef;
  to: PlaceRef;
  options: BusOption[];
  onBack: () => void;
}

function vehicleIcon(type: string): string {
  if (type.includes("RAIL") || type === "TRAIN" || type === "SUBWAY") return "🚆";
  return "🚌";
}

function legDurationSec(leg: BusLeg): number {
  return Math.max(60, (leg.arrival.getTime() - leg.departure.getTime()) / 1000);
}

export function BusResultsScreen({ from, to, options, onBack }: Props) {
  const [optIdx, setOptIdx] = useState(0);
  const [legIdx, setLegIdx] = useState(0);

  // sun analysis for every ride of every option
  const analyses = useMemo(
    () =>
      options.map((o) =>
        o.legs.map((l) => analyzeRoute(l.points, l.departure, legDurationSec(l))),
      ),
    [options],
  );

  const option = options[Math.min(optIdx, options.length - 1)];
  const legI = Math.min(legIdx, option.legs.length - 1);
  const leg = option.legs[legI];
  const analysis = analyses[Math.min(optIdx, options.length - 1)][legI];

  const pickOption = (i: number) => {
    setOptIdx(i);
    setLegIdx(0);
  };

  return (
    <main className="screen results">
      <header className="topbar">
        <button type="button" className="back-btn" onClick={onBack}>
          → {he.back}
        </button>
        <div className="trip-title">
          {from.text} ← {to.text}
        </div>
      </header>

      <section className="card">
        <h2>{he.busOptions}</h2>
        <ul className="compare">
          {options.map((o, i) => (
            <li key={i} className={i === optIdx ? "active" : ""}>
              <button
                type="button"
                className="pick"
                onClick={() => pickOption(i)}
                aria-pressed={i === optIdx}
              >
                <span className="when">
                  {formatDayTime(o.departure)} – {formatClock(o.arrival)}
                </span>
                <span className="chips">
                  {o.legs.map((l, k) => (
                    <span key={k} className="chip">
                      {vehicleIcon(l.vehicle)} {l.line || he.lineWord}
                    </span>
                  ))}
                </span>
                <span className="what">
                  {o.legs.length === 1 ? headline(analyses[i][0]) : `${he.multiLine} – ${he.chooseLine}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {option.legs.length > 1 && (
        <section className="card">
          <h2>{he.busLegs}</h2>
          <ul className="compare">
            {option.legs.map((l, k) => (
              <li key={k} className={k === legI ? "active" : ""}>
                <button
                  type="button"
                  className="pick"
                  onClick={() => setLegIdx(k)}
                  aria-pressed={k === legI}
                >
                  <span className="when">
                    {vehicleIcon(l.vehicle)} {he.lineWord} {l.line}
                  </span>
                  <span className="nums">
                    {formatClock(l.departure)} – {formatClock(l.arrival)}
                  </span>
                  <span className="what">{headline(analyses[optIdx][k])}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={`answer answer-${analysis.recommendation}`} aria-live="polite">
        <div className="answer-text">{headline(analysis)}</div>
        <div className="answer-meta">
          {vehicleIcon(leg.vehicle)} {he.lineWord} {leg.line}
          {leg.headsign ? ` → ${leg.headsign}` : ""} · {formatClock(leg.departure)}–
          {formatClock(leg.arrival)} · {formatDuration(legDurationSec(leg))}
        </div>
        <div className="answer-meta">
          {he.stopFrom}: {leg.fromStop} · {he.stopTo}: {leg.toStop}
        </div>
      </section>

      <AnalysisView key={`${optIdx}-${legI}`} analysis={analysis} departure={leg.departure} />

      <p className="estimate-note">{he.busNote}</p>
      <p className="estimate-note">{he.estimateNote}</p>
    </main>
  );
}
