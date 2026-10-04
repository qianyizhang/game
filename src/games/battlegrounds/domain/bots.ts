import { MINION_BY_ID, HEROES } from '../content/minions';
import { recruitAction } from './recruitment';
import { matchesTribe } from './units';
import type { BGCommand, BGState, Player, Unit } from './types';

export function unitValue(unit: Unit, player: Player): number {
  const definition = MINION_BY_ID[unit.definitionId];
  const friends = player.board.filter(
    (m) => matchesTribe(m, definition.tribe) && definition.tribe !== 'neutral',
  ).length;
  const duplicates = [...player.board, ...player.hand].filter(
    (m) => !m.golden && m.definitionId === unit.definitionId,
  ).length;
  const support = player.board.reduce((sum, ally) => {
    if (ally.id === unit.id) return sum;
    const d = MINION_BY_ID[ally.definitionId];
    return (
      sum +
      (d.summonBuff && matchesTribe(unit, d.summonBuff.tribe) ? 3 : 0) +
      (d.deathGrowth && matchesTribe(unit, d.deathGrowth.tribe) ? 2 : 0) +
      (d.deathDamage && matchesTribe(unit, d.deathDamage.tribe) ? 2 : 0) +
      (d.extraDeathrattle && definition.deathrattle ? 5 : 0)
    );
  }, 0);
  return (
    support +
    unit.attack +
    unit.health * 0.75 +
    definition.tier * 1.5 +
    unit.keywords.length * 2 +
    (definition.deathrattle ? 3 : 0) +
    (definition.endTurn ? 3 + (definition.endTurn.type === 'self' ? 2 : friends * 2) : 0) +
    (definition.summonBuff || definition.deathGrowth || definition.deathDamage || definition.buyBuff
      ? friends * 2
      : 0) +
    friends * 0.8 +
    (duplicates === 2 ? 14 : duplicates === 1 ? 3 : 0)
  );
}
export function botDecision(
  run: Pick<BGState, 'round'>,
  player: Player,
  refreshes: number,
): BGCommand | null {
  if (player.discover.length)
    return {
      type: 'discover',
      id: [...player.discover].sort((a, b) => unitValue(b, player) - unitValue(a, player))[0].id,
    };
  if (player.hand.length) {
    const best = [...player.hand].sort((a, b) => unitValue(b, player) - unitValue(a, player))[0];
    if (player.board.length < 7) {
      const effect = MINION_BY_ID[best.definitionId].battlecry;
      const target =
        effect?.type === 'buff' && effect.targeted
          ? [...player.board]
              .filter((u) => matchesTribe(u, effect.tribe))
              .sort((a, b) => unitValue(b, player) - unitValue(a, player))[0]?.id
          : undefined;
      return { type: 'play', id: best.id, position: player.board.length, target };
    }
    const worst = [...player.board].sort((a, b) => unitValue(a, player) - unitValue(b, player))[0];
    if (unitValue(best, player) > unitValue(worst, player) + 1)
      return { type: 'sell', id: worst.id };
  }
  const copies = (unit: Unit) =>
    [...player.board, ...player.hand].filter(
      (u) => !u.golden && !unit.golden && u.definitionId === unit.definitionId,
    ).length;
  const triple = player.shop.find((u) => copies(u) === 2);
  if (triple && player.gold >= 3 && player.hand.length < 10) return { type: 'buy', id: triple.id };
  const upgradeAt = [0, 2, 4, 6, 8, 10];
  if (
    player.tier < 6 &&
    run.round >= upgradeAt[player.tier] &&
    player.gold >= player.upgradeCost &&
    (player.hp > 15 || player.gold - player.upgradeCost >= 3) &&
    (player.board.length >= Math.min(5, run.round) || run.round === 2)
  )
    return { type: 'upgrade' };
  if (player.gold >= 3 && player.hand.length < 10) {
    const best = [...player.shop].sort((a, b) => unitValue(b, player) - unitValue(a, player))[0];
    const worst = [...player.board].sort((a, b) => unitValue(a, player) - unitValue(b, player))[0];
    if (
      best &&
      (player.board.length + player.hand.length < 7 ||
        unitValue(best, player) > unitValue(worst, player) + 2)
    )
      return { type: 'buy', id: best.id };
  }
  const hero = HEROES.find((h) => h.id === player.hero)!;
  const ability = hero.ability;
  if (!player.powerUsed && player.gold >= hero.cost) {
    if (ability.type === 'recall' && player.hand.length < 10) {
      const target = [...player.board]
        .filter((unit) => MINION_BY_ID[unit.definitionId].battlecry)
        .sort((a, b) => unitValue(b, player) - unitValue(a, player))[0];
      if (target) return { type: 'power', target: target.id };
    }
    if (ability.type === 'buff') {
      const targets = player.board.filter(
        (unit) => ability.target !== 'tribe' || matchesTribe(unit, ability.tribe),
      );
      if (targets.length) {
        const target = [...targets].sort((a, b) => unitValue(b, player) - unitValue(a, player))[0];
        return ability.target === 'friendly'
          ? { type: 'power', target: target.id }
          : { type: 'power' };
      }
    }
  }
  if (triple && player.gold < 3) return player.frozen ? null : { type: 'freeze' };
  if (player.gold >= 1 && refreshes < 5 && (player.gold >= 4 || player.board.length >= 7))
    return { type: 'refresh' };
  return null;
}
export function runBot(run: BGState, player: Player) {
  let refreshes = 0;
  for (let step = 0; step < 100; step++) {
    const command = botDecision(run, player, refreshes);
    if (!command) break;
    const error = recruitAction(run, player, command);
    if (error) throw new Error(`Bot ${player.id} attempted an illegal action: ${error}`);
    if (command.type === 'refresh') refreshes++;
  }
  player.board = baselineOrder(player.board);
}

/** A pure order proposal shared by the fixed bots and the observable baseline agent. */
export function baselineOrder(input: readonly Unit[]): Unit[] {
  const board = [...input];
  // Deterministic positioning: early cleave/high-attack units, support engines behind them.
  board.sort((a, b) => {
    const priority = (unit: Unit) => {
      const d = MINION_BY_ID[unit.definitionId];
      return (
        unit.attack +
        (unit.keywords.includes('cleave') ? 20 : 0) +
        (unit.keywords.includes('windfury') ? 8 : 0) +
        (d.deathrattle ? 4 : 0) -
        (d.summonBuff || d.deathGrowth || d.deathDamage || d.extraDeathrattle ? 30 : 0)
      );
    };
    return priority(b) - priority(a);
  });
  // Keep vulnerable support away from a taunt's cleave-adjacent slot.
  if (board.length >= 4) {
    const taunt = board.findIndex((u) => u.keywords.includes('taunt'));
    if (taunt > 0) board.unshift(board.splice(taunt, 1)[0]);
  }
  return board;
}
