import type { PolicyFactory, Proposal } from '../../../shared/policy/types';
import {
  DELTA,
  DIRECTIONS,
  ROOM_SIZE,
  threshold,
  type Cell,
  type Direction,
} from '../../../shared/layout/layout';
import type { Forecast, Observation, PolicyCommand } from './observation';

export const STRATEGIES = ['immediate', 'survival', 'growth'] as const;
export type Strategy = (typeof STRATEGIES)[number];
const key = (at: Cell) => `${at.x},${at.y}`;
const commandKey = (command: PolicyCommand) => JSON.stringify(command, Object.keys(command).sort());
/** Search the already placed, public atlas. This never constructs an unplaced room. */
function routes(input: Observation): {
  first: Map<string, Direction | null>;
  distances: Map<string, number>;
  nodes: number;
} {
  const queue: Cell[] = [input.player],
    first = new Map<string, Direction | null>([[key(input.player), null]]);
  const distances = new Map<string, number>([[key(input.player), 0]]);
  for (let i = 0; i < queue.length; i++)
    for (const direction of DIRECTIONS) {
      const at = { x: queue[i].x + DELTA[direction].x, y: queue[i].y + DELTA[direction].y },
        id = key(at),
        tile = input.tiles[at.y]?.[at.x];
      if (
        first.has(id) ||
        !(tile === '.' || (tile === '~' && input.relics.includes('boots'))) ||
        input.enemies.some((enemy) => key(enemy) === id)
      )
        continue;
      first.set(id, first.get(key(queue[i])) ?? direction);
      distances.set(id, distances.get(key(queue[i]))! + 1);
      queue.push(at);
    }
  return { first, distances, nodes: queue.length };
}
/** Distance to a legal adjacent attack square, respecting public walls and water. */
function combatDistance(
  input: Observation,
  forecast: Forecast,
): { distance: number; nodes: number } {
  const living = forecast.enemiesAfter.filter((enemy) => enemy.hp > 0);
  if (!living.length) return { distance: 0, nodes: 0 };
  const floor = (at: Cell) => {
    const tile = input.tiles[at.y]?.[at.x];
    return (
      Math.floor(at.x / ROOM_SIZE) === input.room.x &&
      Math.floor(at.y / ROOM_SIZE) === input.room.y &&
      (tile === '.' || (tile === '~' && input.relics.includes('boots'))) &&
      !living.some((enemy) => key(enemy) === key(at))
    );
  };
  const queue: Cell[] = [],
    costs = new Map<string, number>();
  for (const enemy of living)
    for (const direction of DIRECTIONS) {
      const at = { x: enemy.x + DELTA[direction].x, y: enemy.y + DELTA[direction].y };
      if (floor(at) && !costs.has(key(at))) {
        costs.set(key(at), 0);
        queue.push(at);
      }
    }
  for (let i = 0; i < queue.length; i++) {
    const at = queue[i];
    if (key(at) === key(forecast.playerAfter))
      return { distance: costs.get(key(at))!, nodes: i + 1 };
    for (const direction of DIRECTIONS) {
      const next = { x: at.x + DELTA[direction].x, y: at.y + DELTA[direction].y };
      if (floor(next) && !costs.has(key(next))) {
        costs.set(key(next), costs.get(key(at))! + 1);
        queue.push(next);
      }
    }
  }
  return { distance: 0x100, nodes: queue.length };
}
function combatValue(
  input: Observation,
  forecast: Forecast,
  strategy: Strategy,
  nearest: number,
): number {
  if (forecast.hpAfter <= 0) return -1e6 + forecast.damageDealt;
  if (forecast.won) return 1e6 + forecast.hpAfter;
  const damageWeight = strategy === 'immediate' ? 4 : strategy === 'survival' ? 2 : 3;
  const lifeWeight = strategy === 'survival' ? 12 : strategy === 'growth' ? 5 : 2;
  const spending = input.player.focus - forecast.focusAfter;
  // Bracing can let an announced moving foe approach. Bracing forever against
  // a stationary firing line creates no progress; accept the cost of closing it.
  const idleBrace =
    forecast.command.type === 'brace' &&
    forecast.enemiesAfter.every((enemy) =>
      input.enemies.some(
        (before) => before.id === enemy.id && before.x === enemy.x && before.y === enemy.y,
      ),
    );
  return (
    (idleBrace ? -1000 : 0) +
    forecast.kills * 16 +
    forecast.damageDealt * damageWeight +
    (forecast.hpAfter - input.player.hp) * lifeWeight +
    Number(forecast.clearedRoom) * 100 -
    nearest * 1.3 -
    Math.max(0, spending) * (strategy === 'growth' ? 1.5 : 0.3)
  );
}
function emptyNeighbors(input: Observation, x: number, y: number): number {
  return DIRECTIONS.filter((d) => {
    const at = { x: x + DELTA[d].x, y: y + DELTA[d].y };
    return (
      at.x >= 0 &&
      at.y >= 0 &&
      at.x < input.layout.columns &&
      at.y < input.layout.rows &&
      !input.layout.rooms.some((room) => room.x === at.x && room.y === at.y)
    );
  }).length;
}
const relicValues = {
  immediate: { chisel: 14, compass: 10, shell: 8, moss: 6, boots: 4, lens: 3 },
  survival: { chisel: 7, compass: 5, shell: 16, moss: 13, boots: 8, lens: 4 },
  growth: { chisel: 11, compass: 10, shell: 8, moss: 7, boots: 6, lens: 14 },
} as const;
function factory(strategy: Strategy): PolicyFactory<Observation, PolicyCommand> {
  return {
    id: strategy,
    version: 'cartographer-policy-1',
    create() {
      let decisions = 0;
      let frontierGoal: string | null = null;
      return (input): Proposal<PolicyCommand> => {
        let work = input.actions.length,
          routeNodes = 0;
        const choose = (
          command: PolicyCommand,
          reason: string,
          value = 0,
        ): Proposal<PolicyCommand> => ({
          command,
          work,
          diagnostics: { strategy, reason, value, decisions: ++decisions, routeNodes },
        });
        if (!input.actions.length)
          throw new Error('No permitted action is available in this expedition.');
        const relics = input.actions.filter((command) => command.type === 'relic');
        if (relics.length) {
          const ranked = relics
            .map((command) => ({
              command,
              value:
                relicValues[strategy][command.id] +
                (command.id === 'moss' && input.player.hp < input.player.maxHp / 2 ? 3 : 0),
            }))
            .sort((a, b) => b.value - a.value);
          work += ranked.length;
          return choose(
            ranked[0].command,
            'choose an offered relic for this priority',
            ranked[0].value,
          );
        }
        const drafts = input.actions.filter((command) => command.type === 'draft');
        if (drafts.length) {
          const ranked = drafts
            .map((command) => {
              const id = input.offers[command.offer],
                chamber = [...input.definitions.chambers, input.definitions.guardian].find(
                  (room) => room.id === id,
                )!;
              const missing = Math.min(8, input.player.maxHp - input.player.hp),
                healing = chamber.reward === 'heal' ? missing : 0;
              const power = Number(chamber.reward === 'power'),
                focus = Number(chamber.reward === 'focus');
              const exits = chamber.doors
                .map((door) => DIRECTIONS[(DIRECTIONS.indexOf(door) + command.rotation) % 4])
                .filter((door) => {
                  const x = input.draft!.x + DELTA[door].x,
                    y = input.draft!.y + DELTA[door].y;
                  return (
                    x >= 0 &&
                    y >= 0 &&
                    x < input.layout.columns &&
                    y < input.layout.rows &&
                    !input.layout.rooms.some((room) => room.x === x && room.y === y)
                  );
                }).length;
              const value =
                strategy === 'growth'
                  ? power * 20 + healing * 0.5 + exits * 2 - chamber.danger
                  : strategy === 'survival'
                    ? healing * 2.5 + exits - chamber.danger * 6
                    : healing * 0.7 + focus * 2 + exits - chamber.danger * 4;
              return { command, value };
            })
            .sort((a, b) => b.value - a.value);
          work += ranked.length;
          frontierGoal = null;
          return choose(
            ranked[0].command,
            'choose only among visible room offers and legal rotations',
            ranked[0].value,
          );
        }
        if (input.enemies.length) {
          const ranked = input.forecasts
            .map((forecast) => {
              const approach = combatDistance(input, forecast);
              work += approach.nodes;
              return {
                command: forecast.command,
                value: combatValue(input, forecast, strategy, approach.distance),
              };
            })
            .filter((entry) =>
              input.actions.some((command) => commandKey(command) === commandKey(entry.command)),
            )
            .sort((a, b) => b.value - a.value);
          work += ranked.length;
          if (ranked.length)
            return choose(ranked[0].command, 'evaluate the public announced turn', ranked[0].value);
        }
        const map = routes(input);
        routeNodes = map.nodes;
        work += map.nodes;
        const candidates = input.frontiers
          .filter((frontier) => frontier.buildable)
          .map((frontier) => {
            const room = input.layout.rooms.find((room) => room.id === frontier.room)!,
              at = threshold(room, frontier.direction),
              id = `${frontier.room}:${frontier.direction}`;
            const steps = map.distances.get(key(at));
            return {
              frontier,
              id,
              at,
              steps,
              value:
                steps === undefined
                  ? -Infinity
                  : -steps +
                    (strategy === 'growth'
                      ? emptyNeighbors(input, frontier.x, frontier.y) * 0.5
                      : 0),
            };
          })
          .filter((candidate) => Number.isFinite(candidate.value));
        work += candidates.length;
        const goal =
          candidates.find((candidate) => candidate.id === frontierGoal) ??
          candidates.sort((a, b) => b.value - a.value)[0];
        if (goal) {
          frontierGoal = goal.id;
          if (goal.steps === 0) {
            const explore = input.actions.find(
              (command) =>
                command.type === 'explore' && command.direction === goal.frontier.direction,
            );
            if (explore) return choose(explore, 'attach at the selected public frontier');
          }
          const direction = map.first.get(key(goal.at)),
            move = input.actions.find(
              (command) => command.type === 'move' && command.direction === direction,
            );
          if (move) return choose(move, 'follow the placed atlas to a buildable doorway');
        }
        const explore = input.actions.find((command) => command.type === 'explore');
        if (explore) return choose(explore, 'use the available public frontier');
        return choose(
          input.actions.find((command) => command.type === 'brace') ?? input.actions[0],
          'no reachable public frontier',
        );
      };
    },
  };
}
export const builtins = Object.fromEntries(
  STRATEGIES.map((strategy) => [strategy, factory(strategy)]),
) as Record<Strategy, PolicyFactory<Observation, PolicyCommand>>;
