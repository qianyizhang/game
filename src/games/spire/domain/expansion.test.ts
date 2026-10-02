import { generateMap } from './map';
import { describe, expect, it } from 'vitest';
import { CARD_BY_ID } from '../content/cards';
import { BOSS_POOLS } from '../content/bosses';
import { spireSession } from '../application/session';
import { createSpire, transitionSpire } from './game';
import { startCombat, playCard, chooseCard, endTurn, intentText } from './combat';
import { currentIntent, enemySpecial, chooseNextIntent } from './enemies';
import { hit, combatOngoing } from './state';
import { cardRewards, openShop } from './rewards';
import type { Character } from './types';

function fight(cards: string[], enemy: string, character: Character = 'ironclad', ascension = 0) {
  const r = createSpire('EXPANSION', { character, ascension });
  r.relics = [];
  r.deck = cards.map((definitionId, i) => ({ id: `c${i}`, definitionId, upgraded: false }));
  startCombat(r, [enemy]);
  const c = r.combat!;
  c.hand = r.deck.map((x) => x.id);
  c.draw = [];
  c.energy = 20;
  return r;
}
describe('original boss mechanisms', () => {
  it('selects every boss from a seeded act pool, keeping the map reveal stable', () => {
    for (let act = 1; act <= 3; act++) {
      const seen = new Set<string>();
      for (let i = 0; i < 80; i++) {
        const r = createSpire(`BOSS-${i}`);
        r.act = act;
        // Generation is tested directly; choosing a room must use the already revealed encounter.
        const pool = BOSS_POOLS[act - 1];
        expect(pool).toHaveLength(3);
        r.map = generateMap(r);
        const encounter = r.map.at(-1)!.encounter.join(',');
        expect(pool.map((e) => e.join(','))).toContain(encounter);
        seen.add(encounter);
      }
      expect(seen.size).toBe(3);
    }
  });
  it('Guardian interrupts a dangerous move, keeps new Block and retaliates per card, not per hit', () => {
    const r = fight(['twinStrike'], 'guardian'),
      c = r.combat!,
      e = c.enemies[0];
    e.intentIndex = 1;
    hit(r, e, 30, 'Burst');
    expect(currentIntent(e, c).name).toBe('Defensive Mode');
    expect(e.block).toBe(20);
    endTurn(r);
    expect(e.block).toBe(20);
    expect(e.powers.sharpHide).toBe(3);
    c.hand = ['c0'];
    c.discard = [];
    c.energy = 3;
    const hp = r.hp;
    playCard(r, 'c0', e.id);
    expect(r.hp).toBe(hp - 3);
    endTurn(r);
    endTurn(r);
    expect(e.powers.modeShift).toBe(40);
    expect(e.powers.sharpHide).toBe(0);
  });
  it('Hexaghost locks Divider to HP when prepared and upgrades every Burn after Inferno', () => {
    const r = fight(['burn'], 'hexaghost'),
      c = r.combat!,
      e = c.enemies[0];
    endTurn(r);
    expect(intentText(e, c)).toContain('7 damage × 6');
    r.hp = c.player.hp = 12;
    expect(intentText(e, c)).toContain('7 damage × 6');
    enemySpecial(r, e, 'upgradeBurns', 0);
    expect(c.cards.c0.upgraded).toBe(true);
  });
  it('Bronze Orbs steal the rarest draw card, then return it without duplicating it', () => {
    const r = fight(['strike', 'demonForm'], 'bronzeAutomaton'),
      c = r.combat!,
      boss = c.enemies[0];
    c.hand = [];
    c.draw = ['c0', 'c1'];
    enemySpecial(r, boss, 'spawnOrbs', 0);
    const orb = c.enemies[1];
    enemySpecial(r, orb, 'stasis', 0);
    expect(orb.stasisCard).toBe('c1');
    expect(c.draw).toEqual(['c0']);
    hit(r, orb, 100, 'Kill');
    expect(c.hand).toEqual(['c1']);
    expect(orb.stasisCard).toBeUndefined();
  });
  it('Collector replenishes only missing Torch Heads and always debuffs on turn four', () => {
    const r = fight([], 'collector'),
      c = r.combat!,
      boss = c.enemies[0];
    enemySpecial(r, boss, 'spawnTorches', 0);
    enemySpecial(r, boss, 'spawnTorches', 0);
    expect(c.enemies).toHaveLength(3);
    c.enemies[1].hp = 0;
    enemySpecial(r, boss, 'spawnTorches', 0);
    expect(c.enemies.filter((e) => e.hp > 0)).toHaveLength(3);
    boss.turn = 3;
    chooseNextIntent(r, boss);
    expect(currentIntent(boss, c).name).toBe('Mega Debuff');
    hit(r, boss, 1000, 'Kill');
    expect(combatOngoing(r)).toBe(false);
  });
  it('Time Warp waits for the twelfth card’s pending discard before ending the turn', () => {
    let r = fight(['survivor', 'tactician'], 'timeEater', 'silent');
    r.combat!.enemies[0].powers.timeWarp = 11;
    r = transitionSpire(r, { type: 'playCard', id: 'c0' }).state;
    expect(r.combat!.choice?.action).toBe('discard');
    expect(r.combat!.turn).toBe(1);
    r = transitionSpire(r, { type: 'chooseCard', id: 'c1' }).state;
    expect(r.combat!.turn).toBe(2);
    expect(r.combat!.enemies[0].status.strength).toBe(2);
    expect(r.combat!.enemies[0].powers.timeWarp).toBe(0);
  });
  it('Time Eater prepares Haste only once, at intent selection below half HP', () => {
    const r = fight([], 'timeEater'),
      e = r.combat!.enemies[0];
    e.hp = 100;
    chooseNextIntent(r, e);
    expect(currentIntent(e, r.combat!).name).toBe('Haste');
    e.status.poison = 9;
    enemySpecial(r, e, 'haste', 0);
    expect(e.hp).toBe(228);
    expect(e.status.poison).toBe(0);
    e.hp = 100;
    chooseNextIntent(r, e);
    expect(currentIntent(e, r.combat!).name).not.toBe('Haste');
  });
  it('Awakened One survives its first defeat, drops Curiosity and keeps Strength through rebirth', () => {
    const r = fight(['inflame', 'demonForm'], 'awakenedOne'),
      c = r.combat!,
      e = c.enemies[0];
    playCard(r, 'c0');
    expect(e.status.strength).toBe(1);
    hit(r, e, 1000, 'First defeat');
    expect(combatOngoing(r)).toBe(true);
    expect(e.powers.rebirthing).toBe(1);
    playCard(r, 'c1');
    expect(c.powers.demonForm).toBe(2);
    expect(e.status.strength).toBe(1);
    endTurn(r);
    expect(e.hp).toBe(300);
    expect(currentIntent(e, c).name).toBe('Dark Echo');
    hit(r, e, 1000, 'Final defeat');
    expect(combatOngoing(r)).toBe(false);
  });
});
describe('Silent and cumulative difficulty', () => {
  it('replays character/difficulty setup and uses the Silent starter relic and isolated pool', () => {
    let s = spireSession.create('SILENT');
    s = spireSession.act(s, { type: 'configure', character: 'silent', ascension: 5 }).session;
    expect(s.state).toMatchObject({
      hp: 70,
      ascension: 5,
      character: 'silent',
      relics: ['ringOfTheSnake'],
    });
    expect(s.state.deck).toHaveLength(12);
    expect(spireSession.decode(spireSession.encode(s))).toEqual(s);
    startCombat(s.state, ['cultist']);
    expect(s.state.combat!.hand).toHaveLength(7);
    for (let i = 0; i < 20; i++) {
      for (const id of cardRewards(s.state)) expect(CARD_BY_ID[id].character).toBe('silent');
    }
  });
  it('Poison bypasses Block before an enemy acts, then loses one stack', () => {
    const r = fight(['deadlyPoison'], 'cultist', 'silent'),
      c = r.combat!,
      e = c.enemies[0];
    playCard(r, 'c0', e.id);
    e.block = 50;
    endTurn(r);
    expect(e.hp).toBe(45);
    expect(e.status.poison).toBe(4);
    e.hp = 4;
    const hp = r.hp;
    endTurn(r);
    expect(e.hp).toBe(0);
    expect(r.hp).toBe(hp);
  });
  it('Artifact blocks poison and Catalyst respects the debuff boundary', () => {
    const r = fight(['deadlyPoison', 'catalyst'], 'sentry', 'silent'),
      e = r.combat!.enemies[0];
    playCard(r, 'c0', e.id);
    expect(e.status.poison).toBe(0);
    e.status.poison = 4;
    r.combat!.cards.c1.upgraded = true;
    playCard(r, 'c1', e.id);
    expect(e.status.poison).toBe(12);
  });
  it('Shivs consume Accuracy per hit, while After Image triggers per card', () => {
    const r = fight(['accuracy', 'afterImage', 'shiv'], 'cultist', 'silent'),
      c = r.combat!,
      e = c.enemies[0];
    playCard(r, 'c0');
    playCard(r, 'c1');
    playCard(r, 'c2', e.id);
    expect(e.hp).toBe(42);
    expect(c.player.block).toBe(1);
    expect(c.exhaust).toContain('c2');
  });
  it('manual discard triggers Tactician; end-turn cleanup does not', () => {
    const r = fight(['survivor', 'tactician'], 'cultist', 'silent'),
      c = r.combat!;
    c.energy = 3;
    playCard(r, 'c0');
    chooseCard(r, 'c1');
    expect(c.energy).toBe(3);
    expect(c.discarded).toBe(1);
    endTurn(r);
    expect(c.energy).toBe(3);
    expect(c.discarded).toBe(0);
  });
  it('Blur preserves Block for exactly the stacked number of turns', () => {
    const r = fight(['blur'], 'cultist', 'silent'),
      c = r.combat!;
    playCard(r, 'c0');
    endTurn(r);
    expect(c.player.block).toBe(5);
    endTurn(r);
    expect(c.player.block).toBe(0);
  });
  it('shops offer two attacks, two skills and a power from the selected character', () => {
    const r = createSpire('SHOP', { character: 'silent' });
    openShop(r);
    const cards = r.shop.filter((o) => o.kind === 'card').map((o) => CARD_BY_ID[o.definitionId]);
    expect(cards.map((c) => c.kind)).toEqual(['attack', 'attack', 'skill', 'skill', 'power']);
    expect(cards.every((c) => c.character === 'silent')).toBe(true);
  });
  it('A4 strengthens bosses and A5 heals only 75% of missing HP between acts', () => {
    const r = fight([], 'bronzeAutomaton', 'ironclad', 4),
      e = r.combat!.enemies[0];
    e.intentIndex = 3;
    expect(intentText(e, r.combat!)).toContain('50 damage');
    r.ascension = 5;
    r.phase = 'bossRelic';
    r.hp = 40;
    r.combat = null;
    const next = transitionSpire(r, { type: 'bossRelic', id: null });
    expect(next.state.hp).toBe(70);
    expect(next.state.ascension).toBe(5);
    expect(
      transitionSpire(next.state, { type: 'configure', character: 'silent', ascension: 0 }).error,
    ).toBeTruthy();
  });
});

it('Calculated Gamble moves the original hand before discard hooks draw replacements', () => {
  const r = fight(
      ['calculatedGamble', 'reflex', 'tactician', 'defend', 'strike'],
      'cultist',
      'silent',
    ),
    c = r.combat!;
  r.resolution.frames = [];
  playCard(r, 'c0');
  const discard = r.resolution.frames.find((f) => f.detail === 'Discard Reflex.')!;
  expect(discard.snapshot.hand).toHaveLength(0);
  expect(discard.snapshot.discard).toBe(4);
  expect(c.energy).toBe(21);
  expect(c.discarded).toBe(4);
  expect(c.exhaust).toContain('c0');
  const zones = [...c.hand, ...c.draw, ...c.discard, ...c.exhaust];
  expect(new Set(zones).size).toBe(5);
  expect(zones).toHaveLength(5);
});
it('records damage arithmetic and immutable intermediate fighter snapshots', () => {
  const r = fight(['bash', 'strike'], 'cultist'),
    c = r.combat!,
    e = c.enemies[0],
    hp = e.hp;
  c.player.status.strength = 2;
  e.block = 3;
  r.resolution.frames = [];
  playCard(r, 'c0', e.id);
  const frame = r.resolution.frames.find((f) => f.kind === 'damage' && f.source === 'Bash')!;
  expect(frame.amount).toBe(7);
  expect(frame.before).toBe(hp);
  expect(frame.after).toBe(hp - 7);
  expect(frame.formula).toContain('3 blocked');
  e.hp = 1;
  expect(frame.snapshot.enemies[0].hp).toBe(hp - 7);
  const invalid = transitionSpire(r, { type: 'playCard', id: 'missing' });
  expect(invalid.state).toBe(r);
});
