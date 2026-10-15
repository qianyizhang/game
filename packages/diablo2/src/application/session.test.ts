import { expect, it } from 'vitest';
import { dispatch, exportSession, importSession, newSession } from './session';
import type { Command } from '../domain/types';

it('reconstructs a long decision history without dropping or aliasing decisions', () => {
  const replay = newSession('long-journal', 'barbarian').replay;
  replay.commands = Array.from({ length: 2048 }, (_, index) => ({
    type: 'run',
    enabled: index % 2 === 0,
  }));
  const restored = importSession(JSON.stringify(replay));
  expect(restored.replay).toEqual(replay);
  expect(restored.state.player.running).toBe(false);
  expect(restored.state.tick).toBe(0);
  const continued = dispatch(restored, { type: 'run', enabled: true }).session;
  expect(continued.replay.commands).toHaveLength(2049);
  expect(restored.replay.commands).toHaveLength(2048);
  expect(importSession(exportSession(restored))).toEqual(restored);
});

it('uses the same tick packing and owned nested payloads for live and imported journals', () => {
  const initial = newSession('packed-journal', 'barbarian');
  const direction = { x: 1, y: 0, metadata: 'caller' };
  const commands: Command[] = [
    { type: 'advance', ticks: 20 },
    { type: 'advance', ticks: 30 },
    { type: 'advance', ticks: 1 },
    { type: 'travel', act: 0 },
    { type: 'steer', direction },
  ];
  let live = initial;
  for (const command of commands) {
    const next = dispatch(live, command);
    expect(next.error).toBeNull();
    live = next.session;
  }
  const imported = importSession(JSON.stringify({ ...initial.replay, commands }));
  expect(imported).toEqual(live);
  expect(imported.replay.commands).toEqual([
    { type: 'advance', ticks: 50 },
    { type: 'advance', ticks: 1 },
    { type: 'travel', act: 0 },
    { type: 'steer', direction: { x: 1, y: 0 } },
  ]);
  direction.x = -1;
  expect(live.replay.commands.at(-1)).toEqual({ type: 'steer', direction: { x: 1, y: 0 } });
  expect(initial.replay.commands).toEqual([]);
});
