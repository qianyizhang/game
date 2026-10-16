import { expect, it } from 'vitest';
import { BASE_CONTENT } from './content';
import {
  applyCommand,
  createGame,
  difficultyProfile,
  HEALTH_POTION_COOLDOWN,
  RULES_V3,
  RULES_V4,
  RULES_V6,
  RULES_V5,
  RULES_V2,
  RULES_VERSION,
  stats,
} from './game';
import type { Content, Difficulty, State, Projectile } from './types';
import { currentWorld } from './world';

function quiet(
  difficulty: Difficulty,
  version = RULES_VERSION,
  content: Content = BASE_CONTENT,
): State {
  const initial = createGame(
    'DIFFICULTY-RECEIPTS',
    'barbarian',
    content,
    false,
    difficulty,
    version,
  );
  const state = applyCommand(initial, { type: 'travel', act: 0 }, content).state;
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
function advance(state: State, ticks: number, content: Content = BASE_CONTENT): State {
  let next = state;
  while (ticks > 0) {
    const count = Math.min(50, ticks);
    const result = applyCommand(next, { type: 'advance', ticks: count }, content);
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
  for (const [version, difficulty, multiplier, allyMultiplier, playerCap] of [
    [RULES_VERSION, 'relaxed', 0.75, 0.75, null],
    [RULES_VERSION, 'standard', 7, 7, 79],
    [RULES_V6, 'relaxed', 0.75, 0.75, null],
    [RULES_V6, 'standard', 5, 5, 79],
    [RULES_V6, 'severe', 12, 12, 101],
    [RULES_VERSION, 'severe', 12, 12, 101],
    [RULES_V5, 'relaxed', 0.75, 0.75, null],
    [RULES_V5, 'standard', 8, 8, 79],
    [RULES_V5, 'severe', 12, 12, 101],
    [RULES_V4, 'relaxed', 0.75, 0.75, null],
    [RULES_V4, 'standard', 3, 3, null],
    [RULES_V4, 'severe', 6, 6, null],
    [RULES_V3, 'severe', 1.3, 1, null],
    [RULES_V2, 'standard', 1, 1, null],
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
          : Math.min(playerCap ?? Infinity, Math.max(1, Math.round(monster.damage * multiplier))),
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
        target === 'ally'
          ? 10 * allyMultiplier
          : Math.min(playerCap ?? Infinity, Math.round(10 * multiplier)),
        10,
      );
      expect(currentWorld(impact).projectiles).toHaveLength(0);
    }
  }
});

it('uses 50 ms ticks for health recovery and rejects recovering drinks atomically', () => {
  for (const version of [RULES_VERSION, RULES_V6, RULES_V5, RULES_V4])
    for (const [difficulty, recovery] of [
      ['relaxed', 0],
      ['standard', 200],
      ['severe', 600],
    ] as const) {
      const state = quiet(difficulty, version);
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
  const historical = quiet('severe', RULES_V3);
  historical.player.hp = 1;
  const drank = applyCommand(historical, { type: 'potion', kind: 'health' });
  expect(drank.accepted).toBe(true);
  expect(drank.state.player.cooldowns).not.toHaveProperty(HEALTH_POTION_COOLDOWN);
  expect(applyCommand(drank.state, { type: 'potion', kind: 'health' }).accepted).toBe(true);
  expect(difficultyProfile(historical).incomingDamage).toBe(1.3);
  expect(
    difficultyProfile(createGame('legacy', 'barbarian', BASE_CONTENT, false, 'severe', RULES_V2)),
  ).toEqual({
    label: 'Standard',
    incomingDamage: 1,
    maxHitFraction: null,
    healthPotionRecovery: 0,
  });
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

// One controlled hazard exposes the shared player receipt without enemy AI or
// overlapping attacks. Expected amounts specify rounding order independently.
it('applies the player-only hit ceiling after physical or elemental mitigation and rounding', () => {
  const pack = structuredClone(BASE_CONTENT);
  pack.heroes.find((hero) => hero.id === 'barbarian')!.hp = 101;
  const armor = {
    ...createGame('cap-armor', 'barbarian', pack).player.equipment.weapon!,
    slot: 'armor' as const,
    damage: 0,
    armor: 35,
    resist: 25,
    leech: 0,
  };
  for (const [version, tier, element, damage, expectedLoss] of [
    [RULES_VERSION, 'standard', 'physical', 12, 55],
    [RULES_VERSION, 'standard', 'physical', 11, 51],
    [RULES_VERSION, 'standard', 'fire', 11, 55],
    [RULES_VERSION, 'standard', 'fire', 10, 53],
    [RULES_VERSION, 'severe', 'physical', 11, 70],
    [RULES_VERSION, 'severe', 'fire', 10, 70],
    [RULES_VERSION, 'severe', 'fire', 5, 45],
    [RULES_V6, 'standard', 'physical', 17, 55],
    [RULES_V6, 'standard', 'physical', 16, 53],
    [RULES_V6, 'standard', 'fire', 15, 55],
    [RULES_V6, 'standard', 'fire', 14, 53],
    [RULES_V5, 'standard', 'physical', 11, 55],
    [RULES_V5, 'standard', 'physical', 10, 53],
    [RULES_V5, 'standard', 'fire', 10, 55],
    [RULES_V5, 'standard', 'fire', 9, 54],
    [RULES_V5, 'severe', 'fire', 100, 70],
    [RULES_V4, 'standard', 'physical', 11, 22],
    [RULES_V4, 'standard', 'fire', 10, 23],
    [RULES_V4, 'severe', 'fire', 100, 101],
    [RULES_V3, 'severe', 'fire', 100, 98],
    [RULES_V2, 'standard', 'fire', 100, 75],
  ] as const) {
    const state = quiet(tier, version, pack);
    state.player.equipment.armor = structuredClone(armor);
    state.player.hp = 101;
    expect(stats(state, pack)).toMatchObject({ maxHp: 101, armor: 35, resist: 25 });
    currentWorld(state).hazards = [
      {
        uid: 999,
        x: 5.5,
        y: 5.5,
        radius: 2,
        delay: 0.5,
        damage,
        element,
        life: 1,
      },
    ];
    const hit = advance(state, 1, pack);
    expect(101 - hit.player.hp).toBe(expectedLoss);
    expect(hit.status).toBe(expectedLoss === 101 ? 'dead' : 'playing');
    if (version === RULES_VERSION || version === RULES_V6 || version === RULES_V5)
      expect(difficultyProfile(state).maxHitFraction).toBe(tier === 'standard' ? 0.55 : 0.7);
    else expect(difficultyProfile(state).maxHitFraction).toBeNull();
  }
});

it('keeps minimum one damage for a valid custom hero with only one maximum life', () => {
  const pack = structuredClone(BASE_CONTENT);
  pack.heroes.find((hero) => hero.id === 'barbarian')!.hp = 1;
  for (const version of [RULES_VERSION, RULES_V6, RULES_V5])
    for (const tier of ['standard', 'severe'] as const) {
      const state = quiet(tier, version, pack);
      expect(stats(state, pack).maxHp).toBe(1);
      currentWorld(state).hazards = [
        {
          uid: 999,
          x: 5.5,
          y: 5.5,
          radius: 2,
          delay: 0.5,
          damage: 1,
          element: 'physical',
          life: 1,
        },
      ];
      const hit = advance(state, 1, pack);
      expect(hit.player.hp).toBe(0);
      expect(hit.status).toBe('dead');
    }
  // The fractional ceiling is a player-only upper bound subject to minimum one
  // damage; it is not a promise that every valid custom hero survives one hit.
  expect(difficultyProfile(quiet('relaxed')).maxHitFraction).toBeNull();
  for (const version of [RULES_V4, RULES_V3, RULES_V2])
    for (const tier of ['relaxed', 'standard', 'severe'] as const)
      expect(difficultyProfile(quiet(tier, version)).maxHitFraction).toBeNull();
  expect(
    difficultyProfile(createGame('sandbox', 'barbarian', BASE_CONTENT, true, 'severe'))
      .maxHitFraction,
  ).toBeNull();
});

// Traced attacks define these literal breakpoints. This is a controlled native
// receipt check, not a policy campaign or a claim that Standard7 is calibrated.
it('keeps original6 relief and original5 pressure while Standard7 restores the observed early two-hit threat', () => {
  for (const [version, firstHp, secondHp, allyHp] of [
    [RULES_VERSION, 55, 0, 21.8675],
    [RULES_V6, 71, 32, 72.7625],
    [RULES_V5, 50, 0, -3.58],
  ] as const) {
    let state = applyCommand(
      createGame(
        'RECORDED-ARCHER-BREAKPOINT',
        'necromancer',
        BASE_CONTENT,
        false,
        'standard',
        version,
      ),
      { type: 'travel', act: 0 },
    ).state;
    currentWorld(state).enemies = [];
    expect(stats(state, BASE_CONTENT)).toMatchObject({ maxHp: 110, armor: 1 });
    const hit = (before: State) => {
      currentWorld(before).hazards = [
        {
          uid: 999,
          x: before.player.x,
          y: before.player.y,
          radius: 1,
          delay: 0.5,
          damage: 8,
          element: 'physical',
          life: 1,
        },
      ];
      return advance(before, 1);
    };
    state = hit(state);
    expect(state.player.hp).toBe(firstHp);
    state = hit(state);
    expect(state.player.hp).toBe(secondHp);
    expect(state.status).toBe(secondHp === 0 ? 'dead' : 'playing');
    const army = quiet('standard', version);
    currentWorld(army).allies = [{ uid: 900, x: 6.5, y: 5.5, hp: 200, damage: 1, cooldown: 100 }];
    currentWorld(army).projectiles = [
      {
        uid: 901,
        x: 6.3,
        y: 5.5,
        dx: 0.4,
        dy: 0,
        damage: 25.4475,
        element: 'physical',
        life: 5,
        friendly: false,
        radius: 0.3,
        pierce: false,
        hits: [],
        slow: 0,
      },
    ];
    const impact = advance(army, 1);
    expect(currentWorld(impact).allies[0].hp).toBeCloseTo(allyHp, 10);
  }
});

it('preserves the complete original6 generated worlds and RNG before any native7 control', () => {
  for (const hero of ['barbarian', 'sorceress', 'necromancer'])
    for (const difficulty of ['relaxed', 'standard', 'severe'] as const) {
      const original = createGame(
        'VERSIONED-GENERATION',
        hero,
        BASE_CONTENT,
        false,
        difficulty,
        RULES_V6,
      );
      const current = createGame('VERSIONED-GENERATION', hero, BASE_CONTENT, false, difficulty);
      expect({ ...current, rulesVersion: RULES_V6 }).toEqual(original);
    }
});
