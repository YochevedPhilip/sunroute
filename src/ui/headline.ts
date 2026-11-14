import { he } from "../i18n/he";
import type { Recommendation, RouteAnalysis } from "../sun/exposure";

/** One-line answer for an analysis. */
export function headline(a: RouteAnalysis): string {
  const r: Recommendation = a.recommendation;
  if (r === "right") return he.recommendRight;
  if (r === "left") return he.recommendLeft;
  if (r === "night") return he.recommendNight;
  const frontBehind = a.shareByClass.front + a.shareByClass.behind;
  return frontBehind > 0.6 ? he.recommendNoSide : he.recommendNone;
}

/** Sun on the side we would sit on: the smaller of the two sides. */
export function bestSideSun(a: RouteAnalysis): number {
  return Math.min(a.exposureSec.right, a.exposureSec.left);
}
