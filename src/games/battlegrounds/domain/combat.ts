import { random } from '../../../shared/random';
import { MINION_BY_ID } from '../content/minions';
import { buff, makeUnit, matchesTribe, summonHooks } from './units';
import type { CombatFrame, CombatResult, CombatUnit, Unit } from './types';

/** Combat owns deep copies. No temporary wound, summon or buff can leak into recruitment. */
export function resolveCombat(
  left: readonly Unit[],
  right: readonly Unit[],
  tiers: [number, number],
  seed: number,
  record = true,
): CombatResult {
  const boards: [CombatUnit[], CombatUnit[]] = [left, right].map((board) =>
    structuredClone(board).map((unit) => ({ ...unit, attacksTaken: 0 })),
  ) as [CombatUnit[], CombatUnit[]];
  const sweep = [0, 0];
  const frames: CombatFrame[] = [];
  let rng = seed;
  let nextId = 1;
  let attacks = 0;
  let stalemate = false;
  const choose = <T>(choices: readonly T[]): T => {
    const [value, next] = random(rng);
    rng = next;
    return choices[Math.floor(value * choices.length)];
  };
  const frame = (text: string, attacker?: string, target?: string) => {
    if (record) frames.push({ text, boards: structuredClone(boards), attacker, target });
  };
  const damage = (unit: CombatUnit, amount: number, poisonous = false) => {
    if (amount <= 0) return;
    if (unit.keywords.includes('shield')) {
      unit.keywords = unit.keywords.filter((k) => k !== 'shield');
      return;
    }
    unit.health = poisonous ? 0 : unit.health - amount;
  };
  const summon = (
    side: number,
    definitionId: string,
    golden: boolean,
    position: number,
    reborn = false,
  ) => {
    if (boards[side].length >= 7) {
      frame('Summon prevented: the board is full.');
      return;
    }
    const unit: CombatUnit = {
      ...makeUnit(definitionId, `combat-${side}-${nextId++}`, golden, 0),
      attacksTaken: sweep[side],
    };
    if (reborn) {
      unit.health = 1;
      unit.keywords = unit.keywords.filter((k) => k !== 'reborn');
    }
    boards[side].splice(Math.min(position, boards[side].length), 0, unit);
    summonHooks(boards[side], unit);
    frame(`${MINION_BY_ID[definitionId].name} ${reborn ? 'returns with Reborn' : 'is summoned'}.`);
  };
  function deaths(prioritySide: number) {
    type Death = { unit: CombatUnit; side: number; rightIds: string[]; repeats: number };
    const queue: Death[] = [];
    const collect = () => {
      const batch: Death[] = [];
      for (const side of [prioritySide, 1 - prioritySide])
        for (const [position, unit] of boards[side].entries())
          if (unit.health <= 0)
            batch.push({
              unit,
              side,
              rightIds: boards[side].slice(position + 1).map((u) => u.id),
              repeats: 1,
            });
      if (!batch.length) return;
      // All simultaneous deaths leave both boards before any survivor/deathrattle hook.
      for (const side of [0, 1]) boards[side] = boards[side].filter((unit) => unit.health > 0);
      for (const item of batch) {
        item.repeats += boards[item.side].reduce(
          (sum, unit) =>
            sum + (MINION_BY_ID[unit.definitionId].extraDeathrattle ?? 0) * (unit.golden ? 2 : 1),
          0,
        );
        queue.push(item);
      }
    };
    collect();
    let processed = 0;
    while (queue.length && processed++ < 300) {
      const dead = queue.shift()!;
      const definition = MINION_BY_ID[dead.unit.definitionId];
      const scale = dead.unit.golden ? 2 : 1;
      const insertionPoint = () => {
        const index = boards[dead.side].findIndex((unit) => dead.rightIds.includes(unit.id));
        return index < 0 ? boards[dead.side].length : index;
      };
      frame(`${definition.name} falls.`);
      for (const friendly of [...boards[dead.side]]) {
        if (friendly.health <= 0) continue;
        const trigger = MINION_BY_ID[friendly.definitionId];
        const factor = friendly.golden ? 2 : 1;
        if (trigger.deathGrowth && matchesTribe(dead.unit, trigger.deathGrowth.tribe))
          buff(friendly, trigger.deathGrowth.attack * factor, trigger.deathGrowth.health * factor);
        if (trigger.deathDamage && matchesTribe(dead.unit, trigger.deathDamage.tribe)) {
          const targets = boards[1 - dead.side].filter((unit) => unit.health > 0);
          if (targets.length) {
            damage(choose(targets), trigger.deathDamage.amount * factor);
            frame(
              `${MINION_BY_ID[friendly.definitionId].name} triggers for ${trigger.deathDamage.amount * factor} damage.`,
            );
          }
        }
      }
      collect();
      for (let repeat = 0; repeat < dead.repeats; repeat++) {
        const effect = definition.deathrattle;
        if (!effect) break;
        if (effect.type === 'summon')
          for (let n = 0; n < effect.count; n++)
            summon(dead.side, effect.card, dead.unit.golden, insertionPoint());
        if (effect.type === 'damage') {
          const targets = boards[1 - dead.side].filter((unit) => unit.health > 0);
          if (targets.length) {
            damage(choose(targets), effect.amount * scale);
            frame(`${definition.name}: Deathrattle deals ${effect.amount * scale}.`);
          }
        }
        if (effect.type === 'buff') {
          for (const unit of boards[dead.side])
            if (unit.health > 0 && matchesTribe(unit, effect.tribe))
              buff(unit, effect.attack * scale, effect.health * scale);
          frame(`${definition.name}: Deathrattle buffs survivors.`);
        }
        collect();
      }
      if (dead.unit.keywords.includes('reborn'))
        summon(dead.side, dead.unit.definitionId, dead.unit.golden, insertionPoint(), true);
      collect();
    }
    if (queue.length) stalemate = true;
  }
  let side =
    boards[0].length === boards[1].length
      ? choose([0, 1])
      : boards[0].length > boards[1].length
        ? 0
        : 1;
  frame('Warbands enter combat. Recruitment state is preserved.');
  while (boards[0].length && boards[1].length && attacks < 200 && !stalemate) {
    const eligible = boards[side].filter((unit) => unit.attack > 0);
    if (!eligible.length) {
      if (!boards[1 - side].some((unit) => unit.attack > 0)) {
        stalemate = true;
        break;
      }
      side = 1 - side;
      continue;
    }
    // Each sweep visits eligible minions left to right once. Summons join the
    // current sweep, never "catching up" on sweeps before they existed.
    if (eligible.every((unit) => unit.attacksTaken > sweep[side])) sweep[side]++;
    const attacker = eligible.find((unit) => unit.attacksTaken <= sweep[side])!;
    attacker.attacksTaken = sweep[side] + 1;
    const swings = attacker.keywords.includes('windfury') ? 2 : 1;
    for (let swing = 0; swing < swings && attacker.health > 0 && boards[1 - side].length; swing++) {
      const taunts = boards[1 - side].filter((unit) => unit.keywords.includes('taunt'));
      const defender = choose(taunts.length ? taunts : boards[1 - side]);
      const defenderIndex = boards[1 - side].indexOf(defender);
      const cleaveTargets = attacker.keywords.includes('cleave')
        ? boards[1 - side].filter((_, i) => Math.abs(i - defenderIndex) === 1)
        : [];
      // Snapshot attack values, then exchange damage before collecting either death.
      const outgoing = attacker.attack;
      const retaliation = defender.attack;
      damage(defender, outgoing, attacker.keywords.includes('poison'));
      damage(attacker, retaliation, defender.keywords.includes('poison'));
      for (const neighbor of cleaveTargets)
        damage(neighbor, outgoing, attacker.keywords.includes('poison'));
      attacks++;
      frame(
        `${MINION_BY_ID[attacker.definitionId].name} attacks ${MINION_BY_ID[defender.definitionId].name}${swings > 1 ? ` (${swing + 1}/${swings})` : ''}.`,
        attacker.id,
        defender.id,
      );
      deaths(side);
    }
    side = 1 - side;
  }
  if (attacks >= 200 && boards[0].length && boards[1].length) stalemate = true;
  const winner: 0 | 1 | null =
    stalemate || (!boards[0].length && !boards[1].length)
      ? null
      : boards[0].length && !boards[1].length
        ? 0
        : boards[1].length && !boards[0].length
          ? 1
          : null;
  const dealt =
    winner === null
      ? 0
      : tiers[winner] +
        boards[winner].reduce((sum, unit) => sum + MINION_BY_ID[unit.definitionId].tier, 0);
  const healthDamage: [number, number] =
    winner === 0 ? [0, dealt] : winner === 1 ? [dealt, 0] : [0, 0];
  frame(
    winner === null
      ? stalemate
        ? 'Stalemate: neither side can finish this battle.'
        : 'Both warbands fell. Combat is a tie.'
      : `Side ${winner + 1} wins, dealing ${dealt} hero damage.`,
  );
  return { winner, damage: healthDamage, frames, boards, rng, attacks, stalemate };
}
