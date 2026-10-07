import { simulationOutput } from './output';
import { blindsideSession } from '../../src/games/balatro/application/session';
import { automatedEvidence } from './evidence';
import { writeFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { hashSeed, shuffle } from '../../src/shared/random';
import {
  act,
  exportReplay,
  importReplay,
  newSession,
  type Session,
} from '../../src/games/balatro/application/session';
import { activeBoss } from '../../src/games/balatro/content/blinds';
import { CONSUMABLE_BY_ID } from '../../src/games/balatro/content/consumables';
import { JOKER_BY_ID } from '../../src/games/balatro/content/jokers';
import { scoreHand } from '../../src/games/balatro/domain/scoring';
import type { Command, RunState } from '../../src/games/balatro/domain/types';

/** A deliberately simple development policy. It never reads draw order. */
function bestHand(run: RunState) {
  let best = { cards: [run.hand[0]], total: -1 };
  for (let bits = 1; bits < 2 ** run.hand.length; bits++) {
    const cards = run.hand.filter((_, i) => (bits & (1 << i)) !== 0);
    if (cards.length > 5 || (activeBoss(run) === 'five' && cards.length !== 5)) continue;
    const total = scoreHand(run, cards).total;
    if (total > best.total || (total === best.total && cards.length < best.cards.length))
      best = { cards, total };
  }
  return best;
}

function keepForRedraw(run: RunState, best: string[]) {
  const cards = run.hand.map((id) => run.deck.find((c) => c.id === id)!);
  const strongestSuit = ['hearts', 'spades', 'diamonds', 'clubs']
    .map((suit) => cards.filter((c) => c.suit === suit))
    .sort((a, b) => b.length - a.length)[0];
  const flushBuild = run.jokers.some((j) =>
    ['river', 'tidal', 'hearts', 'diamonds', 'spades', 'clubs'].includes(j.definitionId),
  );
  if (flushBuild && strongestSuit.length >= 3) return strongestSuit.slice(0, 5).map((c) => c.id);
  return best;
}

const additiveFirst = (id: string) =>
  ['bankroll', 'tidal', 'last', 'crown', 'constellation'].includes(id) ? 1 : 0;
function simulate(seed: string): Session {
  let session = newSession(seed);
  const command = (input: Command) => {
    const result = act(session, input);
    if (result.error) throw new Error(`${seed}: ${result.error}`);
    session = result.session;
  };
  for (let safety = 0; safety < 1000; safety++) {
    const run = session.run;
    if (run.phase === 'won' || run.phase === 'lost') return session;
    if (run.phase === 'ready') {
      command({ type: 'startBlind' });
      continue;
    }
    if (run.phase === 'shop') {
      // Value cards on an observable sample from permanent deck composition, never future RNG.
      const [sample] = shuffle(run.deck, hashSeed(`${seed}-policy-${run.ante}-${run.blind}`));
      const sampleRun = {
        ...run,
        phase: 'playing' as const,
        blind: 0,
        firstHandType: null,
        hand: sample.slice(0, 8).map((c) => c.id),
        handsLeft: 2,
        discardsLeft: 1,
      };
      const baseline = bestHand(sampleRun).total;
      const offers = run.shop
        .filter((o) => o.kind === 'joker' && o.price <= run.cash)
        .map((offer) => {
          const definition = JOKER_BY_ID[offer.definitionId];
          const owned = {
            id: 'candidate',
            definitionId: offer.definitionId,
            paid: offer.price,
            growth: definition.grow
              ? offer.definitionId === 'runner'
                ? 105
                : offer.definitionId === 'tidal'
                  ? 6
                  : 8
              : 0,
          };
          const options = run.jokers.length < 5 ? [-1] : run.jokers.map((_, index) => index);
          const choices = options.map((replace) => {
            const jokers = [...run.jokers.filter((_, i) => i !== replace), owned].sort(
              (a, b) => additiveFirst(a.definitionId) - additiveFirst(b.definitionId),
            );
            let value = bestHand({ ...sampleRun, jokers }).total / Math.max(1, baseline);
            if (definition.income && run.ante < 4 && run.jokers.length < 5) value += 0.5;
            if (definition.rule === 'extraHand') value *= 1.2;
            return { offer, replace, value };
          });
          return choices.sort((a, b) => b.value - a.value)[0];
        })
        .sort((a, b) => b.value - a.value);
      const pick = offers[0];
      if (pick && pick.value > (run.jokers.length < 5 ? 1.05 : 1.5)) {
        if (pick.replace >= 0) command({ type: 'sellJoker', id: run.jokers[pick.replace].id });
        command({ type: 'buy', offerId: pick.offer.id });
        const latest = session.run.jokers.at(-1)!;
        if (!additiveFirst(latest.definitionId)) {
          let position = session.run.jokers.length - 1;
          while (position > 0 && additiveFirst(session.run.jokers[position - 1].definitionId)) {
            command({ type: 'moveJoker', id: latest.id, direction: -1 });
            position--;
          }
        }
        continue;
      }
      const favored = bestHand(sampleRun);
      const hand = scoreHand(sampleRun, favored.cards).poker.type;
      const planet = run.shop.find(
        (o) =>
          o.kind === 'consumable' && o.definitionId === `planet-${hand}` && o.price <= run.cash,
      );
      if (planet && run.consumables.length < 2) {
        command({ type: 'buy', offerId: planet.id });
        command({ type: 'useConsumable', id: session.run.consumables.at(-1)!.id, cards: [] });
        continue;
      }
      if (run.cash >= 18 && run.rerolls < 2) {
        command({ type: 'reroll' });
        continue;
      }
      command({ type: 'leaveShop' });
      continue;
    }
    for (const owned of run.consumables)
      if (CONSUMABLE_BY_ID[owned.definitionId].targets === 0)
        command({ type: 'useConsumable', id: owned.id, cards: [] });
    const best = bestHand(session.run);
    const remaining = session.run.target - session.run.roundScore;
    if (session.run.discardsLeft > 0 && best.total < (remaining / session.run.handsLeft) * 1.25) {
      const keep = keepForRedraw(session.run, best.cards);
      const discard = session.run.hand.filter((id) => !keep.includes(id)).slice(0, 5);
      if (discard.length) {
        command({ type: 'discard', cards: discard });
        continue;
      }
    }
    command({ type: 'play', cards: best.cards });
  }
  throw new Error(`Run ${seed} exceeded the action bound.`);
}

it('finishes unmodified seeded runs and saves replayable evidence', () => {
  const output = simulationOutput('simulation');
  const seeds = [
    'FIRST-LIGHT',
    'GARDEN',
    'PAIR-CRAFT',
    'LONG-DISTANCE',
    'NEST-EGG',
    'WORKSHOP',
    'MOD-01',
    'MOD-02',
  ];
  const evidence: ReturnType<typeof automatedEvidence>[] = [];
  const summaries = seeds.map((seed) => {
    const session = simulate(seed);
    evidence.push(
      automatedEvidence(blindsideSession, { state: session.run, replay: session.replay }),
    );
    expect(['won', 'lost']).toContain(session.run.phase);
    expect(importReplay(exportReplay(session)).run).toEqual(session.run);
    writeFileSync(`${output}/${seed}.json`, exportReplay(session));
    return {
      seed,
      outcome: session.run.phase,
      ante: session.run.ante,
      blind: session.run.blind + 1,
      score: session.run.roundScore,
      target: session.run.target,
      commands: session.replay.commands.length,
      jokers: session.run.jokers.map((j) => j.definitionId),
    };
  });
  writeFileSync(`${output}/evidence.json`, JSON.stringify(evidence, null, 2));
  writeFileSync(`${output}/summary.json`, JSON.stringify(summaries, null, 2));
  expect(summaries.some((run) => run.outcome === 'won')).toBe(true);
  console.table(
    summaries.map((summary) =>
      Object.fromEntries(Object.entries(summary).filter(([key]) => key !== 'jokers')),
    ),
  );
}, 120_000);
