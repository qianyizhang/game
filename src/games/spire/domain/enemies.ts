import { ENEMY_BY_ID } from '../content/world';
import { aliveEnemies, applyStatus, hit, log, nextId, pick, roll, statuses } from './state';
import type { Combat, Enemy, Intent, SpireState } from './types';

export function createEnemy(run: SpireState, id: string, hp?: number): Enemy {
  const d = ENEMY_BY_ID[id];
  const life = hp ?? d.hp;
  const enemy: Enemy = {
    id: nextId(run, 'enemy'),
    definitionId: id,
    hp: life,
    maxHp: life,
    block: d.block ?? 0,
    status: { ...statuses(), artifact: d.artifact ?? 0 },
    freshDebuffs: [],
    intentIndex: 0,
    turn: 0,
    history: [],
    powers: {},
  };
  if (d.behavior === 'louse') enemy.powers.curlUp = 6;
  if (id === 'lagavulin') enemy.powers.asleep = 1;
  if (id === 'snakePlant') enemy.powers.malleable = 3;
  if (id === 'spiker') enemy.powers.thorns = 3;
  if (id === 'orbWalker') enemy.powers.ritual = 3;
  if (id === 'giantHead') enemy.powers.slow = 1;
  return enemy;
}
/** Dynamic moves are derived from visible state, never rolled by the UI. */
export function currentIntent(enemy: Enemy, combat: Combat): Intent {
  const d = ENEMY_BY_ID[enemy.definitionId];
  if (enemy.powers.woke) return { name: 'Stunned', effects: [] };
  const split = d.behavior?.startsWith('split') || d.behavior === 'slimeBoss';
  if (split && enemy.hp > 0 && enemy.hp <= enemy.maxHp / 2) return d.intents[d.intents.length - 1];
  // Champ reacts at the next enemy turn; his currently shown move remains until then.
  if (d.behavior === 'champ' && !enemy.powers.angered && enemy.hp <= enemy.maxHp / 2)
    return d.intents[4];
  const intent = structuredClone(d.intents[enemy.intentIndex]);
  if (enemy.definitionId === 'bookOfStabbing' && enemy.intentIndex === 0) {
    const damage = intent.effects[0];
    if (damage.type === 'damage') damage.hits = 2 + (enemy.powers.multiStabs ?? 0);
  }
  if (enemy.definitionId === 'giantHead' && enemy.intentIndex === 2) {
    const damage = intent.effects[0];
    if (damage.type === 'damage')
      damage.amount = Math.min(60, 30 + Math.max(0, enemy.turn - 4) * 5);
  }
  if (
    enemy.definitionId === 'centurion' &&
    !combat.enemies.some((e) => e.definitionId === 'mystic' && e.hp > 0)
  )
    return d.intents[2];
  return intent;
}
export function chooseNextIntent(run: SpireState, enemy: Enemy, initial = false) {
  const d = ENEMY_BY_ID[enemy.definitionId],
    last = enemy.history.at(-1),
    twice = enemy.history.at(-2) === last;
  if (initial) {
    if (d.behavior === 'sentry')
      enemy.intentIndex =
        run.combat!.enemies.filter((e) => e.definitionId === 'sentry').indexOf(enemy) === 1 ? 0 : 1;
    else if (
      [
        'louse',
        'slime',
        'splitAcid',
        'splitSpike',
        'spiker',
        'repulsor',
        'orb',
        'slaver',
        'snakePlant',
        'nemesis',
      ].includes(d.behavior ?? '')
    )
      enemy.intentIndex = Math.floor(roll(run) * Math.min(2, d.intents.length));
    return;
  }
  switch (d.behavior) {
    case 'cultist':
      enemy.intentIndex = 1;
      break;
    case 'jawWorm': {
      const value = roll(run);
      let next = value < 0.25 ? 0 : value < 0.55 ? 1 : 2;
      if ((next === 0 && last === 0) || (next === last && twice)) next = (next + 1) % 3;
      enemy.intentIndex = next;
      break;
    }
    case 'louse':
    case 'slaver':
    case 'snakePlant':
      enemy.intentIndex = last === 1 ? 0 : last === 0 && twice ? 1 : roll(run) < 0.75 ? 0 : 1;
      break;
    case 'slime':
    case 'splitAcid':
    case 'splitSpike': {
      const max = d.intents.length - (d.behavior?.startsWith('split') ? 1 : 0);
      const choices = Array.from({ length: max }, (_, i) => i).filter(
        (i) => !(twice && i === last),
      );
      enemy.intentIndex = pick(run, choices);
      break;
    }
    case 'nob':
      enemy.intentIndex = last === 2 || (last === 1 && twice) ? 1 : roll(run) < 2 / 3 ? 1 : 2;
      if (last === 1 && twice) enemy.intentIndex = 2;
      break;
    case 'lagavulin':
      if (enemy.powers.woke) {
        enemy.powers.woke = 0;
        enemy.intentIndex = 1;
        break;
      }
      if (enemy.powers.asleep && enemy.turn < 3) enemy.intentIndex = 0;
      else {
        enemy.powers.asleep = 0;
        enemy.intentIndex = last === 1 && twice ? 2 : 1;
      }
      break;
    case 'sentry':
    case 'donu':
    case 'deca':
      enemy.intentIndex = 1 - enemy.intentIndex;
      break;
    case 'slimeBoss':
      enemy.intentIndex = (enemy.intentIndex + 1) % 3;
      break;
    case 'chosen':
      enemy.intentIndex =
        enemy.turn === 1 ? 1 : pick(run, last === 3 || last === 4 ? [0, 2] : [3, 4]);
      break;
    case 'centurion':
      enemy.intentIndex = roll(run) < 0.65 ? 1 : 0;
      break;
    case 'mystic':
      enemy.intentIndex = aliveEnemies(run).some((e) => e.maxHp - e.hp >= 16)
        ? 0
        : last === 1
          ? 2
          : pick(run, [1, 2]);
      break;
    case 'sphere':
      enemy.intentIndex = enemy.turn === 1 ? 1 : last === 2 ? 3 : 2;
      break;
    case 'book':
      enemy.intentIndex = last === 1 ? 0 : twice ? 1 : roll(run) < 0.85 ? 0 : 1;
      break;
    case 'redSlaver':
      enemy.intentIndex = !enemy.powers.entangled && enemy.turn >= 2 ? 2 : last === 0 ? 1 : 0;
      break;
    case 'champ':
      if (enemy.powers.angered) {
        enemy.intentIndex =
          last === 4 ? 5 : (enemy.powers.sinceExecute ?? 0) >= 2 ? 5 : pick(run, [0, 2]);
      } else
        enemy.intentIndex =
          enemy.turn % 4 === 3
            ? 3
            : pick(
                run,
                [0, 1, 2].filter((i) => i !== last),
              );
      break;
    case 'spiker':
      enemy.intentIndex = last === 1 && twice ? 0 : roll(run) < 0.5 ? 1 : 0;
      break;
    case 'repulsor':
      enemy.intentIndex = last === 1 && twice ? 0 : roll(run) < 0.8 ? 1 : 0;
      break;
    case 'exploder':
      enemy.intentIndex = enemy.turn >= 2 ? 1 : 0;
      break;
    case 'orb':
      enemy.intentIndex = twice ? 1 - (last ?? 0) : pick(run, [0, 1]);
      break;
    case 'growth':
      enemy.intentIndex = run.combat!.enemies.some((e) => e.powers.constrict > 0)
        ? pick(run, [0, 2])
        : 1;
      break;
    case 'giantHead':
      enemy.intentIndex = enemy.turn >= 4 ? 2 : last === 1 ? 0 : pick(run, [0, 1]);
      break;
    case 'nemesis':
      enemy.intentIndex = pick(
        run,
        [0, 1, 2].filter((i) => i !== last || (i === 0 && !twice)),
      );
      break;
    default:
      enemy.intentIndex = (enemy.intentIndex + 1) % d.intents.length;
  }
}
export function enemySpecial(run: SpireState, enemy: Enemy, action: string, amount: number) {
  const combat = run.combat!;
  switch (action) {
    case 'ritual':
      enemy.powers.ritual = amount;
      enemy.powers.ritualFresh = 1;
      break;
    case 'enrage':
      enemy.powers.enrage = amount;
      break;
    case 'metallicize':
      enemy.powers.metallicize = (enemy.powers.metallicize ?? 0) + amount;
      break;
    case 'thorns':
      enemy.powers.thorns = (enemy.powers.thorns ?? 0) + amount;
      break;
    case 'hex':
      enemy.powers.hex = 1;
      break;
    case 'entangle':
      enemy.powers.entangled = 1;
      combat.enemies.forEach((e) => {
        if (e.id === enemy.id) e.powers.entangle = 2;
      });
      break;
    case 'constrict':
      enemy.powers.constrict = amount;
      break;
    case 'allyStrength':
      for (const ally of aliveEnemies(run)) applyStatus(ally, 'strength', amount);
      break;
    case 'allyBlock':
      for (const ally of aliveEnemies(run)) {
        if (enemy.definitionId !== 'centurion' || ally.id !== enemy.id) ally.block += amount;
      }
      break;
    case 'healAll':
      for (const ally of aliveEnemies(run)) ally.hp = Math.min(ally.maxHp, ally.hp + amount);
      break;
    case 'cleanse':
      enemy.status.weak = 0;
      enemy.status.vulnerable = 0;
      enemy.status.frail = 0;
      enemy.status.strength = Math.max(0, enemy.status.strength);
      enemy.powers.angered = 1;
      break;
    case 'selfDestruct':
      hit(run, enemy, enemy.hp + enemy.block, 'Exploder destroys itself', true);
      break;
    case 'splitBoss':
    case 'splitAcid':
    case 'splitSpike': {
      const children =
        action === 'splitBoss'
          ? ['acidSlimeL', 'spikeSlimeL']
          : action === 'splitAcid'
            ? ['acidSlimeM', 'acidSlimeM']
            : ['spikeSlimeM', 'spikeSlimeM'];
      const hp = enemy.hp;
      enemy.hp = 0;
      for (const id of children) {
        const child = createEnemy(run, id, hp);
        combat.enemies.push(child);
        chooseNextIntent(run, child, true);
      }
      log(run, `${ENEMY_BY_ID[enemy.definitionId].name} splits: each child has ${hp} HP.`);
      break;
    }
  }
}
