import { expect, test } from '@playwright/test';
import { bgSession } from '../../src/games/battlegrounds/application/session';
import { replayCodec } from '../../src/shared/replay';

const practice = replayCodec(bgSession.rules, true);

for (const golden of [false, true]) {
  test(`${golden ? 'golden' : 'normal'} Iron Drake retains its identity through Egg summon, inspection, playback and reload`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/?game=battlegrounds');
    const normal = await page.evaluate((key) => localStorage.getItem(key), bgSession.key);
    await page.getByRole('button', { name: 'Practice lab', exact: true }).click();
    await page.getByLabel('Scenario seed').fill('IRON-DRAKE-5');
    await page.getByLabel('Scenario setup').fill(
      JSON.stringify({
        hero: 'forgekeeper',
        tier: 5,
        gold: 10,
        board: golden ? ['egg', 'egg', 'egg'] : ['egg'],
      }),
    );
    await page.getByRole('button', { name: /^Start practice scenario/ }).click();
    if (golden) {
      await page.getByRole('button', { name: /Refresh/ }).click();
      await page.locator('.tavern-offers .minion-card').first().click();
      await page
        .locator('.recruit-hand')
        .getByRole('button', { name: /Mechanical Egg golden/ })
        .click();
      await page.locator('.discover-panel .minion-card').first().click();
    }
    await page.getByRole('button', { name: 'Ready · fight →' }).click();
    const saved = (await page.evaluate((key) => localStorage.getItem(key), practice.key))!;
    const session = practice.decode(saved);
    const result = session.state.lastCombat!;
    const index = golden ? 12 : 7;
    expect(result.frames[index].text).toBe('Iron Drake is summoned.');
    expect(result.frames[index].boards[0]).toEqual([
      expect.objectContaining({
        definitionId: 'drake',
        golden,
        attack: golden ? 16 : 8,
        health: golden ? 16 : 8,
        copies: 0,
      }),
    ]);
    // This fixture avoids the unrelated canid 3D stage and its asynchronous layout.
    expect(result.frames[0].boards[1].map((unit) => unit.definitionId)).toEqual(['copperbeetle']);
    const cursor = page.getByLabel('Combat event', { exact: true });
    await cursor.fill(String(index));
    const drake = page
      .locator('.combat-warband')
      .last()
      .getByRole('button', {
        name: `Iron Drake${golden ? ' golden' : ''}, ${golden ? 16 : 8} attack, ${golden ? 16 : 8} health`,
        exact: true,
      });
    await expect(drake.locator('[data-art-subject="iron-drake"]')).toHaveCount(1);
    await expect(drake.locator('svg.card-art')).toHaveAttribute('aria-hidden', 'true');
    await expect(drake.locator('svg.card-art')).toHaveAttribute('focusable', 'false');
    await drake.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.combat-replay .selected-minion-detail')).toContainText(
      `Iron Drake${golden ? ' · Golden' : ''}`,
    );
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await expect(drake).toBeVisible();
      await expect(drake.locator('.minion-stats b')).toHaveText([
        String(golden ? 16 : 8),
        String(golden ? 16 : 8),
      ]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    await page.getByRole('button', { name: 'Next combat event' }).focus();
    await page.keyboard.press('Enter');
    await expect(cursor).toHaveValue(String(index + 1));
    await page.getByRole('button', { name: 'Previous combat event' }).click();
    await expect(cursor).toHaveValue(String(index));
    expect(await page.evaluate((key) => localStorage.getItem(key), practice.key)).toBe(saved);
    await page.reload();
    await page.getByRole('button', { name: 'Practice lab', exact: true }).click();
    await page.getByRole('button', { name: 'Resume last practice', exact: true }).click();
    await page.getByLabel('Combat event', { exact: true }).fill(String(index));
    await expect(drake.locator('[data-art-subject="iron-drake"]')).toHaveCount(1);
    expect(await page.evaluate((key) => localStorage.getItem(key), practice.key)).toBe(saved);
    expect(await page.evaluate((key) => localStorage.getItem(key), bgSession.key)).toBe(normal);
    await page.getByRole('button', { name: 'Collection', exact: true }).click();
    await page.getByLabel('Search collection').fill('Iron Drake');
    const token = page
      .locator('.minion-catalogue')
      .getByRole('button', { name: 'Iron Drake, 8 attack, 8 health', exact: true });
    await expect(token).toContainText('Summoned only');
    await expect(token.locator('[data-art-subject="iron-drake"]')).toHaveCount(1);
    expect(errors).toEqual([]);
  });
}
