import { expect, test } from '@playwright/test';
import {
  dispatch,
  exportSession,
  importSession,
  newSession,
  SANDBOX_SAVE_KEY,
} from '../../packages/diablo2/src/application/session';
import { bodyFits, distance } from '../../packages/diablo2/src/domain/maps';
import { currentWorld } from '../../packages/diablo2/src/domain/world';
import type { Command } from '../../packages/diablo2/src/domain/types';

test('Sepulcher return and descent arrows agree with their destination floors', async ({
  page,
}) => {
  let fixture = newSession('CRYPT-STAIRS-69', 'sorceress', undefined, true);
  const act = (command: Command) => {
    const result = dispatch(fixture, command);
    expect(result.error).toBeNull();
    fixture = result.session;
  };
  act({ type: 'dev-jump', region: 'bells-3', landing: 'entrance', reset: false });
  act({ type: 'dev-options', god: true, reveal: false });
  const map = fixture.replay.content.regions.find((r) => r.id === 'bells-3')!;
  const views = [];
  for (const [id, target, offset] of [
    ['up', 'bells-1', 2],
    ['down', 'bells-4', -2],
  ] as const) {
    const portal = map.portals.find((p) => p.id === id)!;
    expect(portal.target).toBe(target);
    const beside = { x: portal.at.x + offset, y: portal.at.y };
    act({ type: 'move', target: beside });
    for (let n = 0; n < 800 && distance(fixture.state.player, beside) > 0.3; n++)
      act({ type: 'advance', ticks: 1 });
    expect(distance(fixture.state.player, beside)).toBeLessThan(0.3);
    views.push({ id, at: portal.at, saved: exportSession(fixture) });
  }
  await page.goto('/?game=emberwake');
  const arrows = await page.evaluate(async (views) => {
    const sessionPath = '/packages/diablo2/src/application/session.ts';
    const renderPath = '/packages/diablo2/src/ui/render.ts';
    const { importSession } = (await import(
      sessionPath
    )) as typeof import('../../packages/diablo2/src/application/session');
    const { render, TILE, VIEW_WIDTH, VIEW_HEIGHT } = (await import(
      renderPath
    )) as typeof import('../../packages/diablo2/src/ui/render');
    return views.map(({ id, at, saved }) => {
      const fixture = importSession(saved);
      const canvas = document.createElement('canvas');
      canvas.width = VIEW_WIDTH;
      canvas.height = VIEW_HEIGHT;
      const c = render(canvas, fixture.state, fixture.replay.content, false);
      const ctx = canvas.getContext('2d')!;
      const x = Math.round((at.x - c.x) * TILE);
      const y = Math.round((at.y - c.y) * TILE);
      // The old surface-return glyph put its amber arrowhead in the lower band.
      // Sample the wing, away from the common stem, stairs and label.
      const amber = (top: number) => {
        const pixels = ctx.getImageData(x + 12, y + top, 5, 8).data;
        let count = 0;
        for (let i = 0; i < pixels.length; i += 4)
          if (pixels[i] > 190 && pixels[i + 1] > 135 && pixels[i + 1] < 195 && pixels[i + 2] < 145)
            count++;
        return count;
      };
      return { id, upper: amber(-20), lower: amber(3) };
    });
  }, views);
  const [up, down] = arrows;
  expect(down.lower).toBeGreaterThan(down.upper);
  expect(up.upper).toBeGreaterThan(up.lower);
});

test('crypt stairs preserve explored terrain and encounters on return and reload', async ({
  page,
}) => {
  let fixture = newSession('CRYPT-STAIRS-69', 'sorceress', undefined, true);
  const act = (command: Command) => {
    const result = dispatch(fixture, command);
    expect(result.error).toBeNull();
    fixture = result.session;
  };
  act({ type: 'dev-jump', region: 'bells-3', landing: 'entrance', reset: false });
  act({ type: 'dev-options', god: true, reveal: false });
  const stairs = fixture.replay.content.regions
    .find((r) => r.id === 'bells-3')!
    .portals.find((p) => p.target === 'bells-4')!.at;
  act({ type: 'move', target: stairs });
  for (let n = 0; n < 800 && distance(fixture.state.player, stairs) > 0.3; n++)
    act({ type: 'advance', ticks: 1 });
  expect(distance(fixture.state.player, stairs)).toBeLessThan(0.3);
  expect(bodyFits(currentWorld(fixture.state), fixture.state.player)).toBe(true);
  const original = currentWorld(fixture.state);
  await page.goto('/?game=emberwake');
  await page.clock.install({ time: new Date('2026-10-28T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-28T00:00:01Z'));
  await page
    .locator('input[type=file]')
    .first()
    .setInputFiles({
      name: 'crypt-stairs.json',
      mimeType: 'application/json',
      buffer: Buffer.from(exportSession(fixture)),
    });
  const canvas = page.locator('.ew-canvas-wrap canvas');
  await page.getByRole('button', { name: 'Resume journey', exact: true }).click();
  await page.clock.runFor(16);
  await expect(canvas).toHaveAttribute('data-map-reveal', 'explored');
  await canvas.focus();
  await page.keyboard.press('f');
  await page.clock.runFor(50);
  await expect(page.getByRole('heading', { name: 'Bell Foundry', exact: true })).toBeVisible();
  await page.keyboard.press('f');
  await page.clock.runFor(50);
  await expect(page.getByRole('heading', { name: 'Sepulcher Steps', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.clock.runFor(16);
  const saved = await page.evaluate((key) => localStorage.getItem(key)!, SANDBOX_SAVE_KEY);
  const returned = currentWorld(importSession(saved).state);
  expect(returned.enemies.map((e) => e.uid)).toEqual(original.enemies.map((e) => e.uid));
  expect(returned.seen).toEqual(expect.arrayContaining(original.seen));
  expect(returned.tiles).toEqual(original.tiles);
  await page.clock.resume();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Sepulcher Steps', exact: true })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), SANDBOX_SAVE_KEY)).toBe(saved);
});

test('crypt warm frames reuse terrain, floor changes refresh it, and fog conceals unknown cells', async ({
  page,
}) => {
  await page.goto('/?game=emberwake');
  const result = await page.evaluate(async () => {
    const sessionPath = '/packages/diablo2/src/application/session.ts';
    const renderPath = '/packages/diablo2/src/ui/render.ts';
    const { newSession, dispatch } = (await import(
      sessionPath
    )) as typeof import('../../packages/diablo2/src/application/session');
    const { render } = (await import(
      renderPath
    )) as typeof import('../../packages/diablo2/src/ui/render');
    let fixture = newSession('CRYPT-CACHE-69', 'sorceress', undefined, true);
    fixture = dispatch(fixture, {
      type: 'dev-jump',
      region: 'bells-3',
      landing: 'entrance',
      reset: false,
    }).session;
    fixture = dispatch(fixture, { type: 'dev-options', god: true, reveal: false }).session;
    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 576;
    const ctx = canvas.getContext('2d')!;
    const images: CanvasImageSource[] = [];
    const draw = ctx.drawImage.bind(ctx);
    Object.defineProperty(ctx, 'drawImage', {
      value: (image: CanvasImageSource, x: number, y: number) => {
        images.push(image);
        draw(image, x, y);
      },
    });
    const before = JSON.stringify(fixture.state);
    render(canvas, fixture.state, fixture.replay.content, false);
    render(canvas, fixture.state, fixture.replay.content, false);
    const unknown = Array.from(ctx.getImageData(4, 4, 1, 1).data);
    const unchanged = JSON.stringify(fixture.state) === before;
    fixture = dispatch(fixture, {
      type: 'dev-jump',
      region: 'bells-4',
      landing: 'entrance',
      reset: false,
    }).session;
    render(canvas, fixture.state, fixture.replay.content, false);
    return {
      reused: images[0] === images[1],
      refreshed: images[2] !== images[1],
      unknown,
      unchanged,
    };
  });
  expect(result).toEqual({
    reused: true,
    refreshed: true,
    // Unknown-cell fog after the renderer's existing corner vignette.
    unknown: [10, 15, 19, 255],
    unchanged: true,
  });
});
