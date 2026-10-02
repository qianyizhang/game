import { random, shuffle } from '../../../shared/random';
import { JOKERS, JOKER_BY_ID } from '../content/jokers';
import { CONSUMABLES, CONSUMABLE_BY_ID } from '../content/consumables';
import { PACKS, PACK_BY_ID, VOUCHERS, TAGS } from '../content/shop';
import { HANDS } from './poker';
import { SUITS, type RunState, type HandType, type SkipTag, type PackChoice } from './types';

const id = (run: RunState) => `extra-${run.nextId++}`;
const choose = <T>(run: RunState, choices: readonly T[]): T => {
  const [value, next] = random(run.rng);
  run.rng = next;
  return choices[Math.floor(value * choices.length)];
};
const shuffled = <T>(run: RunState, items: readonly T[]) => {
  const [value, next] = shuffle(items, run.rng);
  run.rng = next;
  return value;
};
export const shopPrice = (run: RunState, price: number) =>
  Math.floor(price * (run.vouchers.includes('discount') ? 0.75 : 1));
export function prepareTags(run: RunState) {
  run.skipTags = Array.from({ length: 2 }, () => ({
    id: choose(run, Object.keys(TAGS) as SkipTag['id'][]),
    hand: choose(run, Object.keys(HANDS) as HandType[]),
  }));
}
export function prepareShopExtras(run: RunState) {
  run.packs = Array.from({ length: 2 }, () => {
    const pack = choose(run, PACKS);
    return { id: id(run), definitionId: pack.id, price: shopPrice(run, pack.price) };
  });
  if (run.voucherAnte !== run.ante) {
    const options = VOUCHERS.filter((v) => !run.vouchers.includes(v.id));
    run.voucherOffer = options.length ? choose(run, options).id : null;
    run.voucherAnte = run.ante;
  }
}
export function openPack(
  run: RunState,
  definitionId: string,
  paid: number,
  returnTo: 'ready' | 'shop',
) {
  const definition = PACK_BY_ID[definitionId];
  let choices: PackChoice[];
  if (definition.kind === 'joker')
    choices = shuffled(
      run,
      JOKERS.filter((j) => !run.jokers.some((o) => o.definitionId === j.id)),
    )
      .slice(0, definition.size)
      .map((j) => ({ id: id(run), kind: 'joker', definitionId: j.id }));
  else if (definition.kind === 'planet')
    choices = shuffled(
      run,
      CONSUMABLES.filter((c) => c.effect.type === 'level'),
    )
      .slice(0, definition.size)
      .map((c) => ({ id: id(run), kind: 'planet', definitionId: c.id }));
  else
    choices = Array.from({ length: definition.size }, () => ({
      id: id(run),
      kind: 'card',
      card: {
        id: id(run),
        rank: choose(run, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]),
        suit: choose(run, SUITS),
        enhancement: choose(run, [
          'plain',
          'plain',
          'plain',
          'bonus',
          'mult',
          'glass',
          'steel',
          'gold',
          'wild',
        ] as const),
      },
    }));
  run.pack = {
    definitionId,
    choices,
    remaining: Math.min(definition.picks, choices.length),
    returnTo,
    paid,
  };
  run.phase = 'pack';
}
export function choosePack(run: RunState, choiceId: string): string | undefined {
  const pack = run.pack,
    choice = pack?.choices.find((c) => c.id === choiceId);
  if (!pack || !choice) return 'Choose one of the cards in this pack.';
  if (choice.kind === 'joker') {
    if (run.jokers.length >= 5)
      return 'All Joker slots are full. Sell one or skip the remaining pack.';
    run.jokers.push({
      id: id(run),
      definitionId: choice.definitionId,
      growth: 0,
      paid: JOKER_BY_ID[choice.definitionId].price,
    });
  } else if (choice.kind === 'planet') {
    const effect = CONSUMABLE_BY_ID[choice.definitionId].effect;
    if (effect.type === 'level') run.levels[effect.hand]++;
  } else if (choice.kind === 'card') run.deck.push(choice.card);
  pack.choices = pack.choices.filter((c) => c.id !== choiceId);
  pack.remaining--;
  if (!pack.remaining || !pack.choices.length) closePack(run);
}
export function closePack(run: RunState) {
  run.phase = run.pack!.returnTo;
  run.pack = null;
}
