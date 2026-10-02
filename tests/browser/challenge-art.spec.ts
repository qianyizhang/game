import { expect, test } from '@playwright/test';

const puzzles = [
  ['blindside-order', 'The last multiplier'],
  ['spire-artifact', 'One layer of protection'],
  ['hearth-position', 'Make room for the Cub'],
] as const;

for (const width of [320, 768, 1440]) {
  test(`challenge illustrations preserve readable controls at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await page.getByRole('button', { name: '◇ Challenges', exact: true }).click();
    await expect(page.locator('.challenge-tile > [data-challenge-art]')).toHaveCount(3);
    await expect(page.locator('.challenge-illustrated-status')).toHaveText([
      'New puzzle',
      'New puzzle',
      'New puzzle',
    ]);
    await expect(page.locator('.challenge-how [data-challenge-symbol]')).toHaveCount(3);
    await page.screenshot({ path: info.outputPath('library.png'), fullPage: true });

    for (const [id, title] of puzzles) {
      await page.getByRole('button', { name: `Open ${title}`, exact: true }).click();
      const art = page.locator(`.challenge-brief > [data-challenge-art="${id}"]`);
      await expect(art).toBeVisible();
      await expect(art).toHaveAttribute('aria-hidden', 'true');
      await expect(art).toHaveAttribute('focusable', 'false');
      const dimensions = await art.boundingBox();
      expect(dimensions!.width / dimensions!.height).toBeCloseTo(360 / 192, 1);
      const hint = page.getByRole('button', { name: /Show a hint/ });
      await expect(hint.locator('[data-challenge-symbol="hint"]')).toBeVisible();
      await hint.click();
      await expect(page.locator('.challenge-hints li')).toHaveCount(1);
      if (id === 'spire-artifact') {
        await expect(
          page.locator('.challenge-relic [data-challenge-symbol="stone"]'),
        ).toBeVisible();
        await expect(page.locator('.challenge-relic')).toContainText('1 Dexterity');
      }
      if (id === 'blindside-order') {
        const jokers = page.locator('.challenge-table .owned-joker');
        const first = (await jokers.nth(0).boundingBox())!;
        const second = (await jokers.nth(1).boundingBox())!;
        expect(first.x + first.width <= second.x || first.y + first.height <= second.y).toBe(true);
        expect(
          await jokers
            .locator('p')
            .evaluateAll((descriptions) =>
              descriptions.every(
                (text) =>
                  text.scrollWidth <= text.clientWidth && text.scrollHeight <= text.clientHeight,
              ),
            ),
        ).toBe(true);
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      await page.screenshot({ path: info.outputPath(`${id}.png`), fullPage: true });
      await page.getByRole('button', { name: '← All challenges', exact: true }).click();
    }
    await expect(page.locator('.challenge-illustrated-status')).toHaveText([
      'In progress',
      'In progress',
      'In progress',
    ]);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
}
