import { describe, expect, it } from 'vitest';
import { CARDS } from '../content/cards';
import { RELICS } from '../content/world';
import { isSpireCommand, spireSession } from '../application/session';
import {
  attackDamage,
  chooseCard,
  combatCardCost,
  drawCards,
  endTurn,
  intentText,
  playCard,
  startCombat,
} from './combat';
import { currentIntent } from './enemies';
import { availableNodes, createSpire, transitionSpire } from './game';
import { applyStatus } from './state';
import { grantRelic, openShop, removalCost } from './rewards';
import type { SpireCommand, SpireState } from './types';
const apply = (run: SpireState, command: SpireCommand) => {
  const result = transitionSpire(run, command);
  expect(result.error).toBeUndefined();
  return result.state;
};
function fight(cards = ['strike', 'defend', 'bash'], enemy = 'cultist') {
  const run = createSpire('RULES');
  run.relics = [];
  run.deck = cards.map((definitionId, i) => ({ id: `c${i}`, definitionId, upgraded: false }));
  startCombat(run, [enemy]);
  run.combat!.hand = cards.slice(0, 10).map((_, i) => `c${i}`);
  run.combat!.draw = cards.slice(10).map((_, i) => `c${i + 10}`);
  return run;
}
const play = (r: SpireState, id: string, target = r.combat!.enemies[0].id) => {
  expect(playCard(r, id, target)).toBeUndefined();
};
describe('Ironclad combat timing', () => {
  it('starts with the original Ironclad deck and resources', () => {
    const r = createSpire('IRON');
    expect(r).toMatchObject({
      hp: 80,
      maxHp: 80,
      gold: 99,
      phase: 'neow',
      relics: ['burningBlood'],
      potions: [],
    });
    expect(r.deck.map((c) => c.definitionId).sort()).toEqual([
      'bash',
      ...Array(4).fill('defend'),
      ...Array(5).fill('strike'),
    ]);
    expect(CARDS.filter((c) => !c.token)).toHaveLength(57);
    expect(RELICS).toHaveLength(32);
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length);
  });
  it('adds Strength per hit, then multiplies and floors before Block', () => {
    const r = fight(['twinStrike']);
    const c = r.combat!,
      e = c.enemies[0];
    c.player.status.strength = 2;
    c.player.status.weak = 1;
    e.status.vulnerable = 1;
    e.block = 5;
    expect(attackDamage(5, c.player, e)).toBe(7);
    play(r, 'c0');
    expect(e.hp).toBe(e.maxHp - 9);
  });
  it('Body Slam includes Strength and consumes no Block', () => {
    const r = fight(['bodySlam']);
    r.combat!.player.block = 12;
    r.combat!.player.status.strength = 3;
    play(r, 'c0');
    expect(r.combat!.enemies[0].hp).toBe(35);
    expect(r.combat!.player.block).toBe(12);
  });
  it('draw cannot recycle the resolving card', () => {
    const r = fight(['pommelStrike', 'strike']);
    const c = r.combat!;
    c.hand = ['c0'];
    c.discard = ['c1'];
    play(r, 'c0');
    expect(c.hand).toEqual(['c1']);
    expect(c.discard).toEqual(['c0']);
  });
  it('upgraded True Grit waits for a selection and resumes atomically', () => {
    let r = fight(['trueGrit', 'strike', 'defend']);
    r.combat!.cards.c0.upgraded = true;
    r = apply(r, { type: 'playCard', id: 'c0' });
    expect(r.combat!.player.block).toBe(9);
    expect(r.combat!.choice?.options).toEqual(['c1', 'c2']);
    expect(transitionSpire(r, { type: 'endTurn' }).state).toBe(r);
    r = apply(r, { type: 'chooseCard', id: 'c2' });
    expect(r.combat!.exhaust).toEqual(['c2']);
    expect(r.combat!.discard).toEqual(['c0']);
    expect(r.combat!.resolving).toBeNull();
  });
  it('Corruption makes skills free and exhausts them after effects, with Exhaust hooks', () => {
    const r = fight(['corruption', 'feelNoPain', 'darkEmbrace', 'sentinel', 'strike']);
    const c = r.combat!;
    c.energy = 9;
    play(r, 'c0');
    play(r, 'c1');
    play(r, 'c2');
    expect(c.exhaust).toEqual([]);
    c.hand = ['c3'];
    c.draw = ['c4'];
    expect(combatCardCost(r, 'c3')).toBe(0);
    const energy = c.energy;
    play(r, 'c3');
    expect(c.player.block).toBe(8);
    expect(c.energy).toBe(energy + 2);
    expect(c.hand).toEqual(['c4']);
    expect(c.exhaust).toEqual(['c3']);
    expect(c.powersPlayed).toHaveLength(3);
  });
  it('Burning Pact exhaust selection precedes draw, and Battle Trance prevents later draw', () => {
    const r = fight(['burningPact', 'wound', 'battleTrance', 'strike', 'defend', 'bash']);
    const c = r.combat!;
    c.hand = ['c0', 'c1', 'c2'];
    c.draw = ['c3', 'c4', 'c5'];
    play(r, 'c0');
    expect(c.hand).toEqual(['c1', 'c2']);
    chooseCard(r, 'c1');
    expect(c.hand).toEqual(['c2', 'c3', 'c4']);
    play(r, 'c2');
    expect(c.noDraw).toBe(true);
    const before = [...c.hand];
    drawCards(r, 3);
    expect(c.hand).toEqual(before);
  });
  it('Fiend Fire exhausts the initial hand and attacks once per exhausted card', () => {
    const r = fight(['fiendFire', 'strike', 'wound']);
    play(r, 'c0');
    expect(r.combat!.enemies[0].hp).toBe(36);
    expect(r.combat!.exhaust.sort()).toEqual(['c0', 'c1', 'c2']);
  });
  it('Whirlwind spends all energy and repeats against every enemy', () => {
    const r = fight(['whirlwind']);
    startCombat(r, ['cultist', 'cultist']);
    const c = r.combat!;
    c.player.status.strength = 2;
    play(r, 'c0');
    expect(c.energy).toBe(0);
    expect(c.enemies.map((e) => e.hp)).toEqual([29, 29]);
  });
  it('Clash rejects a mixed hand; Flex and Rage expire after their turn', () => {
    const r = fight(['clash', 'flex', 'rage']);
    const c = r.combat!;
    expect(playCard(r, 'c0', c.enemies[0].id)).toContain('only Attacks');
    play(r, 'c1');
    play(r, 'c2');
    play(r, 'c0');
    expect(c.player.block).toBe(3);
    expect(c.player.status.strength).toBe(2);
    endTurn(r);
    expect(c.player.status.strength).toBe(0);
    expect(c.rage).toBe(0);
  });
  it('Artifact blocks the Flex strength loss and negative Strength debuffs', () => {
    const r = fight(['flex']);
    applyStatus(r.combat!.player, 'artifact', 1);
    play(r, 'c0');
    endTurn(r);
    expect(r.combat!.player.status.strength).toBe(2);
    expect(r.combat!.player.status.artifact).toBe(0);
  });
  it('Feed and Reaper resolve their benefits on the killing blow', () => {
    let r = fight(['feed']);
    r.combat!.enemies[0].hp = 5;
    r = apply(r, { type: 'playCard', id: 'c0', target: r.combat!.enemies[0].id });
    expect(r.phase).toBe('reward');
    expect(r.maxHp).toBe(83);
    r = fight(['reaper']);
    r.hp = 30;
    r.combat!.player.hp = 30;
    r.combat!.enemies[0].hp = 2;
    r = apply(r, { type: 'playCard', id: 'c0' });
    expect(r.hp).toBe(32);
  });
  it('HP costs ignore Block and stop later effects on death', () => {
    let r = fight(['offering']);
    r.hp = 6;
    r.combat!.player.hp = 6;
    r.combat!.player.block = 99;
    r = apply(r, { type: 'playCard', id: 'c0' });
    expect(r.phase).toBe('lost');
    expect(r.combat!.energy).toBe(3);
  });
  it('potions respect Block and Artifact, without consuming energy', () => {
    let r = fight();
    r.potions = ['fire', 'weak'];
    r.combat!.enemies[0].block = 12;
    const id = r.combat!.enemies[0].id;
    r = apply(r, { type: 'potion', index: 0, target: id });
    expect(r.combat!.enemies[0].hp).toBe(42);
    r.combat!.enemies[0].status.artifact = 1;
    r = apply(r, { type: 'potion', index: 0, target: id });
    expect(r.combat!.enemies[0].status.weak).toBe(0);
    expect(r.combat!.energy).toBe(3);
  });
  it('retains Block only with Barricade and grows Demon Form next turn', () => {
    const r = fight(['barricade', 'demonForm']);
    r.combat!.energy = 6;
    play(r, 'c0');
    play(r, 'c1');
    r.combat!.player.block = 20;
    endTurn(r);
    expect(r.combat!.player.block).toBe(20);
    expect(r.combat!.player.status.strength).toBe(2);
  });
  it('hand limit is 10 and temporary Anger copies never enter the permanent deck', () => {
    const r = fight(Array(15).fill('anger'));
    drawCards(r, 20);
    expect(r.combat!.hand).toHaveLength(10);
    const before = structuredClone(r.deck);
    play(r, 'c0');
    expect(Object.keys(r.combat!.cards)).toHaveLength(16);
    expect(r.deck).toEqual(before);
  });
});
describe('Enemy counterplay', () => {
  it('Gremlin Nob gains Strength from Skills only after Bellow', () => {
    const r = fight(['defend', 'defend'], 'gremlinNob');
    play(r, 'c0');
    expect(r.combat!.enemies[0].status.strength).toBe(0);
    endTurn(r);
    play(r, 'c1');
    expect(r.combat!.enemies[0].status.strength).toBe(2);
  });
  it('Lagavulin only wakes on HP damage, then spends that enemy turn stunned', () => {
    const r = fight(['bash', 'strike'], 'lagavulin');
    const c = r.combat!,
      e = c.enemies[0];
    play(r, 'c0');
    expect(e.powers.asleep).toBe(1);
    play(r, 'c1');
    expect(currentIntent(e, c).name).toBe('Stunned');
    const hp = r.hp;
    endTurn(r);
    expect(r.hp).toBe(hp);
    expect(currentIntent(e, c).name).toBe('Attack');
    endTurn(r);
    expect(r.hp).toBe(hp - 18);
  });
  it('Slime Boss interrupts Slam at half HP and splits into children with remaining HP', () => {
    const r = fight(['strike'], 'slimeBoss');
    const c = r.combat!,
      e = c.enemies[0];
    e.intentIndex = 2;
    e.hp = 70;
    expect(intentText(e, c)).toContain('Split');
    endTurn(r);
    expect(e.hp).toBe(0);
    expect(c.enemies.slice(1).map((e) => e.hp)).toEqual([70, 70]);
    expect(r.hp).toBe(80);
  });
  it('The Champ cleanses and gains Strength before Execute', () => {
    const r = fight(['strike'], 'champ');
    const c = r.combat!,
      e = c.enemies[0];
    e.hp = 210;
    e.status.weak = 3;
    e.status.strength = -2;
    endTurn(r);
    expect(e.status.weak).toBe(0);
    expect(e.status.strength).toBe(6);
    expect(intentText(e, c)).toContain('16 damage × 2');
  });
  it('Donu buffs before Deca attacks, and forecast does not mutate state', () => {
    const r = fight();
    startCombat(r, ['donu', 'deca']);
    const c = r.combat!,
      before = structuredClone(c);
    expect(intentText(c.enemies[1], c)).toContain('13 damage × 2');
    expect(c).toEqual(before);
    endTurn(r);
    expect(r.hp).toBe(54);
  });
  it('enemy-applied Vulnerable lasts through the next player turn and enemy attack', () => {
    const r = fight(['defend'], 'gremlinNob');
    const c = r.combat!,
      e = c.enemies[0];
    e.intentIndex = 2;
    endTurn(r);
    expect(c.player.status.vulnerable).toBe(2);
    e.intentIndex = 1;
    const hp = r.hp;
    expect(intentText(e, c)).toContain('21 damage');
    endTurn(r);
    expect(hp - r.hp).toBe(21);
    expect(c.player.status.vulnerable).toBe(1);
  });
  it('Flame Barrier retaliates once per hit even when fully blocked', () => {
    const r = fight(['flameBarrier'], 'bookOfStabbing');
    const c = r.combat!,
      e = c.enemies[0];
    play(r, 'c0');
    const hp = e.hp;
    endTurn(r);
    expect(e.hp).toBe(hp - 8);
    expect(r.hp).toBe(80);
  });
});
describe('Run lifecycle and replay', () => {
  it('creates connected 15-room maps, with guaranteed chest and final campfire', () => {
    for (let i = 0; i < 100; i++) {
      let r = apply(createSpire(`MAP-${i}`), { type: 'neow', choice: 'maxHp' });
      expect(r.map.filter((n) => n.row === 8).every((n) => n.kind === 'treasure')).toBe(true);
      expect(r.map.filter((n) => n.row === 14).every((n) => n.kind === 'rest')).toBe(true);
      for (let row = 0; row < 16; row++) {
        const options = availableNodes(r);
        expect(options.length).toBeGreaterThan(0);
        const n = options[0];
        expect(n.row).toBe(row);
        r.currentNode = n.id;
        r.row = row;
      }
    }
  });
  it('invalid actions leave the identical state and RNG untouched', () => {
    const r = createSpire('INVALID');
    expect(transitionSpire(r, { type: 'chooseNode', id: 'bogus' }).state).toBe(r);
    const c = apply(r, { type: 'neow', choice: 'gold' });
    expect(transitionSpire(c, { type: 'neow', choice: 'gold' }).state).toBe(c);
  });
  it('boss rewards offer rare cards, then relics, then heal fully into the next act', () => {
    let r = fight(['strike'], 'slimeBoss');
    r.currentNode = r.map.find((n) => n.kind === 'boss')!.id;
    r.combat!.enemies[0].hp = 1;
    r.hp = 20;
    r.combat!.player.hp = 20;
    r = apply(r, { type: 'playCard', id: 'c0', target: r.combat!.enemies[0].id });
    expect(r.reward.every((id) => CARDS.find((c) => c.id === id)!.rarity === 'rare')).toBe(true);
    r = apply(r, { type: 'takeReward', card: null });
    expect(r.phase).toBe('bossRelic');
    expect(r.bossRelics).toHaveLength(3);
    r = apply(r, { type: 'bossRelic', id: r.bossRelics[0] });
    expect(r).toMatchObject({ act: 2, phase: 'map', hp: r.maxHp, row: -1, combat: null });
  });
  it('the final boss ends the run and terminal commands are rejected', () => {
    let r = fight(['strike'], 'donu');
    r.act = 3;
    r.currentNode = r.map.find((n) => n.kind === 'boss')!.id;
    r.combat!.enemies[0].hp = 1;
    r = apply(r, { type: 'playCard', id: 'c0', target: r.combat!.enemies[0].id });
    expect(r.phase).toBe('won');
    expect(transitionSpire(r, { type: 'endTurn' }).state).toBe(r);
  });
  it('removal escalates across visits and boss energy relics impose their costs', () => {
    let r = createSpire('SHOP');
    r.phase = 'shop';
    r.gold = 500;
    openShop(r);
    expect(removalCost(r)).toBe(75);
    r = apply(r, { type: 'removeCard', id: r.deck[0].id });
    expect(r.gold).toBe(425);
    expect(removalCost(r)).toBe(100);
    expect(transitionSpire(r, { type: 'removeCard', id: r.deck[0].id }).error).toBeTruthy();
    grantRelic(r, 'coffeeDripper');
    r.phase = 'rest';
    expect(transitionSpire(r, { type: 'rest', choice: 'heal' }).error).toBeTruthy();
    startCombat(r, ['cultist']);
    expect(r.combat!.energy).toBe(4);
  });
  it('events use A0 costs and upgrade real cards', () => {
    let r = createSpire('LIGHT');
    r.phase = 'event';
    r.event = 'shiningLight';
    r = apply(r, { type: 'event', choice: 'enter' });
    expect(r.hp).toBe(64);
    expect(r.deck.filter((c) => c.upgraded)).toHaveLength(2);
    r.phase = 'event';
    r.event = 'ancientWriting';
    r = apply(r, { type: 'event', choice: 'elegance' });
    expect(
      r.deck.filter((c) => ['strike', 'defend'].includes(c.definitionId)).every((c) => c.upgraded),
    ).toBe(true);
  });
  it('validates commands and replay version without trusting injected state', () => {
    expect(isSpireCommand({ type: 'chooseCard', id: 'c1' })).toBe(true);
    expect(isSpireCommand({ type: 'takeTreasure', skip: 'yes' })).toBe(false);
    expect(isSpireCommand({ type: 'neow', choice: 'cheat' })).toBe(false);
    let s = spireSession.create('SAVE');
    s = spireSession.act(s, { type: 'neow', choice: 'lament' }).session;
    s = spireSession.act(s, { type: 'chooseNode', id: availableNodes(s.state)[0].id }).session;
    expect(spireSession.decode(spireSession.encode(s))).toEqual(s);
    const old = JSON.parse(spireSession.encode(s));
    old.game = 'emberpath';
    old.version = 1;
    expect(() => spireSession.decode(JSON.stringify(old))).toThrow();
  });
});
