import { expect, test } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { spireSession } from '../../src/games/spire/application/session';
import { replayCodec } from '../../src/shared/replay';
import { browserBudget } from './budget';

const practice = replayCodec(spireSession.rules, true);
const encounters = [
  {
    enemies: ['bookOfStabbing'],
    names: ['Book of Stabbing'],
    hp: [165],
    intents: ['Multi-Stab: 6 damage × 2'],
  },
  {
    enemies: ['centurion', 'mystic'],
    names: ['Centurion', 'Mystic'],
    hp: [80, 52],
    intents: ['Slash: 12 damage', 'Heal: Heal allies 16'],
  },
  { enemies: ['chosen'], names: ['Chosen'], hp: [98], intents: ['Poke: 5 damage × 2'] },
  {
    enemies: ['sphericGuardian'],
    names: ['Spheric Guardian'],
    hp: [20],
    intents: ['Activate: 25 Block'],
  },
  { enemies: ['snakePlant'], names: ['Snake Plant'], hp: [78], intents: ['Chomp: 7 damage × 3'] },
  {
    enemies: ['taskmaster'],
    names: ['Taskmaster'],
    hp: [57],
    intents: ['Scouring Whip: 7 damage · 1 Wound'],
  },
];

test('City portraits preserve combat cues, keyboard targeting and practice replay on desktop and phone', async ({
  page,
}, info) => {
  test.setTimeout(browserBudget(60_000));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('card-workshop.playback-speed', '1000'));
  await page.goto('/?game=spire');
  const normal = await page.evaluate((key) => localStorage.getItem(key), spireSession.key);
  for (const encounter of encounters) {
    const name = encounter.enemies.join('-');
    await page.getByRole('button', { name: 'Practice lab', exact: true }).click();
    await page.getByLabel('Scenario seed').fill('CITY-ART-68');
    await page.getByLabel('Scenario setup').fill(
      JSON.stringify({
        deck: ['strike', 'strike', 'defend', 'defend', 'bash'],
        enemies: encounter.enemies,
        hp: 80,
      }),
    );
    await page.getByRole('button', { name: /^Start practice scenario/ }).click();
    await page.getByRole('button', { name: 'Skip to result', exact: true }).click();
    await expect(page.locator('.enemy')).toHaveCount(encounter.enemies.length);
    const before = (await page.evaluate((key) => localStorage.getItem(key), practice.key))!;
    const initial = practice.decode(before);
    for (const [index, id] of encounter.enemies.entries()) {
      const enemy = page.getByRole('button', {
        name: `Target ${encounter.names[index]}`,
        exact: true,
      });
      await expect(enemy).toHaveAccessibleDescription(`Next action ${encounter.intents[index]}`);
      await expect(enemy.locator('.enemy-hp')).toContainText(
        `${encounter.hp[index]}/${encounter.hp[index]}`,
      );
      await expect(enemy.getByRole('meter')).toHaveAttribute(
        'aria-label',
        `${encounter.names[index]} health`,
      );
      const svg = enemy.locator('svg.fighter-portrait');
      await expect(svg).toHaveAttribute('aria-hidden', 'true');
      await expect(svg).toHaveAttribute('focusable', 'false');
      const exported = await svg.evaluate(async (element) => {
        const copy = element.cloneNode(true) as SVGElement;
        copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        copy.setAttribute('width', '180');
        copy.setAttribute('height', '180');
        copy.removeAttribute('aria-hidden');
        copy.setAttribute('role', 'img');
        copy.setAttribute(
          'aria-label',
          element.parentElement!.querySelector('strong')!.textContent,
        );
        const text = new XMLSerializer().serializeToString(copy);
        const url = URL.createObjectURL(new Blob([text], { type: 'image/svg+xml' }));
        try {
          const image = new Image();
          image.src = url;
          await image.decode();
          return { text, width: image.naturalWidth, height: image.naturalHeight };
        } finally {
          URL.revokeObjectURL(url);
        }
      });
      expect([exported.width, exported.height]).toEqual([180, 180]);
      writeFileSync(info.outputPath(`${id}.svg`), exported.text);
      await enemy.focus();
      await page.keyboard.press('Enter');
      await expect(enemy).toHaveAttribute('aria-pressed', 'true');
      await expect(enemy.locator('.sts-target-marker')).toHaveText('◆ Targeted');
      expect(await page.evaluate((key) => localStorage.getItem(key), practice.key)).toBe(before);
    }
    await page
      .locator('.sts-battle')
      .screenshot({ path: info.outputPath(`${name}-desktop.png`), animations: 'disabled' });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    for (const enemy of await page.locator('.enemy').all()) {
      await expect(enemy.locator('svg.fighter-portrait')).toBeVisible();
      await expect(enemy.locator('.sts-intent-cue')).toBeVisible();
    }
    await page
      .locator('.sts-battle')
      .screenshot({ path: info.outputPath(`${name}-phone.png`), animations: 'disabled' });
    await page.setViewportSize({ width: 1440, height: 1080 });
    await page.locator('.battle-hand .ability-card').filter({ hasText: 'Strike' }).first().click();
    await page.getByRole('button', { name: 'Skip to result', exact: true }).click();
    const after = (await page.evaluate((key) => localStorage.getItem(key), practice.key))!;
    const played = practice.decode(after);
    expect(played.replay.commands).toHaveLength(initial.replay.commands.length + 1);
    expect(played.state.combat!.energy).toBe(2);
    const struck = played.state.combat!.enemies.at(-1)!;
    if (struck.definitionId === 'sphericGuardian') {
      expect(struck.hp).toBe(20);
      expect(struck.block).toBe(34);
    } else expect(struck.hp).toBe(encounter.hp.at(-1)! - 6);
    expect(played.state.combat!.enemies.map((enemy) => enemy.definitionId)).toEqual(
      encounter.enemies,
    );
    await page.reload();
    await page.getByRole('button', { name: 'Practice lab', exact: true }).click();
    await page.getByRole('button', { name: 'Resume last practice', exact: true }).click();
    expect(await page.evaluate((key) => localStorage.getItem(key), practice.key)).toBe(after);
    expect(await page.evaluate((key) => localStorage.getItem(key), spireSession.key)).toBe(normal);
  }
  expect(errors).toEqual([]);
});
