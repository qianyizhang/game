import {
  center,
  DELTA,
  DIRECTIONS,
  emptyLayout,
  frontiers,
  opposite,
  placeRoom,
  renderLayout,
  ROOM_SIZE,
  sameCell,
  seededOrder,
  threshold,
  type Cell,
  type Direction,
  type Frontier,
  type Layout,
  type Rotation,
} from '../../../shared/layout/layout';
import {
  CHAMBERS,
  chamber,
  ENEMIES,
  ENTRANCE,
  GUARDIAN,
  RELICS,
  ROOM_LIMIT,
  type EnemyKind,
  type RelicId,
} from './content';

export const RULES_VERSION = 'cartographer-2';
export const LEGACY_RULES_VERSION = 'cartographer-1';
export type Difficulty = 'relaxed' | 'standard' | 'severe';
export const DIFFICULTIES = {
  relaxed: { label: 'Relaxed', hp: 48 },
  standard: { label: 'Standard', hp: 36 },
  severe: { label: 'Severe', hp: 28 },
} as const;
export interface Intent {
  kind: 'attack' | 'move' | 'wait';
  cells: Cell[];
  damage: number;
}
export interface Enemy extends Cell {
  id: number;
  kind: EnemyKind;
  hp: number;
  room: string;
  intent: Intent;
}
export interface State {
  /** Historical v1 state has no setup metadata. */
  rulesVersion?: typeof RULES_VERSION;
  difficulty?: Difficulty;
  seed: string;
  layout: Layout;
  player: Cell & { hp: number; maxHp: number; attack: number; focus: number };
  enemies: Enemy[];
  cleared: string[];
  relics: RelicId[];
  relicOffers: RelicId[];
  draft: Frontier | null;
  offers: string[];
  threat: number;
  turn: number;
  status: 'playing' | 'won' | 'lost';
  log: string[];
}
export type Command =
  | { type: 'move'; direction: Direction }
  | { type: 'strike' | 'shove' | 'flare'; target: number }
  | { type: 'brace' }
  | { type: 'explore'; direction: Direction }
  | { type: 'draft'; offer: number; rotation: Rotation }
  | { type: 'cancel-draft' }
  | { type: 'relic'; id: RelicId };
export const distance = (a: Cell, b: Cell): number => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
export const activeRoom = (state: State) =>
  state.layout.rooms.find(
    (r) =>
      r.x === Math.floor(state.player.x / ROOM_SIZE) &&
      r.y === Math.floor(state.player.y / ROOM_SIZE),
  )!;
const note = (s: State, message: string) => {
  s.log = [...s.log.slice(-7), message];
};
const living = (s: State) => s.enemies.filter((e) => e.hp > 0);
const local = (s: State) => living(s).filter((e) => e.room === activeRoom(s).id);
const has = (s: State, id: RelicId) => s.relics.includes(id);
function floor(s: State, p: Cell, player = false): boolean {
  const tile = renderLayout(s.layout)[p.y]?.[p.x];
  return tile === '.' || (player && tile === '~' && has(s, 'boots'));
}
function sight(s: State, a: Cell, b: Cell): boolean {
  if (a.x !== b.x && a.y !== b.y) return false;
  const dx = Math.sign(b.x - a.x),
    dy = Math.sign(b.y - a.y);
  const tiles = renderLayout(s.layout);
  for (let n = 1; n < distance(a, b); n++)
    if (tiles[a.y + dy * n]?.[a.x + dx * n] === '#') return false;
  return true;
}
function stepToward(s: State, enemy: Enemy): Cell | null {
  const room = activeRoom(s),
    tiles = renderLayout(s.layout);
  const queue: { cell: Cell; first: Cell | null }[] = [{ cell: enemy, first: null }];
  const seen = new Set([`${enemy.x},${enemy.y}`]);
  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    if (distance(item.cell, s.player) === 1) return item.first;
    for (const d of DIRECTIONS) {
      const p = { x: item.cell.x + DELTA[d].x, y: item.cell.y + DELTA[d].y },
        key = `${p.x},${p.y}`;
      if (
        Math.floor(p.x / ROOM_SIZE) !== room.x ||
        Math.floor(p.y / ROOM_SIZE) !== room.y ||
        seen.has(key) ||
        tiles[p.y]?.[p.x] !== '.' ||
        sameCell(p, s.player) ||
        living(s).some((e) => e.id !== enemy.id && sameCell(e, p))
      )
        continue;
      seen.add(key);
      queue.push({ cell: p, first: item.first ?? p });
    }
  }
  return null;
}
function plan(s: State): void {
  for (const e of local(s)) {
    const damage = ENEMIES[e.kind].damage + (s.threat >= 8 ? 1 : 0);
    if (
      (e.kind === 'archer' || e.kind === 'king') &&
      distance(e, s.player) <= 6 &&
      sight(s, e, s.player)
    ) {
      const dx = Math.sign(s.player.x - e.x),
        dy = Math.sign(s.player.y - e.y),
        cells: Cell[] = [];
      for (let n = 1; n <= 6; n++) {
        const p = { x: e.x + dx * n, y: e.y + dy * n };
        if (renderLayout(s.layout)[p.y]?.[p.x] === '#') break;
        cells.push(p);
      }
      e.intent = { kind: 'attack', cells, damage };
    } else if (e.kind === 'bomber' && distance(e, s.player) <= 2) {
      e.intent = {
        kind: 'attack',
        cells: DIRECTIONS.map((d) => ({ x: e.x + DELTA[d].x, y: e.y + DELTA[d].y })).concat([
          { x: e.x, y: e.y },
        ]),
        damage,
      };
    } else if (distance(e, s.player) === 1)
      e.intent = { kind: 'attack', cells: [{ x: s.player.x, y: s.player.y }], damage };
    else {
      const to = stepToward(s, e);
      e.intent = { kind: to ? 'move' : 'wait', cells: to ? [to] : [], damage: 0 };
    }
  }
}
export function createGame(
  seed: string,
  difficulty: Difficulty = 'standard',
  rulesVersion: string = RULES_VERSION,
): State {
  if (!Object.hasOwn(DIFFICULTIES, difficulty)) throw new Error('Unknown difficulty.');
  if (rulesVersion !== RULES_VERSION && rulesVersion !== LEGACY_RULES_VERSION)
    throw new Error('Unsupported Cartographer rules version.');
  if (typeof seed !== 'string' || !seed.trim() || seed.length > 80)
    throw new Error('Use a seed of 1–80 characters.');
  const layout = placeRoom(emptyLayout(), ENTRANCE, { x: 2, y: 2 });
  const hp = rulesVersion === LEGACY_RULES_VERSION ? 36 : DIFFICULTIES[difficulty].hp;
  return {
    ...(rulesVersion === RULES_VERSION ? { rulesVersion, difficulty } : {}),
    seed,
    layout,
    player: { ...center(layout.rooms[0]), hp, maxHp: hp, attack: 3, focus: 3 },
    enemies: [],
    cleared: [layout.rooms[0].id],
    relics: [],
    relicOffers: [],
    draft: null,
    offers: [],
    threat: 0,
    turn: 0,
    status: 'playing',
    log: ['Reach a golden doorway. Draft the dungeon. Defeat its king.'],
  };
}
export function draftRotations(s: State, offer: number): Rotation[] {
  if (!s.draft || !s.offers[offer]) return [];
  const frontier = s.draft;
  return ([0, 1, 2, 3] as Rotation[]).filter((rotation) => {
    try {
      const template = chamber(s.offers[offer]);
      const next = placeRoom(s.layout, template, frontier, rotation);
      const placed = next.rooms.at(-1)!;
      return (
        placed.doors.includes(opposite(frontier.direction)) &&
        (next.rooms.length === ROOM_LIMIT || frontiers(next).length > 0)
      );
    } catch {
      return false;
    }
  });
}
function spawn(s: State, from: Direction): void {
  const room = activeRoom(s),
    definition = chamber(room.template);
  const boss = room.template === 'guardian';
  const tiles = renderLayout(s.layout),
    positions: Cell[] = [];
  for (let y = room.y * ROOM_SIZE + 1; y < room.y * ROOM_SIZE + 8; y++)
    for (let x = room.x * ROOM_SIZE + 1; x < room.x * ROOM_SIZE + 8; x++)
      if (tiles[y][x] === '.' && distance({ x, y }, s.player) >= 4) positions.push({ x, y });
  const ordered = seededOrder(s.seed, `encounters:${room.id}:${room.template}`, positions);
  const kinds = seededOrder<EnemyKind>(s.seed, `kinds:${room.id}`, [
    'keeper',
    'archer',
    'crawler',
    'bomber',
  ]);
  const count = boss ? 1 : definition.reward === 'power' ? 3 : 2;
  for (let n = 0; n < count; n++) {
    const kind = boss ? 'king' : kinds[n];
    s.enemies.push({
      ...ordered[n],
      id: s.enemies.length + 1,
      kind,
      hp: ENEMIES[kind].hp,
      room: room.id,
      intent: { kind: 'wait', cells: [], damage: 0 },
    });
  }
  note(s, `Entered ${definition.name} from the ${from}. Doorways seal until the room is clear.`);
  plan(s);
}
function finishTurn(s: State, braced = false): void {
  s.turn++;
  for (const e of local(s)) {
    if (e.intent.kind === 'attack' && e.intent.cells.some((p) => sameCell(p, s.player))) {
      const amount = Math.max(
        0,
        Math.max(1, e.intent.damage - (has(s, 'shell') ? 1 : 0)) - (braced ? 3 : 0),
      );
      s.player.hp = Math.max(0, s.player.hp - amount);
      if (amount) note(s, `${ENEMIES[e.kind].name} hits for ${amount}.`);
    } else if (e.intent.kind === 'move') {
      const p = e.intent.cells[0];
      if (
        p &&
        !sameCell(p, s.player) &&
        !living(s).some((other) => other.id !== e.id && sameCell(other, p))
      ) {
        e.x = p.x;
        e.y = p.y;
      }
    }
  }
  if (s.player.hp <= 0) {
    s.status = 'lost';
    note(s, 'Your lantern went dark. A new seed is another expedition.');
    return;
  }
  const room = activeRoom(s);
  if (!local(s).length && !s.cleared.includes(room.id)) {
    s.cleared.push(room.id);
    s.player.focus = 3;
    const definition = chamber(room.template);
    if (definition.reward === 'heal') s.player.hp = Math.min(s.player.maxHp, s.player.hp + 8);
    if (definition.reward === 'power') s.player.attack++;
    note(
      s,
      `${definition.name} cleared. Focus restored.${definition.reward === 'heal' ? ' Restored 8 life.' : definition.reward === 'power' ? ' Strike damage increased.' : ''}`,
    );
    if (room.template === 'guardian') {
      s.status = 'won';
      note(s, 'The Unwritten King falls. You have charted a way home.');
      return;
    }
    if ([3, 5, 7].includes(s.cleared.length))
      s.relicOffers = seededOrder(
        s.seed,
        `loot:${s.cleared.length}`,
        RELICS.filter((r) => !has(s, r.id)).map((r) => r.id),
      ).slice(0, 3);
  }
  plan(s);
}
function execute(s: State, command: Command): void {
  if (s.status !== 'playing') throw new Error('This expedition has ended. Start a new run.');
  if (s.relicOffers.length) {
    if (command.type !== 'relic' || !s.relicOffers.includes(command.id))
      throw new Error('Choose an offered relic first.');
    s.relics.push(command.id);
    s.relicOffers = [];
    note(s, `Found ${RELICS.find((r) => r.id === command.id)!.name}.`);
    return;
  }
  if (s.draft) {
    if (command.type === 'cancel-draft') {
      s.draft = null;
      s.offers = [];
      return;
    }
    if (command.type !== 'draft' || !draftRotations(s, command.offer).includes(command.rotation))
      throw new Error('Choose a room and a matching rotation.');
    const definition = chamber(s.offers[command.offer]),
      frontier = s.draft;
    s.layout = placeRoom(s.layout, definition, frontier, command.rotation);
    s.threat += definition.danger;
    Object.assign(s.player, threshold(s.layout.rooms.at(-1)!, opposite(frontier.direction)));
    if (has(s, 'moss')) s.player.hp = Math.min(s.player.maxHp, s.player.hp + 3);
    s.draft = null;
    s.offers = [];
    spawn(s, opposite(frontier.direction));
    return;
  }
  if (command.type === 'explore') {
    const room = activeRoom(s);
    const frontier = frontiers(s.layout).find(
      (f) => f.room === room.id && f.direction === command.direction,
    );
    if (local(s).length || !frontier || !sameCell(s.player, threshold(room, command.direction)))
      throw new Error('Stand at an unexplored doorway in a cleared room.');
    s.draft = frontier;
    const pool =
      s.layout.rooms.length === ROOM_LIMIT - 1
        ? [GUARDIAN]
        : seededOrder(s.seed, `layout-offers:${s.layout.rooms.length}`, CHAMBERS);
    s.offers = pool.map((c) => c.id);
    s.offers = s.offers
      .filter((_, i) => draftRotations(s, i).length > 0)
      .slice(0, has(s, 'lens') ? 4 : 3);
    if (!s.offers.length) throw new Error('No room fits this doorway. Try another exit.');
    return;
  }
  if (command.type === 'move') {
    const p = {
      x: s.player.x + DELTA[command.direction].x,
      y: s.player.y + DELTA[command.direction].y,
    };
    if (!floor(s, p, true) || living(s).some((e) => sameCell(e, p)))
      throw new Error('That tile is blocked.');
    if (
      local(s).length &&
      (Math.floor(p.x / ROOM_SIZE) !== activeRoom(s).x ||
        Math.floor(p.y / ROOM_SIZE) !== activeRoom(s).y)
    )
      throw new Error('Clear the room before leaving.');
    s.player.x = p.x;
    s.player.y = p.y;
    finishTurn(s);
    return;
  }
  if (command.type === 'brace') {
    finishTurn(s, true);
    return;
  }
  if (command.type === 'strike' || command.type === 'shove' || command.type === 'flare') {
    const enemy = local(s).find((e) => e.id === command.target);
    if (!enemy) throw new Error('Choose a living enemy in this room.');
    if (command.type === 'flare') {
      if (!s.player.focus || distance(s.player, enemy) > 5 || !sight(s, s.player, enemy))
        throw new Error('Flare needs focus and a clear straight line within 5 tiles.');
      s.player.focus--;
      enemy.hp -= 4;
    } else {
      if (distance(s.player, enemy) !== 1) throw new Error('Move next to the enemy first.');
      if (command.type === 'strike') {
        const doorway = activeRoom(s).doors.some((d) =>
          sameCell(s.player, threshold(activeRoom(s), d)),
        );
        enemy.hp -= s.player.attack + (has(s, 'compass') && doorway ? 2 : 0);
      } else {
        enemy.hp -= 2 + (has(s, 'chisel') ? 2 : 0);
        const to = {
          x: enemy.x + Math.sign(enemy.x - s.player.x),
          y: enemy.y + Math.sign(enemy.y - s.player.y),
        };
        const tile = renderLayout(s.layout)[to.y]?.[to.x];
        if (tile === '~') {
          enemy.hp -= 4;
          note(s, 'The water tears away 4 more life.');
        } else if (
          Math.floor(to.x / ROOM_SIZE) !== activeRoom(s).x ||
          Math.floor(to.y / ROOM_SIZE) !== activeRoom(s).y ||
          !floor(s, to) ||
          living(s).some((e) => e.id !== enemy.id && sameCell(e, to))
        )
          enemy.hp -= 2;
        else {
          enemy.x = to.x;
          enemy.y = to.y;
        }
        enemy.intent = { kind: 'wait', cells: [], damage: 0 };
      }
    }
    note(
      s,
      `${command.type === 'flare' ? 'Flare' : command.type === 'shove' ? 'Shove' : 'Strike'} → ${ENEMIES[enemy.kind].name}${enemy.hp <= 0 ? ' defeated' : ` (${enemy.hp} life)`}.`,
    );
    finishTurn(s);
    return;
  }
  throw new Error('That action is not available now.');
}
export function applyCommand(
  state: State,
  command: Command,
): { state: State; error: string | null } {
  if (
    state.rulesVersion !== undefined &&
    (state.rulesVersion !== RULES_VERSION ||
      !state.difficulty ||
      !Object.hasOwn(DIFFICULTIES, state.difficulty))
  )
    return { state, error: 'Unsupported Cartographer rules or difficulty.' };
  const next = structuredClone(state);
  try {
    execute(next, command);
    return { state: next, error: null };
  } catch (error) {
    return { state, error: error instanceof Error ? error.message : 'Invalid action.' };
  }
}
