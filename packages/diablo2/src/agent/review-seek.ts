import type { Json } from '../../../../src/shared/policy/types';
import { dispatch, importSession, type Session } from '../application/session';
import type { Command } from '../domain/types';

const units = (command: Command) => (command.type === 'advance' ? command.ticks : 1);
interface Checkpoint {
  cursor: number;
  next: number;
  session: Session;
}
interface Index {
  original: string;
  limit: number;
  commands: Command[];
  checkpoints: Checkpoint[];
}

/** Passive native reconstruction only. Checkpoints never stand in for original
 * policy input or alias history. Replay bytes are checked even when identity matches. */
export function createReviewSeeker() {
  const indexes = new WeakMap<object, Index>();
  return (replay: Json, requested: number): Session => {
    if (!replay || typeof replay !== 'object') throw new Error('Invalid campaign replay.');
    const original = JSON.stringify(replay);
    let index = indexes.get(replay);
    if (!index || index.original !== original) {
      const final = importSession(original);
      if (final.replay.mode === 'sandbox')
        throw new Error('Sandbox replays are outside the campaign policy contract.');
      const commands = final.replay.commands;
      let session = importSession(JSON.stringify({ ...final.replay, commands: [] }));
      const checkpoints: Checkpoint[] = [{ cursor: 0, next: 0, session }];
      let cursor = 0;
      for (let next = 0; next < commands.length; next++) {
        const result = dispatch(session, commands[next]);
        if (result.error) throw new Error(result.error);
        session = result.session;
        cursor += units(commands[next]);
        if ((next + 1) % 128 === 0) checkpoints.push({ cursor, next: next + 1, session });
      }
      if (checkpoints.at(-1)!.cursor !== cursor)
        checkpoints.push({ cursor, next: commands.length, session: final });
      index = { original, limit: cursor, commands, checkpoints };
      indexes.set(replay, index);
    }
    if (!Number.isSafeInteger(requested) || requested < 0 || requested > index.limit)
      throw new Error('Invalid Emberwake replay cursor.');
    let checkpoint = index.checkpoints[0];
    for (const value of index.checkpoints) {
      if (value.cursor > requested) break;
      checkpoint = value;
    }
    let session = checkpoint.session,
      remaining = requested - checkpoint.cursor;
    for (let next = checkpoint.next; remaining > 0; next++) {
      const command = index.commands[next];
      const count = Math.min(units(command), remaining);
      const result = dispatch(
        session,
        command.type === 'advance' ? { ...command, ticks: count } : command,
      );
      if (result.error) throw new Error(result.error);
      session = result.session;
      remaining -= count;
    }
    return session;
  };
}
