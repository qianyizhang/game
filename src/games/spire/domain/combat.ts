import { CARD_BY_ID, cardCost } from '../content/cards';
import { ENERGY_RELICS, ENEMY_BY_ID, RELIC_BY_ID } from '../content/world';
import { chooseNextIntent, createEnemy, currentIntent, enemySpecial } from './enemies';
import {
  aliveEnemies,
  combatOngoing,
  applyStatus,
  gainBlock,
  heal,
  hit,
  log,
  maxHp,
  nextId,
  pick,
  shuffled,
  statuses,
  tickDurations,
} from './state';
import type { Combat, Effect, Enemy, Fighter, Power, SpireState } from './types';
export { aliveEnemies, hit, log, nextId, statuses } from './state';
export function attackDamage(
  base: number,
  source: Fighter,
  target: Fighter,
  strengthScale = 1,
  multiplier = 1,
): number {
  return Math.max(
    0,
    Math.floor(
      Math.max(0, base + source.status.strength * strengthScale) *
        (source.status.weak > 0 ? 0.75 : 1) *
        (target.status.vulnerable > 0 ? 1.5 : 1) *
        multiplier,
    ),
  );
}
export function combatCardCost(run: SpireState, id: string): number {
  const card = run.combat!.cards[id],
    definition = CARD_BY_ID[card.definitionId];
  if (definition.kind === 'skill' && run.combat!.powers.corruption) return 0;
  return cardCost(card.definitionId, card.upgraded);
}
export function attackExplanation(
  base: number,
  source: Fighter,
  target: Fighter,
  strengthScale = 1,
  multiplier = 1,
): string {
  return `floor(max(0, ${base} base + ${source.status.strength} Strength × ${strengthScale}) × ${source.status.weak > 0 ? '0.75 Weak' : '1'} × ${target.status.vulnerable > 0 ? '1.5 Vulnerable' : '1'} × ${multiplier}) = ${attackDamage(base, source, target, strengthScale, multiplier)}`;
}
export function addGenerated(
  run: SpireState,
  definitionId: string,
  count: number,
  zone: 'hand' | 'draw' | 'discard',
  upgraded = false,
) {
  const combat = run.combat!;
  for (let i = 0; i < count; i++) {
    const id = nextId(run, 'temporary');
    combat.cards[id] = { id, definitionId, upgraded };
    if (zone === 'hand' && combat.hand.length < 10) combat.hand.push(id);
    else if (zone === 'draw') {
      combat.draw = shuffled(run, [...combat.draw, id]);
    } else combat.discard.push(id);
  }
  log(run, `${count} ${CARD_BY_ID[definitionId].name} added to ${zone}.`);
}
export function drawCards(run: SpireState, count: number) {
  const c = run.combat!;
  if (c.noDraw) {
    log(run, 'No Draw prevents drawing this turn.');
    return;
  }
  for (let i = 0; i < count && c.player.hp > 0 && combatOngoing(run); i++) {
    if (c.hand.length >= 10) {
      log(run, 'Hand limit: additional draw stops.');
      return;
    }
    if (!c.draw.length && c.discard.length) {
      c.draw = shuffled(run, c.discard);
      c.discard = [];
      log(run, 'Shuffle discard into draw.');
    }
    const id = c.draw.shift();
    if (!id) return;
    c.hand.push(id);
    if (c.cards[id].definitionId === 'void') c.energy = Math.max(0, c.energy - 1);
    log(run, `Draw ${CARD_BY_ID[c.cards[id].definitionId].name}.`, {
      kind: 'card',
      source: 'Draw',
    });
    if (
      c.powers.fireBreathing &&
      ['status', 'curse'].includes(CARD_BY_ID[c.cards[id].definitionId].kind)
    ) {
      for (const enemy of aliveEnemies(run))
        hit(run, enemy, c.powers.fireBreathing, 'Fire Breathing');
    }
  }
}
/** Only manual/card discards fire these hooks; ordinary end-turn cleanup does not. */
export function discardCard(run: SpireState, id: string) {
  const c = run.combat!;
  if (!c.hand.includes(id)) return;
  c.hand = c.hand.filter((card) => card !== id);
  c.discard.push(id);
  c.discarded++;
  discardHook(run, id);
}
function discardHook(run: SpireState, id: string) {
  const c = run.combat!;
  const instance = c.cards[id],
    definition = CARD_BY_ID[instance.definitionId];
  log(run, `Discard ${definition.name}.`);
  const hook = definition.onDiscard;
  if (hook) {
    const amount = instance.upgraded ? hook.upgradedAmount : hook.amount;
    if (hook.type === 'draw') drawCards(run, amount);
    else c.energy += amount;
  }
}
export function exhaustCard(run: SpireState, id: string) {
  const c = run.combat!;
  if (c.exhaust.includes(id)) return;
  c.hand = c.hand.filter((card) => card !== id);
  c.exhaust.push(id);
  log(run, `${CARD_BY_ID[c.cards[id].definitionId].name} Exhausts.`);
  if (c.powers.feelNoPain) gainBlock(run, c.powers.feelNoPain);
  if (c.cards[id].definitionId === 'sentinel') c.energy += c.cards[id].upgraded ? 3 : 2;
  if (c.powers.darkEmbrace) drawCards(run, c.powers.darkEmbrace);
}
function loseCardHp(run: SpireState, amount: number, label: string) {
  const c = run.combat!;
  const lost = hit(run, c.player, amount, label, true);
  if (lost > 0 && c.powers.rupture && c.player.hp > 0) {
    applyStatus(c.player, 'strength', c.powers.rupture);
    log(run, `Rupture: +${c.powers.rupture} Strength.`);
  }
}
function playerAttack(
  run: SpireState,
  effect: Extract<Effect, { type: 'damage' }>,
  targetId: string | undefined,
  x: number,
) {
  const c = run.combat!;
  let healed = 0;
  const strikes = Object.values(c.cards).filter(
    (card) =>
      !c.exhaust.includes(card.id) &&
      !c.enemies.some((e) => e.stasisCard === card.id) &&
      CARD_BY_ID[card.definitionId].name.includes('Strike'),
  ).length;
  const base =
    (effect.fromBlock ? c.player.block : effect.amount) +
    (effect.strikeScale ?? 0) * strikes +
    c.attackBonus +
    (c.cards[c.resolving!]?.definitionId === 'shiv' ? c.powers.accuracy : 0);
  const repeats =
    effect.poisonedTwice && aliveEnemies(run).some((e) => e.id === targetId && e.status.poison > 0)
      ? 2
      : 1;
  for (let n = 0; n < (effect.xHits ? x : (effect.hits ?? repeats)); n++) {
    if (c.player.hp <= 0 || !aliveEnemies(run).length) break;
    const targets = effect.all
      ? aliveEnemies(run)
      : effect.random
        ? [pick(run, aliveEnemies(run))]
        : aliveEnemies(run).filter((e) => e.id === targetId);
    for (const enemy of targets) {
      if (c.player.hp <= 0 || enemy.hp <= 0) continue;
      const slow = enemy.powers.slow ? 1 + Math.max(0, c.cardsPlayed - 1) * 0.1 : 1;
      const amount = attackDamage(
        base,
        c.player,
        enemy,
        effect.strengthScale ?? 1,
        c.attackMultiplier * slow,
      );
      const lost = hit(
        run,
        enemy,
        amount,
        CARD_BY_ID[c.cards[c.resolving!].definitionId].name,
        false,
        attackExplanation(
          base,
          c.player,
          enemy,
          effect.strengthScale ?? 1,
          c.attackMultiplier * slow,
        ),
      );
      healed += lost;
      if (lost > 0 && enemy.hp > 0 && c.powers.envenom)
        applyStatus(enemy, 'poison', c.powers.envenom);
      if (lost > 0 && enemy.hp > 0 && enemy.powers.curlUp) {
        enemy.block += enemy.powers.curlUp;
        enemy.powers.curlUp = 0;
      }
      if (lost > 0 && enemy.hp > 0 && enemy.powers.malleable) {
        enemy.block += enemy.powers.malleable;
        enemy.powers.malleable++;
      }
      if (enemy.powers.thorns) hit(run, c.player, enemy.powers.thorns, 'Thorns');
      if (
        enemy.hp === 0 &&
        !enemy.powers.rebirthing &&
        effect.fatalMaxHp &&
        ENEMY_BY_ID[enemy.definitionId].kind !== 'summon'
      ) {
        maxHp(run, effect.fatalMaxHp);
        log(run, `Feed: +${effect.fatalMaxHp} maximum HP.`);
      }
    }
  }
  if (effect.heal && c.player.hp > 0) {
    heal(run, healed);
    log(run, `Reaper heals ${healed} HP.`);
  }
}
function finishCard(run: SpireState, id: string, exhaust: boolean) {
  const c = run.combat!,
    definition = CARD_BY_ID[c.cards[id].definitionId];
  c.resolving = null;
  if (definition.kind === 'power') c.powersPlayed.push(id);
  else if (exhaust) exhaustCard(run, id);
  else c.discard.push(id);
  log(
    run,
    `${definition.name} → ${definition.kind === 'power' ? 'active Powers' : exhaust ? 'Exhaust' : 'discard'}.`,
    { kind: 'card', source: definition.name },
  );
  if (c.timeWarpPending && c.player.hp > 0 && combatOngoing(run)) {
    c.timeWarpPending = false;
    log(run, 'Time Warp: the twelfth card has resolved. Your turn ends.');
    endTurn(run);
  }
}
/** A choice suspends the action, retaining the resolving card outside every pile. */
function resolveCardEffects(
  run: SpireState,
  effects: readonly Effect[],
  sourceId: string,
  targetId: string | undefined,
  exhaust: boolean,
  x: number,
): boolean {
  const c = run.combat!;
  for (const [index, effect] of effects.entries()) {
    if (c.player.hp <= 0 || !combatOngoing(run)) break;
    const target = aliveEnemies(run).find((e) => e.id === targetId);
    switch (effect.type) {
      case 'damage':
        playerAttack(run, effect, targetId, x);
        break;
      case 'block':
        gainBlock(run, effect.amount, true);
        break;
      case 'draw':
        drawCards(run, effect.amount);
        break;
      case 'energy':
        c.energy += effect.amount;
        log(run, `Gain ${effect.amount} Energy.`);
        break;
      case 'heal':
        heal(run, effect.amount);
        break;
      case 'loseHp':
        loseCardHp(run, effect.amount, 'Card HP cost');
        break;
      case 'status': {
        const targets =
          effect.target === 'self'
            ? [c.player]
            : effect.target === 'all'
              ? aliveEnemies(run)
              : target
                ? [target]
                : [];
        for (const recipient of targets)
          log(
            run,
            applyStatus(recipient, effect.status, effect.amount)
              ? `${effect.status} ${effect.amount >= 0 ? '+' : ''}${effect.amount}.`
              : 'Artifact blocks the debuff.',
          );
        break;
      }
      case 'power':
        c.powers[effect.power] += effect.amount;
        log(run, `Activate ${effect.power} ${effect.amount}.`);
        break;
      case 'generate':
        addGenerated(
          run,
          effect.card,
          effect.amount,
          effect.zone,
          effect.copySource && c.cards[sourceId].upgraded,
        );
        break;
      case 'noDraw':
        c.noDraw = true;
        break;
      case 'discardHand': {
        const held = [...c.hand];
        c.hand = [];
        c.discard.push(...held);
        c.discarded += held.length;
        for (const id of held) discardHook(run, id);
        if (effect.draw) drawCards(run, held.length);
        break;
      }
      case 'multiplyPoison':
        if (target && target.status.poison > 0)
          applyStatus(target, 'poison', target.status.poison * (effect.amount - 1));
        break;
      case 'randomPoison':
        for (let i = 0; i < effect.hits && aliveEnemies(run).length; i++)
          applyStatus(pick(run, aliveEnemies(run)), 'poison', effect.amount);
        break;
      case 'nextTurn':
        c.nextTurn[effect.stat] +=
          effect.stat === 'block'
            ? Math.floor(
                Math.max(0, effect.amount + c.player.status.dexterity) *
                  (c.player.status.frail > 0 ? 0.75 : 1),
              )
            : effect.amount;
        break;
      case 'blur':
        c.blur += effect.amount;
        break;
      case 'temporary':
        if (effect.stat === 'strength') {
          applyStatus(c.player, 'strength', effect.amount);
          c.temporaryStrength += effect.amount;
        } else c[effect.stat] += effect.amount;
        break;
      case 'doubleBlock':
        c.player.block = Math.min(999, c.player.block * 2);
        break;
      case 'doubleStrength':
        c.player.status.strength *= 2;
        break;
      case 'choose': {
        const options =
          effect.action === 'topdeck'
            ? [...c.discard]
            : c.hand.filter(
                (id) =>
                  effect.action !== 'upgrade' ||
                  (!c.cards[id].upgraded && !CARD_BY_ID[c.cards[id].definitionId].token),
              );
        if (!options.length) break;
        if (effect.random) {
          exhaustCard(run, pick(run, options));
          break;
        }
        c.choice = {
          action: effect.action,
          options,
          effects: [
            ...((effect.count ?? 1) > 1 ? [{ ...effect, count: effect.count! - 1 }] : []),
            ...effects.slice(index + 1),
          ],
          sourceId,
          targetId,
          exhaust,
          x,
        };
        log(
          run,
          `Choose a card to ${effect.action === 'topdeck' ? 'put on top of draw' : effect.action}.`,
        );
        return false;
      }
      case 'exhaustHand': {
        const ids = c.hand.filter(
          (id) => !effect.nonAttacks || CARD_BY_ID[c.cards[id].definitionId].kind !== 'attack',
        );
        for (const id of ids) {
          exhaustCard(run, id);
          if (effect.blockEach) gainBlock(run, effect.blockEach, true);
        }
        if (effect.damageEach)
          playerAttack(
            run,
            { type: 'damage', amount: effect.damageEach, hits: ids.length },
            targetId,
            x,
          );
        break;
      }
    }
  }
  finishCard(run, sourceId, exhaust);
  return true;
}
export function chooseCard(run: SpireState, id: string): string | undefined {
  const c = run.combat!,
    choice = c.choice;
  if (!choice || !choice.options.includes(id)) return 'Choose one of the highlighted cards.';
  c.choice = null;
  if (choice.action === 'exhaust') exhaustCard(run, id);
  if (choice.action === 'discard') discardCard(run, id);
  if (choice.action === 'upgrade') c.cards[id].upgraded = true;
  if (choice.action === 'topdeck') {
    c.discard = c.discard.filter((card) => card !== id);
    c.draw.unshift(id);
  }
  resolveCardEffects(
    run,
    choice.effects,
    choice.sourceId,
    choice.targetId,
    choice.exhaust,
    choice.x,
  );
}
export function playCard(run: SpireState, id: string, targetId?: string): string | undefined {
  const c = run.combat!;
  if (c.choice) return 'Resolve the card choice first.';
  if (!c.hand.includes(id)) return 'That card is not in your hand.';
  const instance = c.cards[id],
    definition = CARD_BY_ID[instance.definitionId],
    cost = combatCardCost(run, id);
  if (cost === -1) return 'This card is unplayable.';
  if (cost > c.energy) return 'Not enough Energy.';
  if (definition.target && !aliveEnemies(run).some((e) => e.id === targetId))
    return 'Choose a living enemy.';
  if (
    definition.onlyAttacks &&
    c.hand.some((card) => CARD_BY_ID[c.cards[card].definitionId].kind !== 'attack')
  )
    return 'Clash requires a hand containing only Attacks.';
  if (definition.kind === 'attack' && aliveEnemies(run).some((e) => e.powers.entangle > 0))
    return 'Entangled: you cannot play Attacks this turn.';
  const x = c.energy;
  const mustExhaust =
    !!(instance.upgraded
      ? (definition.upgradedExhaust ?? definition.exhaust)
      : definition.exhaust) ||
    (definition.kind === 'skill' && !!c.powers.corruption);
  c.energy -= cost === -2 ? x : cost;
  c.hand = c.hand.filter((card) => card !== id);
  c.resolving = id;
  c.cardsPlayed++;
  if (c.powers.afterImage) gainBlock(run, c.powers.afterImage);
  if (c.powers.thousandCuts)
    for (const enemy of aliveEnemies(run))
      hit(run, enemy, c.powers.thousandCuts, 'A Thousand Cuts');
  if (definition.requiresDiscard && c.discarded > 0) c.energy += 2;
  for (const enemy of aliveEnemies(run)) {
    if (enemy.definitionId === 'timeEater') {
      enemy.powers.timeWarp = (enemy.powers.timeWarp + 1) % 12;
      if (enemy.powers.timeWarp === 0) {
        applyStatus(enemy, 'strength', 2);
        c.timeWarpPending = true;
      }
    }
    if (definition.kind === 'power' && enemy.powers.curiosity)
      applyStatus(enemy, 'strength', enemy.powers.curiosity);
    if (definition.kind === 'attack' && enemy.powers.sharpHide)
      hit(run, c.player, enemy.powers.sharpHide, 'Sharp Hide');
  }
  log(
    run,
    `Play ${definition.name}${instance.upgraded ? '+' : ''} (${cost === -2 ? x : cost} Energy).`,
  );
  c.attackBonus = 0;
  c.attackMultiplier = 1;
  if (definition.kind === 'attack') {
    c.attacksPlayed++;
    if (c.rage) gainBlock(run, c.rage);
    if (run.relics.includes('akabeko') && !run.relicCounters.akabekoUsed) {
      c.attackBonus = 8;
      run.relicCounters.akabekoUsed = 1;
    }
    if (run.relics.includes('penNib')) {
      run.relicCounters.penNib = (run.relicCounters.penNib ?? 0) + 1;
      if (run.relicCounters.penNib === 10) {
        c.attackMultiplier = 2;
        run.relicCounters.penNib = 0;
        log(run, 'Pen Nib: double attack damage.');
      }
    }
    if (c.attacksPlayed % 3 === 0) {
      if (run.relics.includes('kunai')) applyStatus(c.player, 'dexterity', 1);
      if (run.relics.includes('shuriken')) applyStatus(c.player, 'strength', 1);
      if (run.relics.includes('ornamentalFan')) gainBlock(run, 4);
    }
  }
  if (definition.kind === 'skill') {
    c.skillsPlayed++;
    for (const enemy of aliveEnemies(run))
      if (enemy.powers.enrage) {
        applyStatus(enemy, 'strength', enemy.powers.enrage);
        log(run, `Gremlin Nob gains ${enemy.powers.enrage} Strength from the Skill.`);
      }
    if (c.skillsPlayed % 3 === 0 && run.relics.includes('letterOpener'))
      for (const enemy of aliveEnemies(run)) hit(run, enemy, 5, 'Letter Opener');
  }
  if (definition.kind !== 'attack' && aliveEnemies(run).some((e) => e.powers.hex))
    addGenerated(run, 'dazed', 1, 'draw');
  resolveCardEffects(
    run,
    instance.upgraded ? (definition.upgradedEffects ?? definition.effects) : definition.effects,
    id,
    targetId,
    mustExhaust,
    x,
  );
}
function emptyPowers(): Record<Power, number> {
  return {
    metallicize: 0,
    demonForm: 0,
    barricade: 0,
    feelNoPain: 0,
    darkEmbrace: 0,
    corruption: 0,
    combust: 0,
    combustHp: 0,
    rupture: 0,
    fireBreathing: 0,
    noxiousFumes: 0,
    accuracy: 0,
    afterImage: 0,
    infiniteBlades: 0,
    envenom: 0,
    thousandCuts: 0,
  };
}
export function startCombat(run: SpireState, encounter: string[]) {
  const c: Combat = {
    turn: 0,
    energy: 0,
    player: { hp: run.hp, maxHp: run.maxHp, block: 0, status: statuses(), freshDebuffs: [] },
    enemies: [],
    cards: Object.fromEntries(run.deck.map((card) => [card.id, { ...card }])),
    hand: [],
    draw: [],
    discard: [],
    exhaust: [],
    powersPlayed: [],
    resolving: null,
    powers: emptyPowers(),
    attacksPlayed: 0,
    skillsPlayed: 0,
    cardsPlayed: 0,
    damageTaken: 0,
    attackBonus: 0,
    attackMultiplier: 1,
    rage: 0,
    flameBarrier: 0,
    temporaryStrength: 0,
    noDraw: false,
    choice: null,
    timeWarpPending: false,
    drawReduction: 0,
    nextTurn: { block: 0, energy: 0, draw: 0 },
    blur: 0,
    discarded: 0,
  };
  run.combat = c;
  run.phase = 'combat';
  c.enemies = encounter.map((id) => createEnemy(run, id));
  const elite = run.map.find((n) => n.id === run.currentNode)?.kind === 'elite';
  for (const enemy of c.enemies) {
    if (elite && run.relics.includes('preservedInsect')) enemy.hp = Math.round(enemy.hp * 0.75);
    if (run.relics.includes('neowsLament') && (run.relicCounters.neowsLament ?? 0) < 3)
      enemy.hp = 1;
    chooseNextIntent(run, enemy, true);
  }
  if (run.relics.includes('neowsLament'))
    run.relicCounters.neowsLament = (run.relicCounters.neowsLament ?? 0) + 1;
  run.relicCounters.akabekoUsed = 0;
  c.draw = shuffled(
    run,
    run.deck.map((card) => card.id),
  );
  c.draw.sort(
    (a, b) =>
      Number(!!(CARD_BY_ID[c.cards[b].definitionId].innateUpgrade && c.cards[b].upgraded)) -
      Number(!!(CARD_BY_ID[c.cards[a].definitionId].innateUpgrade && c.cards[a].upgraded)),
  );
  if (run.relics.includes('vajra')) applyStatus(c.player, 'strength', 1);
  if (run.relics.includes('oddlySmoothStone')) applyStatus(c.player, 'dexterity', 1);
  if (run.relics.includes('bagOfMarbles'))
    for (const enemy of c.enemies) applyStatus(enemy, 'vulnerable', 1);
  startPlayerTurn(run);
  if (run.relics.includes('anchor')) gainBlock(run, 10);
  for (const id of run.relics) {
    const relic = RELIC_BY_ID[id];
    if (relic.startBlock) gainBlock(run, relic.startBlock);
    if (relic.startStrength) applyStatus(c.player, 'strength', relic.startStrength);
  }
  log(run, `Encounter: ${c.enemies.map((e) => ENEMY_BY_ID[e.definitionId].name).join(' + ')}.`);
}
function startPlayerTurn(run: SpireState) {
  const c = run.combat!;
  c.turn++;
  c.attacksPlayed = 0;
  c.skillsPlayed = 0;
  c.cardsPlayed = 0;
  c.rage = 0;
  c.flameBarrier = 0;
  c.noDraw = false;
  c.discarded = 0;
  if (!c.powers.barricade && !c.blur) c.player.block = 0;
  c.blur = Math.max(0, c.blur - 1);
  c.energy =
    3 +
    ENERGY_RELICS.filter((id) => run.relics.includes(id)).length +
    (c.turn === 1 && run.relics.includes('lantern') ? 1 : 0) +
    c.nextTurn.energy;
  if (run.relics.includes('happyFlower')) {
    run.relicCounters.happyFlower = ((run.relicCounters.happyFlower ?? 0) + 1) % 3;
    if (run.relicCounters.happyFlower === 0) c.energy++;
  }
  applyStatus(c.player, 'strength', c.powers.demonForm);
  if (c.nextTurn.block) gainBlock(run, c.nextTurn.block);
  if (c.powers.noxiousFumes)
    for (const enemy of aliveEnemies(run)) applyStatus(enemy, 'poison', c.powers.noxiousFumes);
  if (c.powers.infiniteBlades) addGenerated(run, 'shiv', c.powers.infiniteBlades, 'hand');
  drawCards(
    run,
    5 +
      (c.turn === 1
        ? (run.relics.includes('bagOfPreparation') ? 2 : 0) +
          (run.relics.includes('ringOfTheSnake') ? 2 : 0)
        : 0) +
      c.nextTurn.draw -
      (c.drawReduction > 0 ? 1 : 0),
  );
  c.drawReduction = Math.max(0, c.drawReduction - 1);
  c.nextTurn = { block: 0, energy: 0, draw: 0 };
  log(run, `Turn ${c.turn}: ${c.energy} Energy.`);
}
function enemyAttack(run: SpireState, enemy: Enemy, base: number, hits: number) {
  const c = run.combat!;
  for (let n = 0; n < hits && enemy.hp > 0 && c.player.hp > 0; n++) {
    const lost = hit(
      run,
      c.player,
      attackDamage(base, enemy, c.player),
      ENEMY_BY_ID[enemy.definitionId].name,
      false,
      attackExplanation(base, enemy, c.player),
    );
    if (lost && enemy.definitionId === 'bookOfStabbing') addGenerated(run, 'wound', 1, 'discard');
    const retaliation = c.flameBarrier + (run.relics.includes('bronzeScales') ? 3 : 0);
    if (retaliation) hit(run, enemy, retaliation, 'Retaliation');
  }
}
export function endTurn(run: SpireState): string | undefined {
  const c = run.combat!;
  if (c.choice) return 'Resolve the card choice first.';
  const held = [...c.hand];
  for (const id of held) {
    if (c.player.hp <= 0) break;
    const def = CARD_BY_ID[c.cards[id].definitionId];
    if (def.id === 'burn') hit(run, c.player, c.cards[id].upgraded ? 4 : 2, 'Burn');
    if (def.id === 'regret') loseCardHp(run, held.length, 'Regret');
  }
  // Ethereal exhaustion happens after end-turn hand triggers; exhaust draws join cleanup.
  for (const id of held) if (CARD_BY_ID[c.cards[id].definitionId].ethereal) exhaustCard(run, id);
  c.discard.push(...c.hand);
  c.hand = [];
  if (c.temporaryStrength) {
    applyStatus(c.player, 'strength', -c.temporaryStrength);
    c.temporaryStrength = 0;
  }
  if (c.player.hp > 0 && c.powers.combust) {
    loseCardHp(run, c.powers.combustHp, 'Combust');
    if (c.player.hp > 0)
      for (const enemy of aliveEnemies(run)) hit(run, enemy, c.powers.combust, 'Combust');
  }
  if (c.player.hp > 0) {
    if (run.relics.includes('orichalcum') && c.player.block === 0) gainBlock(run, 6);
    if (c.powers.metallicize) gainBlock(run, c.powers.metallicize);
    for (const enemy of aliveEnemies(run))
      if (enemy.powers.constrict) hit(run, c.player, enemy.powers.constrict, 'Constricted');
  }
  // Only enemies alive when their phase began get an action. Split children wait a turn.
  // Clear the entire enemy side before any ally can grant fresh Block.
  for (const enemy of aliveEnemies(run)) {
    if (enemy.definitionId !== 'sphericGuardian' && !enemy.powers.retainBlock) enemy.block = 0;
    enemy.powers.retainBlock = 0;
  }
  for (const enemy of [...c.enemies]) {
    if ((enemy.hp <= 0 && !enemy.powers.rebirthing) || c.player.hp <= 0) continue;
    if (enemy.status.poison > 0 && !enemy.powers.rebirthing) {
      hit(run, enemy, enemy.status.poison, 'Poison', true);
      enemy.status.poison = Math.max(0, enemy.status.poison - 1);
      if (enemy.hp <= 0 && !enemy.powers.rebirthing) continue;
    }
    if (enemy.powers.malleable) enemy.powers.malleable = 3;
    const intent = currentIntent(enemy, c);
    log(run, `${ENEMY_BY_ID[enemy.definitionId].name}: ${intent.name}.`);
    const usedIndex = ENEMY_BY_ID[enemy.definitionId].intents.findIndex(
      (i) => i.name === intent.name,
    );
    enemy.history.push(usedIndex);
    enemy.turn++;
    for (const effect of intent.effects) {
      if (c.player.hp <= 0 || (enemy.hp <= 0 && !enemy.powers.rebirthing)) break;
      if (effect.type === 'damage') enemyAttack(run, enemy, effect.amount, effect.hits ?? 1);
      if (effect.type === 'block')
        enemy.block += Math.max(0, effect.amount + enemy.status.dexterity);
      if (effect.type === 'status')
        applyStatus(
          effect.target === 'self' ? enemy : c.player,
          effect.status,
          effect.amount,
          true,
        );
      if (effect.type === 'generate')
        addGenerated(
          run,
          effect.card,
          effect.amount,
          effect.zone,
          effect.card === 'burn' && !!enemy.powers.upgradedBurns,
        );
      if (effect.type === 'special') enemySpecial(run, enemy, effect.action, effect.amount ?? 0);
    }
    if (enemy.powers.ritual) {
      if (enemy.powers.ritualFresh) enemy.powers.ritualFresh = 0;
      else applyStatus(enemy, 'strength', enemy.powers.ritual);
    }
    if (enemy.powers.metallicize) enemy.block += enemy.powers.metallicize;
    if (enemy.powers.regeneration && enemy.hp > 0)
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + enemy.powers.regeneration);
    if (enemy.powers.entangle) enemy.powers.entangle--;
    if (enemy.definitionId === 'nemesis') enemy.powers.intangible = enemy.turn % 2;
    if (enemy.definitionId === 'bookOfStabbing' && usedIndex === 0)
      enemy.powers.multiStabs = (enemy.powers.multiStabs ?? 0) + 1;
    if (enemy.definitionId === 'champ')
      enemy.powers.sinceExecute = usedIndex === 5 ? 0 : (enemy.powers.sinceExecute ?? 0) + 1;
    chooseNextIntent(run, enemy);
  }
  tickDurations(c.player);
  for (const enemy of c.enemies) tickDurations(enemy);
  if (c.player.hp > 0 && combatOngoing(run)) startPlayerTurn(run);
}
/** Planned damage, before Block. Uses the same damage formula and sequential buff ordering. */
export function intentText(enemy: Enemy, combat: Combat): string {
  if (enemy.hp <= 0 && !enemy.powers.rebirthing) return 'Defeated';
  const source = structuredClone(enemy),
    target = structuredClone(combat.player);
  for (const earlier of combat.enemies) {
    if (earlier.id === enemy.id) break;
    if (earlier.hp <= 0) continue;
    for (const effect of currentIntent(earlier, combat).effects) {
      if (effect.type === 'status' && effect.target !== 'self')
        applyStatus(target, effect.status, effect.amount);
      if (effect.type === 'special' && effect.action === 'allyStrength')
        source.status.strength += effect.amount ?? 0;
    }
  }
  const intent = currentIntent(enemy, combat);
  const parts = intent.effects.map((effect) => {
    if (effect.type === 'damage')
      return `${attackDamage(effect.amount, source, target)} damage${(effect.hits ?? 1) > 1 ? ` × ${effect.hits}` : ''}`;
    if (effect.type === 'block') return `${effect.amount} Block`;
    if (effect.type === 'status') {
      applyStatus(effect.target === 'self' ? source : target, effect.status, effect.amount);
      return `${effect.amount} ${effect.status}`;
    }
    if (effect.type === 'generate') return `${effect.amount} ${CARD_BY_ID[effect.card].name}`;
    if (effect.type === 'special')
      return (
        (
          {
            ritual: `Ritual ${effect.amount}`,
            enrage: `Enrage ${effect.amount}`,
            splitBoss: 'Split into two Slimes',
            splitAcid: 'Split into two Slimes',
            splitSpike: 'Split into two Slimes',
            allyBlock: `All allies: ${effect.amount} Block`,
            allyStrength: `All allies: +${effect.amount} Strength`,
            cleanse: 'Remove debuffs',
            hex: 'Hex',
            entangle: 'Entangle',
            constrict: `Constricted ${effect.amount}`,
            healAll: `Heal allies ${effect.amount}`,
            metallicize: `Metallicize ${effect.amount}`,
            thorns: `Thorns +${effect.amount}`,
            selfDestruct: 'Self-destruct',
            sharpHide: 'Retaliate per Attack card',
            offensiveMode: 'Return to offensive mode',
            upgradeBurns: 'Upgrade all Burns',
            spawnOrbs: 'Summon two Bronze Orbs',
            spawnTorches: 'Replenish Torch Heads',
            stasis: 'Steal a card',
            supportAutomaton: `Automaton: ${effect.amount} Block`,
            drawReduction: 'Draw one less next turn',
            haste: 'Heal to half HP and cleanse',
            rebirth: 'Revive with full HP',
          } as Record<string, string>
        )[effect.action] ?? effect.action
      );
    return effect.type;
  });
  return `${intent.name}${parts.length ? `: ${parts.join(' · ')}` : ' · no attack'}`;
}
