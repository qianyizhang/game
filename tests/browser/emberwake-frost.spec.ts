import { expect, test } from '@playwright/test';
import {
  dispatch,
  exportSession,
  importSession,
  newSession,
  SANDBOX_SAVE_KEY,
} from '../../packages/diablo2/src/application/session';
import { currentWorld } from '../../packages/diablo2/src/domain/world';
import type { Command } from '../../packages/diablo2/src/domain/types';
import type { VisualCue } from '../../packages/diablo2/src/ui/skill-effects';

test('cold hit silhouettes remain distinct from physical hits without their colors', async ({
  page,
}) => {
  await page.goto('/?game=emberwake');
  const masks = await page.evaluate(async () => {
    const path = '/packages/diablo2/src/ui/skill-effects.ts';
    const { drawSkillEffects } = (await import(
      path
    )) as typeof import('../../packages/diablo2/src/ui/skill-effects');
    return (['physical', 'cold'] as const).map((element) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      const cue: VisualCue = {
        kind: 'impact',
        skill: 'impact',
        effect: 'melee',
        element,
        from: { x: 2, y: 2 },
        target: { x: 2, y: 2 },
        radius: 0.8,
        region: 'fen-1',
        started: 0,
        duration: 0.4,
      };
      drawSkillEffects(ctx, [cue], { x: 0, y: 0 }, 32, 0.1);
      // Discard RGB: different colors on the old shared rays cannot satisfy this check.
      const rgba = ctx.getImageData(0, 0, 128, 128).data;
      return Array.from({ length: 128 * 128 }, (_, pixel) => rgba[pixel * 4 + 3] > 96);
    });
  });
  expect(masks[0].some(Boolean)).toBe(true);
  expect(masks[1].some(Boolean)).toBe(true);
  expect(masks[0]).not.toEqual(masks[1]);
});

test('an accepted Frost nova hit survives pause and replay reload under reduced motion', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let fixture = newSession('FROST-IMPACT-1', 'sorceress', undefined, true);
  const act = (command: Command) => {
    const result = dispatch(fixture, command);
    expect(result.error).toBeNull();
    fixture = result.session;
  };
  act({ type: 'dev-jump', region: 'fen-1', landing: 'entrance', reset: false });
  const nearest = () =>
    currentWorld(fixture.state)
      .enemies.filter((e) => e.hp > 0)
      .sort(
        (a, b) =>
          Math.hypot(a.x - fixture.state.player.x, a.y - fixture.state.player.y) -
          Math.hypot(b.x - fixture.state.player.x, b.y - fixture.state.player.y),
      )[0];
  act({ type: 'move', target: { x: nearest().x, y: nearest().y } });
  for (
    let n = 0;
    n < 200 &&
    Math.hypot(nearest().x - fixture.state.player.x, nearest().y - fixture.state.player.y) > 2.4;
    n++
  )
    act({ type: 'advance', ticks: 1 });
  act({ type: 'steer', direction: { x: 0, y: 0 } });
  const target = nearest();
  const expected = dispatch(fixture, {
    type: 'cast',
    skill: 'frostnova',
    target: { x: fixture.state.player.x, y: fixture.state.player.y },
  });
  expect(expected.error).toBeNull();
  expect(
    currentWorld(expected.session.state).enemies.find((e) => e.uid === target.uid)!.hp,
  ).toBeLessThan(target.hp);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?game=emberwake');
  await page.clock.install({ time: new Date('2026-10-27T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-27T00:00:01Z'));
  await page
    .locator('input[type=file]')
    .first()
    .setInputFiles({
      name: 'frost-hit.json',
      mimeType: 'application/json',
      buffer: Buffer.from(exportSession(fixture)),
    });
  await page.getByRole('button', { name: 'Resume journey', exact: true }).click();
  await page.clock.runFor(16);
  const canvas = page.locator('.ew-canvas-wrap canvas');
  await canvas.focus();
  await page.keyboard.press('e');
  await page.clock.runFor(100);
  await expect(canvas).toHaveAttribute('data-effects', /frostnova,impact/);
  await page.keyboard.press('Escape');
  await page.clock.runFor(16);
  const saved = await page.evaluate((key) => localStorage.getItem(key)!, SANDBOX_SAVE_KEY);
  expect(
    currentWorld(importSession(saved).state).enemies.find((e) => e.uid === target.uid)!.hp,
  ).toBe(currentWorld(expected.session.state).enemies.find((e) => e.uid === target.uid)!.hp);
  const pixels = await canvas.evaluate((c) => (c as HTMLCanvasElement).toDataURL());
  await page.clock.runFor(500);
  expect(await canvas.evaluate((c) => (c as HTMLCanvasElement).toDataURL())).toBe(pixels);
  expect(await page.evaluate((key) => localStorage.getItem(key), SANDBOX_SAVE_KEY)).toBe(saved);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Resume journey', exact: true }).click();
  await page.clock.runFor(600);
  await expect(canvas).not.toHaveAttribute('data-effects', /impact/);
  await page.keyboard.press('Escape');
  await page.clock.runFor(16);
  const resumed = await page.evaluate((key) => localStorage.getItem(key)!, SANDBOX_SAVE_KEY);
  // Let the lazy-loaded app settle on navigation; the game's own paused state stays frozen.
  await page.clock.resume();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Paused', exact: true })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), SANDBOX_SAVE_KEY)).toBe(resumed);
  expect(errors).toEqual([]);
});

test('overlapping cold hits preserve the opaque player and living target silhouettes', async ({
  page,
}) => {
  let fixture = newSession('FROST-OVERLAP-1', 'sorceress', undefined, true);
  const act = (command: Command) => {
    const result = dispatch(fixture, command);
    expect(result.error).toBeNull();
    fixture = result.session;
  };
  const region = fixture.replay.content.regions.find((r) => r.boss === 'bellkeeper')!;
  act({ type: 'dev-jump', region: region.id, landing: 'boss', reset: false });
  const boss = currentWorld(fixture.state).enemies.find((e) => e.boss)!;
  const target = { x: boss.x - 2.5, y: boss.y };
  act({ type: 'move', target });
  for (
    let n = 0;
    n < 60 &&
    Math.hypot(fixture.state.player.x - target.x, fixture.state.player.y - target.y) > 0.15;
    n++
  )
    act({ type: 'advance', ticks: 1 });
  act({ type: 'steer', direction: { x: 0, y: 0 } });
  while (fixture.state.tick < 108) act({ type: 'advance', ticks: 1 });
  const command: Command = {
    type: 'cast',
    skill: 'frostnova',
    target: { x: fixture.state.player.x, y: fixture.state.player.y },
  };
  const accepted = dispatch(fixture, command);
  expect(accepted.error).toBeNull();
  expect(
    currentWorld(accepted.session.state).enemies.filter(
      (e) => e.hp < currentWorld(fixture.state).enemies.find((old) => old.uid === e.uid)!.hp,
    ),
  ).toHaveLength(5);
  await page.goto('/?game=emberwake');
  const counts = await page.evaluate(
    async ({ before, after, command, content }) => {
      const effectsPath = '/packages/diablo2/src/ui/skill-effects.ts';
      const renderPath = '/packages/diablo2/src/ui/render.ts';
      const { SkillEffects } = (await import(
        effectsPath
      )) as typeof import('../../packages/diablo2/src/ui/skill-effects');
      const { render, figure, camera, TILE } = (await import(
        renderPath
      )) as typeof import('../../packages/diablo2/src/ui/render');
      class WithoutCold extends SkillEffects {
        override visible(region: string, time: number) {
          return super
            .visible(region, time)
            .filter((cue) => !(cue.kind === 'impact' && cue.element === 'cold'));
        }
      }
      const all = new SkillEffects(),
        control = new WithoutCold();
      all.record(before, after, command, content);
      control.record(before, after, command, content);
      const time = after.tick * 0.05 + 0.1;
      const make = () => {
        const c = document.createElement('canvas');
        c.width = 960;
        c.height = 576;
        return c;
      };
      const actual = make(),
        reference = make(),
        mask = make();
      render(actual, after, content, false, { previous: null, alpha: 1, time, effects: all });
      render(reference, after, content, false, {
        previous: null,
        alpha: 1,
        time,
        effects: control,
      });
      const painted = actual.getContext('2d')!.getImageData(0, 0, 960, 576).data;
      const clear = reference.getContext('2d')!.getImageData(0, 0, 960, 576).data;
      const c = camera(after),
        ctx = mask.getContext('2d')!;
      const hero = content.heroes.find((h) => h.id === after.hero)!;
      const livingBoss = after.worlds[after.region].enemies.find((e) => e.boss && e.hp > 0)!;
      const monster = content.monsters.find((m) => m.id === livingBoss.kind)!;
      return [
        { point: after.player, kind: hero.id, color: hero.color, scale: 1, monsterId: undefined },
        {
          point: livingBoss,
          kind: monster.shape,
          color: monster.color,
          scale: 1.85,
          monsterId: monster.id,
        },
      ].map(({ point, kind, color, scale, monsterId }) => {
        ctx.clearRect(0, 0, 960, 576);
        ctx.save();
        ctx.translate((point.x - c.x) * TILE, (point.y - c.y) * TILE);
        figure(ctx, kind, color, scale, time * 4, monsterId);
        ctx.restore();
        const silhouette = ctx.getImageData(0, 0, 960, 576).data;
        let opaque = 0,
          covered = 0;
        for (let i = 0; i < silhouette.length; i += 4)
          if (silhouette[i + 3] === 255) {
            opaque++;
            if (
              painted[i] !== clear[i] ||
              painted[i + 1] !== clear[i + 1] ||
              painted[i + 2] !== clear[i + 2]
            )
              covered++;
          }
        return { kind, opaque, covered };
      });
    },
    {
      before: fixture.state,
      after: accepted.session.state,
      command,
      content: fixture.replay.content,
    },
  );
  for (const actor of counts) {
    expect(actor.opaque).toBeGreaterThan(50);
    expect(actor.covered).toBe(0);
  }
});
