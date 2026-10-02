import { random, shuffle } from '../../../shared/random';
import { CARD_BY_ID } from '../content/cards';
import type { Fighter, SpireState, Status } from './types';
export const statuses = (): Record<Status, number> => ({
  strength: 0,
  dexterity: 0,
  weak: 0,
  vulnerable: 0,
  frail: 0,
  artifact: 0,
});
export const log = (run: SpireState, message: string) => {
  run.notice = message;
  run.log = [...run.log.slice(-149), message];
};
export const nextId = (run: SpireState, prefix: string) => `${prefix}-${run.nextId++}`;
export function roll(run: SpireState) {
  const [value, next] = random(run.rng);
  run.rng = next;
  return value;
}
export function pick<T>(run: SpireState, choices: readonly T[]): T {
  return choices[Math.floor(roll(run) * choices.length)];
}
export function shuffled<T>(run: SpireState, choices: readonly T[]): T[] {
  const [items, next] = shuffle(choices, run.rng);
  run.rng = next;
  return items;
}
export const aliveEnemies = (run: SpireState) => run.combat?.enemies.filter((e) => e.hp > 0) ?? [];
export function heal(run: SpireState, amount: number) {
  run.hp = Math.min(run.maxHp, run.hp + Math.max(0, Math.floor(amount)));
  if (run.combat) {
    run.combat.player.hp = run.hp;
    run.combat.player.maxHp = run.maxHp;
  }
}
export function maxHp(run: SpireState, amount: number) {
  run.maxHp += amount;
  heal(run, amount);
}
export function applyStatus(
  fighter: Fighter,
  status: Status,
  amount: number,
  fromEnemyTurn = false,
): boolean {
  const debuff = amount < 0 || ['weak', 'vulnerable', 'frail'].includes(status);
  if (debuff && fighter.status.artifact > 0) {
    fighter.status.artifact--;
    return false;
  }
  fighter.status[status] += amount;
  if (
    fromEnemyTurn &&
    ['weak', 'vulnerable', 'frail'].includes(status) &&
    !fighter.freshDebuffs.includes(status)
  )
    fighter.freshDebuffs.push(status);
  return true;
}
export function tickDurations(fighter: Fighter) {
  for (const key of ['weak', 'vulnerable', 'frail'] as const)
    if (!fighter.freshDebuffs.includes(key))
      fighter.status[key] = Math.max(0, fighter.status[key] - 1);
  fighter.freshDebuffs = [];
}
export function gainBlock(run: SpireState, amount: number, fromCard = false) {
  const player = run.combat!.player;
  const gain = fromCard
    ? Math.floor(
        Math.max(0, amount + player.status.dexterity) * (player.status.frail > 0 ? 0.75 : 1),
      )
    : Math.max(0, amount);
  player.block = Math.min(999, player.block + gain);
  log(run, `Gain ${gain} Block.`);
}
/** Non-Attack damage also uses Block; HP costs alone bypass it. */
export function hit(
  run: SpireState,
  target: Fighter,
  amount: number,
  label: string,
  ignoreBlock = false,
): number {
  const enemy = run.combat?.enemies.find((e) => e === target);
  amount = Math.max(0, Math.floor(amount));
  if (enemy?.powers.intangible && amount > 0) amount = 1;
  const absorbed = ignoreBlock ? 0 : Math.min(target.block, amount);
  target.block -= absorbed;
  const lost = Math.min(target.hp, amount - absorbed);
  target.hp -= lost;
  if (target === run.combat?.player) {
    run.hp = target.hp;
    run.combat.damageTaken += lost;
  }
  if (enemy && lost > 0 && enemy.powers.asleep) {
    enemy.powers.asleep = 0;
    enemy.powers.woke = 1;
    enemy.intentIndex = 1;
  }
  log(run, `${label}: ${lost} HP${absorbed ? `, ${absorbed} blocked` : ''}.`);
  return lost;
}
export function addPermanentCard(run: SpireState, definitionId: string) {
  const card = { id: nextId(run, 'card'), definitionId, upgraded: false };
  run.deck.push(card);
  return card;
}
export function upgradeRandom(run: SpireState, count: number, kind?: string) {
  for (const card of shuffled(
    run,
    run.deck.filter(
      (c) =>
        !c.upgraded &&
        !CARD_BY_ID[c.definitionId].token &&
        (!kind || CARD_BY_ID[c.definitionId].kind === kind),
    ),
  ).slice(0, count))
    card.upgraded = true;
}
