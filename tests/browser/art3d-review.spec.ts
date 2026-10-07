import type { StudyId } from '../../src/art3d/models';
import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

// A repeatable visual contact sheet, not an automated aesthetic verdict.
// Filter with --grep and use a fresh --output directory for each review round.
for (const name of [
  'Nightjar',
  'Catalyst',
  'Phoenix',
  'Spiral',
  'Vajra',
  'Hydra',
  'Prowler',
  'Wolf',
  'Matriarch',
  'Thornstag',
  'Moonmoth',
  'Bogtoad',
  'Crocolisk',
  'Scavenger',
  'Guardian',
  'Tortoise',
  'Stormroc',
  'Stray',
  'Pack Caller',
  'Cub',
  'Amalgam',
  'Imp',
  'Matron',
  'Juggler',
  'Watcher',
  'Herald',
  'Patron',
  'Squire',
  'Banner Bearer',
]) {
  test(`${name} visual review: silhouette, connections, motion and phone`, async ({
    page,
  }, info) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?art=3d');
    await page
      .getByRole('navigation', { name: 'Choose a 3D study' })
      .getByRole('button', { name: new RegExp(name) })
      .click();
    await expect(page.locator('.study-render')).toHaveAttribute('data-ready', 'true');
    await expect(page.getByRole('alert')).toHaveCount(0);
    const canvas = page.locator('canvas');
    const capture = async (view: string) => {
      // Let OrbitControls damping and material upload settle before comparing pixels.
      await page.waitForTimeout(350);
      await canvas.screenshot({
        path: info.outputPath(`${name.toLowerCase().replaceAll(' ', '')}-${view}.png`),
      });
    };
    if (
      [
        'Wolf',
        'Matriarch',
        'Thornstag',
        'Moonmoth',
        'Bogtoad',
        'Crocolisk',
        'Scavenger',
        'Guardian',
        'Tortoise',
        'Stormroc',
        'Stray',
        'Pack Caller',
        'Cub',
        'Amalgam',
        'Imp',
        'Matron',
        'Juggler',
        'Watcher',
        'Herald',
        'Patron',
        'Squire',
        'Banner Bearer',
      ].includes(name)
    ) {
      const structures = await page.evaluate(
        async (id) => {
          const helper = '/tests/browser/study-roundtrip.ts';
          const { captureStudyStructure } = (await import(
            helper
          )) as typeof import('./study-roundtrip');
          return captureStudyStructure(id as StudyId);
        },
        name.toLowerCase().replaceAll(' ', ''),
      );
      for (const [view, png] of Object.entries(structures))
        await writeFile(
          info.outputPath(`${name.toLowerCase().replaceAll(' ', '')}-${view}.png`),
          Buffer.from(png.split(',')[1], 'base64'),
        );
    }
    await capture('hero');
    await page.locator('.art-studio').screenshot({ path: info.outputPath('desktop.png') });
    for (const view of ['Front', 'Side']) {
      await page.getByRole('button', { name: view, exact: true }).click();
      await capture(view.toLowerCase());
    }
    await page.getByRole('button', { name: 'Front', exact: true }).click();
    const box = (await canvas.boundingBox())!;
    // OrbitControls maps a drag of half the viewport height to a half turn.
    const start = { x: box.x + box.width * 0.2, y: box.y + box.height * 0.5 };
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + box.height / 2, start.y, { steps: 24 });
    await page.mouse.up();
    await page.waitForTimeout(800);
    await capture('back');
    await page.getByRole('button', { name: 'Reset camera' }).click();
    const timeline = page.getByLabel('Animation timeline');
    if (await timeline.isEnabled()) {
      for (const time of ['0.75', '2.25', '4.5']) {
        await timeline.fill(time);
        await capture(`motion-${time}`);
      }
      if (
        [
          'Nightjar',
          'Prowler',
          'Wolf',
          'Matriarch',
          'Thornstag',
          'Bogtoad',
          'Crocolisk',
          'Scavenger',
          'Guardian',
          'Tortoise',
          'Stormroc',
          'Stray',
          'Pack Caller',
          'Cub',
          'Amalgam',
          'Imp',
          'Matron',
          'Juggler',
          'Watcher',
          'Herald',
          'Patron',
          'Squire',
          'Banner Bearer',
        ].includes(name)
      ) {
        await timeline.fill(
          name === 'Banner Bearer'
            ? '3.85'
            : name === 'Squire'
              ? '3.8'
              : name === 'Patron'
                ? '3.9'
                : name === 'Herald'
                  ? '3.7'
                  : name === 'Watcher'
                    ? '3.8'
                    : name === 'Juggler'
                      ? '3.75'
                      : name === 'Matron'
                        ? '3.85'
                        : name === 'Imp'
                          ? '3.6'
                          : name === 'Amalgam'
                            ? '3.7'
                            : name === 'Cub'
                              ? '3.65'
                              : name === 'Pack Caller'
                                ? '3.8'
                                : name === 'Stray'
                                  ? '3.95'
                                  : name === 'Stormroc'
                                    ? '3.65'
                                    : name === 'Tortoise'
                                      ? '3.9'
                                      : name === 'Guardian'
                                        ? '3.55'
                                        : name === 'Scavenger'
                                          ? '3.75'
                                          : name === 'Crocolisk'
                                            ? '4.1'
                                            : name === 'Bogtoad'
                                              ? '3.35'
                                              : name === 'Thornstag'
                                                ? '4.3'
                                                : name === 'Matriarch'
                                                  ? '3.6'
                                                  : name === 'Wolf'
                                                    ? '4.15'
                                                    : name === 'Prowler'
                                                      ? '3.8'
                                                      : '3.85',
        );
        await capture('blink');
      }
      await timeline.fill('0');
    }
    if (
      [
        'Hydra',
        'Nightjar',
        'Phoenix',
        'Prowler',
        'Wolf',
        'Matriarch',
        'Thornstag',
        'Moonmoth',
        'Bogtoad',
        'Crocolisk',
        'Scavenger',
        'Guardian',
        'Tortoise',
        'Stormroc',
        'Stray',
        'Pack Caller',
        'Cub',
        'Amalgam',
        'Imp',
        'Matron',
        'Juggler',
        'Watcher',
        'Herald',
        'Patron',
        'Squire',
        'Banner Bearer',
      ].includes(name)
    ) {
      await page.setViewportSize({ width: 2200, height: 1600 });
      const large = await page.addStyleTag({ content: '.studio-workspace { height: 1300px; }' });
      await capture('large');
      await large.evaluate((node) => node.parentNode?.removeChild(node));
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
    await page
      .locator('.studio-stage')
      .screenshot({ path: info.outputPath(`${name.toLowerCase().replaceAll(' ', '')}-phone.png`) });
    await expect(
      page
        .getByRole('navigation', { name: 'Choose a 3D study' })
        .getByRole('button', { name: new RegExp(name) }),
    ).toBeVisible();
  });
}
