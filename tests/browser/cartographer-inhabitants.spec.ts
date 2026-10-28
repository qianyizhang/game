import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import {
  dispatch,
  exportSession,
  importSession,
  newSession,
  saveKey,
  SAVE_KEY,
  type Replay,
} from '../../src/games/cartographer/application/session';
import { draftRotations } from '../../src/games/cartographer/domain/game';
import { ENEMIES } from '../../src/games/cartographer/domain/content';

function opening() {
  let session = newSession('ink-and-ember', 'standard');
  for (let step = 0; step < 3; step++)
    session = dispatch(session, { type: 'move', direction: 'north' }).session;
  session = dispatch(session, { type: 'explore', direction: 'north' }).session;
  return dispatch(session, {
    type: 'draft',
    offer: 0,
    rotation: draftRotations(session.state, 0)[0],
  }).session;
}

test('board and inspector share all four guardian identities through pointer/keyboard selection and phone reload', async ({
  page,
}, info) => {
  const session = opening();
  const saved = exportSession(session);
  await page.addInitScript(({ key, saved }) => localStorage.setItem(key, saved), {
    key: SAVE_KEY,
    saved,
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?game=cartographer');
  await expect(page.locator('.dc-board [data-inhabitant="hero"]')).toHaveCount(1);
  await expect(page.locator('.dc-stats [data-inhabitant="hero"]')).toHaveCount(1);
  const enemies = session.state.enemies.filter((enemy) => enemy.hp > 0);
  expect(enemies.map((enemy) => enemy.kind).sort()).toEqual([
    'archer',
    'bomber',
    'crawler',
    'keeper',
  ]);
  for (const enemy of enemies) {
    const name = ENEMIES[enemy.kind].name;
    const tile = page.getByRole('button', {
      name: new RegExp(`^${enemy.x},${enemy.y}: ${name}, ${enemy.hp} life`),
    });
    const card = page.locator('.dc-enemy-card').filter({ hasText: name });
    for (const host of [tile, card]) {
      await expect(host.locator(`[data-inhabitant="${enemy.kind}"]`)).toHaveAttribute(
        'aria-hidden',
        'true',
      );
      await expect(host.locator('svg')).toHaveAttribute('focusable', 'false');
    }
    await expect(tile.locator('small')).toHaveText(String(enemy.hp));
    // Clicking the subject's center must still reach the original tile button.
    await tile.click({ position: { x: 20, y: 20 } });
    await expect(card).toHaveAttribute('aria-pressed', 'true');
    await expect(tile).toHaveClass(/selected/);
    await card.focus();
    await page.keyboard.press('Space');
    await expect(card).toHaveAttribute('aria-pressed', 'true');
  }
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(saved);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.locator('.dc-board [data-inhabitant]')).toHaveCount(5);
  await expect(page.locator('.dc-enemy-card [data-inhabitant]')).toHaveCount(4);
  await page.locator('.dc-board').screenshot({ path: info.outputPath('four-guardians-phone.png') });
  await page
    .locator('.dc-sidebar section')
    .nth(1)
    .screenshot({
      path: info.outputPath('four-guardians-inspector-phone.png'),
    });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(saved);
  expect(errors).toEqual([]);
});

test('the crowned king shares his inspector identity and an imported historical combat ends and reloads normally', async ({
  page,
}, info) => {
  // Reuse the frozen, legal historical victory: one public strike remains.
  const fixture = JSON.parse(
    readFileSync('tests/fixtures/cartographer-v2-continuity.json', 'utf8'),
  ) as { cases: { replay: Replay }[] };
  const replay = structuredClone(fixture.cases[0].replay);
  expect(replay.commands.pop()?.type).toBe('strike');
  const session = importSession(JSON.stringify(replay));
  const king = session.state.enemies.find((enemy) => enemy.kind === 'king' && enemy.hp > 0)!;
  expect(king).toBeDefined();
  await page.goto('/?game=cartographer');
  await page.getByLabel('Import Cartographer replay').setInputFiles({
    name: 'king-before-final-strike.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(replay)),
  });
  await expect(page.getByRole('alert')).toContainText('Replay restored');
  const tile = page.getByRole('button', {
    name: new RegExp(`^${king.x},${king.y}: Unwritten King, ${king.hp} life`),
  });
  const card = page.locator('.dc-enemy-card').filter({ hasText: 'Unwritten King' });
  await expect(tile.locator('[data-inhabitant="king"]')).toBeVisible();
  await expect(card.locator('[data-inhabitant="king"]')).toBeVisible();
  await tile.focus();
  await page.keyboard.press('Enter');
  await expect(card).toHaveAttribute('aria-pressed', 'true');
  const saved = await page.evaluate((key) => localStorage.getItem(key), saveKey(session));
  expect(saved).toBe(exportSession(session));
  await page.locator('.dc-board').screenshot({ path: info.outputPath('king-desktop.png') });
  await card.screenshot({ path: info.outputPath('king-inspector-desktop.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(tile.locator('[data-inhabitant="king"]')).toBeVisible();
  await page.locator('.dc-board').screenshot({ path: info.outputPath('king-phone.png') });
  await card.screenshot({ path: info.outputPath('king-inspector-phone.png') });
  await tile.click();
  await page
    .locator('.dc-actions')
    .getByRole('button', { name: /^Strike/ })
    .click();
  await expect(page.getByRole('heading', { name: 'A way home, written in light.' })).toBeVisible();
  const won = importSession(
    (await page.evaluate((key) => localStorage.getItem(key), saveKey(session)))!,
  );
  expect(won.state.status).toBe('won');
  expect(won.replay.commands).toEqual([...replay.commands, { type: 'strike', target: king.id }]);
  expect(won.state.enemies.find((enemy) => enemy.id === king.id)!.hp).toBeLessThanOrEqual(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'A way home, written in light.' })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), saveKey(session))).toBe(
    exportSession(won),
  );
});
