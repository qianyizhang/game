import { BOSS_POOLS } from '../content/bosses';
import { pick, roll } from './state';
import type { MapNode, NodeKind, SpireState } from './types';
export const MAP_ROWS = 15;
export const MAP_LANES = 7;
const nodeId = (act: number, row: number, lane: number) => `act${act}-${row}-${lane}`;
/** Six seeded walks merge and branch on a seven-column, fifteen-floor map. */
export function generateMap(run: SpireState): MapNode[] {
  const nodes = new Map<string, MapNode>();
  const get = (row: number, lane: number) => {
    const id = nodeId(run.act, row, lane);
    let node = nodes.get(id);
    if (!node) {
      node = { id, row, lane, kind: 'fight', encounter: [], visited: false, next: [] };
      nodes.set(id, node);
    }
    return node;
  };
  const starts = [0, 2, 4, 6, pick(run, [0, 1, 2, 3, 4, 5, 6]), pick(run, [0, 1, 2, 3, 4, 5, 6])];
  for (const start of starts) {
    let lane = start;
    for (let row = 0; row < MAP_ROWS - 1; row++) {
      const from = get(row, lane);
      const options = [lane - 1, lane, lane + 1].filter(
        (to) =>
          to >= 0 &&
          to < MAP_LANES &&
          ![...nodes.values()].some(
            (other) =>
              other.row === row &&
              other.lane !== lane &&
              other.next.some((id) => {
                const dest = nodes.get(id)!;
                return (other.lane - lane) * (dest.lane - to) < 0;
              }),
          ),
      );
      const to = get(row + 1, pick(run, options));
      if (!from.next.includes(to.id)) from.next.push(to.id);
      lane = to.lane;
    }
  }
  const ordered = [...nodes.values()].sort((a, b) => a.row - b.row || a.lane - b.lane);
  for (const node of ordered) {
    if (node.row === 0) node.kind = 'fight';
    else if (node.row === 8) node.kind = 'treasure';
    else if (node.row === 14) node.kind = 'rest';
    else {
      const parents = ordered.filter((n) => n.next.includes(node.id));
      const disallowed = parents
        .map((n) => n.kind)
        .filter((k) => ['elite', 'rest', 'shop'].includes(k));
      const value = roll(run);
      let kind: NodeKind =
        value < 0.22
          ? 'event'
          : value < 0.3
            ? 'shop'
            : value < 0.42
              ? 'rest'
              : value < 0.42 + (run.ascension >= 1 ? 0.128 : 0.08)
                ? 'elite'
                : 'fight';
      if ((node.row < 5 && ['elite', 'rest'].includes(kind)) || disallowed.includes(kind))
        kind = 'fight';
      node.kind = kind;
    }
  }
  const boss: MapNode = {
    id: nodeId(run.act, 15, 3),
    row: 15,
    lane: 3,
    kind: 'boss',
    encounter: [...pick<readonly string[]>(run, BOSS_POOLS[run.act - 1])],
    visited: false,
    next: [],
  };
  for (const node of ordered) if (node.row === 14) node.next = [boss.id];
  return [...ordered, boss];
}
export const availableNodes = (run: SpireState) =>
  run.phase === 'map'
    ? run.currentNode
      ? run.map.filter((n) =>
          run.map.find((current) => current.id === run.currentNode)!.next.includes(n.id),
        )
      : run.map.filter((n) => n.row === 0)
    : [];
const NORMALS = [
  [
    ['jawWorm'],
    ['cultist'],
    ['redLouse', 'greenLouse'],
    ['acidSlimeM', 'spikeSlimeM'],
    ['acidSlimeL'],
    ['spikeSlimeL'],
  ],
  [
    ['sphericGuardian'],
    ['chosen'],
    ['centurion', 'mystic'],
    ['snakePlant'],
    ['sentry', 'sphericGuardian'],
  ],
  [['orbWalker'], ['spiker', 'repulsor', 'exploder'], ['spireGrowth'], ['orbWalker', 'repulsor']],
];
const ELITES = [
  [['gremlinNob'], ['lagavulin'], ['sentry', 'sentry', 'sentry']],
  [['bookOfStabbing'], ['slaverBlue', 'taskmaster', 'slaverRed']],
  [['giantHead'], ['nemesis']],
];
export function encounterFor(run: SpireState, kind: NodeKind): string[] {
  if (kind === 'boss') return [...run.map.find((n) => n.kind === 'boss')!.encounter];
  if (kind === 'elite') {
    const choices = ELITES[run.act - 1].filter((e) => e.join(',') !== run.lastElite);
    const encounter = pick(run, choices);
    run.lastElite = encounter.join(',');
    return [...encounter];
  }
  const all = NORMALS[run.act - 1];
  const easy =
    run.fightsThisAct < (run.act === 1 ? 3 : 2) ? all.slice(0, run.act === 1 ? 3 : 2) : all;
  const encounter = pick(
    run,
    easy.filter((e) => e.join(',') !== run.lastEncounter),
  );
  run.lastEncounter = encounter.join(',');
  run.fightsThisAct++;
  return [...encounter];
}
