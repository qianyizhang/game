import { hashSeed, random, shuffle } from '../../../shared/random';
import { activeBoss, BOSSES, currentBoss, targetFor } from '../content/blinds';
import { CONSUMABLE_BY_ID, CONSUMABLES } from '../content/consumables';
import { JOKER_BY_ID, JOKERS } from '../content/jokers';
import { HANDS } from './poker';
import { contextFor, isDebuffed, scoreHand } from './scoring';
import { SUITS, type Command, type HandType, type RunState, type Transition } from './types';

export const RULES_VERSION = 2;
export const JOKER_LIMIT = 5;
export const CONSUMABLE_LIMIT = 2;
const note = (run: RunState, message: string) => {
  run.notice = message;
  run.history = [...run.history.slice(-59), message];
};
const makeId = (run: RunState, prefix: string) => `${prefix}-${run.nextId++}`;
const countRule = (run: RunState, rule: string) =>
  run.jokers.filter((j) => JOKER_BY_ID[j.definitionId].rule === rule).length;
export const handSize = (run: RunState) =>
  8 + countRule(run, 'extraCard') - (activeBoss(run) === 'narrow' ? 2 : 0);
export const rerollPrice = (run: RunState) => 5 + run.rerolls;
export const sellPrice = (paid: number) => Math.max(1, Math.floor(paid / 2));

export function createRun(inputSeed: string): RunState {
  const seed = inputSeed.trim().slice(0, 64) || 'FIRST-LIGHT';
  const [bosses, rng] = shuffle(
    BOSSES.filter((b) => b.id !== 'crown'),
    hashSeed(seed),
  );
  const run: RunState = {
    version: RULES_VERSION,
    seed,
    rng,
    nextId: 1,
    phase: 'ready',
    ante: 1,
    blind: 0,
    bossIds: [...bosses.map((b) => b.id), 'crown'],
    target: 200,
    roundScore: 0,
    cash: 6,
    handsLeft: 4,
    discardsLeft: 3,
    handsPlayed: 0,
    deck: [],
    hand: [],
    draw: [],
    discard: [],
    jokers: [],
    consumables: [],
    levels: Object.fromEntries(Object.keys(HANDS).map((key) => [key, 1])) as Record<
      HandType,
      number
    >,
    shop: [],
    rerolls: 0,
    firstHandType: null,
    lastScore: null,
    notice: 'Build a little engine. Break a big blind.',
    history: [],
  };
  for (const suit of SUITS)
    for (let rank = 2; rank <= 14; rank++)
      run.deck.push({ id: makeId(run, 'card'), rank, suit, enhancement: 'plain' });
  return run;
}

function drawToSize(run: RunState): void {
  while (run.hand.length < handSize(run) && run.draw.length) run.hand.push(run.draw.shift()!);
}

function generateShop(run: RunState): void {
  const owned = new Set(run.jokers.map((j) => j.definitionId));
  const candidates = JOKERS.filter((j) => !owned.has(j.id));
  run.shop = [];
  for (let slot = 0; slot < 4 && candidates.length; slot++) {
    const weighted = candidates.flatMap((j) =>
      Array.from({ length: j.rarity === 'common' ? 4 : j.rarity === 'uncommon' ? 2 : 1 }, () => j),
    );
    const [value, next] = random(run.rng);
    run.rng = next;
    const picked = weighted[Math.floor(value * weighted.length)];
    candidates.splice(
      candidates.findIndex((j) => j.id === picked.id),
      1,
    );
    run.shop.push({
      id: makeId(run, 'offer'),
      kind: 'joker',
      definitionId: picked.id,
      price: picked.price,
    });
  }
  const [consumables, next] = shuffle(CONSUMABLES, run.rng);
  run.rng = next;
  for (const item of consumables.slice(0, 3))
    run.shop.push({
      id: makeId(run, 'offer'),
      kind: 'consumable',
      definitionId: item.id,
      price: item.price,
    });
}

function winBlind(run: RunState): void {
  const reward = [3, 4, 5][run.blind];
  const interest = Math.min(5, Math.floor(run.cash / 5));
  const jokerIncome = run.jokers.reduce(
    (sum, j) => sum + (JOKER_BY_ID[j.definitionId].income?.(run, j) ?? 0),
    0,
  );
  const goldIncome =
    run.hand
      .map((id) => run.deck.find((c) => c.id === id)!)
      .filter((c) => c.enhancement === 'gold' && !isDebuffed(c, run)).length * 3;
  const total = reward + run.handsLeft + interest + jokerIncome + goldIncome;
  run.cash += total;
  note(
    run,
    `Blind cleared! +$${total}: $${reward} reward + $${run.handsLeft} spare hands + $${interest} interest + $${jokerIncome + goldIncome} card income.`,
  );
  run.phase = run.ante === 8 && run.blind === 2 ? 'won' : 'shop';
  if (run.phase === 'shop') {
    run.rerolls = 0;
    generateShop(run);
  }
}

const selectedValid = (run: RunState, ids: string[]) =>
  ids.length >= 1 &&
  ids.length <= 5 &&
  new Set(ids).size === ids.length &&
  ids.every((id) => run.hand.includes(id));

/** The only authoritative state transition. Rejected commands preserve the original object. */
export function transition(previous: RunState, command: Command): Transition {
  const run = structuredClone(previous);
  const reject = (error: string): Transition => ({ state: previous, error });
  if (run.phase === 'won' || run.phase === 'lost')
    return reject('This run is finished. Start a new seed to play again.');
  switch (command.type) {
    case 'startBlind': {
      if (run.phase !== 'ready') return reject('The blind is not ready.');
      run.phase = 'playing';
      run.roundScore = 0;
      run.firstHandType = null;
      run.handsPlayed = 0;
      run.handsLeft = 4 + countRule(run, 'extraHand');
      run.discardsLeft = (activeBoss(run) === 'pinch' ? 1 : 3) + countRule(run, 'extraDiscard');
      run.target = targetFor(run);
      run.hand = [];
      run.discard = [];
      [run.draw, run.rng] = shuffle(
        run.deck.map((card) => card.id),
        run.rng,
      );
      drawToSize(run);
      note(
        run,
        `${run.blind === 2 ? currentBoss(run).name : ['Small Blind', 'Big Blind'][run.blind]} · score ${run.target.toLocaleString('en-US')} to advance.`,
      );
      break;
    }
    case 'play': {
      if (run.phase !== 'playing' || run.handsLeft <= 0)
        return reject('No hand can be played now.');
      if (!selectedValid(run, command.cards))
        return reject('Select one to five different cards from your hand.');
      if (activeBoss(run) === 'five' && command.cards.length !== 5)
        return reject('The Five requires exactly five cards.');
      const context = contextFor(run, command.cards);
      const score = scoreHand(run, command.cards);
      run.lastScore = score;
      run.roundScore += score.total;
      run.cash += score.cash;
      if (!score.blocked)
        for (const owned of run.jokers)
          owned.growth += JOKER_BY_ID[owned.definitionId].grow?.(context) ?? 0;
      run.firstHandType ??= score.poker.type;
      run.handsLeft--;
      run.handsPlayed++;
      run.hand = run.hand.filter((id) => !command.cards.includes(id));
      run.discard.push(...command.cards);
      if (!score.blocked)
        for (const card of context.scored) {
          if (card.enhancement !== 'glass' || isDebuffed(card, run)) continue;
          const [value, next] = random(run.rng);
          run.rng = next;
          if (value < 0.25 && run.deck.length > 5) {
            run.deck = run.deck.filter((c) => c.id !== card.id);
            run.discard = run.discard.filter((id) => id !== card.id);
            score.steps.push({
              source: 'Glass broke',
              detail: `Card ${card.rank} of ${card.suit} left the deck.`,
              chips: score.chips,
              mult: score.mult,
              cash: score.cash,
            });
          }
        }
      note(
        run,
        `${HANDS[score.poker.type].name}: +${score.total.toLocaleString('en-US')} points${score.blocked ? ' (blocked by The Lock)' : ''}.`,
      );
      if (run.roundScore >= run.target) winBlind(run);
      else if (run.handsLeft === 0) {
        run.phase = 'lost';
        note(
          run,
          `Run ended at ante ${run.ante}. ${run.roundScore.toLocaleString('en-US')} / ${run.target.toLocaleString('en-US')} points.`,
        );
      } else {
        drawToSize(run);
        if (!run.hand.length) {
          run.phase = 'lost';
          note(run, 'The deck ran out before the target was reached.');
        }
      }
      break;
    }
    case 'discard': {
      if (run.phase !== 'playing' || run.discardsLeft <= 0) return reject('No discards remain.');
      if (!selectedValid(run, command.cards))
        return reject('Select one to five different cards from your hand.');
      run.discardsLeft--;
      run.hand = run.hand.filter((id) => !command.cards.includes(id));
      run.discard.push(...command.cards);
      drawToSize(run);
      note(run, `Discarded ${command.cards.length}. ${run.discardsLeft} discards remain.`);
      if (!run.hand.length) {
        run.phase = 'lost';
        note(run, 'The deck ran out before the target was reached.');
      }
      break;
    }
    case 'buy': {
      if (run.phase !== 'shop') return reject('Purchases are only available in the shop.');
      const offer = run.shop.find((item) => item.id === command.offerId);
      if (!offer) return reject('That offer is no longer available.');
      if (run.cash < offer.price) return reject('Not enough money.');
      if (offer.kind === 'joker') {
        if (run.jokers.length >= JOKER_LIMIT)
          return reject('All five Joker slots are full. Sell one first.');
        run.jokers.push({
          id: makeId(run, 'joker'),
          definitionId: offer.definitionId,
          growth: 0,
          paid: offer.price,
        });
      } else {
        if (run.consumables.length >= CONSUMABLE_LIMIT)
          return reject('Both consumable slots are full. Use or sell one first.');
        run.consumables.push({
          id: makeId(run, 'consumable'),
          definitionId: offer.definitionId,
          paid: offer.price,
        });
      }
      run.cash -= offer.price;
      run.shop = run.shop.filter((item) => item.id !== offer.id);
      note(
        run,
        `Bought ${offer.kind === 'joker' ? JOKER_BY_ID[offer.definitionId].name : CONSUMABLE_BY_ID[offer.definitionId].name} for $${offer.price}.`,
      );
      break;
    }
    case 'sellJoker': {
      const owned = run.jokers.find((j) => j.id === command.id);
      if (!owned) return reject('Joker not found.');
      run.cash += sellPrice(owned.paid);
      run.jokers = run.jokers.filter((j) => j.id !== owned.id);
      note(run, `Sold ${JOKER_BY_ID[owned.definitionId].name} for $${sellPrice(owned.paid)}.`);
      break;
    }
    case 'sellConsumable': {
      const owned = run.consumables.find((c) => c.id === command.id);
      if (!owned) return reject('Consumable not found.');
      run.cash += sellPrice(owned.paid);
      run.consumables = run.consumables.filter((c) => c.id !== owned.id);
      note(run, `Sold ${CONSUMABLE_BY_ID[owned.definitionId].name} for $${sellPrice(owned.paid)}.`);
      break;
    }
    case 'moveJoker':
    case 'moveCard': {
      if (command.type === 'moveCard' && run.phase !== 'playing')
        return reject('Cards can only be reordered during a blind.');
      const collection = command.type === 'moveJoker' ? run.jokers : run.hand;
      const index = collection.findIndex(
        (item) => (typeof item === 'string' ? item : item.id) === command.id,
      );
      const destination = index + command.direction;
      if (index < 0 || destination < 0 || destination >= collection.length)
        return reject('Cannot move farther in that direction.');
      [collection[index], collection[destination]] = [collection[destination], collection[index]];
      break;
    }
    case 'sortHand': {
      if (run.phase !== 'playing') return reject('Cards can only be sorted during a blind.');
      const cards = run.hand.map((id) => run.deck.find((card) => card.id === id)!);
      cards.sort((a, b) =>
        command.by === 'rank'
          ? b.rank - a.rank || SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit)
          : SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit) || b.rank - a.rank,
      );
      run.hand = cards.map((card) => card.id);
      break;
    }
    case 'reroll': {
      if (run.phase !== 'shop') return reject('Rerolls are only available in the shop.');
      if (run.cash < rerollPrice(run)) return reject('Not enough money for a reroll.');
      run.cash -= rerollPrice(run);
      run.rerolls++;
      generateShop(run);
      note(run, 'Fresh stock. Reroll price increases by $1.');
      break;
    }
    case 'leaveShop': {
      if (run.phase !== 'shop') return reject('You are not in a shop.');
      run.blind++;
      if (run.blind === 3) {
        run.ante++;
        run.blind = 0;
      }
      run.phase = 'ready';
      run.hand = [];
      run.draw = [];
      run.discard = [];
      run.shop = [];
      run.roundScore = 0;
      run.target = targetFor(run);
      note(run, 'Inspect the next blind, then take your seat.');
      break;
    }
    case 'useConsumable': {
      const owned = run.consumables.find((c) => c.id === command.id);
      if (!owned) return reject('Consumable not found.');
      const definition = CONSUMABLE_BY_ID[owned.definitionId];
      const effect = definition.effect;
      if (
        definition.targets > 0 &&
        (run.phase !== 'playing' ||
          !selectedValid(run, command.cards) ||
          command.cards.length > definition.targets)
      )
        return reject(
          `During a blind, select 1–${definition.targets} cards to use ${definition.name}.`,
        );
      if (effect.type === 'level') run.levels[effect.hand]++;
      else if (effect.type === 'destroy') {
        if (run.deck.length - command.cards.length < 5)
          return reject('At least five cards must remain in the deck.');
        run.deck = run.deck.filter((card) => !command.cards.includes(card.id));
        run.hand = run.hand.filter((id) => !command.cards.includes(id));
        drawToSize(run);
      } else if (effect.type === 'copy') {
        const original = run.deck.find((card) => card.id === command.cards[0])!;
        run.deck.push({ ...original, id: makeId(run, 'card') });
      } else {
        for (const card of run.deck.filter((card) => command.cards.includes(card.id))) {
          if (effect.type === 'enhance') card.enhancement = effect.enhancement;
          if (effect.type === 'suit') card.suit = effect.suit;
          if (effect.type === 'rank') card.rank = card.rank === 14 ? 2 : card.rank + 1;
        }
      }
      run.consumables = run.consumables.filter((c) => c.id !== owned.id);
      note(run, `Used ${definition.name}.`);
      break;
    }
    default:
      return reject('Unknown command.');
  }
  if (run.phase === 'playing' && run.hand.length < (activeBoss(run) === 'five' ? 5 : 1)) {
    run.phase = 'lost';
    note(run, 'Not enough cards remain to play a legal hand.');
  }
  return { state: run };
}
