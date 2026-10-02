import { describe, it, expect } from 'vitest';
import { createBG, transitionBG, supplyTotal } from './game';
import { botDecision, unitValue } from './bots';
import { makeUnit } from './units';
import { MINIONS, RECRUITS } from '../content/minions';
import { POOL_COPIES } from './recruitment';

describe('scouting and composition decisions', () => {
  it('fixes visible pairings before recruitment and snapshots only finished rounds', () => {
    let r = transitionBG(createBG('SCOUT'), { type: 'chooseHero', hero: 'forgekeeper' }).state;
    const i = r.pairings.indexOf(0),
      opponent = r.pairings[i % 2 ? i - 1 : i + 1];
    expect(r.scouting).toEqual([]);
    r = transitionBG(r, { type: 'endRecruit' }).state;
    expect(r.opponent).toBe(opponent);
    const seen = structuredClone(r.scouting);
    r = transitionBG(r, { type: 'nextRound' }).state;
    expect(r.scouting).toEqual(seen);
    r.players[opponent].board[0].attack += 99;
    expect(r.scouting).toEqual(seen);
    for (const definition of RECRUITS)
      expect(supplyTotal(r, definition.id)).toBe(POOL_COPIES[definition.tier]);
  });
  it('buys a triple before upgrading and freezes an unaffordable triple', () => {
    const r = createBG('BOT'),
      p = r.players[1];
    r.round = 6;
    p.tier = 2;
    p.gold = 6;
    p.upgradeCost = 5;
    p.board = [makeUnit('stray', 'a'), makeUnit('stray', 'b')];
    p.shop = [makeUnit('stray', 'offer')];
    expect(botDecision(r, p, 0)).toEqual({ type: 'buy', id: 'offer' });
    p.gold = 0;
    expect(botDecision(r, p, 0)).toEqual({ type: 'freeze' });
    p.frozen = true;
    expect(botDecision(r, p, 0)).toBeNull();
  });
  it('values supported tribes and preserves cash when another refresh cannot buy anything', () => {
    const r = createBG('SUPPORT'),
      p = r.players[1];
    const support = MINIONS.find((m) => m.summonBuff?.tribe === 'beast')!;
    const stray = makeUnit('stray', 'test');
    const base = unitValue(stray, p);
    p.board = [makeUnit(support.id, 'support')];
    expect(unitValue(stray, p)).toBeGreaterThan(base);
    p.gold = 1;
    p.powerUsed = true;
    p.shop = [];
    expect(botDecision(r, p, 0)).toBeNull();
  });
});
