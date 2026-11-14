import type { SunClass } from "../sun/exposure";

export const CLASS_COLOR: Record<SunClass, string> = {
  right: "#f97316", // orange
  left: "#2563eb", // blue
  front: "#eab308", // yellow
  behind: "#9333ea", // purple
  night: "#64748b", // gray
};
