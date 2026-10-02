import { random, shuffle } from '../../../shared/random';
import { CARD_BY_ID } from '../content/cards';
import { ENEMY_BY_ID } from '../content/world';
import type { Fighter, ResolutionFrame, SpireState, Status } from './types';
export const statuses = (): Record<Status, number> => ({
  strength: 0,
  dexterity: 0,
  weak: 0,
  vulnerable: 0,
  frail: 0,
  artifact: 0,
  poison: 0,
});
export const log = (
  run: SpireState,
  message: string,
  event: Partial<Omit<ResolutionFrame, 'snapshot'>> = {},
) => {
  run.notice = message;
  run.log = [...run.log.slice(-149), message];
  const c = run.combat;
  if (c && (run.phase === 'combat' || run.resolution.frames.length))
    run.resolution.frames.push({
      kind: 'trigger',
      source: 'Rules',
      detail: message,
      ...event,
      snapshot: structuredClone({
        player: c.player,
        enemies: c.enemies,
        energy: c.energy,
        turn: c.turn,
        hand: c.hand.map((id) => c.cards[id]),
        draw: c.draw.length,
        discard: c.discard.length,
        exhaust: c.exhaust.length,
      }),
    });
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
export const aliveEnemies = (run: SpireState) =>
  run.combat?.enemies.filter((e) => e.hp > 0 && !e.powers.rebirthing) ?? [];
export const combatOngoing = (run: SpireState) =>
  !!run.combat?.enemies.some((e) => e.hp > 0 || e.powers.rebirthing);
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
  const debuff = amount < 0 || ['weak', 'vulnerable', 'frail', 'poison'].includes(status);
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
  const before = player.block;
  player.block = Math.min(999, player.block + gain);
  log(run, `Gain ${gain} Block.`, {
    kind: 'block',
    source: fromCard ? 'Card Block' : 'Block effect',
    target: 'player',
    amount: player.block - before,
    before,
    after: player.block,
    formula: fromCard
      ? `floor(max(0, ${amount} + ${player.status.dexterity} Dexterity) × ${player.status.frail > 0 ? '0.75 Frail' : '1'}) = ${gain}`
      : `${amount} flat Block (unaffected by Dexterity or Frail)`,
  });
}
/** Non-Attack damage also uses Block; HP costs alone bypass it. */
export function hit(
  run: SpireState,
  target: Fighter,
  amount: number,
  label: string,
  ignoreBlock = false,
  formula?: string,
): number {
  const enemy = run.combat?.enemies.find((e) => e === target);
  if (enemy?.powers.rebirthing) return 0;
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
  log(run, `${label}: ${lost} HP${absorbed ? `, ${absorbed} blocked` : ''}.`, {
    kind: 'damage',
    source: label,
    target: enemy?.id ?? 'player',
    amount: lost,
    before: target.hp + lost,
    after: target.hp,
    formula: formula
      ? `${formula}; ${absorbed} blocked, ${lost} HP lost${enemy?.powers.intangible ? '; Intangible caps incoming damage at 1' : ''}.`
      : `${amount} ${ignoreBlock ? 'direct HP loss' : 'damage'}; ${absorbed} blocked, ${lost} HP lost.`,
  });
  if (enemy && lost > 0 && enemy.hp > 0 && enemy.powers.modeShift > 0) {
    enemy.powers.modeShift = Math.max(0, enemy.powers.modeShift - lost);
    if (!enemy.powers.modeShift) {
      enemy.block += 20;
      enemy.powers.retainBlock = 1;
      enemy.intentIndex = 4;
      log(run, 'Mode Shift interrupts the Guardian: +20 Block, Defensive Mode.');
    }
  }
  if (enemy?.hp === 0) {
    if (enemy.definitionId === 'awakenedOne' && !enemy.powers.awakened) {
      enemy.powers.rebirthing = 1;
      enemy.powers.curiosity = 0;
      enemy.intentIndex = 2;
      log(run, 'The Awakened One prepares Rebirth. It cannot be targeted until it rises.');
    }
    if (enemy.stasisCard) {
      const c = run.combat!;
      (c.hand.length < 10 ? c.hand : c.discard).push(enemy.stasisCard);
      log(run, `Stasis releases ${CARD_BY_ID[c.cards[enemy.stasisCard].definitionId].name}.`);
      delete enemy.stasisCard;
    }
    if (ENEMY_BY_ID[enemy.definitionId].kind === 'boss' && !enemy.powers.rebirthing) {
      for (const ally of run.combat!.enemies) {
        if (
          ENEMY_BY_ID[ally.definitionId].kind === 'summon' ||
          (enemy.definitionId === 'awakenedOne' && ally.definitionId === 'cultist')
        )
          ally.hp = 0;
      }
    }
  }
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
