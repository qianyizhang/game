import { CARD_BY_ID } from '../content/cards';
import type { Observation, PolicyCommand } from './observation';

// Public Ironclad collection priorities adapted from the existing simulation
// heuristic. These are policy preferences, not authoritative card scores.
const priorities: Readonly<Record<string, number>> = {
  demonForm: 35,
  inflame: 30,
  disarm: 29,
  impervious: 29,
  shrugItOff: 24,
  flameBarrier: 28,
  reaper: 34,
  offering: 28,
  immolate: 32,
  uppercut: 26,
  battleTrance: 24,
  shockwave: 27,
  metallicize: 22,
  pommelStrike: 22,
  cleave: 21,
  heavyBlade: 22,
  twinStrike: 20,
  anger: 20,
  bludgeon: 20,
  fiendFire: 20,
  feelNoPain: 19,
  corruption: 17,
  darkEmbrace: 18,
  powerThrough: 21,
  whirlwind: 25,
  limitBreak: 26,
  feed: 26,
  bloodletting: 18,
  seeingRed: 18,
  trueGrit: 18,
  burningPact: 20,
  secondWind: 18,
  barricade: 13,
  headbutt: 20,
  clothesline: 20,
  carnage: 21,
  hemokinesis: 20,
  ironWave: 19,
};

/** Curate a compact deck and upgrade it while healthy. Uses offered commands only. */
export function collectionPlan(view: Observation): {
  command: PolicyCommand;
  work: number;
  reason: string;
} | null {
  const rank = (id: string) =>
    (priorities[id] ?? 10) -
    view.deck.filter((card) => card.definitionId === id).length * (id === 'shrugItOff' ? 5 : 14);
  const result = (command: PolicyCommand | undefined, reason: string) =>
    command ? { command, work: view.actions.length, reason } : null;
  if (view.phase === 'reward') {
    const offers = view.actions
      .filter((command) => command.type === 'takeReward')
      .filter((command) => command.card)
      .map((command) => ({ command, value: rank(command.card!) }))
      .sort((a, b) => b.value - a.value);
    const best = offers[0];
    return result(
      best && best.value >= (view.deck.length < 17 ? 17 : 22) && view.deck.length < 25
        ? best.command
        : view.actions.find((command) => command.type === 'takeReward' && !command.card),
      'Prioritize lasting card quality; skip weak or redundant additions.',
    );
  }
  if (view.phase === 'rest') {
    const heal = view.actions.find(
      (command) => command.type === 'rest' && command.choice === 'heal',
    );
    if (view.hp < view.maxHp * 0.7 && heal) return result(heal, 'Recover the low health reserve.');
    const upgrades = view.actions
      .filter((command) => command.type === 'rest')
      .filter((command) => command.choice === 'upgrade')
      .map((command) => {
        const card = view.deck.find((card) => card.id === command.card)!;
        return {
          command,
          value: priorities[card.definitionId] ?? (card.definitionId === 'bash' ? 23 : 0),
        };
      })
      .sort((a, b) => b.value - a.value);
    return result(
      upgrades[0]?.command ??
        heal ??
        view.actions.find((command) => command.type === 'rest' && command.choice === 'leave'),
      'Choose a permitted campfire action, accounting for health and relic restrictions.',
    );
  }
  if (view.phase === 'shop') {
    const offers = view.actions
      .filter((command) => command.type === 'buy')
      .map((command) => {
        const offer = view.shop.find((offer) => offer.id === command.id)!;
        return {
          command,
          value:
            offer.kind === 'card'
              ? rank(offer.definitionId)
              : offer.kind === 'relic'
                ? [
                    'vajra',
                    'oddlySmoothStone',
                    'anchor',
                    'bagOfPreparation',
                    'orichalcum',
                    'shuriken',
                    'kunai',
                    'meatOnTheBone',
                  ].includes(offer.definitionId)
                  ? 28
                  : 15
                : 0,
        };
      })
      .sort((a, b) => b.value - a.value);
    if (offers[0]?.value >= 22)
      return result(offers[0].command, 'Buy an affordable high-priority card or relic.');
    const removals = view.actions.filter((command) => command.type === 'removeCard');
    const curse = removals.find(
      (command) =>
        CARD_BY_ID[view.deck.find((card) => card.id === command.id)!.definitionId].kind === 'curse',
    );
    const strike =
      view.deck.length > 12
        ? removals.find(
            (command) =>
              view.deck.find((card) => card.id === command.id)!.definitionId === 'strike',
          )
        : undefined;
    return result(
      curse ?? strike ?? view.actions.find((command) => command.type === 'leaveShop'),
      'Remove a curse or surplus Strike after considering useful purchases.',
    );
  }
  return null;
}
