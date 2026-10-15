import { ARENA, boon, RUNES, weapon, WEAPONS } from '../domain/content';
import { hazardPhase, hazardTiming } from '../domain/encounters';
import { validCommand } from '../domain/game';
import {
  DIFFICULTIES,
  contentVersion,
  type Difficulty,
  type RulesVersion,
} from '../domain/contracts';
import { passageScore, type PassageScore } from '../domain/score';
import { attackShapes, projectileAngles, type ThreatShape } from '../domain/threats';
import type {
  Boon,
  Command,
  Enemy,
  Hazard,
  Player,
  Profile,
  Projectile,
  Room,
  Route,
  RuneId,
  StateView as State,
  Weapon,
} from '../domain/types';
import { dispatch, exportChronicle, createChronicle, type Chronicle } from './chronicle';

export const API_VERSION = 'night-passage-agent-1';
type DiscreteCommand = Exclude<Command, { type: 'frame' }>;
export interface Observation {
  version: 'night-passage-agent-1';
  rulesVersion: string;
  contentVersion: string;
  difficulty: Difficulty;
  phase: State['phase'];
  tick: number;
  region: number;
  chamber: number;
  roomsCleared: number;
  gold: number;
  kills: number;
  score: PassageScore;
  player: Player;
  profile: Profile;
  room: Omit<Room, 'hazards'> & {
    hazards: (Hazard & {
      active: boolean;
      warning: boolean;
      cycle: number;
      ticksUntilActive: number;
    })[];
  };
  enemies: Pick<
    Enemy,
    | 'id'
    | 'kind'
    | 'x'
    | 'y'
    | 'hp'
    | 'maxHp'
    | 'radius'
    | 'aim'
    | 'windup'
    | 'stagger'
    | 'burn'
    | 'chill'
    | 'exposed'
  >[];
  projectiles: Pick<Projectile, 'id' | 'x' | 'y' | 'vx' | 'vy' | 'radius' | 'hostile' | 'life'>[];
  threats: {
    enemyId: number;
    /** Remaining attack windup; the countdown pauses while the enemy is staggered. */
    remainingWindupTicks: number;
    shapes: ThreatShape[];
    projectileAngles: number[];
  }[];
  offers: (Boon & { command: Extract<Command, { type: 'choose' }> })[];
  routes: (Route & { command: Extract<Command, { type: 'travel' }> })[];
  legalActions: DiscreteCommand[];
  frame: null | {
    ticks: { min: 1; max: number };
    movement: { min: -1; max: 1 };
    aim: { min: number; max: number };
    ticksPerSecond: 60;
  };
  arena: typeof ARENA;
  catalog: {
    weapon: Weapon;
    boons: Boon[];
    weapons: Weapon[];
    runes: (typeof RUNES)[number][];
  };
  message: string;
}

function actionCandidates(state: State): DiscreteCommand[] {
  switch (state.phase) {
    case 'hub': {
      const runes = state.profile.unlockedRunes;
      const loadouts: RuneId[][] = [[], ...runes.map((rune) => [rune])];
      for (let i = 0; i < runes.length; i++)
        for (let j = i + 1; j < runes.length; j++) loadouts.push([runes[i], runes[j]]);
      return [
        ...WEAPONS.flatMap((entry) =>
          loadouts.flatMap((loadout): DiscreteCommand[] =>
            state.rulesVersion === 'night-passage-4'
              ? [{ type: 'start', weapon: entry.id, runes: loadout }]
              : DIFFICULTIES.map((difficulty) => ({
                  type: 'start',
                  weapon: entry.id,
                  runes: loadout,
                  difficulty,
                })),
          ),
        ),
        { type: 'train' },
      ];
    }
    case 'combat':
      return [{ type: 'retire' }];
    case 'reward':
      return [
        ...state.offers.map((id): DiscreteCommand => ({ type: 'choose', id })),
        { type: 'retire' },
      ];
    case 'route':
      return [
        ...state.routes.map((_, index): DiscreteCommand => ({ type: 'travel', index })),
        { type: 'retire' },
      ];
    case 'shop':
      return [
        ...(['heal', 'heart', 'boon'] as const).map((item): DiscreteCommand => ({
          type: 'buy',
          item,
        })),
        { type: 'leave' },
        { type: 'retire' },
      ];
    case 'won':
    case 'lost':
      return [{ type: 'return' }];
  }
}

/** A detached view of the current scene; no seed, RNG, future draws or replay journal. */
export function observeChronicle(chronicle: Chronicle): Observation {
  const state = chronicle.state;
  const frameTicks = chronicle.frameTicks;
  const canFrame = frameTicks > 0;
  return structuredClone({
    version: API_VERSION,
    rulesVersion: state.rulesVersion,
    contentVersion: contentVersion(state.rulesVersion),
    difficulty: state.difficulty,
    phase: state.phase,
    tick: state.tick,
    region: state.region,
    chamber: state.chamber,
    roomsCleared: state.roomsCleared,
    gold: state.gold,
    kills: state.kills,
    score: passageScore(state),
    player: state.player,
    profile: state.profile,
    room: {
      ...state.room,
      hazards: state.room.hazards.map((hazard) => {
        const cycle = hazardPhase(state.tick, hazard.offset);
        const timing = hazardTiming(hazard);
        return {
          ...hazard,
          active: cycle >= timing.active,
          warning: cycle > timing.warning && cycle < timing.active,
          cycle,
          ticksUntilActive: Math.max(0, timing.active - cycle),
        };
      }),
    },
    enemies: state.enemies.map(
      ({ id, kind, x, y, hp, maxHp, radius, aim, windup, stagger, burn, chill, exposed }) => ({
        id,
        kind,
        x,
        y,
        hp,
        maxHp,
        radius,
        aim,
        windup,
        stagger,
        burn,
        chill,
        exposed,
      }),
    ),
    projectiles: state.projectiles.map(({ id, x, y, vx, vy, radius, hostile, life }) => ({
      id,
      x,
      y,
      vx,
      vy,
      radius,
      hostile,
      life,
    })),
    threats: state.enemies
      .filter((enemy) => enemy.windup > 0)
      .map((enemy) => ({
        enemyId: enemy.id,
        remainingWindupTicks: enemy.windup,
        shapes: attackShapes(enemy, state.region),
        projectileAngles: projectileAngles(enemy, state.region),
      })),
    offers: state.offers.map((id) => ({ ...boon(id), command: { type: 'choose', id } })),
    routes: state.routes.map((route, index) => ({ ...route, command: { type: 'travel', index } })),
    // Use the actual command boundary for affordability, rune unlocks and replay limits.
    // Trial dispatches produce new sessions; they never mutate this chronicle or its RNG.
    legalActions: actionCandidates(state).filter((command) => !dispatch(chronicle, command).error),
    frame: canFrame
      ? {
          ticks: { min: 1, max: frameTicks },
          movement: { min: -1, max: 1 },
          aim: { min: -Math.PI, max: Math.PI },
          ticksPerSecond: 60,
        }
      : null,
    arena: ARENA,
    catalog: {
      weapon: weapon(state.player.weapon),
      boons: state.player.boons.map((entry) => boon(entry.id)),
      weapons: state.phase === 'hub' ? [...WEAPONS] : [],
      runes: RUNES.filter((rune) => state.profile.unlockedRunes.includes(rune.id)),
    },
    message: state.message,
  }) as Observation;
}

export interface Agent {
  observe(): Observation;
  step(command: unknown): { accepted: boolean; error: string | null; observation: Observation };
  exportReplay(): string;
}

// Whitelist the command payload as well: unknown caller metadata must not enter the replay.
export function commandPayload(command: Command): Command {
  switch (command.type) {
    case 'start':
      return {
        type: 'start',
        weapon: command.weapon,
        runes: [...command.runes],
        ...(command.difficulty ? { difficulty: command.difficulty } : {}),
      };
    case 'frame': {
      const { x, y, aim, attack, special, dash, cast, call } = command.input;
      return {
        type: 'frame',
        ticks: command.ticks,
        input: { x, y, aim, attack, special, dash, cast, call },
      };
    }
    case 'choose':
      return { type: 'choose', id: command.id };
    case 'travel':
      return { type: 'travel', index: command.index };
    case 'buy':
      return { type: 'buy', item: command.item };
    default:
      return { type: command.type };
  }
}

/** Own the chronicle in a closure so a policy cannot modify authoritative state. */
export function createAgent(seed: string, rules?: RulesVersion): Agent {
  let chronicle = createChronicle(seed, rules);
  return {
    observe: () => observeChronicle(chronicle),
    step(command) {
      if (!validCommand(command))
        return {
          accepted: false,
          error: 'Malformed action.',
          observation: observeChronicle(chronicle),
        };
      const result = dispatch(chronicle, commandPayload(command));
      chronicle = result.chronicle;
      return {
        accepted: result.error === null,
        error: result.error,
        observation: observeChronicle(chronicle),
      };
    },
    exportReplay: () => exportChronicle(chronicle),
  };
}
