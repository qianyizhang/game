import { applyCommand, createGame } from '../domain/game';
import type { Command } from '../domain/types';
import { importSession } from './session';

/** Validate once, then replay recorded inputs without touching a live session or browser save. */
export function createPlayback(text: string) {
  const restored = importSession(text);
  const commands: Command[] = [];
  for (let node = restored.journal; node; node = node.previous) commands.push(node.command);
  commands.reverse();
  const totalTicks = commands.reduce((sum, c) => sum + (c.type === 'frame' ? c.ticks : 0), 0);
  let state = createGame(restored.state.seed);
  let index = 0,
    offset = 0,
    position = 0;
  const apply = (command: Command) => {
    const next = applyCommand(state, command);
    if (next.error) throw new Error(next.error);
    state = next.state;
  };
  const decisions = () => {
    while (index < commands.length && commands[index].type !== 'frame') apply(commands[index++]);
  };
  const snapshot = () => ({ state, position, totalTicks, finished: index === commands.length });
  const advance = (ticks: number) => {
    if (!Number.isFinite(ticks) || ticks < 0) throw new Error('Invalid replay time.');
    let remaining = Math.floor(ticks);
    decisions();
    while (remaining > 0 && index < commands.length) {
      const command = commands[index];
      if (command.type !== 'frame') throw new Error('Unexpected replay decision.');
      const step = Math.min(remaining, command.ticks - offset);
      // A frame command stops combat early on a clear/death. Its unused requested ticks
      // still occupy replay time, but must never be sent as a new illegal combat command.
      if (state.phase === 'combat') apply({ ...command, ticks: step });
      position += step;
      offset += step;
      remaining -= step;
      if (offset === command.ticks) {
        index++;
        offset = 0;
        decisions();
      }
    }
    return snapshot();
  };
  decisions();
  return {
    snapshot,
    advance,
    seek(tick: number) {
      if (!Number.isFinite(tick)) throw new Error('Invalid replay time.');
      const target = Math.max(0, Math.min(totalTicks, Math.floor(tick)));
      if (target < position) {
        state = createGame(restored.state.seed);
        index = 0;
        offset = 0;
        position = 0;
      }
      return advance(target - position);
    },
  };
}
