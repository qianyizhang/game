import { CARDS } from '../../src/games/spire/content/cards';
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { spireSession } from '../../src/games/spire/application/session';
import { spirePolicy } from '../simulation/spire-policy';
import type { SpireCommand } from '../../src/games/spire/domain/types';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('card-workshop.playback-speed', '100'));
});

test('intent symbols preserve mixed actions, accessible planned text and replay bytes', async ({
  page,
}) => {
  await page.goto('/?game=spire');
  await page.getByRole('button', { name: '+ New run', exact: true }).click();
  await page.getByLabel('Run seed').fill('asset-readability-pilot');
  await page.getByRole('button', { name: 'Start new run →', exact: true }).click();
  await page.getByRole('button', { name: 'Obtain +8 Max HP', exact: true }).click();
  await page.getByRole('button', { name: 'Floor 1 lane 1 fight', exact: true }).click();
  const enemy = page.getByRole('button', { name: 'Target Jaw Worm', exact: true });
  await expect(enemy).toHaveAccessibleDescription(/Chomp: 11 damage/);
  await expect(enemy.locator('[data-intent-art="attack"]')).toHaveCount(1);
  const before = await page.evaluate((key) => localStorage.getItem(key), spireSession.key);
  await enemy.focus();
  await page.keyboard.press('Enter');
  await expect(enemy).toHaveAttribute('aria-pressed', 'true');
  await expect(enemy.locator('.sts-target-marker')).toHaveText('◆ Targeted');
  expect(await page.evaluate((key) => localStorage.getItem(key), spireSession.key)).toBe(before);
  await page.getByRole('button', { name: 'End turn' }).click();
  await expect(enemy).toHaveAccessibleDescription(/Thrash: 7 damage · 5 Block/);
  await expect(enemy.locator('[data-intent-art="attack"]')).toHaveCount(1);
  await expect(enemy.locator('[data-intent-art="block"]')).toHaveCount(1);
  const next = await saved(page);
  await page.reload();
  expect(await saved(page)).toEqual(next);
  await expect(enemy).toHaveAccessibleDescription(/Thrash: 7 damage · 5 Block/);
  await page.setViewportSize({ width: 390, height: 844 });
  await enemy.locator('.sts-intent-cue').scrollIntoViewIfNeeded();
  const covered = await page.evaluate(() => {
    const cue = document.querySelector('.sts-intent-cue')!.getBoundingClientRect();
    return [...document.querySelectorAll('.art-studio-entry, .dcc-workbench-entry')].some((el) => {
      const shortcut = el.getBoundingClientRect();
      return (
        shortcut.left < cue.right &&
        shortcut.right > cue.left &&
        shortcut.top < cue.bottom &&
        shortcut.bottom > cue.top
      );
    });
  });
  expect(covered).toBe(false);
});

async function saved(page: Page) {
  return spireSession.decode(
    (await page.evaluate((key) => localStorage.getItem(key), spireSession.key))!,
  );
}
async function loadPhase(page: Page, phase: string) {
  const replay = JSON.parse(readFileSync('tests/fixtures/spire-win.json', 'utf8')) as {
    seed: string;
    commands: SpireCommand[];
  };
  let session = spireSession.create(replay.seed);
  for (const command of replay.commands) {
    session = spireSession.act(session, command).session;
    if (session.state.phase === phase) break;
  }
  expect(session.state.phase).toBe(phase);
  await page.getByLabel('Import replay file').setInputFiles({
    name: 'run.json',
    mimeType: 'application/json',
    buffer: Buffer.from(spireSession.encode(session)),
  });
}

for (const width of [320, 390, 1440]) {
  test(`keyboard card choices stay visible at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/?game=spire');
    await page.getByLabel('Character', { exact: true }).selectOption('silent');
    await page.getByRole('button', { name: 'Obtain +7 Max HP', exact: true }).click();
    await page.getByRole('button', { name: 'Floor 1 lane 1 fight', exact: true }).click();
    const finishResolution = async () => {
      const skip = page.getByRole('button', { name: 'Skip to result', exact: true });
      if (await skip.isVisible()) await skip.click();
    };
    await finishResolution();
    const hand = page.getByRole('region', { name: 'Cards in hand', exact: true });
    for (const name of [/Strike/, /Strike/, /Defend/, /Neutralize/]) {
      await hand.getByRole('button', { name }).first().focus();
      await page.keyboard.press('Enter');
      await finishResolution();
    }
    await page.getByRole('button', { name: 'End turn →', exact: true }).focus();
    await page.keyboard.press('Enter');
    await finishResolution();
    const before = await saved(page);
    await hand.getByRole('button', { name: /Survivor/ }).focus();
    await page.keyboard.press('Enter');
    await finishResolution();
    await expect(page.getByRole('region', { name: 'Choose a card', exact: true })).toBeVisible();
    const choosing = await saved(page);
    expect(choosing.state.combat!.energy).toBe(before.state.combat!.energy - 1);
    await expect(page.getByRole('button', { name: 'End turn →', exact: true })).toBeDisabled();

    const traverseHand = async () => {
      const cards = hand.locator('.ability-card');
      const count = await cards.count();
      await cards.first().focus();
      for (const direction of ['Tab', 'Shift+Tab']) {
        for (let step = 1; step < count; step++) {
          await page.keyboard.press(direction);
          await expect
            .poll(() =>
              hand.evaluate((region) => {
                const focused = document.activeElement;
                if (!focused?.matches('.ability-card')) return false;
                const card = focused.getBoundingClientRect();
                const bounds = region.getBoundingClientRect();
                return card.left >= bounds.left - 1 && card.right <= bounds.right + 1;
              }),
            )
            .toBe(true);
        }
      }
    };
    await traverseHand();
    expect((await saved(page)).replay).toEqual(choosing.replay);
    await page.keyboard.press('Enter');
    await finishResolution();
    const after = await saved(page);
    const discarded = choosing.state.combat!.choice!.options[0];
    expect(after.replay.commands.at(-1)).toEqual({ type: 'chooseCard', id: discarded });
    expect(after.state.combat!.choice).toBeNull();
    expect(after.state.combat!.discard).toContain(discarded);
    expect(after.state.combat!.hand).not.toContain(discarded);
    expect(after.state.combat!.energy).toBe(choosing.state.combat!.energy);
    await expect(page.getByRole('button', { name: 'End turn →', exact: true })).toBeEnabled();
    await traverseHand();
    expect((await saved(page)).replay).toEqual(after.replay);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}

test(
  'Spire map, targeted combat, reward, save/resume and collection',
  { tag: '@smoke' },
  async ({ page }, info) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/');
    await page.getByLabel('Choose game').selectOption('spire');
    await expect(page.getByRole('heading', { name: 'The Ironclad' })).toBeVisible();
    await page.getByRole('button', { name: 'Obtain +8 Max HP', exact: true }).click();
    await expect(page.locator('.sts-map-scroll')).toBeVisible();
    await page.screenshot({ path: info.outputPath('spire-map.png'), fullPage: true });
    await page.getByRole('button', { name: 'Floor 1 lane 1 fight' }).click();
    await expect(page.locator('.battle-hand .ability-card')).toHaveCount(5);
    await page.screenshot({ path: info.outputPath('spire-combat.png'), fullPage: true });
    for (let step = 0; step < 100; step++) {
      const session = await saved(page);
      if (session.state.phase !== 'combat') break;
      const command = spirePolicy(session.state);
      if (command.type === 'playCard') {
        if (command.target)
          await page
            .locator('.enemy')
            .nth(
              session.state
                .combat!.enemies.filter((e) => e.hp > 0)
                .findIndex((e) => e.id === command.target),
            )
            .click();
        await page
          .locator('.battle-hand .ability-card')
          .nth(session.state.combat!.hand.indexOf(command.id))
          .click();
      } else if (command.type === 'endTurn')
        await page.getByRole('button', { name: 'End turn' }).click();
      else if (command.type === 'potion') {
        if (command.target)
          await page
            .locator('.enemy')
            .nth(
              session.state
                .combat!.enemies.filter((e) => e.hp > 0)
                .findIndex((e) => e.id === command.target),
            )
            .click();
        await page
          .locator('.potion-belt > div')
          .nth(command.index)
          .getByRole('button')
          .first()
          .click();
      }
    }
    await expect(page.getByRole('heading', { name: 'Choose a card' })).toBeVisible();
    await page.locator('.reward-cards .ability-card').first().click();
    const before = await saved(page);
    expect(before.state.deck).toHaveLength(11);
    await page.reload();
    expect(await saved(page)).toEqual(before);
    await page.getByRole('button', { name: 'Collection', exact: true }).click();
    await expect(page.locator('.ability-grid .ability-card')).toHaveCount(CARDS.length);
    await page.getByRole('button', { name: 'Rules & workshop' }).click();
    await expect(page.getByRole('heading', { name: 'Cards and timing' })).toBeVisible();
    expect(errors).toEqual([]);
  },
);

test('Spire shop, campfire upgrades, legal victory replay and phone layout', async ({
  page,
}, info) => {
  await page.goto('/');
  await page.getByLabel('Choose game').selectOption('spire');
  await loadPhase(page, 'shop');
  const before = await saved(page);
  await page.locator('.shop .ability-card:enabled').first().click();
  expect((await saved(page)).state.gold).toBeLessThan(before.state.gold);
  await loadPhase(page, 'rest');
  await page.locator('.choice-panel .deck-list button:enabled').first().click();
  expect((await saved(page)).state.deck.some((c) => c.upgraded)).toBe(true);
  await loadPhase(page, 'won');
  await expect(page.getByRole('heading', { name: 'Victory', exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('spire-victory.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await loadPhase(page, 'combat');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('spire-phone.png'), fullPage: true });
});

test('Spire boss relic tradeoffs, suspended card choice, and legacy save isolation', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('card-workshop.emberpath.v1', 'legacy-save-kept'),
  );
  await page.goto('/');
  await page.getByLabel('Choose game').selectOption('spire');
  await loadPhase(page, 'bossRelic');
  const before = await saved(page);
  await expect(page.getByRole('heading', { name: 'Power at a price' })).toBeVisible();
  await page.locator('.sts-relic-choices button').first().click();
  const next = await saved(page);
  expect(next.state.act).toBe(before.state.act + 1);
  expect(next.state.hp).toBe(next.state.maxHp);
  expect(next.state.phase).toBe('map');
  const replay = JSON.parse(readFileSync('tests/fixtures/spire-win.json', 'utf8')) as {
    seed: string;
    commands: SpireCommand[];
  };
  let session = spireSession.create(replay.seed);
  for (const command of replay.commands) {
    session = spireSession.act(session, command).session;
    if (session.state.combat?.choice) break;
  }
  expect(session.state.combat?.choice).toBeTruthy();
  await page.getByLabel('Import replay file').setInputFiles({
    name: 'choice.json',
    mimeType: 'application/json',
    buffer: Buffer.from(spireSession.encode(session)),
  });
  await expect(page.getByRole('region', { name: 'Choose a card' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'End turn' })).toBeDisabled();
  await page.reload();
  expect((await saved(page)).state.combat?.choice).toEqual(session.state.combat?.choice);
  await page.locator('.sts-card-choice .ability-card').first().click();
  expect((await saved(page)).state.combat?.choice).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('card-workshop.emberpath.v1'))).toBe(
    'legacy-save-kept',
  );
});

test('phone map edges reach their rooms and the combat hand scrolls within the viewport', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByLabel('Choose game').selectOption('spire');
  await page.getByRole('button', { name: 'Obtain +8 Max HP', exact: true }).click();
  const distances = await page.locator('.sts-map-canvas').evaluate((canvas) => {
    const line = canvas.querySelector('line')!;
    const matrix = line.getScreenCTM()!;
    return (['from', 'to'] as const).map((side, index) => {
      const node = canvas
        .querySelector(`[data-node-id="${line.dataset[side]}"]`)!
        .getBoundingClientRect();
      const point = new DOMPoint(
        index ? line.x2.baseVal.value : line.x1.baseVal.value,
        index ? line.y2.baseVal.value : line.y1.baseVal.value,
      ).matrixTransform(matrix);
      return Math.hypot(point.x - node.x - node.width / 2, point.y - node.y - node.height / 2);
    });
  });
  expect(distances.every((distance) => distance < 2)).toBe(true);
  await page.screenshot({ path: info.outputPath('spire-phone-map.png'), fullPage: true });
  await page.getByRole('button', { name: 'Floor 1 lane 1 fight' }).click();
  const hand = page.getByRole('region', { name: 'Cards in hand' });
  expect(await hand.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  const last = hand.locator('.ability-card').last();
  await last.scrollIntoViewIfNeeded();
  expect(await hand.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  await last.click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('spire-phone-hand.png'), fullPage: true });
});
