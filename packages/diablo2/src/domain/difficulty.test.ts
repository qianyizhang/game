import { expect, it } from 'vitest';
import { BASE_CONTENT } from './content';
import {
  applyCommand,
  createGame,
  difficultyProfile,
  HEALTH_POTION_COOLDOWN,
  PREVIOUS_RULES_VERSION,
  LEGACY_RULES_VERSION,
  RULES_VERSION,
  stats,
} from './game';
import type { Difficulty, State, Projectile } from './types';
import { currentWorld } from './world';

function quiet(difficulty: Difficulty, version = RULES_VERSION): State {
  const initial = createGame(
    'DIFFICULTY-RECEIPTS',
    'barbarian',
    BASE_CONTENT,
    false,
    difficulty,
    version,
  );
  const state = applyCommand(initial, { type: 'travel', act: 0 }).state;
  const world = currentWorld(state);
  world.tiles = Array.from({ length: 30 }, () => '.'.repeat(30));
  world.seen = Array.from({ length: 900 }, (_, index) => index);
  world.enemies = [];
  world.allies = [];
  world.projectiles = [];
  world.hazards = [];
  state.player.x = 5.5;
  state.player.y = 5.5;
  state.player.equipment = {};
  state.player.attributes.dexterity = 0;
  return state;
}
function advance(state: State, ticks: number): State {
  let next = state;
  while (ticks > 0) {
    const count = Math.min(50, ticks);
    const result = applyCommand(next, { type: 'advance', ticks: count });
    expect(result.accepted).toBe(true);
    next = result.state;
    ticks -= count;
  }
  return next;
}

// Controlled quiet fields expose one receipt at a time. A completed campaign may
// never hit the same unarmored player/ally through both melee and projectile paths.
it('scales each hostile player and ally receipt once, preserving historical ally damage', () => {
  const monster = BASE_CONTENT.monsters.find((definition) => definition.pattern === 'melee')!;
  for (const [version, difficulty, multiplier, allyMultiplier] of [
    [RULES_VERSION, 'relaxed', 0.75, 0.75],
    [RULES_VERSION, 'standard', 3, 3],
    [RULES_VERSION, 'severe', 6, 6],
    [PREVIOUS_RULES_VERSION, 'severe', 1.3, 1],
    [LEGACY_RULES_VERSION, 'standard', 1, 1],
  ] as const) {
    for (const target of ['player', 'ally'] as const) {
      const melee = quiet(difficulty, version);
      const world = currentWorld(melee);
      melee.player.hp = 1000;
      if (target === 'ally')
        world.allies = [{ uid: 800, x: 6.5, y: 5.5, hp: 1000, damage: 1, cooldown: 100 }];
      world.enemies = [
        {
          uid: 801,
          kind: monster.id,
          x: target === 'ally' ? 7 : 6,
          y: 5.5,
          hp: 1000,
          maxHp: 1000,
          boss: false,
          elite: false,
          cooldown: 0,
          slow: 0,
          cursed: 0,
          windup: 0,
          phase: 0,
        },
      ];
      const hit = advance(melee, 1);
      const actual =
        target === 'ally' ? 1000 - currentWorld(hit).allies[0].hp : 1000 - hit.player.hp;
      expect(actual).toBeCloseTo(
        target === 'ally'
          ? monster.damage * allyMultiplier
          : Math.max(1, Math.round(monster.damage * multiplier)),
        10,
      );
      const shotState = quiet(difficulty, version);
      shotState.player.hp = 1000;
      if (target === 'ally')
        currentWorld(shotState).allies = [
          { uid: 900, x: 6.5, y: 5.5, hp: 1000, damage: 1, cooldown: 100 },
        ];
      const at = target === 'ally' ? currentWorld(shotState).allies[0] : shotState.player;
      const shot: Projectile = {
        uid: 901,
        x: at.x - 0.2,
        y: at.y,
        dx: 0.4,
        dy: 0,
        damage: 10,
        element: 'fire',
        life: 5,
        friendly: false,
        radius: 0.3,
        pierce: false,
        hits: [],
        slow: 0,
      };
      currentWorld(shotState).projectiles = [shot];
      const impact = advance(shotState, 1);
      const actualShot =
        target === 'ally' ? 1000 - currentWorld(impact).allies[0].hp : 1000 - impact.player.hp;
      expect(actualShot).toBeCloseTo(
        target === 'ally' ? 10 * allyMultiplier : Math.round(10 * multiplier),
        10,
      );
      expect(currentWorld(impact).projectiles).toHaveLength(0);
    }
  }
});

it('uses 50 ms ticks for health recovery and rejects recovering drinks atomically', () => {
  for (const [difficulty, recovery] of [
    ['relaxed', 0],
    ['standard', 200],
    ['severe', 600],
  ] as const) {
    const state = quiet(difficulty);
    state.player.hp = 1;
    state.player.mana = 0;
    state.player.healthPotions = 3;
    state.player.manaPotions = 2;
    const first = applyCommand(state, { type: 'potion', kind: 'health' });
    expect(first.accepted).toBe(true);
    expect(first.state.player.hp).toBe(1 + stats(state, BASE_CONTENT).maxHp * 0.6);
    expect(first.state.player.cooldowns[HEALTH_POTION_COOLDOWN]).toBe(recovery);
    expect(first.state.player.healthPotions).toBe(2);
    const mana = applyCommand(first.state, { type: 'potion', kind: 'mana' });
    expect(mana.accepted).toBe(true);
    expect(mana.state.player.manaPotions).toBe(1);
    if (recovery === 0) {
      expect(applyCommand(first.state, { type: 'potion', kind: 'health' }).accepted).toBe(true);
    } else {
      const original = structuredClone(first.state);
      const rejected = applyCommand(first.state, { type: 'potion', kind: 'health' });
      expect(rejected.accepted).toBe(false);
      expect(rejected.state).toBe(first.state);
      expect(first.state).toEqual(original);
      const almost = advance(first.state, recovery * 2 - 1);
      expect(almost.player.cooldowns[HEALTH_POTION_COOLDOWN]).toBe(0.5);
      expect(applyCommand(almost, { type: 'potion', kind: 'health' }).state).toBe(almost);
      const ready = advance(almost, 1);
      expect(ready.player.cooldowns[HEALTH_POTION_COOLDOWN]).toBe(0);
      const second = applyCommand(ready, { type: 'potion', kind: 'health' });
      expect(second.accepted).toBe(true);
      expect(second.state.player.healthPotions).toBe(1);
    }
  }
  const historical = quiet('severe', PREVIOUS_RULES_VERSION);
  historical.player.hp = 1;
  const drank = applyCommand(historical, { type: 'potion', kind: 'health' });
  expect(drank.accepted).toBe(true);
  expect(drank.state.player.cooldowns).not.toHaveProperty(HEALTH_POTION_COOLDOWN);
  expect(applyCommand(drank.state, { type: 'potion', kind: 'health' }).accepted).toBe(true);
  expect(difficultyProfile(historical).incomingDamage).toBe(1.3);
  expect(
    difficultyProfile(
      createGame('legacy', 'barbarian', BASE_CONTENT, false, 'severe', LEGACY_RULES_VERSION),
    ),
  ).toEqual({ label: 'Standard', incomingDamage: 1, healthPotionRecovery: 0 });
  expect(
    difficultyProfile(createGame('sandbox', 'barbarian', BASE_CONTENT, true, 'severe'))
      .incomingDamage,
  ).toBe(1);
});

it('keeps the reserved health recovery key outside valid content skill IDs', () => {
  const pack = structuredClone(BASE_CONTENT);
  pack.skills[0].id = HEALTH_POTION_COOLDOWN;
  expect(() => createGame('reserved-key', 'barbarian', pack)).toThrow('skills ID');
});
