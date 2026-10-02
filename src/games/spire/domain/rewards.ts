import { REWARD_CARDS } from '../content/cards';
import { POTIONS, RELICS } from '../content/world';
import {
  addPermanentCard,
  heal,
  maxHp,
  nextId,
  pick,
  roll,
  shuffled,
  upgradeRandom,
} from './state';
import type { Potion, Rarity, SpireState } from './types';
export const removalCost = (run: SpireState) => 75 + 25 * run.removals;
export function grantRelic(run: SpireState, id: string) {
  if (run.relics.includes(id)) return;
  if (id === 'blackBlood') run.relics = run.relics.filter((r) => r !== 'burningBlood');
  run.relics.push(id);
  if (['strawberry', 'pear', 'mango'].includes(id))
    maxHp(run, { strawberry: 7, pear: 10, mango: 14 }[id]!);
  if (id === 'warPaint') upgradeRandom(run, 2, 'skill');
  if (id === 'whetstone') upgradeRandom(run, 2, 'attack');
}
export function randomRelic(run: SpireState, excluded = new Set<string>()): string | null {
  const value = roll(run);
  const rarity = value < 0.5 ? 'common' : value < 0.83 ? 'uncommon' : 'rare';
  const all = RELICS.filter(
    (r) =>
      !run.relics.includes(r.id) &&
      !excluded.has(r.id) &&
      ['common', 'uncommon', 'rare'].includes(r.rarity),
  );
  const pool = all.filter((r) => r.rarity === rarity);
  return pick(run, pool.length ? pool : all)?.id ?? null;
}
export function bossRelicOptions(run: SpireState, swap = false): string[] {
  return shuffled(
    run,
    RELICS.filter(
      (r) =>
        r.rarity === 'boss' &&
        !run.relics.includes(r.id) &&
        (r.id !== 'blackBlood' || (!swap && run.relics.includes('burningBlood'))),
    ),
  )
    .slice(0, 3)
    .map((r) => r.id);
}
export function cardRewards(
  run: SpireState,
  kind: 'fight' | 'elite' | 'boss' | 'shop' = 'fight',
  count?: number,
): string[] {
  const result: string[] = [];
  run.rewardUpgrades = [];
  for (let i = 0; i < (count ?? (run.relics.includes('bustedCrown') ? 1 : 3)); i++) {
    const value = roll(run) * 100;
    const rare = (kind === 'elite' ? 10 : kind === 'shop' ? 9 : 3) + run.rareOffset;
    const uncommon = kind === 'elite' ? 40 : 37;
    const rarity: Rarity =
      kind === 'boss'
        ? 'rare'
        : value < rare
          ? 'rare'
          : value < rare + uncommon
            ? 'uncommon'
            : 'common';
    const candidates = REWARD_CARDS.filter((c) => c.rarity === rarity && !result.includes(c.id));
    const selected = pick(
      run,
      candidates.length ? candidates : REWARD_CARDS.filter((c) => !result.includes(c.id)),
    );
    if (!selected) break;
    result.push(selected.id);
    if (kind !== 'shop') {
      if (rarity === 'rare') run.rareOffset = -5;
      else if (rarity === 'common') run.rareOffset = Math.min(40, run.rareOffset + 1);
    }
    if (kind !== 'shop' && roll(run) < (run.act - 1) * 0.25) run.rewardUpgrades.push(selected.id);
  }
  return result;
}
export function rewardPotion(run: SpireState, boss = false): Potion | null {
  if (run.relics.includes('sozu')) return null;
  const success = boss || roll(run) * 100 < run.potionChance;
  if (!boss) run.potionChance = Math.max(0, Math.min(100, run.potionChance + (success ? -10 : 10)));
  return success ? pick(run, Object.keys(POTIONS) as Potion[]) : null;
}
export function openShop(run: SpireState) {
  const chosen = cardRewards(run, 'shop', 5);
  run.rewardUpgrades = [];
  run.shop = chosen.map((id, index) => {
    const card = REWARD_CARDS.find((c) => c.id === id)!;
    const base = { common: 50, uncommon: 75, rare: 150, basic: 50, special: 50 }[card.rarity];
    return {
      id: nextId(run, 'offer'),
      kind: 'card' as const,
      definitionId: id,
      price: Math.round(base * (0.9 + roll(run) * 0.2) * (index === 0 ? 0.5 : 1)),
    };
  });
  const excluded = new Set<string>();
  for (let i = 0; i < 3; i++) {
    const id = randomRelic(run, excluded);
    if (id && !excluded.has(id)) {
      excluded.add(id);
      run.shop.push({
        id: nextId(run, 'offer'),
        kind: 'relic',
        definitionId: id,
        price: Math.round(150 * (0.9 + roll(run) * 0.2)),
      });
    }
  }
  if (!run.relics.includes('sozu'))
    for (const potion of shuffled(run, Object.keys(POTIONS) as Potion[]).slice(0, 3))
      run.shop.push({
        id: nextId(run, 'offer'),
        kind: 'potion',
        definitionId: potion,
        price: Math.round(50 * (0.9 + roll(run) * 0.2)),
      });
  run.removalUsed = false;
}
export function collectCombatReward(run: SpireState, card: string | null) {
  if (card) {
    const added = addPermanentCard(run, card);
    added.upgraded = run.rewardUpgrades.includes(card);
  }
  if (run.rewardRelic) grantRelic(run, run.rewardRelic);
  if (run.rewardPotion && run.potions.length < 3 && !run.relics.includes('sozu'))
    run.potions.push(run.rewardPotion);
  run.reward = [];
  run.rewardUpgrades = [];
  run.rewardRelic = null;
  run.rewardPotion = null;
}
export function healAfterCombat(run: SpireState) {
  // End-combat healing follows acquisition order (the starter comes first).
  for (const relic of run.relics) {
    if (relic === 'burningBlood') heal(run, 6);
    if (relic === 'blackBlood') heal(run, 12);
    if (relic === 'meatOnTheBone' && run.hp <= run.maxHp / 2) heal(run, 12);
  }
}
