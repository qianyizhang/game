import { describe, expect, it } from 'vitest';
import { compareScores } from '../../../../src/shared/policy/scoring';
import { BASE_CONTENT } from '../domain/content';
import { adapter, study } from './adapter';

/** Explicit result fixture: scoring rules can be tested without replaying a campaign. */
function result(status: 'playing' | 'dead' | 'victory', tick: number) {
  const state = adapter.create('EMBERWAKE-SCORE', {});
  state.session.state.status = status;
  state.session.state.tick = tick;
  for (const region of BASE_CONTENT.regions) {
    const world = state.session.state.worlds[region.id];
    world.visited = true;
    world.ward = region.ward !== null;
    world.bossDefeated = region.boss !== null;
  }
  return state;
}
const vector = (state: ReturnType<typeof result>): number[] =>
  adapter.metrics(state).score as number[];

describe('Emberwake performance score', () => {
  it('preserves mandatory progress and ranks completed campaigns by native executed time', () => {
    const fast = result('victory', 1000),
      slow = result('victory', 2000);
    expect(adapter.identity.score).toBe('emberwake-performance-2');
    expect(vector(fast)).toEqual([1, 4, 8, 20, 1000]);
    expect(adapter.metrics(fast).progress).toBe(40820);
    expect(compareScores(study.score!, vector(fast), vector(slow))).toBe(1);
    // Policy observation/history cursors are not the authoritative elapsed time.
    slow.input.tick = 1;
    slow.input.requestedTicks = 99999;
    expect(vector(slow)).toEqual([1, 4, 8, 20, 2000]);
  });

  it('never rewards faster death or an unfinished all-boss run over victory', () => {
    const victory = result('victory', 50000);
    for (const status of ['playing', 'dead'] as const) {
      const early = result(status, 1),
        late = result(status, 90000);
      expect(vector(early)).toEqual([0, 4, 8, 20, 0]);
      expect(compareScores(study.score!, vector(victory), vector(early))).toBe(1);
      expect(compareScores(study.score!, vector(early), vector(late))).toBe(0);
      early.session.state.worlds[BASE_CONTENT.acts[0].bossRegion].bossDefeated = false;
      expect(compareScores(study.score!, vector(late), vector(early))).toBe(1);
    }
  });

  it('keeps gold, level, final healing and potion stock outside the ordinal rank', () => {
    const ordinary = result('victory', 1000),
      farmed = structuredClone(ordinary);
    farmed.session.state.player.gold += 10000;
    farmed.session.state.player.level = 20;
    farmed.session.state.player.xp += 10000;
    farmed.session.state.player.hp += 1000;
    farmed.session.state.player.mana += 1000;
    farmed.session.state.player.healthPotions = 8;
    farmed.session.state.player.manaPotions = 8;
    expect(vector(farmed)).toEqual(vector(ordinary));
    expect(compareScores(study.score!, vector(farmed), vector(ordinary))).toBe(0);
    expect(adapter.metrics(farmed).gold).not.toBe(adapter.metrics(ordinary).gold);
  });
});
