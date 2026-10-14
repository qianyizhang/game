import { hashSeed, shuffle } from '../../../shared/random';
import { isRecord } from '../../../shared/json';
import { BOONS, boon, CHAMBERS_PER_REGION, REGIONS, RUNES, WEAPONS } from './content';
import { stepCombat } from './combat';
import { drawBoons } from './boon-offers';
import { spawnEnemy } from './encounters';
import { CHAMBER_LAYOUTS, chamberLayout } from './chamber-content';
import { distance } from './geometry';
import type { Command, Input, LayoutId, Player, Reward, Route, State } from './types';
export type { Command, Input, State } from './types';

import { DIFFICULTIES, DIFFICULTY, RULES_VERSION, type RulesVersion } from './contracts';
export { RULES_VERSION } from './contracts';
const freshPlayer = (): Player => ({
  x: 480,
  y: 430,
  hp: 120,
  maxHp: 120,
  aim: -Math.PI / 2,
  weapon: 'sword',
  runes: [],
  boons: [],
  invulnerable: 0,
  dashLeft: 0,
  dashCooldown: 0,
  dashAim: 0,
  recovery: 0,
  strike: null,
  buffer: null,
  casts: 3,
  castClock: 0,
  charge: 0,
  combo: 0,
  hindered: 0,
});
export function createGame(seed: string, rulesVersion: RulesVersion = RULES_VERSION): State {
  return {
    rulesVersion,
    difficulty: 'standard',
    seed,
    rng: hashSeed(seed),
    tick: 0,
    nextId: 1,
    phase: 'hub',
    profile: {
      ash: 0,
      runs: 0,
      wins: 0,
      deepest: 0,
      vitality: 0,
      unlockedRunes: ['vigor', 'fleet', 'focus'],
    },
    runNumber: 0,
    region: 0,
    chamber: 0,
    roomsCleared: 0,
    gold: 0,
    earnedAsh: 0,
    kills: 0,
    player: freshPlayer(),
    room: {
      name: 'The Lantern Quay',
      reward: 'boon',
      boss: false,
      wave: 0,
      waves: 1,
      pillars: [],
      hazards: [],
    },
    enemies: [],
    projectiles: [],
    cues: [],
    offers: [],
    rewardReturn: 'route',
    routes: [],
    purchases: [],
    message: 'Borrow a light. Find a way through.',
  };
}
const routeInfo: Record<Reward, Omit<Route, 'reward'>> = {
  boon: { label: 'Divine audience', detail: 'Fight for a choice of three god boons.' },
  coin: { label: 'Ferryman’s cache', detail: 'Fight for 65 gold.' },
  heart: { label: 'Living ember', detail: 'Fight for +20 maximum health and 20 healing.' },
  upgrade: { label: 'Memory shrine', detail: 'Fight to strengthen a boon you already carry.' },
  fountain: { label: 'Quiet spring', detail: 'A safe room. Recover 35 health.' },
  shop: {
    label: 'The wandering market',
    detail: 'A safe room. Spend gold on healing, vitality or a boon.',
  },
  trial: {
    label: 'Oath of danger',
    detail: 'An optional harder encounter with an extra wave, a boon and 80 gold.',
  },
};
function shuffled<T>(state: State, items: readonly T[]): T[] {
  const [result, next] = shuffle(items, state.rng);
  state.rng = next;
  return result;
}
function ordinaryRoutes(state: State, rewards: readonly Reward[]): Route[] {
  const layouts = shuffled(
    state,
    CHAMBER_LAYOUTS.filter((layout) => layout.id !== state.room.layout),
  );
  let next = 0;
  return rewards.map((reward) => {
    const detail = routeInfo[reward].detail
      .replace('35 health', `${Math.round(35 * DIFFICULTY[state.difficulty].healing)} health`)
      .replace('20 healing', `${Math.round(20 * DIFFICULTY[state.difficulty].healing)} healing`);
    const route = { reward, ...routeInfo[reward], detail };
    if (reward === 'shop' || reward === 'fountain') return route;
    const layout = layouts[next++];
    return {
      ...route,
      layout: layout.id,
      detail: `${layout.name}: ${layout.description} ${route.detail}`,
    };
  });
}
export function offerBoons(state: State, upgrade = false): void {
  [state.offers, state.rng] = drawBoons(state.player.boons, state.rng, upgrade);
  if (state.offers.length === 0) {
    state.gold += 45;
    state.message = 'Your blessings are complete. The shrine grants 45 gold.';
    if (state.rewardReturn === 'shop') state.phase = 'shop';
    else routePhase(state);
  } else state.phase = 'reward';
}
function routePhase(state: State): void {
  state.phase = 'route';
  state.rewardReturn = 'route';
  state.offers = [];
  if (state.chamber === CHAMBERS_PER_REGION - 2) {
    state.routes = [
      {
        reward: 'boon',
        label: REGIONS[state.region].boss,
        detail: `Face this region’s guardian. A spring restores ${Math.round(25 * DIFFICULTY[state.difficulty].healing)} health on entry.`,
      },
    ];
  } else if (state.chamber === CHAMBERS_PER_REGION - 1) {
    const next = ordinaryRoutes(state, ['boon'])[0];
    state.routes = [
      {
        ...next,
        label: REGIONS[state.region + 1].name,
        detail: `Descend to the next region. ${next.detail}`,
      },
    ];
  } else {
    const pool: Reward[] = [
      'boon',
      'coin',
      'heart',
      'trial',
      ...(state.player.boons.length ? ['upgrade' as const] : []),
    ];
    const choices: Reward[] = shuffled(state, pool).slice(0, 2);
    if (state.chamber === 2 || state.chamber === CHAMBERS_PER_REGION - 3)
      choices.push(state.chamber === 2 ? 'shop' : 'fountain');
    state.routes = ordinaryRoutes(state, choices);
  }
}
function spawnWave(state: State): void {
  const region = REGIONS[state.region];
  if (state.room.boss) {
    spawnEnemy(state, 'boss', { x: 480, y: 190 });
    return;
  }
  const positions = shuffled(state, chamberLayout(state.room.layout ?? 'court').spawns).filter(
    (point) => distance(point, state.player) >= 140,
  );
  const count = Math.min(5, 2 + state.region + (state.room.reward === 'trial' ? 1 : 0));
  const kinds = shuffled(state, region.enemies);
  for (let i = 0; i < count; i++) {
    const kind = kinds[i % kinds.length];
    const ranged = kind === 'archer' || kind === 'witch';
    // Keep seeded variety within broad distance bands: ranged backline, melee approach.
    positions.sort(
      (a, b) =>
        (ranged ? -1 : 1) *
        (Math.floor(distance(a, state.player) / 100) - Math.floor(distance(b, state.player) / 100)),
    );
    const point = positions.shift();
    if (!point) throw new Error('Chamber layout has insufficient safe reinforcement sites.');
    spawnEnemy(state, kind, point);
  }
}
function enterRoom(state: State, reward: Reward, layoutId: LayoutId = 'court'): void {
  const boss = state.chamber === CHAMBERS_PER_REGION - 1;
  const safe = !boss && (reward === 'shop' || reward === 'fountain');
  const layout = boss || safe ? null : chamberLayout(layoutId);
  const hazardSites = boss
    ? [
        { x: 260, y: 390, offset: 0 },
        { x: 700, y: 230, offset: 145 },
      ]
    : (layout?.hazards ?? []);
  state.room = {
    name: boss
      ? REGIONS[state.region].boss
      : `${REGIONS[state.region].name} · ${layout?.name ?? (reward === 'shop' ? 'Market' : 'Quiet spring')}`,
    ...(layout ? { layout: layout.id } : {}),
    reward,
    boss,
    wave: 1,
    waves: boss
      ? 1
      : (state.chamber === 0 && state.region === 0 ? 1 : 2 + Number(state.region > 1)) +
        Number(reward === 'trial'),
    pillars: layout?.pillars.map((pillar) => ({ ...pillar })) ?? [],
    hazards:
      state.region === 0 && state.chamber === 0
        ? []
        : hazardSites.map((site) => ({
            ...site,
            radius: state.region === 2 ? 60 : 46,
            kind: REGIONS[state.region].hazardKind,
          })),
  };
  Object.assign(state.player, {
    x: 480,
    y: 470,
    strike: null,
    buffer: null,
    recovery: 0,
    dashLeft: 0,
    invulnerable: 60,
    hindered: 0,
  });
  state.enemies = [];
  state.projectiles = [];
  state.cues = [];
  state.routes = [];
  state.offers = [];
  state.purchases = [];
  state.rewardReturn = 'route';
  if (boss)
    state.player.hp = Math.min(
      state.player.maxHp,
      state.player.hp + Math.round(25 * DIFFICULTY[state.difficulty].healing),
    );
  if (!boss && reward === 'shop') {
    state.phase = 'shop';
    state.message = 'The ferryman trades in borrowed time.';
    return;
  }
  if (!boss && reward === 'fountain') {
    state.player.hp = Math.min(
      state.player.maxHp,
      state.player.hp + Math.round(35 * DIFFICULTY[state.difficulty].healing),
    );
    state.message = `The quiet spring restores ${Math.round(35 * DIFFICULTY[state.difficulty].healing)} health.`;
    routePhase(state);
    return;
  }
  state.phase = 'combat';
  state.message = boss
    ? 'The guardian stirs. Watch its warning marks.'
    : 'Clear the chamber to claim its reward.';
  spawnWave(state);
}
function clearRoom(state: State): void {
  state.roomsCleared++;
  state.earnedAsh += 2;
  if (state.player.runes.includes('mercy'))
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 3);
  state.projectiles = [];
  state.player.buffer = null;
  state.player.strike = null;
  if (state.room.boss) {
    state.earnedAsh += 10;
    state.profile.deepest = Math.max(state.profile.deepest, state.region + 1);
    if (state.region === REGIONS.length - 1) {
      state.phase = 'won';
      state.message = 'You brought a light through the Starless Gate.';
      return;
    }
  }
  state.message = 'Chamber cleared. Choose your next advantage.';
  switch (state.room.reward) {
    case 'trial':
      state.gold += 80;
      offerBoons(state);
      break;
    case 'boon':
      offerBoons(state);
      break;
    case 'upgrade':
      offerBoons(state, true);
      break;
    case 'heart':
      state.player.maxHp += 20;
      state.player.hp = Math.min(
        state.player.maxHp,
        state.player.hp + Math.round(20 * DIFFICULTY[state.difficulty].healing),
      );
      routePhase(state);
      break;
    case 'coin':
      state.gold += 65;
      routePhase(state);
      break;
    default:
      routePhase(state);
  }
}
const numberIn = (v: unknown, low: number, high: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= low && v <= high;
export function validInput(value: unknown): value is Input {
  return (
    isRecord(value) &&
    numberIn(value.x, -1, 1) &&
    numberIn(value.y, -1, 1) &&
    numberIn(value.aim, -Math.PI, Math.PI) &&
    ['attack', 'special', 'dash', 'cast', 'call'].every((key) => typeof value[key] === 'boolean')
  );
}
export function validCommand(value: unknown): value is Command {
  if (!isRecord(value)) return false;
  switch (value.type) {
    case 'start':
      return (
        (value.difficulty === undefined || DIFFICULTIES.some((d) => d === value.difficulty)) &&
        WEAPONS.some((w) => w.id === value.weapon) &&
        Array.isArray(value.runes) &&
        value.runes.length <= 2 &&
        new Set(value.runes).size === value.runes.length &&
        value.runes.every((r: unknown) => RUNES.some((entry) => entry.id === r))
      );
    case 'frame':
      return (
        validInput(value.input) && numberIn(value.ticks, 1, 120) && Number.isInteger(value.ticks)
      );
    case 'choose':
      return typeof value.id === 'string' && BOONS.some((b) => b.id === value.id);
    case 'travel':
      return numberIn(value.index, 0, 2) && Number.isInteger(value.index);
    case 'buy':
      return value.item === 'heal' || value.item === 'heart' || value.item === 'boon';
    case 'leave':
    case 'return':
    case 'retire':
    case 'train':
      return true;
    default:
      return false;
  }
}
function rejection(state: State, command: Command): string | null {
  switch (command.type) {
    case 'start':
      return state.rulesVersion === 'night-passage-4' && command.difficulty !== undefined
        ? 'Legacy chronicles keep their original Standard rules. Begin a new chronicle for difficulty selection.'
        : state.phase !== 'hub'
          ? 'Return to the quay before starting.'
          : command.runes.some((r) => !state.profile.unlockedRunes.includes(r))
            ? 'That rune is still locked.'
            : null;
    case 'frame':
      return state.phase !== 'combat' ? 'Combat is not active.' : null;
    case 'choose':
      return state.phase !== 'reward' || !state.offers.includes(command.id)
        ? 'Choose an offered blessing.'
        : null;
    case 'travel':
      return state.phase !== 'route' || !state.routes[command.index]
        ? 'Choose an open route.'
        : null;
    case 'buy':
      return state.phase !== 'shop'
        ? 'Find a market first.'
        : state.purchases.includes(command.item)
          ? 'Already purchased in this market.'
          : state.gold < { heal: 35, heart: 60, boon: 80 }[command.item]
            ? 'Not enough gold.'
            : command.item === 'heal' && state.player.hp === state.player.maxHp
              ? 'Your health is already full.'
              : null;
    case 'leave':
      return state.phase !== 'shop' ? 'You are not at a market.' : null;
    case 'return':
      return state.phase !== 'won' && state.phase !== 'lost' ? 'This passage has not ended.' : null;
    case 'retire':
      return state.phase === 'hub' || state.phase === 'won' || state.phase === 'lost'
        ? 'No active passage to end.'
        : null;
    case 'train':
      return state.phase !== 'hub'
        ? 'Training is available at the quay.'
        : state.profile.vitality >= 3
          ? 'Vitality is fully trained.'
          : state.profile.ash < (state.profile.vitality + 1) * 15
            ? 'Not enough ash.'
            : null;
  }
}
export function applyCommand(
  previous: State,
  command: Command,
): { state: State; error: string | null } {
  if (!validCommand(command)) return { state: previous, error: 'Malformed action.' };
  const error = rejection(previous, command);
  if (error) return { state: previous, error };
  const state = structuredClone(previous);
  switch (command.type) {
    case 'start': {
      state.difficulty = command.difficulty ?? 'standard';
      state.runNumber++;
      state.rng = hashSeed(`${state.seed}:${state.runNumber}`);
      state.region = 0;
      state.chamber = 0;
      state.roomsCleared = 0;
      state.gold = 0;
      state.earnedAsh = 0;
      state.kills = 0;
      state.tick = 0;
      state.player = { ...freshPlayer(), weapon: command.weapon, runes: [...command.runes] };
      state.player.maxHp +=
        state.profile.vitality * 10 + (command.runes.includes('vigor') ? 25 : 0);
      state.player.hp = state.player.maxHp;
      enterRoom(state, 'boon');
      break;
    }
    case 'frame':
      for (let n = 0; n < command.ticks && state.phase === 'combat'; n++) {
        stepCombat(state, command.input);
        if (state.player.hp <= 0) {
          state.phase = 'lost';
          state.message = 'Your lantern dims. The quay will remember.';
        } else if (state.enemies.length === 0) {
          if (state.room.wave < state.room.waves) {
            state.room.wave++;
            spawnWave(state);
          } else clearRoom(state);
        }
      }
      break;
    case 'choose': {
      const chosen = boon(command.id);
      const owned = state.player.boons.find((b) => b.id === command.id);
      if (owned) owned.level++;
      else {
        state.player.boons = state.player.boons.filter(
          (b) => chosen.slot === 'duo' || boon(b.id).slot !== chosen.slot,
        );
        state.player.boons.push({ id: command.id, level: 1 });
      }
      // A duo remains active only while both patrons still have an equipped boon.
      const gods = state.player.boons
        .filter((b) => boon(b.id).slot !== 'duo')
        .map((b) => boon(b.id).god);
      state.player.boons = state.player.boons.filter(
        (b) => !boon(b.id).requires || boon(b.id).requires!.every((g) => gods.includes(g)),
      );
      state.offers = [];
      if (state.rewardReturn === 'shop') state.phase = 'shop';
      else routePhase(state);
      break;
    }
    case 'travel': {
      const { reward, layout } = state.routes[command.index];
      if (state.chamber === CHAMBERS_PER_REGION - 1) {
        state.region++;
        state.chamber = 0;
      } else state.chamber++;
      enterRoom(state, reward, layout);
      break;
    }
    case 'buy':
      state.gold -= { heal: 35, heart: 60, boon: 80 }[command.item];
      state.purchases.push(command.item);
      if (command.item === 'heal')
        state.player.hp = Math.min(
          state.player.maxHp,
          state.player.hp + Math.round(40 * DIFFICULTY[state.difficulty].healing),
        );
      if (command.item === 'heart') {
        state.player.maxHp += 20;
        state.player.hp += Math.round(20 * DIFFICULTY[state.difficulty].healing);
      }
      if (command.item === 'boon') {
        state.rewardReturn = 'shop';
        offerBoons(state);
      }
      break;
    case 'leave':
      routePhase(state);
      break;
    case 'retire':
      state.phase = 'lost';
      state.message = 'You chose to carry these memories home.';
      break;
    case 'return': {
      state.profile.ash += state.earnedAsh;
      state.profile.runs++;
      state.profile.wins += previous.phase === 'won' ? 1 : 0;
      state.profile.unlockedRunes = RUNES.filter((r) => r.unlock <= state.profile.deepest).map(
        (r) => r.id,
      );
      state.phase = 'hub';
      state.enemies = [];
      state.projectiles = [];
      state.cues = [];
      state.offers = [];
      state.routes = [];
      state.message = `Passage remembered. ${state.earnedAsh} ash returned to the quay.`;
      break;
    }
    case 'train':
      state.profile.ash -= (state.profile.vitality + 1) * 15;
      state.profile.vitality++;
      break;
  }
  return { state, error: null };
}
