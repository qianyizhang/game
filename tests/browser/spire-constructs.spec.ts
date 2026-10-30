import { expect, test } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { spireSession } from '../../src/games/spire/application/session';
import { replayCodec } from '../../src/shared/replay';

const practice = replayCodec(spireSession.rules, true);
const encounters = [
  {
    ids: ['spiker', 'repulsor', 'exploder'],
    names: ['Spiker', 'Repulsor', 'Exploder'],
    hp: [50, 33, 30],
    intents: ['Cut: 7 damage', 'Bash: 11 damage', 'Slam: 9 damage'],
  },
  { ids: ['orbWalker'], names: ['Orb Walker'], hp: [94], intents: ['Laser: 10 damage · 2 Burn'] },
];

for (const encounter of encounters) {
  test(`Beyond constructs: ${encounter.names.join(', ')} keep target, cues and replay on phone`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('card-workshop.playback-speed', '1000'));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?game=spire');
    const normal = await page.evaluate((key) => localStorage.getItem(key), spireSession.key);
    await page.getByRole('button', { name: 'Practice lab', exact: true }).click();
    await page.getByLabel('Scenario seed').fill('BEYOND-CONSTRUCTS');
    await page.getByLabel('Scenario setup').fill(
      JSON.stringify({
        deck: ['strike', 'strike', 'defend', 'defend', 'bash'],
        enemies: encounter.ids,
        hp: 80,
      }),
    );
    await page.getByRole('button', { name: /^Start practice scenario/ }).click();
    await page.getByRole('button', { name: 'Skip to result', exact: true }).click();
    const initial = (await page.evaluate((key) => localStorage.getItem(key), practice.key))!;
    const receipt: Record<string, unknown>[] = [];
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1080 });
      await expect(page.locator('.enemy')).toHaveCount(encounter.ids.length);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      for (const [index, name] of encounter.names.entries()) {
        const enemy = page.getByRole('button', { name: `Target ${name}`, exact: true });
        await expect(enemy).toHaveAccessibleDescription(`Next action ${encounter.intents[index]}`);
        await expect(enemy.locator('.enemy-hp')).toContainText(
          `${encounter.hp[index]}/${encounter.hp[index]}`,
        );
        await expect(enemy.getByRole('meter')).toHaveAttribute('aria-label', `${name} health`);
        const art = enemy.locator('.fighter-portrait');
        await expect(art).toHaveAttribute('aria-hidden', 'true');
        await expect(art).toHaveAttribute('focusable', 'false');
        await expect(art).toBeVisible();
        await expect(enemy.locator('.sts-intent-cue')).toBeVisible();
        await enemy.focus();
        await page.keyboard.press('Enter');
        await expect(enemy).toHaveAttribute('aria-pressed', 'true');
        await expect(enemy.locator('.sts-target-marker')).toHaveText('◆ Targeted');
        expect(await page.evaluate((key) => localStorage.getItem(key), practice.key)).toBe(initial);
        await art.screenshot({ path: info.outputPath(`${encounter.ids[index]}-${width}.png`) });
        receipt.push({
          id: encounter.ids[index],
          width,
          box: await art.boundingBox(),
          intent: encounter.intents[index],
        });
      }
      await page
        .locator('.sts-battle')
        .screenshot({ path: info.outputPath(`combat-${width}.png`), animations: 'disabled' });
      await page
        .locator('.enemy-row')
        .screenshot({ path: info.outputPath(`enemies-${width}.png`), animations: 'disabled' });
    }
    writeFileSync(info.outputPath('context.json'), JSON.stringify({ receipt, initial }, null, 2));
    await page.locator('.battle-hand .ability-card').filter({ hasText: 'Strike' }).first().click();
    await page.getByRole('button', { name: 'Skip to result', exact: true }).click();
    const after = (await page.evaluate((key) => localStorage.getItem(key), practice.key))!;
    const decoded = practice.decode(after);
    expect(decoded.replay.commands).toHaveLength(
      practice.decode(initial).replay.commands.length + 1,
    );
    expect(decoded.state.combat!.energy).toBe(2);
    expect(decoded.state.combat!.enemies.at(-1)!.hp).toBe(encounter.hp.at(-1)! - 6);
    expect(decoded.state.combat!.enemies.map((enemy) => enemy.definitionId)).toEqual(encounter.ids);
    await page.reload();
    await page.getByRole('button', { name: 'Practice lab', exact: true }).click();
    await page.getByRole('button', { name: 'Resume last practice', exact: true }).click();
    expect(await page.evaluate((key) => localStorage.getItem(key), practice.key)).toBe(after);
    expect(await page.evaluate((key) => localStorage.getItem(key), spireSession.key)).toBe(normal);
    expect(errors).toEqual([]);
  });
}
