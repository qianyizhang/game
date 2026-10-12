import { expect, test } from 'vitest';
import { applyCommand, createGame } from '../../src/games/night-passage/domain/game';
import { WEAPONS } from '../../src/games/night-passage/domain/content';
import { passageCommand } from './night-passage-policy';

test('optional trial adds its extra wave and pays the promised boon and gold only after clearing', () => {
  let state = applyCommand(createGame('trial-passage'), {
    type: 'start',
    weapon: 'sword',
    runes: ['vigor', 'fleet'],
  }).state;
  state.phase = 'route';
  state.routes = [{ reward: 'trial', label: 'Trial', detail: 'Harder encounter' }];
  state = applyCommand(state, { type: 'travel', index: 0 }).state;
  expect(state.room.waves).toBe(3);
  expect(state.gold).toBe(0);
  for (let n = 0; n < 3000 && state.phase === 'combat'; n++)
    state = applyCommand(state, passageCommand(state)).state;
  expect(state.phase).toBe('reward');
  expect(state.kills).toBe(9);
  expect(state.gold).toBe(125);
  expect(state.offers).toHaveLength(3);
});

test.each(
  WEAPONS.flatMap((weapon) =>
    ['passage-verification', 'a-light-in-the-dark', 'gods-and-runes'].map((seed) => ({
      ...weapon,
      seed,
    })),
  ),
)(
  'Night Passage: $id clears all four guardians on $seed through legal commands',
  (weapon) => {
    let state = applyCommand(createGame(weapon.seed), {
      type: 'start',
      weapon: weapon.id,
      runes: ['vigor', 'fleet'],
    }).state;
    const bosses = new Set<number>();
    for (let step = 0; step < 20000 && state.phase !== 'won' && state.phase !== 'lost'; step++) {
      const before = state;
      const result = applyCommand(state, passageCommand(state));
      if (result.error) throw new Error(result.error);
      state = result.state;
      if (
        before.phase === 'combat' &&
        before.room.boss &&
        state.phase !== 'combat' &&
        state.phase !== 'lost'
      )
        bosses.add(state.region);
    }
    expect(
      {
        phase: state.phase,
        region: state.region,
        chamber: state.chamber,
        hp: state.player.hp,
        kills: state.kills,
      },
      JSON.stringify({
        weapon: weapon.id,
        state: {
          phase: state.phase,
          region: state.region,
          chamber: state.chamber,
          hp: state.player.hp,
          kills: state.kills,
        },
      }),
    ).toMatchObject({ phase: 'won', region: 3 });
    expect([...bosses]).toEqual([0, 1, 2, 3]);
    const home = applyCommand(state, { type: 'return' });
    expect(home.state.profile.wins).toBe(1);
    expect(home.state.profile.unlockedRunes).toHaveLength(6);
  },
  20000,
);
