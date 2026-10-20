import type { Page } from '@playwright/test';

/** Expand evidence through the same disclosure the reader uses. */
export async function openReviewSection(page: Page, label: string) {
  const summary = page.locator('summary').filter({ hasText: label }).first();
  if ((await summary.locator('..').getAttribute('open')) === null) await summary.click();
}
