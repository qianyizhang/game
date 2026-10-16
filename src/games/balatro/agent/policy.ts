import { hashSeed, shuffle } from '../../../shared/random';
import type { PolicyFactory, Proposal } from '../../../shared/policy/types';
import { CONSUMABLE_BY_ID } from '../content/consumables';
import { JOKER_BY_ID } from '../content/jokers';
import { PACK_BY_ID } from '../content/shop';
import type { Command, OwnedJoker, RunState } from '../domain/types';
import { bestHand, forecastState } from './forecast';
import type { Observation } from './observation';

export const STRATEGIES = ['immediate', 'survival', 'growth'] as const;
export type Strategy = (typeof STRATEGIES)[number];
const multiplier = (id: string) =>
  ['bankroll', 'tidal', 'last', 'crown', 'constellation'].includes(id);
const ordered = (jokers: OwnedJoker[]) =>
  [...jokers].sort(
    (a, b) => Number(multiplier(a.definitionId)) - Number(multiplier(b.definitionId)),
  );

/** All forecasts use only this observation and the policy's independent sample stream. */
export function createPolicy(strategy: Strategy, policySeed = 'blindside-policy-1') {
  let rng = hashSeed(policySeed);
  let shopKey = '';
  let sample: string[] = [];
  return (view: Observation): Proposal<Command> => {
    let work = 0;
    const propose = (
      command: Command,
      reason: string,
      extra: Record<string, number | string> = {},
    ): Proposal<Command> => ({
      command,
      work,
      diagnostics: { strategy, reason, ...extra },
    });
    if (view.phase === 'won' || view.phase === 'lost')
      throw new Error('Policy called after terminal outcome.');
    const run = forecastState(view);
    const evaluate = (model: RunState, growthWeight = 0) => {
      const result = bestHand(model, growthWeight);
      work += result.work;
      return result;
    };
    // Planet effects are deterministic, public and beneficial at every permitted phase.
    if (view.phase !== 'pack') {
      const planet = view.consumables.find(
        (item) => CONSUMABLE_BY_ID[item.definitionId].targets === 0,
      );
      if (planet)
        return propose(
          { type: 'useConsumable', id: planet.id, cards: [] },
          'Apply permanent hand level.',
        );
    }
    if (view.phase === 'ready') {
      const tag = view.skipTags[view.blind];
      if (strategy === 'growth' && view.actions.skip && tag?.id === 'economy' && view.cash >= 20)
        return propose({ type: 'skipBlind' }, 'Trade a blind reward for a public economy tag.');
      if (
        strategy === 'growth' &&
        view.actions.skip &&
        tag?.id === 'buffoon' &&
        view.jokers.length < 3
      )
        return propose({ type: 'skipBlind' }, 'Take free engine components while slots remain.');
      return propose({ type: 'startBlind' }, 'Enter the displayed blind.');
    }
    if (view.phase === 'playing') {
      const best = evaluate(run);
      const consumable = view.consumables.find(
        (item) => CONSUMABLE_BY_ID[item.definitionId].targets > 0,
      );
      if (consumable) {
        const effect = CONSUMABLE_BY_ID[consumable.definitionId].effect;
        const ranked = [...view.hand].sort((a, b) => b.rank - a.rank);
        const target =
          effect.type === 'destroy'
            ? ranked.at(-1)
            : effect.type === 'enhance' && effect.enhancement === 'steel'
              ? (view.hand.find((card) => !best.cards.includes(card.id)) ?? ranked[0])
              : (view.hand.find((card) => best.cards.includes(card.id)) ?? ranked[0]);
        if (target && (effect.type !== 'destroy' || view.deck.length > 5))
          return propose(
            { type: 'useConsumable', id: consumable.id, cards: [target.id] },
            'Use an owned public card improvement.',
          );
      }
      // Put whole-hand multipliers after additive effects; each swap reduces inversions.
      const inverted = view.jokers.findIndex(
        (joker, i) =>
          i > 0 && !multiplier(joker.definitionId) && multiplier(view.jokers[i - 1].definitionId),
      );
      if (inverted > 0)
        return propose(
          { type: 'moveJoker', id: view.jokers[inverted].id, direction: -1 },
          'Apply additive effects before multipliers.',
        );
      const need = view.target - view.roundScore;
      const pressure = strategy === 'survival' ? 1.5 : strategy === 'growth' ? 1.2 : 0.8;
      if (
        view.actions.discard &&
        view.drawCount > 0 &&
        best.total < (need / Math.max(1, view.handsLeft)) * pressure
      ) {
        const suits = ['hearts', 'spades', 'diamonds', 'clubs'].map((suit) =>
          view.hand.filter((card) => card.suit === suit),
        );
        const flush = suits.sort((a, b) => b.length - a.length)[0];
        const flushBuild = view.jokers.some((joker) =>
          ['river', 'tidal', 'hearts', 'diamonds', 'spades', 'clubs'].includes(joker.definitionId),
        );
        const keep = flushBuild && flush.length >= 3 ? flush.map((card) => card.id) : best.cards;
        const cards = view.hand
          .filter((card) => !keep.includes(card.id))
          .slice(0, Math.min(5, view.drawCount))
          .map((card) => card.id);
        if (cards.length)
          return propose(
            { type: 'discard', cards },
            'Replace unscoring cards under projected blind pressure.',
            { forecast: best.total, needed: need },
          );
      }
      if (strategy === 'growth' && best.total < need && view.handsLeft > 1) {
        const growing = evaluate(run, Math.max(2, best.total / 100));
        if (growing.total >= need / view.handsLeft && growing.growth > 0)
          return propose(
            { type: 'play', cards: growing.cards },
            'Meet required pace while triggering permanent Joker growth.',
            { forecast: growing.total, growth: growing.growth },
          );
      }
      return propose(
        { type: 'play', cards: best.cards },
        'Maximize the exact visible-hand score.',
        { forecast: best.total, hand: best.hand },
      );
    }
    // Shop/pack valuation uses a private independent sample of the known deck, never a future draw.
    const key = `${view.ante}/${view.blind}`;
    if (key !== shopKey) {
      shopKey = key;
      let cards;
      [cards, rng] = shuffle(view.deck, rng);
      sample = cards.slice(0, 7).map((card) => card.id);
    }
    const model = {
      ...run,
      phase: 'playing' as const,
      blind: 0,
      firstHandType: null,
      hand: sample.filter((id) => view.deck.some((card) => card.id === id)),
      handsLeft: 2,
      discardsLeft: 1,
    };
    const baseline = evaluate(model);
    const horizon =
      strategy === 'growth' ? Math.max(1, 8 - view.ante) : strategy === 'survival' ? 1 : 0;
    const valueJoker = (definitionId: string, paid: number) => {
      const definition = JOKER_BY_ID[definitionId];
      const growth = definition.grow
        ? (definitionId === 'runner' ? 18 : definitionId === 'tidal' ? 2 : 3) * horizon
        : 0;
      const owned = { id: 'public-candidate', definitionId, paid, growth };
      const slots = view.jokers.length < 5 ? [-1] : view.jokers.map((_, i) => i);
      return slots
        .map((replace) => {
          const jokers = ordered([...view.jokers.filter((_, i) => i !== replace), owned]);
          const scored = evaluate({ ...model, jokers });
          let value = scored.total / Math.max(1, baseline.total);
          if (definition.income && view.ante < 6 && view.jokers.length < 5)
            value += strategy === 'growth' ? 0.8 : 0.25;
          if (definition.rule === 'extraHand') value *= strategy === 'survival' ? 1.55 : 1.2;
          if (definition.rule === 'extraDiscard' || definition.rule === 'extraCard')
            value *= strategy === 'survival' ? 1.3 : 1.1;
          return { replace, value };
        })
        .sort((a, b) => b.value - a.value)[0];
    };
    if (view.phase === 'pack') {
      const choices = view.pack?.choices ?? [];
      const jokers = choices
        .flatMap((choice) =>
          choice.kind === 'joker'
            ? [{ choice, ...valueJoker(choice.definitionId, view.pack!.paid) }]
            : [],
        )
        .sort((a, b) => b.value - a.value);
      const pick = jokers[0];
      if (pick && pick.value > 1.03) {
        if (pick.replace >= 0)
          return propose(
            { type: 'sellJoker', id: view.jokers[pick.replace].id },
            'Make room for a stronger public pack choice.',
            { value: pick.value },
          );
        return propose(
          { type: 'choosePack', id: pick.choice.id },
          'Choose the best sampled engine improvement.',
          { value: pick.value },
        );
      }
      const planet = choices.find(
        (choice) => choice.kind === 'planet' && choice.definitionId === `planet-${baseline.hand}`,
      );
      if (planet && view.consumables.length < 2)
        return propose({ type: 'choosePack', id: planet.id }, 'Upgrade the sampled favored hand.');
      const card = choices
        .filter((choice) => choice.kind === 'card')
        .sort(
          (a, b) =>
            Number(b.card.enhancement !== 'plain') - Number(a.card.enhancement !== 'plain') ||
            b.card.rank - a.card.rank,
        )[0];
      if (card && (card.card.enhancement !== 'plain' || strategy === 'growth'))
        return propose({ type: 'choosePack', id: card.id }, 'Add a permanent enhanced card.');
      return propose(
        { type: 'skipPack' },
        'No remaining choice improves the declared public model.',
      );
    }
    const affordable = view.shop
      .filter((offer) => offer.kind === 'joker' && offer.price <= view.cash)
      .map((offer) => ({ offer, ...valueJoker(offer.definitionId, offer.price) }))
      .sort((a, b) => b.value - a.value);
    const pick = affordable[0];
    if (
      pick &&
      pick.value > (view.jokers.length < 5 ? 1.05 : strategy === 'immediate' ? 1.4 : 1.25)
    ) {
      if (pick.replace >= 0)
        return propose(
          { type: 'sellJoker', id: view.jokers[pick.replace].id },
          'Replace the weakest sampled engine slot.',
          { value: pick.value },
        );
      return propose(
        { type: 'buy', offerId: pick.offer.id },
        'Purchase sampled score, resource or income value.',
        { value: pick.value },
      );
    }
    const voucherReserve = strategy === 'survival' ? 10 : strategy === 'growth' ? 20 : 35;
    if (
      view.voucherOffer &&
      view.cash >= voucherReserve &&
      (strategy !== 'survival' ||
        ['extraHand', 'extraDiscard', 'handSize'].includes(view.voucherOffer))
    )
      return propose({ type: 'buyVoucher' }, 'Invest in permanent resources.');
    const planet = view.shop.find(
      (offer) =>
        offer.kind === 'consumable' &&
        offer.definitionId === `planet-${baseline.hand}` &&
        offer.price <= view.cash,
    );
    if (planet && view.consumables.length < 2)
      return propose(
        { type: 'buy', offerId: planet.id },
        'Buy a permanent level for the sampled favored hand.',
      );
    if (strategy === 'growth' && view.cash >= 16 && view.jokers.length < 5) {
      const pack = view.packs.find(
        (offer) => PACK_BY_ID[offer.definitionId].kind === 'joker' && offer.price <= view.cash - 8,
      );
      if (pack)
        return propose(
          { type: 'buyPack', id: pack.id },
          'Invest spare capital in additional engine choices.',
        );
    }
    const reserve = strategy === 'growth' ? 25 : strategy === 'survival' ? 15 : 12;
    if (view.cash >= reserve && view.rerolls < (strategy === 'immediate' ? 2 : 1))
      return propose({ type: 'reroll' }, 'Spend excess capital looking for a stronger engine.');
    return propose({ type: 'leaveShop' }, 'Retain interest capital and enter the next blind.');
  };
}

export const builtins = Object.fromEntries(
  STRATEGIES.map((strategy) => [
    strategy,
    {
      id: strategy,
      version: 'blindside-policy-1',
      create: (config) => createPolicy(strategy, config.policySeed),
    } satisfies PolicyFactory<Observation, Command>,
  ]),
) as Record<Strategy, PolicyFactory<Observation, Command>>;
