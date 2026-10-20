import { expect, test } from '@playwright/test';
import { recordEpisode } from '../../src/shared/policy/rollout';
import { adapter as blindside } from '../../src/games/balatro/agent/adapter';
import { builtins as blindsidePolicies } from '../../src/games/balatro/agent/policy';
import { adapter as hearth } from '../../src/games/battlegrounds/agent/adapter';
import { builtins as hearthPolicies } from '../../src/games/battlegrounds/agent/policy';
import type { Observation as HearthObservation } from '../../src/games/battlegrounds/agent/observation';
import { openReviewSection } from './policy-review';

const options = {
  seed: 'policy-browser',
  setup: {},
  policySeed: 'independent-layout-policy',
  policyOptions: {},
  maxDecisions: 80,
};

for (const width of [1440, 390])
  test(`autoplay keeps the scene and document stable across a shop boundary at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    const run = await recordEpisode(blindside, blindsidePolicies.immediate, options);
    const shop = run.decisions.findIndex((row) => row.marker.endsWith('shop'));
    expect(shop).toBeGreaterThan(0);
    await page.route(
      (url) => url.pathname === '/layout.json',
      (route) => route.fulfill({ json: run }),
    );
    await page.goto(`/?game=balatro&review=policy&rollout=/layout.json&decision=${shop}`);
    await expect(page.getByLabel('Decision number')).toHaveValue(String(shop));
    await openReviewSection(page, 'Playback options');
    await page.getByLabel('Playback speed').selectOption('4');
    await page.getByText('Playback options', { exact: true }).click();
    await page.evaluate(() => {
      const bar = document.querySelector('.policy-playback-bar')!;
      window.scrollTo(0, bar.getBoundingClientRect().top + window.scrollY);
    });
    const position = () =>
      page.evaluate(() => {
        const scene = document.querySelector('.policy-review-stage')!.getBoundingClientRect();
        const bar = document.querySelector('.policy-playback-bar')!.getBoundingClientRect();
        const details = document.querySelector('.policy-decision-details')!.getBoundingClientRect();
        return {
          scroll: scrollY,
          top: scene.top,
          height: scene.height,
          controls: bar.top,
          details: details.top,
        };
      });
    const before = await position();
    await page.getByRole('button', { name: 'Play decisions', exact: true }).click();
    await expect
      .poll(async () => Number(await page.getByLabel('Decision number').inputValue()))
      .toBeGreaterThan(shop + 2);
    await page.getByRole('button', { name: 'Pause decisions', exact: true }).click();
    const after = await position();
    for (const key of Object.keys(before) as (keyof typeof before)[])
      expect(Math.abs(after[key] - before[key]), key).toBeLessThanOrEqual(1);
  });

test('a full Hearth warband remains one readable row and can be scrolled by keyboard on a phone', async ({
  page,
}, testInfo) => {
  const run = await recordEpisode(hearth, hearthPolicies.immediate, {
    ...options,
    seed: 'POLICY-ADOPTION-1-DEV-01',
    maxDecisions: 100,
  });
  const full = run.decisions.findIndex(
    (row) => (row.input as unknown as HearthObservation).observation.self.board.length === 7,
  );
  expect(full).toBeGreaterThan(0);
  await page.route(
    (url) => url.pathname === '/cards.json',
    (route) => route.fulfill({ json: run }),
  );
  await page.goto(`/?game=hearth&review=policy&rollout=/cards.json&decision=${full + 1}`);
  const row = page.getByRole('group', { name: 'Your warband cards', exact: true });
  const cards = row.locator('.minion-card');
  await expect(cards).toHaveCount(7);
  const layout = () =>
    cards.evaluateAll((elements) =>
      elements.map((el) => {
        const rect = el.getBoundingClientRect();
        return { top: rect.top, width: rect.width };
      }),
    );
  const desktop = await layout();
  expect(new Set(desktop.map((card) => Math.round(card.top))).size).toBe(1);
  await page.screenshot({ path: testInfo.outputPath('desktop.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await row.scrollIntoViewIfNeeded();
  const phone = await layout();
  expect(new Set(phone.map((card) => Math.round(card.top))).size).toBe(1);
  expect(phone.every((card) => card.width >= 112)).toBe(true);
  expect(await row.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  await row.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => row.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('phone.png') });
});

test('a rejected decision stays legible beside a shortened location on a phone', async ({
  page,
}) => {
  const run = await recordEpisode(
    blindside,
    {
      id: 'rejected-command-fixture',
      version: '1',
      create: () => () => ({ command: { type: 'play' as const, cards: [] }, work: 0 }),
    },
    options,
  );
  expect(run.decisions[0].accepted).toBe(false);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route(
    (url) => url.pathname === '/rejected.json',
    (route) => route.fulfill({ json: run }),
  );
  await page.goto('/?game=balatro&review=policy&rollout=/rejected.json');
  const result = page.getByText('Rejected / error', { exact: true });
  await expect(result).toBeInViewport();
  expect(
    await result.evaluate((el) => {
      const result = el.getBoundingClientRect();
      const caption = el.closest('.policy-decision-caption')!.getBoundingClientRect();
      return (
        result.left >= caption.left &&
        result.right <= caption.right &&
        result.bottom <= caption.bottom
      );
    }),
  ).toBe(true);
});
