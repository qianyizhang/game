/** Authored impact envelope. The caller supplies remaining snapshot life, not wall time. */
export function cinderCueStyle(remaining: number, reducedMotion: boolean) {
  const life = Math.max(0, Math.min(1, remaining));
  // Reduced motion retains the existing steady silhouette/color and linear fade.
  if (reducedMotion) return { cooling: 0, opacity: life * 0.8 };
  // Hold the initial hot peak for two of the current sixteen cue ticks, then cool once.
  // Anticipation already belongs to the spell windup; never delay a confirmed impact.
  const cooling = Math.max(0, (1 - life - 0.125) / 0.875);
  return { cooling, opacity: 0.8 * (1 - cooling) ** 1.4 };
}
