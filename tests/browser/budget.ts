/** Hosted CPU/graphics throughput needs the same bounded margin as geometry checks. */
export function browserBudget(milliseconds: number) {
  return milliseconds * (process.env.CI ? 4 : 1);
}

/** A cold software-rendered scene has a bounded first-frame budget. */
export const sceneReadyTimeout = browserBudget(15_000);
