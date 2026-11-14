import { useMemo, useState } from "react";
import { he } from "../i18n/he";
import type { PlaceRef, RouteResult } from "../routing/types";
import { analyzeRoute } from "../sun/exposure";
import { AnalysisView } from "./AnalysisView";
import {
  formatClock,
  formatDayTime,
  formatDistance,
  formatDuration,
  toTimeInput,
} from "./format";
import { bestSideSun, headline } from "./headline";

interface Props {
  from: PlaceRef;
  to: PlaceRef;
  route: RouteResult;
  departure: Date;
  onBack: () => void;
  /** Recalculate the trip in the opposite direction, at the selected time. */
  onReverse: (departure: Date) => void;
  busy?: boolean;
  error?: string;
}

const MAX_TIMES = 3;

export function ResultsScreen({
  from,
  to,
  route,
  departure,
  onBack,
  onReverse,
  busy,
  error,
}: Props) {
  const [departures, setDepartures] = useState<Date[]>([departure]);
  const [selected, setSelected] = useState(0);

  const analyses = useMemo(
    () => departures.map((d) => analyzeRoute(route.points, d, route.durationSec)),
    [departures, route],
  );
  const sel = Math.min(selected, analyses.length - 1);
  const a = analyses[sel];
  const dep = departures[sel];

  const best = useMemo(() => {
    if (analyses.length < 2) return -1;
    const scores = analyses.map(bestSideSun);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    if (max - min < 1) return -1; // practically equal
    return scores.indexOf(min);
  }, [analyses]);

  const shift = (minutes: number) =>
    setDepartures((list) =>
      list.map((d, i) => (i === sel ? new Date(d.getTime() + minutes * 60_000) : d)),
    );

  const setTime = (index: number, value: string) => {
    const [h, m] = value.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return;
    setDepartures((list) =>
      list.map((d, i) => {
        if (i !== index) return d;
        const n = new Date(d);
        n.setHours(h, m, 0, 0);
        return n;
      }),
    );
  };

  const addTime = () => {
    setDepartures((list) => [...list, new Date(list[list.length - 1].getTime() + 30 * 60_000)]);
    setSelected(departures.length);
  };

  const removeTime = (index: number) => {
    setDepartures((list) => list.filter((_, i) => i !== index));
    setSelected(0);
  };

  const arrival = new Date(dep.getTime() + route.durationSec * 1000);

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

      <section className={`answer answer-${a.recommendation}`} aria-live="polite">
        <div className="answer-text">{headline(a)}</div>
        <div className="answer-meta">
          {he.departureAt} {formatDayTime(dep)} · {he.duration} {formatDuration(route.durationSec)} ·{" "}
          {formatDistance(route.distanceMeters)}
        </div>
      </section>

      <button
        type="button"
        className="secondary-btn"
        disabled={busy}
        onClick={() => onReverse(dep)}
      >
        ⇄ {busy ? he.calculating : he.reverse}
      </button>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      <AnalysisView key={sel} analysis={a} departure={dep} />

      <section className="card">
        <h2>{he.compare}</h2>
        <div className="quick">
          <button type="button" className="secondary-btn" onClick={() => shift(-30)}>
            − {he.earlier30}
          </button>
          <button type="button" className="secondary-btn" onClick={() => shift(30)}>
            + {he.later30}
          </button>
        </div>
        <ul className="compare">
          {analyses.map((an, i) => (
            <li
              key={i}
              className={`${i === sel ? "active" : ""} ${i === best ? "best" : ""}`}
            >
              <button type="button" className="pick" onClick={() => setSelected(i)} aria-pressed={i === sel}>
                <span className="when">{formatDayTime(departures[i])}</span>
                <span className="what">{headline(an)}</span>
                <span className="nums">
                  {he.right} {formatDuration(an.exposureSec.right)} · {he.left}{" "}
                  {formatDuration(an.exposureSec.left)}
                </span>
                {i === best && <span className="badge">{he.bestOption} · {he.lessSun}</span>}
              </button>
              <div className="compare-actions">
                <input
                  type="time"
                  value={toTimeInput(departures[i])}
                  onChange={(e) => setTime(i, e.target.value)}
                  aria-label={he.time}
                />
                {departures.length > 1 && (
                  <button type="button" className="icon-btn" onClick={() => removeTime(i)} aria-label={he.removeTime}>
                    ✕
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
        {departures.length < MAX_TIMES && (
          <button type="button" className="secondary-btn" onClick={addTime}>
            + {he.addTime}
          </button>
        )}
        <p className="hint">
          {he.duration}: {formatDuration(route.durationSec)} · ~{formatClock(arrival)}
        </p>
      </section>

      <p className="estimate-note">{he.estimateNote}</p>
    </main>
  );
}
