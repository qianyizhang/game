/** Hosted CPU/graphics throughput needs the same bounded margin as geometry checks. */
export function browserBudget(milliseconds: number) {
  return milliseconds * (process.env.CI ? 4 : 1);
}
