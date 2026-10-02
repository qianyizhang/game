import { random } from '../../../shared/random';
import { HEROES, MINION_BY_ID, RECRUITS } from '../content/minions';
import { buff, makeUnit, matchesTribe, summonHooks } from './units';
import type { BGCommand, BGState, Player, Unit } from './types';

export const POOL_COPIES = [0, 16, 15, 13, 11, 9, 7];
export const SHOP_SIZE = [0, 3, 4, 4, 5, 5, 6];
const UPGRADE_COST = [0, 5, 7, 8, 9, 10, 0];
export const bgLog = (run: BGState, message: string) => {
  run.notice = message;
  run.log = [...run.log.slice(-99), message];
};
export const bgId = (run: BGState) => `unit-${run.nextId++}`;
export const returnUnits = (run: BGState, units: readonly Unit[]) => {
  for (const unit of units) if (unit.copies) run.pool[unit.definitionId] += unit.copies;
};

function drawFromPool(
  run: BGState,
  tier: number,
  exact = false,
  exclude: string[] = [],
): Unit | undefined {
  const available = RECRUITS.filter(
    (m) =>
      (exact ? m.tier === tier : m.tier <= tier) && run.pool[m.id] > 0 && !exclude.includes(m.id),
  );
  const total = available.reduce((sum, m) => sum + run.pool[m.id], 0);
  if (!total) return undefined;
  const [value, next] = random(run.rng);
  run.rng = next;
  let threshold = Math.floor(value * total);
  for (const definition of available) {
    threshold -= run.pool[definition.id];
    if (threshold < 0) {
      run.pool[definition.id]--;
      return makeUnit(definition.id, bgId(run));
    }
  }
  return undefined;
}
function fillShop(run: BGState, player: Player) {
  const missing = SHOP_SIZE[player.tier] - player.shop.length;
  for (let i = 0; i < missing; i++) {
    const unit = drawFromPool(run, player.tier);
    if (unit) player.shop.push(unit);
  }
}
export function refreshShop(run: BGState, player: Player) {
  returnUnits(run, player.shop);
  player.shop = [];
  player.frozen = false;
  fillShop(run, player);
}
export function startRecruitment(run: BGState) {
  for (const player of run.players.filter((p) => p.hp > 0)) {
    player.gold = Math.min(10, run.round + 2) + (player.hero === 'quartermaster' ? 1 : 0);
    player.powerUsed = false;
    if (run.round > 1) player.upgradeCost = Math.max(0, player.upgradeCost - 1);
    if (!player.frozen) refreshShop(run, player);
    else fillShop(run, player);
    player.frozen = false;
  }
  run.phase = 'recruit';
  bgLog(
    run,
    `Round ${run.round}: recruit, upgrade, and arrange your warband. Gold refreshes each round.`,
  );
}
function triples(run: BGState, player: Player) {
  for (;;) {
    const all = [...player.board, ...player.hand].filter((unit) => !unit.golden);
    const definitionId = all.find(
      (unit) => all.filter((other) => other.definitionId === unit.definitionId).length >= 3,
    )?.definitionId;
    if (!definitionId) return;
    const chosen = all.filter((unit) => unit.definitionId === definitionId).slice(0, 3);
    const ids = chosen.map((unit) => unit.id);
    const base = MINION_BY_ID[definitionId];
    const golden = makeUnit(
      definitionId,
      bgId(run),
      true,
      chosen.reduce((sum, unit) => sum + unit.copies, 0),
    );
    buff(
      golden,
      chosen.reduce((sum, unit) => sum + unit.attack - base.attack, 0),
      chosen.reduce((sum, unit) => sum + unit.maxHealth - base.health, 0),
    );
    golden.keywords = [...new Set(chosen.flatMap((unit) => unit.keywords))];
    golden.tripleReward = true;
    player.board = player.board.filter((unit) => !ids.includes(unit.id));
    player.hand = player.hand.filter((unit) => !ids.includes(unit.id));
    player.hand.push(golden);
    if (player.id === 0)
      bgLog(
        run,
        `Triple! ${base.name} is golden. Play it to discover a minion from the next tier.`,
      );
  }
}
function battlecry(run: BGState, player: Player, source: Unit, targetId?: string) {
  const effect = MINION_BY_ID[source.definitionId].battlecry;
  if (!effect) return;
  const scale = source.golden ? 2 : 1;
  if (effect.type === 'buff') {
    for (const other of player.board)
      if (
        other.id !== source.id &&
        matchesTribe(other, effect.tribe) &&
        (!effect.targeted || other.id === targetId)
      )
        buff(other, effect.attack * scale, effect.health * scale);
  }
  if (effect.type === 'gold') player.gold += effect.amount * scale;
  if (effect.type === 'summon')
    for (let i = 0; i < effect.count && player.board.length < 7; i++) {
      const token = makeUnit(effect.card, bgId(run), source.golden, 0);
      player.board.push(token);
      summonHooks(player.board, token);
    }
}
function offerDiscover(run: BGState, player: Player) {
  const ids: string[] = [];
  player.discover = [];
  for (let i = 0; i < 3; i++) {
    const unit = drawFromPool(run, Math.min(6, player.tier + 1), true, ids);
    if (unit) {
      player.discover.push(unit);
      ids.push(unit.definitionId);
    }
  }
}
/** Shared legal recruitment commands for the human and bots. Mutates only the cloned run. */
export function recruitAction(
  run: BGState,
  player: Player,
  command: BGCommand,
): string | undefined {
  if (player.discover.length && command.type !== 'discover')
    return 'Choose your Discover reward first.';
  switch (command.type) {
    case 'buy': {
      const unit = player.shop.find((m) => m.id === command.id);
      if (!unit) return 'That minion is not in the shop.';
      if (player.gold < 3) return 'Recruiting costs 3 gold.';
      if (player.hand.length >= 10) return 'Your hand is full.';
      player.gold -= 3;
      player.shop = player.shop.filter((m) => m.id !== unit.id);
      player.hand.push(unit);
      for (const friendly of player.board) {
        const trigger = MINION_BY_ID[friendly.definitionId].buyBuff;
        if (trigger && matchesTribe(unit, trigger.tribe))
          for (const target of player.board)
            if (matchesTribe(target, trigger.tribe))
              buff(
                target,
                trigger.attack * (friendly.golden ? 2 : 1),
                trigger.health * (friendly.golden ? 2 : 1),
              );
      }
      triples(run, player);
      return;
    }
    case 'play': {
      const unit = player.hand.find((m) => m.id === command.id);
      if (!unit) return 'That minion is not in your hand.';
      if (player.board.length >= 7) return 'Your warband is full. Sell a minion first.';
      if (
        !Number.isInteger(command.position) ||
        command.position < 0 ||
        command.position > player.board.length
      )
        return 'Invalid board position.';
      const effect = MINION_BY_ID[unit.definitionId].battlecry;
      if (effect?.type === 'buff' && effect.targeted) {
        const targets = player.board.filter((m) => matchesTribe(m, effect.tribe));
        if (targets.length && !targets.some((m) => m.id === command.target))
          return 'Choose a friendly target for this Battlecry.';
      }
      player.hand = player.hand.filter((m) => m.id !== unit.id);
      player.board.splice(command.position, 0, unit);
      summonHooks(player.board, unit);
      battlecry(run, player, unit, command.target);
      if (unit.tripleReward) {
        unit.tripleReward = false;
        offerDiscover(run, player);
      }
      triples(run, player);
      return;
    }
    case 'sell': {
      const unit = player.board.find((m) => m.id === command.id);
      if (!unit) return 'Select a minion on your board to sell.';
      player.board = player.board.filter((m) => m.id !== unit.id);
      player.gold++;
      returnUnits(run, [unit]);
      return;
    }
    case 'move': {
      const from = player.board.findIndex((m) => m.id === command.id);
      const to = from + command.direction;
      if (from < 0 || to < 0 || to >= player.board.length)
        return 'Cannot move farther in that direction.';
      [player.board[from], player.board[to]] = [player.board[to], player.board[from]];
      return;
    }
    case 'refresh':
      if (player.gold < 1) return 'Refreshing costs 1 gold.';
      else {
        player.gold--;
        refreshShop(run, player);
        return;
      }
    case 'freeze':
      player.frozen = !player.frozen;
      return;
    case 'upgrade':
      if (player.tier >= 6) return 'Maximum tavern tier reached.';
      else if (player.gold < player.upgradeCost) return 'Not enough gold to upgrade.';
      else {
        player.gold -= player.upgradeCost;
        player.tier++;
        player.upgradeCost = UPGRADE_COST[player.tier];
        return;
      }
    case 'power': {
      const hero = HEROES.find((h) => h.id === player.hero)!;
      if (player.hero === 'quartermaster') return 'This hero power is passive.';
      if (player.powerUsed) return 'Hero power already used this round.';
      if (player.gold < hero.cost) return 'Not enough gold for the hero power.';
      if (hero.targeted) {
        const target = player.board.find((m) => m.id === command.target);
        if (!target) return 'Select a friendly minion.';
        buff(target, 1, 1);
      } else {
        const targets = player.board.filter((m) => matchesTribe(m, 'beast'));
        if (!targets.length) return 'Recruit a Beast first.';
        for (const target of targets) buff(target, 1, 1);
      }
      player.gold -= hero.cost;
      player.powerUsed = true;
      return;
    }
    case 'discover': {
      const chosen = player.discover.find((m) => m.id === command.id);
      if (!chosen) return 'Choose an offered Discover minion.';
      if (player.hand.length >= 10) return 'Your hand is full.';
      returnUnits(
        run,
        player.discover.filter((m) => m.id !== chosen.id),
      );
      player.discover = [];
      player.hand.push(chosen);
      triples(run, player);
      return;
    }
    default:
      return 'That is not a recruitment action.';
  }
}
export function endRecruitment(player: Player) {
  for (const unit of [...player.board]) {
    const effect = MINION_BY_ID[unit.definitionId].endTurn;
    if (!effect) continue;
    const scale = unit.golden ? 2 : 1;
    if (effect.type === 'self') buff(unit, effect.attack * scale, effect.health * scale);
    if (effect.type === 'perTribe') {
      const count = player.board.filter(
        (m) => m.id !== unit.id && matchesTribe(m, effect.tribe),
      ).length;
      buff(unit, effect.attack * scale * count, effect.health * scale * count);
    }
    if (effect.type === 'tribe')
      for (const target of player.board)
        if (matchesTribe(target, effect.tribe))
          buff(target, effect.attack * scale, effect.health * scale);
    if (effect.type === 'menagerie') {
      const used = new Set<string>();
      for (const tribe of ['beast', 'mech', 'demon', 'elemental'] as const) {
        const target = player.board.find((m) => !used.has(m.id) && matchesTribe(m, tribe));
        if (target) {
          used.add(target.id);
          buff(target, effect.attack * scale, effect.health * scale);
        }
      }
    }
  }
}
export function initialPlayer(id: number): Player {
  return {
    id,
    name: id === 0 ? 'You' : ['Mira', 'Bram', 'Ash', 'Nell', 'Orin', 'Pip', 'Sable'][id - 1],
    hero: HEROES[id % 3].id,
    hp: 40,
    tier: 1,
    gold: 0,
    upgradeCost: 5,
    board: [],
    hand: [],
    shop: [],
    frozen: false,
    powerUsed: false,
    discover: [],
    eliminatedRound: null,
    placement: null,
  };
}
