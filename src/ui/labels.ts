import { he } from "../i18n/he";
import type { SunClass } from "../sun/exposure";

export const CLASS_LABEL: Record<SunClass, string> = {
  right: he.sunOnRight,
  left: he.sunOnLeft,
  front: he.sunInFront,
  behind: he.sunBehind,
  night: he.sunDown,
};

export const CLASS_ORDER: SunClass[] = ["right", "left", "front", "behind", "night"];
