import { CARD_BY_ID } from '../content/cards';
import { playCard } from '../domain/combat';
import { currentIntent } from '../domain/enemies';
import { ENEMY_BY_ID } from '../content/world';
import type { Effect, SpireState } from '../domain/types';
import { turnLoss, powerValue } from './forecast';
import { legalActions } from './legality';
import { observe, type Observation, type PolicyCommand } from './observation';

type Strategy = 'immediate' | 'survival' | 'growth';
const supported = new Set([
  'damage',
  'block',
  'status',
  'power',
  'temporary',
  'energy',
  'heal',
  'loseHp',
  'noDraw',
  'nextTurn',
  'blur',
  'doubleStrength',
  'doubleBlock',
  'multiplyPoison',
]);

/** A bounded public approximation of this hand, never an authoritative seeded successor.
 * Draws, choices, random effects and generated cards end a search branch. The next
 * real observation supplies their outcome; no sorted pile is treated as draw order.
 */
export function project(input: Observation, command: PolicyCommand): Observation | null {
  if (command.type !== 'playCard' || !input.combat || input.combat.choice) return null;
  const original = input.combat,
    card = original.cards[command.id],
    def = CARD_BY_ID[card.definitionId];
  const effects = card.upgraded ? (def.upgradedEffects ?? def.effects) : def.effects;
  const exhausts =
    (card.upgraded ? (def.upgradedExhaust ?? def.exhaust) : def.exhaust) ||
    (def.kind === 'skill' && original.powers.corruption);
  if (
    effects.some((e) => !supported.has(e.type) || (e.type === 'damage' && e.random)) ||
    (exhausts && original.powers.darkEmbrace) ||
    original.timeWarpPending ||
    original.enemies.some(
      (e) => e.stasis || e.powers.timeWarp === 11 || (def.kind !== 'attack' && e.powers.hex),
    )
  )
    return null;
  // This is a fictional state assembled from public data, never the live state or its seed.
  // Hidden fields are fixed placeholders and cannot be queried as policy information.
  const view = structuredClone(input);
  const run: SpireState = {
    ...view,
    version: 3,
    seed: 'SPIRE-PUBLIC-MODEL-1',
    rng: 1,
    nextId: 1000000,
    resolution: { sequence: 0, frames: [] },
    practiceEncounter: true,
    unknownChances: { fight: 0, shop: 0, treasure: 0 },
    seenEvents: [],
    fightsThisAct: 0,
    lastEncounter: '',
    lastElite: '',
    rareOffset: 0,
    potionChance: 0,
    removals: 0,
    log: [],
    notice: '',
    map: view.map.map((n) => ({ ...n, encounter: [] })),
    combat: {
      ...view.combat!,
      resolving: null,
      choice: null,
      player: { ...view.combat!.player, freshDebuffs: [] },
      enemies: view.combat!.enemies.map((e) => ({
        ...e,
        freshDebuffs: [],
        ascension: view.ascension,
        turn: 0,
        history: [],
        intentIndex: Math.max(
          0,
          ENEMY_BY_ID[e.definitionId].intents.findIndex((i) => i.name === e.intent.name),
        ),
      })),
    },
  };
  const modeledIntents = run.combat!.enemies.map((e) =>
    JSON.stringify(currentIntent(e, run.combat!)),
  );
  if (
    playCard(run, command.id, command.target) ||
    run.rng !== 1 ||
    run.combat!.turn !== original.turn ||
    run.combat!.choice
  )
    return null;
  if (
    run.combat!.enemies.some(
      (e) =>
        e.definitionId === 'awakenedOne' &&
        e.hp === 0 &&
        original.enemies.find((o) => o.id === e.id)!.hp > 0,
    )
  )
    return null;
  const projected = observe(run);
  // Preserve the displayed move when fictional AI counters cannot reconstruct its exact numbers.
  // Only native, deterministic public triggers (split/wake/Mode Shift/Champ) may change it.
  for (const [index, enemy] of projected.combat!.enemies.entries()) {
    if (
      modeledIntents[index] ===
      JSON.stringify(currentIntent(run.combat!.enemies[index], run.combat!))
    ) {
      enemy.intent = structuredClone(original.enemies[index].intent);
    }
    // Model-only text never repeats damage numbers rendered for an older status state.
    enemy.intentText = enemy.intent.name;
  }
  projected.actions = legalActions(projected);
  return projected;
}

function endpoint(root: Observation, view: Observation, strategy: Strategy): number {
  const c = view.combat!,
    start = root.combat!;
  if (c.player.hp <= 0) return -1e9;
  const lossWeight = strategy === 'survival' ? 3.5 : strategy === 'growth' ? 2.8 : 2;
  const threat = turnLoss(view);
  let score = (c.player.hp - start.player.hp) * lossWeight - threat * lossWeight;
  if (c.player.hp <= threat) score -= 5000;
  for (const enemy of c.enemies) {
    const old = start.enemies.find((e) => e.id === enemy.id)!;
    const pressure = enemy.definitionId === 'sphericGuardian' ? 3 : 1;
    score +=
      (old.hp - enemy.hp) * pressure +
      (old.block - enemy.block) * (enemy.definitionId === 'sphericGuardian' ? 3 : 0.5);
    if (!enemy.targetable) score += 18;
    else score += Math.min(enemy.hp, enemy.status.poison * 3) * 0.8;
  }
  const horizon = strategy === 'growth' ? 3 : strategy === 'survival' ? 2.4 : 1.8;
  score +=
    ((c.player.status.strength - start.player.status.strength) * 3 +
      (c.player.status.dexterity - start.player.status.dexterity) * 4) *
    horizon;
  for (const key of Object.keys(c.powers) as Extract<Effect, { type: 'power' }>['power'][])
    score += (c.powers[key] - start.powers[key]) * powerValue(key) * (2 / 3) * horizon;
  score += (c.nextTurn.energy - start.nextTurn.energy) * 3;
  return score;
}

/** Replan on each actual observation; return the first action of the best bounded hand sequence. */
export function planTurn(
  input: Observation,
  strategy: Strategy,
  fallback: (view: Observation, command: PolicyCommand) => number,
) {
  type Node = { view: Observation; first: PolicyCommand; score: number };
  const width = 12,
    depth = 5;
  let work = 0;
  let best = {
    command: { type: 'endTurn' } as PolicyCommand,
    score: endpoint(input, input, strategy),
  };
  let beam: Node[] = [];
  const expand = (view: Observation, first?: PolicyCommand) => {
    const next: Node[] = [];
    for (const command of view.actions) {
      if (command.type !== 'playCard' && command.type !== 'potion') continue;
      work++;
      const projected = project(view, command);
      const score = projected
        ? endpoint(input, projected, strategy)
        : endpoint(input, view, strategy) + fallback(view, command);
      const chosen = first ?? command;
      if (score > best.score + 1e-8) best = { command: chosen, score };
      if (
        projected &&
        projected.combat!.player.hp > 0 &&
        projected.combat!.enemies.some((e) => e.targetable)
      )
        next.push({ view: projected, first: chosen, score });
    }
    return next;
  };
  beam = expand(input)
    .sort((a, b) => b.score - a.score)
    .slice(0, width);
  for (let d = 1; d < depth && beam.length; d++)
    beam = beam
      .flatMap((n) => expand(n.view, n.first))
      .sort((a, b) => b.score - a.score)
      .slice(0, width);
  return { ...best, work };
}
