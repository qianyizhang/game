/** Verification policy uses legal player commands and public state only. */
import {
  DELTA,
  DIRECTIONS,
  frontiers,
  renderLayout,
  sameCell,
  threshold,
  type Cell,
} from '../../src/shared/layout/layout';
import {
  activeRoom,
  applyCommand,
  distance,
  draftRotations,
  type Command,
  type State,
} from '../../src/games/cartographer/domain/game';
import { chamber } from '../../src/games/cartographer/domain/content';
import {
  dispatch,
  newSession,
  type Session,
} from '../../src/games/cartographer/application/session';

function route(state: State, target: Cell): Command {
  const tiles = renderLayout(state.layout);
  const queue: { cell: Cell; first: Command | null }[] = [{ cell: state.player, first: null }];
  const seen = new Set([`${state.player.x},${state.player.y}`]);
  for (let i = 0; i < queue.length; i++) {
    const { cell, first } = queue[i];
    if (sameCell(cell, target) && first) return first;
    for (const direction of DIRECTIONS) {
      const p = { x: cell.x + DELTA[direction].x, y: cell.y + DELTA[direction].y },
        key = `${p.x},${p.y}`;
      if (seen.has(key) || tiles[p.y]?.[p.x] !== '.') continue;
      seen.add(key);
      queue.push({ cell: p, first: first ?? { type: 'move', direction } });
    }
  }
  throw new Error('Policy cannot reach a frontier.');
}
export function expeditionCommand(state: State): Command {
  if (state.relicOffers.length) {
    const ranked = ['chisel', 'shell', 'moss', 'compass', 'boots', 'lens'];
    return {
      type: 'relic',
      id: [...state.relicOffers].sort((a, b) => ranked.indexOf(a) - ranked.indexOf(b))[0],
    };
  }
  if (state.draft) {
    const ranked = state.offers.map((id, offer) => ({ offer, reward: chamber(id).reward }));
    ranked.sort((a, b) => {
      const score = (reward: string) =>
        reward === 'heal' && state.player.hp < 25
          ? 5
          : reward === 'power' && state.player.attack < 5
            ? 4
            : reward === 'heal'
              ? 3
              : 0;
      return score(b.reward) - score(a.reward);
    });
    const offer = ranked[0].offer;
    return { type: 'draft', offer, rotation: draftRotations(state, offer)[0] };
  }
  const foes = state.enemies.filter((e) => e.hp > 0 && e.room === activeRoom(state).id);
  if (foes.length) {
    const commands: Command[] = foes.flatMap(
      (e) =>
        [
          { type: 'strike', target: e.id },
          { type: 'shove', target: e.id },
          { type: 'flare', target: e.id },
        ] as Command[],
    );
    commands.push(...DIRECTIONS.map((direction) => ({ type: 'move' as const, direction })), {
      type: 'brace',
    });
    let best: { command: Command; score: number } | null = null;
    for (const command of commands) {
      const result = applyCommand(state, command);
      if (result.error) continue;
      const next = result.state,
        alive = next.enemies.filter((e) => e.hp > 0 && e.room === activeRoom(next).id);
      const dealt = foes.reduce(
        (sum, e) => sum + e.hp - Math.max(0, next.enemies.find((n) => n.id === e.id)!.hp),
        0,
      );
      const score =
        (next.player.hp - state.player.hp) * 12 +
        dealt * 4 +
        (foes.length - alive.length) * 15 +
        (next.status === 'won' ? 1000 : 0) -
        (alive.length ? Math.min(...alive.map((e) => distance(next.player, e))) : 0) * 0.8 +
        (command.type === 'shove' ? 0.2 : 0) -
        (command.type === 'brace' ? 1 : 0) -
        (command.type === 'flare' ? 1 : 0);
      if (!best || score > best.score) best = { command, score };
    }
    return best!.command;
  }
  const options = frontiers(state.layout)
    .map((f) => ({
      f,
      at: threshold(
        state.layout.rooms.find((r) => r.id === f.room)!,
        f.direction,
      ),
    }))
    .sort((a, b) => distance(a.at, state.player) - distance(b.at, state.player));
  const option = options[0];
  if (sameCell(option.at, state.player)) return { type: 'explore', direction: option.f.direction };
  return route(state, option.at);
}
export function playExpedition(seed: string): Session {
  let session = newSession(seed);
  for (let n = 0; n < 900 && session.state.status === 'playing'; n++) {
    const result = dispatch(session, expeditionCommand(session.state));
    if (result.error) throw new Error(result.error);
    session = result.session;
  }
  return session;
}
