import { ENEMY_BY_ID } from '../content/world';
import { aliveEnemies, applyStatus, hit, log, nextId, pick, roll, statuses } from './state';
import type { Combat, Enemy, Intent, SpireState } from './types';
import { CARD_BY_ID } from '../content/cards';
import { ascensionIntent } from './difficulty';

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
    ascension: run.ascension,
  };
  if (d.behavior === 'louse') enemy.powers.curlUp = 6;
  if (id === 'lagavulin') enemy.powers.asleep = 1;
  if (id === 'snakePlant') enemy.powers.malleable = 3;
  if (id === 'spiker') enemy.powers.thorns = 3;
  if (id === 'orbWalker') enemy.powers.ritual = 3;
  if (id === 'giantHead') enemy.powers.slow = 1;
  if (id === 'guardian') Object.assign(enemy.powers, { modeShift: 30, modeThreshold: 30 });
  if (id === 'timeEater') enemy.powers.timeWarp = 0;
  if (id === 'awakenedOne') {
    Object.assign(enemy.powers, { curiosity: 1, regeneration: 10 });
    if (run.ascension >= 4) enemy.status.strength = 2;
  }
  return enemy;
}
/** Dynamic moves are derived from visible state, never rolled by the UI. */
export function currentIntent(enemy: Enemy, combat: Combat): Intent {
  const d = ENEMY_BY_ID[enemy.definitionId];
  if (enemy.powers.rebirthing) return d.intents[2];
  if (enemy.powers.woke) return { name: 'Stunned', effects: [] };
  const split = d.behavior?.startsWith('split') || d.behavior === 'slimeBoss';
  if (split && enemy.hp > 0 && enemy.hp <= enemy.maxHp / 2) return d.intents[d.intents.length - 1];
  // Champ reacts at the next enemy turn; his currently shown move remains until then.
  if (d.behavior === 'champ' && !enemy.powers.angered && enemy.hp <= enemy.maxHp / 2)
    return ascensionIntent(enemy, d.intents[4], d.kind);
  const intent = ascensionIntent(enemy, d.intents[enemy.intentIndex], d.kind);
  if (d.behavior === 'hexaghost' && enemy.intentIndex === 1) {
    const effect = intent.effects[0];
    if (effect.type === 'damage') effect.amount = enemy.powers.divider ?? 1;
  }
  if (enemy.definitionId === 'bookOfStabbing' && enemy.intentIndex === 0) {
    const damage = intent.effects[0];
    if (damage.type === 'damage') damage.hits = 2 + (enemy.powers.multiStabs ?? 0);
  }
  if (enemy.definitionId === 'giantHead' && enemy.intentIndex === 2) {
    const damage = intent.effects[0];
    if (damage.type === 'damage')
      damage.amount = Math.min(
        enemy.ascension >= 3 ? 70 : 60,
        (enemy.ascension >= 3 ? 40 : 30) + Math.max(0, enemy.turn - 4) * 5,
      );
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
    if (d.behavior === 'timeEater' || d.behavior === 'bronzeOrb') {
      chooseNextIntent(run, enemy);
      return;
    }
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
    case 'guardian':
      enemy.intentIndex = last === 6 ? 3 : last === 3 ? 0 : (last ?? -1) + 1;
      break;
    case 'hexaghost': {
      if (enemy.turn === 1) {
        enemy.powers.divider = Math.floor(run.combat!.player.hp / 12) + 1;
        enemy.intentIndex = 1;
      } else enemy.intentIndex = [2, 3, 2, 4, 3, 2, 5][(enemy.turn - 2) % 7];
      break;
    }
    case 'automaton':
      enemy.intentIndex = [1, 2, 1, 2, 3, 4][(enemy.turn - 1) % 6];
      break;
    case 'bronzeOrb': {
      const value = roll(run);
      enemy.intentIndex =
        !enemy.powers.stasisUsed && value < 0.75
          ? 0
          : value < (enemy.powers.stasisUsed ? 0.3 : 0.825)
            ? 1
            : 2;
      if (twice && enemy.intentIndex === last) enemy.intentIndex = last === 1 ? 2 : 1;
      break;
    }
    case 'collector': {
      if (enemy.turn === 3) {
        enemy.intentIndex = 3;
        break;
      }
      const missing = aliveEnemies(run).filter((e) => e.definitionId === 'torchHead').length < 2;
      const value = roll(run);
      enemy.intentIndex = missing && value < 0.25 ? 0 : value < 0.7 ? 1 : 2;
      if (enemy.intentIndex === 2 && last === 2) enemy.intentIndex = 1;
      if (enemy.intentIndex === 1 && last === 1 && twice) enemy.intentIndex = 2;
      break;
    }
    case 'timeEater': {
      if (!enemy.powers.hasted && enemy.hp < enemy.maxHp / 2) {
        enemy.intentIndex = 3;
        break;
      }
      const choices = [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2].filter(
        (i) => i !== last || (i === 0 && !twice),
      );
      enemy.intentIndex = pick(run, choices);
      break;
    }
    case 'awakened':
      enemy.intentIndex = enemy.powers.rebirthing
        ? 2
        : last === 2
          ? 3
          : enemy.powers.awakened
            ? twice
              ? last === 4
                ? 5
                : 4
              : pick(run, [4, 5])
            : last === 1
              ? 0
              : twice
                ? 1
                : roll(run) < 0.75
                  ? 0
                  : 1;
      break;
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
    case 'snakePlant':
      enemy.intentIndex = last === 1 ? 0 : last === 0 && twice ? 1 : roll(run) < 0.75 ? 0 : 1;
      break;
    case 'slaver':
      enemy.intentIndex = twice ? 1 - (last ?? 0) : roll(run) < 0.6 ? 0 : 1;
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
      enemy.intentIndex = !enemy.powers.entangled
        ? roll(run) < 0.25
          ? 2
          : last === 1 && twice
            ? 0
            : 1
        : twice
          ? 1 - (last ?? 0)
          : roll(run) < 0.55
            ? 1
            : 0;
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
    case 'sharpHide':
      enemy.powers.sharpHide = amount;
      break;
    case 'offensiveMode':
      enemy.powers.sharpHide = 0;
      enemy.powers.modeThreshold += 10;
      enemy.powers.modeShift = enemy.powers.modeThreshold;
      break;
    case 'upgradeBurns':
      enemy.powers.upgradedBurns = 1;
      for (const card of Object.values(combat.cards))
        if (card.definitionId === 'burn') card.upgraded = true;
      break;
    case 'spawnOrbs':
    case 'spawnTorches': {
      const id = action === 'spawnOrbs' ? 'bronzeOrb' : 'torchHead';
      const count = 2 - aliveEnemies(run).filter((e) => e.definitionId === id).length;
      for (let i = 0; i < count; i++) {
        const child = createEnemy(run, id);
        combat.enemies.push(child);
        chooseNextIntent(run, child, true);
      }
      break;
    }
    case 'supportAutomaton': {
      const boss = aliveEnemies(run).find((e) => e.definitionId === 'bronzeAutomaton');
      if (boss) boss.block += amount;
      break;
    }
    case 'stasis': {
      enemy.powers.stasisUsed = 1;
      const pile = combat.draw.length ? combat.draw : combat.discard;
      const rank = { rare: 4, uncommon: 3, common: 2, basic: 1, special: 0 };
      const rarity = (id: string) => rank[CARD_BY_ID[combat.cards[id].definitionId].rarity];
      const best = Math.max(...pile.map(rarity));
      const candidates = pile.filter((id) => rarity(id) === best);
      if (!candidates.length) break;
      enemy.stasisCard = pick(run, candidates);
      pile.splice(pile.indexOf(enemy.stasisCard), 1);
      log(
        run,
        `Stasis takes ${CARD_BY_ID[combat.cards[enemy.stasisCard].definitionId].name}. Defeat the Orb to recover it.`,
      );
      break;
    }
    case 'drawReduction':
      if (combat.player.status.artifact) combat.player.status.artifact--;
      else combat.drawReduction += amount;
      break;
    case 'haste':
      enemy.hp = Math.max(enemy.hp, Math.floor(enemy.maxHp / 2));
      enemy.powers.hasted = 1;
      for (const status of ['weak', 'vulnerable', 'frail', 'poison'] as const)
        enemy.status[status] = 0;
      enemy.status.strength = Math.max(0, enemy.status.strength);
      break;
    case 'rebirth':
      enemy.powers.rebirthing = 0;
      enemy.powers.awakened = 1;
      enemy.hp = enemy.maxHp;
      for (const status of ['weak', 'vulnerable', 'frail', 'poison'] as const)
        enemy.status[status] = 0;
      enemy.status.strength = Math.max(0, enemy.status.strength);
      break;
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
