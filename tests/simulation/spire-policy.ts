import { spireSession } from '../../src/games/spire/application/session';
import { CARD_BY_ID } from '../../src/games/spire/content/cards';
import { aliveEnemies, attackDamage, combatCardCost } from '../../src/games/spire/domain/combat';
import { currentIntent } from '../../src/games/spire/domain/enemies';
import { availableNodes, transitionSpire } from '../../src/games/spire/domain/game';
import { removalCost } from '../../src/games/spire/domain/rewards';
import type { SpireCommand, SpireState } from '../../src/games/spire/domain/types';
const priorities: Record<string, number> = {
  noxiousFumes: 35,
  footwork: 32,
  afterImage: 34,
  bladeDance: 26,
  accuracy: 25,
  backflip: 26,
  deadlyPoison: 25,
  catalyst: 28,
  adrenaline: 30,
  envenom: 27,
  cripplingCloud: 28,
  legSweep: 28,
  dash: 26,
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
const rank = (run: SpireState, id: string) =>
  (priorities[id] ?? 10) -
  run.deck.filter((c) => c.definitionId === id).length * (id === 'shrugItOff' ? 5 : 14);
function incoming(run: SpireState) {
  const c = run.combat!;
  return aliveEnemies(run).reduce(
    (sum, e) =>
      sum +
      currentIntent(e, c).effects.reduce(
        (n, f) =>
          n + (f.type === 'damage' ? attackDamage(f.amount, e, c.player) * (f.hits ?? 1) : 0),
        0,
      ),
    0,
  );
}
/** Legal-action development heuristic with one-command lookahead; not a fair-play benchmark. */
export function spirePolicy(run: SpireState): SpireCommand {
  if (run.phase === 'neow') return { type: 'neow', choice: 'maxHp' };
  if (run.phase === 'map') {
    const value = {
      fight: 4,
      elite: run.hp > run.maxHp * 0.9 && run.deck.length > 13 ? 5 : 0,
      event: 6,
      rest: 9,
      shop: run.gold > 140 ? 8 : 1,
      treasure: 12,
      boss: 12,
    };
    return {
      type: 'chooseNode',
      id: [...availableNodes(run)].sort((a, b) => value[b.kind] - value[a.kind])[0].id,
    };
  }
  if (run.phase === 'reward') {
    const id = [...run.reward].sort((a, b) => rank(run, b) - rank(run, a))[0];
    return {
      type: 'takeReward',
      card: rank(run, id) >= (run.deck.length < 17 ? 17 : 22) && run.deck.length < 25 ? id : null,
    };
  }
  if (run.phase === 'bossRelic') {
    const rank = [
      'cursedKey',
      'fusionHammer',
      'sozu',
      'coffeeDripper',
      'blackBlood',
      'bustedCrown',
    ];
    return {
      type: 'bossRelic',
      id: [...run.bossRelics].sort((a, b) => rank.indexOf(a) - rank.indexOf(b))[0] ?? null,
    };
  }
  if (run.phase === 'rest') {
    const card = [...run.deck]
      .filter((c) => !c.upgraded && !CARD_BY_ID[c.definitionId].token)
      .sort(
        (a, b) =>
          (priorities[b.definitionId] ?? (b.definitionId === 'bash' ? 23 : 0)) -
          (priorities[a.definitionId] ?? (a.definitionId === 'bash' ? 23 : 0)),
      )[0];
    if (run.hp < run.maxHp * 0.7 && !run.relics.includes('coffeeDripper'))
      return { type: 'rest', choice: 'heal' };
    if (card && !run.relics.includes('fusionHammer'))
      return { type: 'rest', choice: 'upgrade', card: card.id };
    return { type: 'rest', choice: run.relics.includes('coffeeDripper') ? 'leave' : 'heal' };
  }
  if (run.phase === 'treasure')
    return { type: 'takeTreasure', skip: run.relics.includes('cursedKey') };
  if (run.phase === 'event')
    return {
      type: 'event',
      choice:
        (
          {
            bigFish: run.hp < run.maxHp * 0.8 ? 'banana' : 'donut',
            cleric: run.hp < run.maxHp * 0.7 && run.gold >= 35 ? 'heal' : 'leave',
            shiningLight: run.hp > run.maxHp * 0.8 ? 'enter' : 'leave',
            goldenIdol: 'maxHp',
            goldenShrine: 'pray',
            ancientWriting: 'elegance',
            womanInBlue: 'leave',
            moaiHead: run.relics.includes('goldenIdol') ? 'idol' : 'jump',
          } as Record<string, string>
        )[run.event] ?? 'leave',
    };
  if (run.phase === 'shop') {
    const offer = run.shop
      .filter((o) => o.price <= run.gold)
      .map((o) => ({
        ...o,
        value:
          o.kind === 'card'
            ? rank(run, o.definitionId)
            : o.kind === 'relic'
              ? [
                  'vajra',
                  'oddlySmoothStone',
                  'anchor',
                  'bagOfPreparation',
                  'orichalcum',
                  'shuriken',
                  'kunai',
                  'meatOnTheBone',
                ].includes(o.definitionId)
                ? 28
                : 15
              : 0,
      }))
      .sort((a, b) => b.value - a.value)[0];
    if (offer && offer.value >= 22) return { type: 'buy', id: offer.id };
    const remove =
      run.deck.find((c) => CARD_BY_ID[c.definitionId].kind === 'curse') ??
      (run.deck.length > 12 ? run.deck.find((c) => c.definitionId === 'strike') : undefined);
    if (remove && !run.removalUsed && run.gold >= removalCost(run))
      return { type: 'removeCard', id: remove.id };
    return { type: 'leaveShop' };
  }
  if (run.phase !== 'combat') throw new Error(`No action for ${run.phase}`);
  const c = run.combat!,
    enemies = aliveEnemies(run),
    danger = incoming(run);
  if (c.choice) {
    const priority = (id: string) => {
      const card = c.cards[id],
        def = CARD_BY_ID[card.definitionId];
      return (priorities[card.definitionId] ?? (def.token ? -20 : 5)) + (card.upgraded ? 3 : 0);
    };
    return {
      type: 'chooseCard',
      id: [...c.choice.options].sort((a, b) =>
        ['exhaust', 'discard'].includes(c.choice!.action)
          ? priority(a) - priority(b)
          : priority(b) - priority(a),
      )[0],
    };
  }
  for (const [index, p] of run.potions.entries()) {
    const target = [...enemies].sort((a, b) => a.hp + a.block - b.hp - b.block)[0]?.id;
    if (['strength', 'dexterity'].includes(p)) return { type: 'potion', index };
    if (p === 'blood' && run.hp < run.maxHp * 0.7) return { type: 'potion', index };
    if (p === 'fire' && (enemies.some((e) => e.hp + e.block <= 20) || danger > c.player.block + 12))
      return { type: 'potion', index, target };
    if (p === 'explosive' && enemies.length > 1) return { type: 'potion', index };
    if (p === 'weak' && danger > 15)
      return { type: 'potion', index, target: [...enemies].sort((a, b) => b.hp - a.hp)[0].id };
    if (p === 'block' && danger - c.player.block >= 10) return { type: 'potion', index };
    if (p === 'energy' && c.energy === 0 && c.hand.some((id) => combatCardCost(run, id) > 0))
      return { type: 'potion', index };
  }
  let best: { command: SpireCommand; value: number } = { command: { type: 'endTurn' }, value: 0.1 };
  for (const id of c.hand) {
    const def = CARD_BY_ID[c.cards[id].definitionId],
      cost = combatCardCost(run, id);
    if (cost === -1 || cost > c.energy) continue;
    for (const target of def.target ? enemies.map((e) => e.id) : [undefined]) {
      const command: SpireCommand = { type: 'playCard', id, target };
      const result = transitionSpire(run, command);
      if (result.error || result.state.phase === 'lost') continue;
      if (['reward', 'won'].includes(result.state.phase)) return command;
      const after = result.state.combat!;
      const attackValue = c.enemies.reduce(
        (sum, e, i) =>
          sum +
          (e.hp - after.enemies[i].hp) * 0.85 +
          Math.max(0, e.block - after.enemies[i].block) * 0.75 +
          (after.enemies[i].hp === 0 && e.hp > 0 ? 18 : 0) +
          (after.enemies[i].status.poison - e.status.poison) * 3 +
          (after.enemies[i].status.weak - e.status.weak) * 3 +
          (e.status.strength - after.enemies[i].status.strength) * 5 +
          (after.enemies[i].status.vulnerable - e.status.vulnerable) * 3,
        0,
      );
      const powerValue = Object.entries(after.powers).reduce(
        (sum, [key, v]) =>
          sum +
          (v - c.powers[key as keyof typeof c.powers]) *
            ({
              noxiousFumes: 18,
              afterImage: 12,
              infiniteBlades: 10,
              accuracy: 8,
              envenom: 10,
              thousandCuts: 8,
              demonForm: 25,
              metallicize: 12,
              feelNoPain: 7,
              darkEmbrace: 8,
              corruption: 8,
              rupture: 5,
              barricade: 8,
              combust: 4,
              fireBreathing: 4,
            }[key] ?? 0),
        0,
      );
      const value =
        attackValue +
        (result.state.hp - run.hp) * 2 +
        Math.max(0, Math.min(danger - c.player.block, after.player.block - c.player.block)) * 1.5 +
        (after.player.status.strength - c.player.status.strength) * 7 +
        (after.player.status.dexterity - c.player.status.dexterity) * 8 +
        powerValue +
        Math.max(0, after.energy - c.energy) * 5 +
        Math.max(0, after.hand.length - c.hand.length + 1) * 4 +
        (after.choice ? 6 : 0) +
        (after.rage - c.rage) * 2 +
        (after.flameBarrier - c.flameBarrier) * (danger > 0 ? 2 : 0) -
        Math.max(cost, 0) * 1.3;
      if (value > best.value) best = { command, value };
    }
  }
  return best.command;
}
export function simulateSpire(
  seed: string,
  character: SpireState['character'] = 'ironclad',
  ascension = 0,
) {
  let session = spireSession.create(seed);
  if (character !== 'ironclad' || ascension)
    session = spireSession.act(session, { type: 'configure', character, ascension }).session;
  for (let step = 0; step < 3000; step++) {
    if (['won', 'lost'].includes(session.state.phase)) return session;
    const r = spireSession.act(session, spirePolicy(session.state));
    if (r.error) throw new Error(`${seed} ${session.state.phase}: ${r.error}`);
    session = r.session;
    const c = session.state.combat;
    if (c) {
      const zones = [
        ...c.hand,
        ...c.draw,
        ...c.discard,
        ...c.exhaust,
        ...c.powersPlayed,
        ...(c.resolving ? [c.resolving] : []),
        ...c.enemies.flatMap((e) => (e.stasisCard ? [e.stasisCard] : [])),
      ];
      if (
        new Set(zones).size !== zones.length ||
        zones.length !== Object.keys(c.cards).length ||
        zones.some((id) => !c.cards[id])
      )
        throw new Error(`${seed}: card zone conservation failed at ${step}`);
      if (c.energy < 0 || c.hand.length > 10 || c.player.hp !== session.state.hp)
        throw new Error(`${seed}: invalid combat resources at ${step}`);
    }
  }
  throw new Error(`${seed} did not terminate`);
}
