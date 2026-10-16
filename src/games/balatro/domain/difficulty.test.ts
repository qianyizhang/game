import { describe, expect, it } from 'vitest';
import { targetFor } from '../content/blinds';
import { createRun, transition } from './game';
import { DIFFICULTIES, type Difficulty } from './types';

const configured = (difficulty: Difficulty) =>
  transition(createRun('PRESSURE'), { type: 'configure', difficulty }).state;

describe('fixed gameplay difficulty', () => {
  it('changes only score pressure while keeping Standard and seeded content unchanged', () => {
    const original = createRun('PRESSURE', 4);
    for (const difficulty of DIFFICULTIES) {
      const run = configured(difficulty);
      expect(run.rng).toBe(original.rng);
      expect(run.deck).toEqual(original.deck);
      expect(run.bossIds).toEqual(original.bossIds);
      expect(run.skipTags).toEqual(original.skipTags);
      for (let ante = 1; ante <= 8; ante++) {
        for (let blind = 0; blind < 3; blind++) {
          const historical = { ...original, ante, blind };
          expect(targetFor({ ...run, ante, blind })).toBe(
            Math.floor(
              targetFor(historical) * { relaxed: 0.75, standard: 1, severe: 1.35 }[difficulty],
            ),
          );
        }
      }
      const started = transition(run, { type: 'startBlind' }).state;
      expect(started.target).toBe(run.target);
      expect(started.hand).toEqual(transition(original, { type: 'startBlind' }).state.hand);
    }
  });

  it('locks setup on the first accepted gameplay action, including a skip into another ready phase', () => {
    let run = configured('severe');
    const rejected = transition(run, { type: 'play', cards: [] });
    expect(rejected.state).toBe(run);
    expect(run.setupLocked).toBe(false);
    run = transition(run, { type: 'configure', difficulty: 'relaxed' }).state;
    run = transition(run, { type: 'skipBlind' }).state;
    expect(run.phase).toBe('ready');
    expect(run.setupLocked).toBe(true);
    const changed = transition(run, { type: 'configure', difficulty: 'standard' });
    expect(changed.error).toMatch(/first gameplay action/);
    expect(changed.state).toBe(run);
    const playing = transition(configured('severe'), { type: 'startBlind' }).state;
    expect(transition(playing, { type: 'configure', difficulty: 'relaxed' }).state).toBe(playing);
  });
});
