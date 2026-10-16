import { applyCommand, createGame } from '../domain/game';
import type { Command, ReadonlyValue } from '../domain/types';
import { restoreChronicle, recordedCommands, immutable } from './chronicle';

/** Validate once, then replay recorded inputs without touching a live chronicle or browser save. */
export function createPlayback(text: string) {
  const restored = restoreChronicle(text);
  const commands = recordedCommands(restored);
  const totalTicks = commands.reduce((sum, c) => sum + (c.type === 'frame' ? c.ticks : 0), 0);
  let state = createGame(restored.state.seed, restored.state.rulesVersion);
  let index = 0,
    offset = 0,
    position = 0;
  const apply = (command: ReadonlyValue<Command>) => {
    const next = applyCommand(state, command);
    if (next.error !== null) throw new Error(next.error);
    state = next.state;
  };
  const decisions = () => {
    while (index < commands.length && commands[index].type !== 'frame') apply(commands[index++]);
  };
  const snapshot = () =>
    Object.freeze({
      state: immutable(state),
      position,
      totalTicks,
      finished: index === commands.length,
    });
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
    /** Exact decision boundary, including menus at the same simulation tick and packed-frame interiors. */
    seekUnit(unit: number) {
      const total = commands.reduce((sum, c) => sum + (c.type === 'frame' ? c.ticks : 1), 0);
      if (!Number.isSafeInteger(unit) || unit < 0 || unit > total)
        throw new Error('Invalid decision replay boundary.');
      state = createGame(restored.state.seed, restored.state.rulesVersion);
      index = 0;
      offset = 0;
      position = 0;
      let remaining = unit;
      while (remaining > 0 && index < commands.length) {
        const command = commands[index];
        if (command.type !== 'frame') {
          apply(command);
          index++;
          remaining--;
        } else {
          const used = Math.min(command.ticks, remaining);
          if (state.phase === 'combat') apply({ ...command, ticks: used });
          position += used;
          remaining -= used;
          if (used === command.ticks) index++;
          else offset = used;
        }
      }
      return snapshot();
    },
    seek(tick: number) {
      if (!Number.isFinite(tick)) throw new Error('Invalid replay time.');
      const target = Math.max(0, Math.min(totalTicks, Math.floor(tick)));
      if (target < position) {
        state = createGame(restored.state.seed, restored.state.rulesVersion);
        index = 0;
        offset = 0;
        position = 0;
      }
      return advance(target - position);
    },
  };
}
