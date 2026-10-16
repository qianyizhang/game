import {
  DELTA,
  DIRECTIONS,
  ROOM_SIZE,
  frontiers,
  opposite,
  placeRoom,
  renderLayout,
  sameCell,
  threshold,
  type Cell,
  type Frontier,
  type Layout,
  type PlacedRoom,
  type Rotation,
} from '../../../shared/layout/layout';
import {
  CHAMBERS,
  ENTRANCE,
  GUARDIAN,
  RELICS,
  ENEMIES,
  ROOM_LIMIT,
  chamber,
  type RelicId,
} from '../domain/content';
import {
  chamberDescription,
  combatProfile,
  incomingHit,
  type CombatProfile,
  activeRoom,
  distance,
  type Command,
  type Enemy,
  type State,
} from '../domain/game';

export type PolicyCommand = Command;
export interface Aliases {
  ids: Record<string, number>;
  next: number;
}
export const emptyAliases = (): Aliases => ({ ids: {}, next: 1 });
export interface Forecast {
  command: PolicyCommand;
  hpAfter: number;
  damageDealt: number;
  kills: number;
  focusAfter: number;
  clearedRoom: boolean;
  won: boolean;
  playerAfter: Cell;
  enemiesAfter: { id: number; x: number; y: number; hp: number }[];
}
export interface Observation {
  schema: 'cartographer-observation-2';
  phase: 'field' | 'draft' | 'relic' | 'ended';
  status: State['status'];
  player: State['player'];
  combat: CombatProfile;
  layout: Layout;
  tiles: string[];
  room: PlacedRoom;
  enemies: Enemy[];
  cleared: string[];
  relics: RelicId[];
  relicOffers: RelicId[];
  draft: Frontier | null;
  offers: string[];
  threat: number;
  turn: number;
  frontiers: (Frontier & { buildable: boolean })[];
  definitions: {
    chambers: typeof CHAMBERS;
    entrance: typeof ENTRANCE;
    guardian: typeof GUARDIAN;
    relics: typeof RELICS;
    enemies: typeof ENEMIES;
  };
  actions: PolicyCommand[];
  forecasts: Forecast[];
}
/** Compatibility of an already public template and placed geometry, with no seeded offer stream. */
export function publicDraftRotations(layout: Layout, draft: Frontier, id: string): Rotation[] {
  return ([0, 1, 2, 3] as Rotation[]).filter((rotation) => {
    try {
      const next = placeRoom(layout, chamber(id), draft, rotation);
      return (
        next.rooms.at(-1)!.doors.includes(opposite(draft.direction)) &&
        (next.rooms.length === ROOM_LIMIT || frontiers(next).length > 0)
      );
    } catch {
      return false;
    }
  });
}
function sight(tiles: string[], a: Cell, b: Cell): boolean {
  if (a.x !== b.x && a.y !== b.y) return false;
  const dx = Math.sign(b.x - a.x),
    dy = Math.sign(b.y - a.y);
  for (let n = 1; n < distance(a, b); n++)
    if (tiles[a.y + dy * n]?.[a.x + dx * n] === '#') return false;
  return true;
}
/** Exactly the public announced-turn consequences. This never generates offers, relics or enemies. */
export function combatForecast(
  input: Pick<
    Observation,
    'player' | 'enemies' | 'room' | 'tiles' | 'relics' | 'cleared' | 'combat'
  >,
  command: PolicyCommand,
): Forecast | null {
  if (!['move', 'strike', 'shove', 'flare', 'brace'].includes(command.type)) return null;
  const player = { ...input.player };
  const foes = structuredClone(input.enemies);
  const aliveBefore = foes.length;
  const has = (id: RelicId) => input.relics.includes(id);
  let damageDealt = 0;
  if (command.type === 'move') {
    player.x += DELTA[command.direction].x;
    player.y += DELTA[command.direction].y;
  } else if ('target' in command) {
    const enemy = foes.find((e) => e.id === command.target)!;
    const oldHp = enemy.hp;
    if (command.type === 'flare') {
      player.focus--;
      enemy.hp -= 4;
    } else if (command.type === 'strike')
      enemy.hp -=
        player.attack +
        (has('compass') && input.room.doors.some((d) => sameCell(player, threshold(input.room, d)))
          ? 2
          : 0);
    else {
      enemy.hp -= 2 + (has('chisel') ? 2 : 0);
      const to = {
        x: enemy.x + Math.sign(enemy.x - player.x),
        y: enemy.y + Math.sign(enemy.y - player.y),
      };
      const tile = input.tiles[to.y]?.[to.x];
      if (tile === '~') enemy.hp -= 4;
      else if (
        Math.floor(to.x / ROOM_SIZE) !== input.room.x ||
        Math.floor(to.y / ROOM_SIZE) !== input.room.y ||
        tile !== '.' ||
        foes.some((e) => e.id !== enemy.id && e.hp > 0 && sameCell(e, to))
      )
        enemy.hp -= 2;
      else Object.assign(enemy, to);
      enemy.intent = { kind: 'wait', cells: [], damage: 0 };
    }
    damageDealt = oldHp - Math.max(0, enemy.hp);
  }
  for (const enemy of foes.filter((e) => e.hp > 0)) {
    if (enemy.intent.kind === 'attack' && enemy.intent.cells.some((cell) => sameCell(cell, player)))
      player.hp = Math.max(
        0,
        player.hp -
          incomingHit(
            enemy.intent.damage,
            has('shell'),
            command.type === 'brace' ? input.combat.brace : 0,
          ),
      );
    else if (enemy.intent.kind === 'move') {
      const to = enemy.intent.cells[0];
      if (
        to &&
        !sameCell(to, player) &&
        !foes.some((other) => other.id !== enemy.id && other.hp > 0 && sameCell(other, to))
      )
        Object.assign(enemy, to);
    }
  }
  const remaining = foes.filter((e) => e.hp > 0);
  const clearedRoom = player.hp > 0 && !remaining.length && !input.cleared.includes(input.room.id);
  if (clearedRoom) {
    player.focus = 3;
    if (chamber(input.room.template).reward === 'heal')
      player.hp = Math.min(player.maxHp, player.hp + input.combat.healing);
  }
  return {
    command,
    hpAfter: player.hp,
    damageDealt,
    kills: aliveBefore - remaining.length,
    focusAfter: player.focus,
    clearedRoom,
    won: clearedRoom && input.room.template === 'guardian',
    playerAfter: { x: player.x, y: player.y },
    enemiesAfter: foes.map(({ id, x, y, hp }) => ({ id, x, y, hp })),
  };
}
export function observe(state: State, aliases: Aliases): Observation {
  const room = activeRoom(state);
  const enemies = state.enemies
    .filter((e) => e.hp > 0 && e.room === room.id)
    .map((e) => ({
      ...structuredClone(e),
      id: aliases.ids[String(e.id)] ?? (aliases.ids[String(e.id)] = aliases.next++),
    }));
  const phase: Observation['phase'] =
    state.status !== 'playing'
      ? 'ended'
      : state.relicOffers.length
        ? 'relic'
        : state.draft
          ? 'draft'
          : 'field';
  const layout = structuredClone(state.layout);
  const input: Observation = {
    schema: 'cartographer-observation-2',
    phase,
    status: state.status,
    player: { ...state.player },
    combat: { ...combatProfile(state) },
    layout,
    tiles: renderLayout(layout),
    room: structuredClone(room),
    enemies,
    cleared: [...state.cleared],
    relics: [...state.relics],
    relicOffers: phase === 'relic' ? [...state.relicOffers] : [],
    draft: phase === 'draft' ? structuredClone(state.draft) : null,
    offers: phase === 'draft' ? [...state.offers] : [],
    threat: state.threat,
    turn: state.turn,
    frontiers: frontiers(layout).map((f) => ({
      ...f,
      buildable: (layout.rooms.length === ROOM_LIMIT - 1 ? [GUARDIAN] : CHAMBERS).some(
        (c) => publicDraftRotations(layout, f, c.id).length > 0,
      ),
    })),
    definitions: structuredClone({
      chambers: CHAMBERS,
      entrance: ENTRANCE,
      guardian: GUARDIAN,
      relics: RELICS,
      enemies: ENEMIES,
    }),
    actions: [],
    forecasts: [],
  };
  input.definitions.chambers.forEach((definition) => {
    definition.description = chamberDescription(definition.id, input.combat);
  });
  const actions = input.actions;
  if (phase === 'ended') return input;
  if (phase === 'relic') {
    for (const id of input.relicOffers) actions.push({ type: 'relic', id });
    return input;
  }
  if (phase === 'draft') {
    actions.push({ type: 'cancel-draft' });
    input.offers.forEach((id, offer) => {
      for (const rotation of publicDraftRotations(layout, input.draft!, id))
        actions.push({ type: 'draft', offer, rotation });
    });
    return input;
  }
  for (const direction of DIRECTIONS) {
    const to = { x: input.player.x + DELTA[direction].x, y: input.player.y + DELTA[direction].y };
    const tile = input.tiles[to.y]?.[to.x];
    if (
      (tile === '.' || (tile === '~' && input.relics.includes('boots'))) &&
      !enemies.some((e) => sameCell(e, to)) &&
      (!enemies.length ||
        (Math.floor(to.x / ROOM_SIZE) === room.x && Math.floor(to.y / ROOM_SIZE) === room.y))
    )
      actions.push({ type: 'move', direction });
  }
  for (const enemy of enemies) {
    if (distance(input.player, enemy) === 1)
      actions.push({ type: 'strike', target: enemy.id }, { type: 'shove', target: enemy.id });
    if (
      input.player.focus > 0 &&
      distance(input.player, enemy) <= 5 &&
      sight(input.tiles, input.player, enemy)
    )
      actions.push({ type: 'flare', target: enemy.id });
  }
  actions.push({ type: 'brace' });
  if (!enemies.length)
    for (const f of input.frontiers)
      if (f.room === room.id && f.buildable && sameCell(input.player, threshold(room, f.direction)))
        actions.push({ type: 'explore', direction: f.direction });
  input.forecasts = actions.flatMap((command) => {
    const forecast = combatForecast(input, command);
    return forecast ? [forecast] : [];
  });
  return input;
}
