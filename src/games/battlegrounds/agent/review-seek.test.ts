import { describe, expect, it, vi } from 'vitest';
import { arenaSession } from '../application/arena';
import { recordEpisode } from '../../../shared/policy/rollout';
import type { Json } from '../../../shared/policy/types';
import { adapter, at, createReviewSeeker } from './adapter';
import { builtins } from './policy';

// Checkpoints must preserve observed aliases and all-actor spans, not just the board.
describe('Hearth review seeking', () => {
  it('matches authoritative reconstruction across round spans, backward jumps and changed bytes', async () => {
    const run = await recordEpisode(adapter, builtins.immediate, {
      seed: 'hearth-policy-browser',
      setup: { hero: 'forgekeeper', difficulty: 'standard' },
      policySeed: 'independent-hearth-policy',
      policyOptions: {},
      maxDecisions: 40,
    });
    const seek = createReviewSeeker();
    const full = adapter.restore(run.replay);
    const span = run.decisions.find((row) => row.after - row.before > 1)!;
    expect(span).toBeDefined();
    for (const cursor of [
      span.after,
      1,
      span.before,
      span.after,
      32,
      0,
      full.session.replay.commands.length,
    ]) {
      const actual = seek(run.replay, cursor);
      expect(actual).toEqual(at(full, cursor));
      // Returned review state cannot poison a later cached seek.
      actual.session.state.players[0].hp = -999;
      actual.aliases.next = 999999;
    }
    // The reported lag was full-journal work on every click. Once indexed,
    // a few seeks must not decode or execute another complete match.
    const decode = vi.spyOn(arenaSession, 'decode');
    const act = vi.spyOn(arenaSession, 'act');
    try {
      for (const cursor of [1, span.before, span.after]) seek(run.replay, cursor);
      expect(decode).not.toHaveBeenCalled();
      expect(act.mock.calls.length).toBeLessThan(full.session.replay.commands.length);
    } finally {
      decode.mockRestore();
      act.mockRestore();
    }
    const changed = structuredClone(run.replay) as { [key: string]: Json };
    seek(changed, 1);
    changed.version = -1;
    expect(() => seek(changed, 1)).toThrow();
    expect(seek(run.replay, span.after)).toEqual(at(full, span.after));
    for (const cursor of [-1, 0.5, full.session.replay.commands.length + 1])
      expect(() => seek(run.replay, cursor)).toThrow('valid all-actor replay cursor');
  });
});
