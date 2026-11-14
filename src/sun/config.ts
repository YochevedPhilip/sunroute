/** Tunable constants of the sun model. Adjust here after real trips. */
export const SUN_CONFIG = {
  /** Sun lower than this (degrees) counts as "below the horizon". */
  horizonElevationDeg: -0.83,
  /** |relative angle| at or below this = sun in front. */
  frontHalfAngleDeg: 30,
  /** |relative angle| at or above this = sun behind. */
  behindFromAngleDeg: 150,
  /** Route is cut into steps of about this length (meters). */
  stepMeters: 200,
  /** If the two sides differ by less than this share, say "no clear difference". */
  clearDifferenceRatio: 0.1,
} as const;
