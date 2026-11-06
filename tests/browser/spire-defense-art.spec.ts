import { expect, test } from '@playwright/test';
import { spireSession } from '../../src/games/spire/application/session';
import { replayCodec } from '../../src/shared/replay';

const practice = replayCodec(spireSession.rules, true);
const cards = [
  { id: 'metallicize', name: 'Metallicize' },
  { id: 'ghostlyArmor', name: 'Ghostly Armor' },
  { id: 'sentinel', name: 'Sentinel' },
];

test('selected defensive art fits real base/upgrade hands and preserves card play and replay', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('card-workshop.playback-speed', '1000'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?game=spire');
  const normal = await page.evaluate((key) => localStorage.getItem(key), spireSession.key);
  for (const upgraded of [false, true]) {
    await page.getByRole('button', { name: 'Practice lab', exact: true }).click();
    await page.getByLabel('Scenario seed').fill('PACKED-DEFENSE-ACCEPTANCE');
    await page.getByLabel('Scenario setup').fill(
      JSON.stringify({
        deck: cards.map((card) => card.id),
        upgrades: upgraded ? cards.map((card) => card.id) : [],
        enemies: ['jawWorm'],
        hp: 80,
      }),
    );
    await page.getByRole('button', { name: /^Start practice scenario/ }).click();
    await page.getByRole('button', { name: 'Skip to result', exact: true }).click();
    const initial = (await page.evaluate((key) => localStorage.getItem(key), practice.key))!;
    const hand = page.getByRole('region', { name: 'Cards in hand', exact: true });
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.keyboard.press('Tab');
      for (const { id, name } of cards) {
        const card = hand.getByRole('button', { name: new RegExp(name) });
        await expect(card).toContainText(upgraded ? `${name}+` : name);
        await expect(card).toBeEnabled();
        const art = card.locator('svg.card-art');
        await expect(art).toHaveAttribute('aria-hidden', 'true');
        await expect(art).toHaveAttribute('focusable', 'false');
        await expect(art.locator('[data-defense-art]')).toHaveAttribute(
          'data-defense-art',
          `${id}-${upgraded ? 'upgraded' : 'base'}`,
        );
        await expect(art.locator('image, script, foreignObject, [id]')).toHaveCount(0);
        await card.focus();
        await expect(card).toBeInViewport();
        const fits = await art.evaluate((svg) => {
          const box = svg.getBoundingClientRect();
          return box.width > 70 && box.height > 45 && box.left >= 0 && box.right <= innerWidth;
        });
        expect(fits).toBe(true);
        await card.screenshot({
          path: info.outputPath(`${id}-${upgraded ? 'upgraded' : 'base'}-${width}.png`),
        });
      }
      await hand.screenshot({
        path: info.outputPath(`hand-${upgraded ? 'upgraded' : 'base'}-${width}.png`),
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(await page.evaluate((key) => localStorage.getItem(key), practice.key)).toBe(initial);
    }
    const before = practice.decode(initial);
    await hand.getByRole('button', { name: /Metallicize/ }).focus();
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Skip to result', exact: true }).click();
    const after = (await page.evaluate((key) => localStorage.getItem(key), practice.key))!;
    const decoded = practice.decode(after);
    expect(decoded.replay.commands).toHaveLength(before.replay.commands.length + 1);
    expect(decoded.state.combat!.energy).toBe(before.state.combat!.energy - 1);
    expect(decoded.state.combat!.powers.metallicize).toBe(upgraded ? 4 : 3);
    await page.reload();
    await page.getByRole('button', { name: 'Practice lab', exact: true }).click();
    await page.getByRole('button', { name: 'Resume last practice', exact: true }).click();
    expect(await page.evaluate((key) => localStorage.getItem(key), practice.key)).toBe(after);
    expect(await page.evaluate((key) => localStorage.getItem(key), spireSession.key)).toBe(normal);
  }
  expect(errors).toEqual([]);
});
