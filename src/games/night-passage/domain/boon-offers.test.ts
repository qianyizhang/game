import { expect, test } from 'vitest';
import { applyCommand, createGame, offerBoons } from './game';
import { boon } from './content';

test('audiences grow unfinished builds with distinct slots, deterministically and without altering the loadout', () => {
  for (let seed = 0; seed < 128; seed++) {
    const state = createGame(`unfinished-build-${seed}`);
    state.player.boons = [
      { id: 'storm-attack', level: 2 },
      { id: 'winter-cast', level: 5 },
      { id: 'veil-dash', level: 1 },
    ];
    const before = structuredClone(state),
      duplicate = structuredClone(state);
    offerBoons(state);
    offerBoons(duplicate);
    expect(state).toEqual(duplicate);
    expect(state.player).toEqual(before.player);
    expect(state.rng).not.toBe(before.rng);
    expect(state.phase).toBe('reward');
    expect(state.offers).toHaveLength(3);
    expect(new Set(state.offers.map((id) => boon(id).slot)).size).toBe(3);
    expect(state.offers.some((id) => ['special', 'call'].includes(boon(id).slot))).toBe(true);
    expect(state.offers).not.toContain('winter-cast');
    expect(state.offers.every((id) => !['steam', 'eclipse'].includes(id))).toBe(true);
    const choice = state.offers.find((id) => ['special', 'call'].includes(boon(id).slot))!;
    const result = applyCommand(state, { type: 'choose', id: choice });
    expect(result.error).toBeNull();
    expect(result.state.player.boons).toEqual([...before.player.boons, { id: choice, level: 1 }]);
  }
});

test('full builds retain eligible duo, replacement and rank-up choices; capped choices stay out', () => {
  const seen = new Set<string>();
  for (let seed = 0; seed < 128; seed++) {
    const state = createGame(`finished-build-${seed}`);
    state.player.boons = [
      { id: 'storm-attack', level: 5 },
      { id: 'winter-cast', level: 2 },
      { id: 'veil-dash', level: 2 },
      { id: 'tide-special', level: 2 },
      { id: 'cinder-call', level: 2 },
      { id: 'conductor', level: 1 },
    ];
    offerBoons(state);
    expect(state.offers).toHaveLength(3);
    expect(new Set(state.offers.map((id) => boon(id).slot)).size).toBe(3);
    expect(state.offers).not.toContain('storm-attack');
    expect(state.offers).not.toContain('conductor');
    for (const id of state.offers) seen.add(id);
  }
  expect([...seen]).toEqual(
    expect.arrayContaining(['steam', 'eclipse', 'winter-cast', 'cinder-attack']),
  );
});

test('memory shrines only rank up owned uncapped regular blessings and preserve shop return', () => {
  const state = createGame('memory-shrine');
  state.player.boons = [
    { id: 'storm-attack', level: 2 },
    { id: 'winter-cast', level: 5 },
    { id: 'conductor', level: 1 },
  ];
  state.rewardReturn = 'shop';
  offerBoons(state, true);
  expect(state.offers).toEqual(['storm-attack']);
  const result = applyCommand(state, { type: 'choose', id: 'storm-attack' });
  expect(result.error).toBeNull();
  expect(result.state.phase).toBe('shop');
  expect(result.state.player.boons).toEqual([
    { id: 'storm-attack', level: 3 },
    { id: 'winter-cast', level: 5 },
    { id: 'conductor', level: 1 },
  ]);
});
