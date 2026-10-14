import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { hashSeed, shuffle } from '../../src/shared/random';
import { BOONS, boon } from '../../src/games/night-passage/domain/content';
import { drawBoons } from '../../src/games/night-passage/domain/boon-offers';
import type { Player } from '../../src/games/night-passage/domain/types';

// Rules-3 draft at 638b585. Kept only as the declared comparison, never used to replay saves.
function previousDraft(owned: Player['boons'], rng: number): string[] {
  const gods = owned.map((entry) => boon(entry.id).god);
  const pool = BOONS.filter(
    (entry) =>
      (!entry.requires || entry.requires.every((god) => gods.includes(god))) &&
      (owned.find((item) => item.id === entry.id)?.level ?? 0) < (entry.slot === 'duo' ? 1 : 5),
  ).map((entry) => entry.id);
  return shuffle(pool, rng)[0].slice(0, 3);
}

test('fixed-seed reward comparison removes competing slots and empty-slot droughts without eliminating patrons', () => {
  const loadouts: Record<string, Player['boons']> = {
    empty: [],
    partial: [
      { id: 'storm-attack', level: 2 },
      { id: 'winter-cast', level: 2 },
      { id: 'veil-dash', level: 2 },
    ],
    full: [
      { id: 'storm-attack', level: 2 },
      { id: 'winter-cast', level: 2 },
      { id: 'veil-dash', level: 2 },
      { id: 'tide-special', level: 2 },
      { id: 'cinder-call', level: 2 },
    ],
  };
  const samples = 512;
  const results = Object.entries(loadouts).map(([name, owned]) => {
    const occupied = new Set(owned.map((entry) => boon(entry.id).slot));
    const summarize = (draft: (rng: number) => string[]) => {
      let repeatedSlots = 0,
        noEmptySlot = 0;
      const patrons = new Set<string>(),
        ids = new Set<string>(),
        triples = new Set<string>();
      for (let seed = 0; seed < samples; seed++) {
        const offers = draft(hashSeed(`reward-variety-${seed}`));
        const slots = offers.map((id) => boon(id).slot);
        if (new Set(slots).size < offers.length) repeatedSlots++;
        if (occupied.size < 5 && !slots.some((slot) => slot !== 'duo' && !occupied.has(slot)))
          noEmptySlot++;
        for (const id of offers) {
          patrons.add(boon(id).god);
          ids.add(id);
        }
        triples.add([...offers].sort().join(','));
      }
      return {
        repeatedSlots,
        noEmptySlot: occupied.size < 5 ? noEmptySlot : null,
        patrons: [...patrons].sort(),
        uniqueBlessings: ids.size,
        distinctTriples: triples.size,
      };
    };
    const previous = summarize((rng) => previousDraft(owned, rng));
    const current = summarize((rng) => drawBoons(owned, rng, false)[0]);
    expect(previous.repeatedSlots).toBeGreaterThan(0);
    expect(current.repeatedSlots).toBe(0);
    if (name === 'partial') {
      expect(previous.noEmptySlot).toBeGreaterThan(0);
      expect(current.noEmptySlot).toBe(0);
    }
    expect(current.patrons).toEqual(['cinder', 'storm', 'tide', 'veil', 'winter']);
    expect(current.uniqueBlessings).toBe(previous.uniqueBlessings);
    return { loadout: name, owned, samples, previous, current };
  });
  mkdirSync('test-results/night-passage-rewards', { recursive: true });
  writeFileSync(
    'test-results/night-passage-rewards/comparison.json',
    JSON.stringify(
      {
        previousRules: 'night-passage-3',
        rules: 'night-passage-5',
        seeds: 'reward-variety-0 through reward-variety-511',
        results,
      },
      null,
      2,
    ),
  );
});
