import { he } from "../i18n/he";
import type { RouteStep } from "../sun/exposure";

/** Top view of the car (front = up) with the sun placed around it. */
export function CarDiagram({ step }: { step: RouteStep }) {
  const cx = 80;
  const cy = 80;
  const r = 62;
  const rad = (step.relativeAngleDeg * Math.PI) / 180;
  const sx = cx + r * Math.sin(rad);
  const sy = cy - r * Math.cos(rad);
  const night = step.sunClass === "night";

  return (
    <svg viewBox="0 0 160 160" className="car-diagram" role="img" aria-label={he.sunDirection}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="3 4" />
      {/* car body */}
      <rect x="62" y="38" width="36" height="84" rx="14" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeOpacity="0.6" strokeWidth="2" />
      <rect x="67" y="52" width="26" height="16" rx="4" fill="currentColor" fillOpacity="0.3" />
      <rect x="67" y="96" width="26" height="12" rx="4" fill="currentColor" fillOpacity="0.3" />
      <path d="M80 28 l-7 10 h14 z" fill="currentColor" fillOpacity="0.7" />
      <text x="146" y="84" textAnchor="middle" fontSize="12" fill="currentColor" fillOpacity="0.7">{he.right}</text>
      <text x="14" y="84" textAnchor="middle" fontSize="12" fill="currentColor" fillOpacity="0.7">{he.left}</text>
      {!night && (
        <g>
          <line x1={sx} y1={sy} x2={cx + (sx - cx) * 0.45} y2={cy + (sy - cy) * 0.45} stroke="#f59e0b" strokeWidth="3" strokeDasharray="4 3" />
          <circle cx={sx} cy={sy} r="11" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
        </g>
      )}
      {night && (
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="12" fill="currentColor">{he.night}</text>
      )}
    </svg>
  );
}
