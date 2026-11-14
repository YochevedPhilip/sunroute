import { useState } from "react";
import { he } from "../i18n/he";
import type { RouteAnalysis } from "../sun/exposure";
import { CarDiagram } from "./CarDiagram";
import { CLASS_COLOR } from "./colors";
import { formatClock, formatDuration, formatPercent } from "./format";
import { CLASS_LABEL, CLASS_ORDER } from "./labels";
import { RouteMap } from "./RouteMap";

/** Map, legend, position slider and summary for one analysed route or bus leg. */
export function AnalysisView({
  analysis: a,
  departure,
}: {
  analysis: RouteAnalysis;
  departure: Date;
}) {
  const [cursorFrac, setCursorFrac] = useState(0);
  const cursor = Math.min(a.steps.length - 1, Math.round(cursorFrac * (a.steps.length - 1)));
  const step = a.steps[cursor];
  const stepTime = new Date(departure.getTime() + step.midTimeSec * 1000);
  const maxExposure = Math.max(a.exposureSec.right, a.exposureSec.left, 1);

  return (
    <>
      <RouteMap steps={a.steps} cursor={cursor} />

      <div className="legend" aria-label={he.legend}>
        {CLASS_ORDER.map((c) => (
          <span key={c}>
            <i style={{ background: CLASS_COLOR[c] }} />
            {CLASS_LABEL[c]}
          </span>
        ))}
      </div>

      <section className="card scrub">
        <label>
          <span className="label">{he.position}</span>
          <input
            type="range"
            min={0}
            max={1000}
            value={Math.round(cursorFrac * 1000)}
            onChange={(e) => setCursorFrac(Number(e.target.value) / 1000)}
          />
        </label>
        <p className="hint">{he.positionHint}</p>
        <div className="scrub-body">
          <CarDiagram step={step} />
          <dl>
            <dt>{formatClock(stepTime)}</dt>
            <dd style={{ color: CLASS_COLOR[step.sunClass] }}>
              <strong>{CLASS_LABEL[step.sunClass]}</strong>
            </dd>
            {step.sunClass !== "night" && (
              <>
                <dt>{he.sunHeight}</dt>
                <dd>{Math.round(step.sunElevationDeg)}°</dd>
              </>
            )}
          </dl>
        </div>
      </section>

      <section className="card">
        <h2>{he.summary}</h2>
        <ul className="summary">
          {CLASS_ORDER.map((c) => (
            <li key={c}>
              <i style={{ background: CLASS_COLOR[c] }} />
              <span className="name">{CLASS_LABEL[c]}</span>
              <span className="num">{formatPercent(a.shareByClass[c])}</span>
              <span className="num dim">{formatDuration(a.secondsByClass[c])}</span>
            </li>
          ))}
        </ul>
        <h3>{he.exposure}</h3>
        <div className="bars">
          {(["right", "left"] as const).map((side) => (
            <div key={side} className="bar-row">
              <span className="name">{he[side]}</span>
              <div className="bar">
                <div
                  style={{
                    width: `${(a.exposureSec[side] / maxExposure) * 100}%`,
                    background: CLASS_COLOR[side],
                  }}
                />
              </div>
              <span className="num">{formatDuration(a.exposureSec[side])}</span>
            </div>
          ))}
        </div>
        <p className="hint">{he.exposureHint}</p>
      </section>
    </>
  );
}
