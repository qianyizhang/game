import { describe, expect, it } from 'vitest';
import { bgSession } from '../application/session';
import { RECRUITS } from '../content/minions';
import { createBG, supplyTotal, transitionBG } from './game';
import { bgId, POOL_COPIES, recruitAction, returnUnits } from './recruitment';
import { buff, makeUnit } from './units';
import type { BGCommand, BGState, Unit } from './types';

const act = (run: BGState, command: BGCommand) => {
  const result = transitionBG(run, command);
  expect(result.error).toBeUndefined();
  return result.state;
};
const checkSupply = (run: BGState) => {
  for (const m of RECRUITS) {
    expect(run.pool[m.id]).toBeGreaterThanOrEqual(0);
    expect(supplyTotal(run, m.id), m.id).toBe(POOL_COPIES[m.tier]);
  }
};
function recruit(): BGState {
  return act(createBG('RECRUIT'), { type: 'chooseHero', hero: 'forgekeeper' });
}
function reserve(run: BGState, definitionId: string): Unit {
  run.pool[definitionId]--;
  return makeUnit(definitionId, bgId(run));
}

describe('Battlegrounds economy and ownership', () => {
  it('has eight recruits at each tier and an eight-player shared supply', () => {
    expect(RECRUITS).toHaveLength(48);
    for (let i = 1; i <= 6; i++) expect(RECRUITS.filter((m) => m.tier === i)).toHaveLength(8);
    const run = recruit();
    expect(run.players).toHaveLength(8);
    expect(run.players[0].gold).toBe(3);
    checkSupply(run);
  });
  it('purchase, deployment, sale and refresh conserve supply and charge exactly once', () => {
    let run = recruit();
    const id = run.players[0].shop[0].id;
    run = act(run, { type: 'buy', id });
    expect(run.players[0].gold).toBe(0);
    checkSupply(run);
    expect(transitionBG(run, { type: 'buy', id }).state).toBe(run);
    const unit = run.players[0].hand[0];
    run = act(run, { type: 'play', id: unit.id, position: 0 });
    checkSupply(run);
    run = act(run, { type: 'sell', id: unit.id });
    expect(run.players[0].gold).toBe(1);
    checkSupply(run);
    run = act(run, { type: 'refresh' });
    expect(run.players[0].gold).toBe(0);
    checkSupply(run);
  });
  it('triples preserve buffs and three-copy ownership; Discover returns unchosen reserves', () => {
    const run = recruit();
    const player = run.players[0];
    returnUnits(run, player.shop);
    player.shop = [];
    const a = reserve(run, 'imp');
    const b = reserve(run, 'imp');
    const c = reserve(run, 'imp');
    buff(a, 2, 3);
    buff(b, 1, 2);
    player.board = [a, b];
    player.shop = [c];
    expect(recruitAction(run, player, { type: 'buy', id: c.id })).toBeUndefined();
    expect(player.board).toHaveLength(0);
    expect(player.hand).toHaveLength(1);
    const gold = player.hand[0];
    expect(gold.golden).toBe(true);
    expect(gold.attack).toBe(9);
    expect(gold.health).toBe(11);
    expect(gold.copies).toBe(3);
    checkSupply(run);
    expect(recruitAction(run, player, { type: 'play', id: gold.id, position: 0 })).toBeUndefined();
    expect(player.discover).toHaveLength(3);
    checkSupply(run);
    expect(recruitAction(run, player, { type: 'refresh' })).toContain('Discover');
    expect(
      recruitAction(run, player, { type: 'discover', id: player.discover[0].id }),
    ).toBeUndefined();
    expect(player.discover).toHaveLength(0);
    checkSupply(run);
  });
  it('freezing holds exact offers while round gold resets and upgrade cost falls', () => {
    let run = recruit();
    const offers = structuredClone(run.players[0].shop);
    run = act(run, { type: 'freeze' });
    run = act(run, { type: 'endRecruit' });
    expect(run.phase).toBe('combat');
    run = act(run, { type: 'nextRound' });
    expect(run.players[0].shop).toEqual(offers);
    expect(run.players[0].frozen).toBe(false);
    expect(run.players[0].gold).toBe(4);
    expect(run.players[0].upgradeCost).toBe(4);
    checkSupply(run);
    run = act(run, { type: 'upgrade' });
    expect(run.players[0].tier).toBe(2);
    expect(run.players[0].gold).toBe(0);
  });
  it('fills missing frozen offers next round and refreshing clears the freeze', () => {
    let run = recruit();
    run = act(run, { type: 'buy', id: run.players[0].shop[0].id });
    const kept = structuredClone(run.players[0].shop);
    run = act(run, { type: 'freeze' });
    run = act(run, { type: 'endRecruit' });
    run = act(run, { type: 'nextRound' });
    expect(run.players[0].shop).toHaveLength(3);
    expect(run.players[0].shop.slice(0, 2)).toEqual(kept);
    run = act(run, { type: 'freeze' });
    run = act(run, { type: 'refresh' });
    expect(run.players[0].frozen).toBe(false);
    expect(run.players[0].shop.every((u) => !kept.some((k) => k.id === u.id))).toBe(true);
    checkSupply(run);
  });
  it('Battlecry targets and the hero power are legal once and permanent', () => {
    let run = recruit();
    const player = run.players[0];
    const a = reserve(run, 'imp');
    const b = reserve(run, 'banner');
    player.board = [a];
    player.hand = [b];
    expect(transitionBG(run, { type: 'play', id: b.id, position: 1 }).error).toContain('target');
    run = act(run, { type: 'play', id: b.id, position: 1, target: a.id });
    expect(run.players[0].board[0].attack).toBe(5);
    run = act(run, { type: 'power', target: a.id });
    expect(run.players[0].board[0].attack).toBe(6);
    expect(transitionBG(run, { type: 'power', target: a.id }).error).toContain('already');
    checkSupply(run);
  });
  it('combat cannot alter permanent warband stats and each round keeps accounting balanced', () => {
    let run = recruit();
    const unit = run.players[0].shop[0];
    run = act(run, { type: 'buy', id: unit.id });
    run = act(run, { type: 'play', id: run.players[0].hand[0].id, position: 0 });
    const board = structuredClone(run.players[0].board);
    run = act(run, { type: 'endRecruit' });
    expect(run.players[0].board).toEqual(board);
    expect(run.lastCombat?.frames.length).toBeGreaterThan(0);
    checkSupply(run);
  });
  it('empty warbands eventually lose without blocking the lobby and eliminated copies return', () => {
    let run = recruit();
    for (let rounds = 0; rounds < 30 && !['lost', 'won'].includes(run.phase); rounds++) {
      run = act(run, { type: 'endRecruit' });
      checkSupply(run);
      if (run.phase === 'combat') run = act(run, { type: 'nextRound' });
    }
    expect(run.phase).toBe('lost');
    expect(run.players[0].placement).toBeGreaterThan(1);
    checkSupply(run);
  });
  it('replays identical lobbies and rejects incompatible or illegal commands', () => {
    let session = bgSession.create('SAVED');
    session = bgSession.act(session, { type: 'chooseHero', hero: 'quartermaster' }).session;
    session = bgSession.act(session, { type: 'endRecruit' }).session;
    expect(bgSession.decode(bgSession.encode(session))).toEqual(session);
    expect(() =>
      bgSession.decode(
        JSON.stringify({ ...session.replay, commands: [{ type: 'chooseHero', hero: 'missing' }] }),
      ),
    ).toThrow();
    expect(() =>
      bgSession.decode(
        JSON.stringify({ ...session.replay, commands: [{ type: 'buy', id: 'missing' }] }),
      ),
    ).toThrow();
  });
});
