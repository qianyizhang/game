import { describe, expect, it } from 'vitest';
import { replayCodec } from '../../../shared/replay';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { TAVERN_SPELLS } from '../content/spells';
import { RECRUITS } from '../content/minions';
import { bgSession, bgSessionV5 } from '../application/session';
import { arenaFrame, arenaSession, arenaSessionV1 } from '../application/arena';
import { advanceRivals } from '../application/arena-controller';
import { activeSeat, mixedRivalsConfig } from './arena';
import { createBG, transitionBG, supplyTotal } from './game';
import { makeUnit } from './units';
import { handSize, recruitPrice } from './spells';
import { refreshShop, POOL_COPIES, returnUnits } from './recruitment';
import { hearthFrame, actHearthAgent, hearthCatalogue } from '../application/agent';
import type { BGState, BGCommand } from './types';

function recruit() {
  return transitionBG(createBG('SPELL-RULES'), { type: 'chooseHero', hero: 'archivist' }).state;
}
function hold(run: BGState, definitionId: string, id = definitionId) {
  run.players[0].tavern!.hand.push({ id, definitionId });
  return id;
}
function friendly(run: BGState, definitionId = 'wolf', id = 'ally') {
  run.pool[definitionId]--;
  const unit = makeUnit(definitionId, id);
  run.players[0].board.push(unit);
  return unit;
}
function act(run: BGState, command: BGCommand) {
  const result = transitionBG(run, command);
  expect(result.error).toBeUndefined();
  return result.state;
}
function supply(run: BGState) {
  for (const d of RECRUITS) expect(supplyTotal(run, d.id), d.id).toBe(POOL_COPIES[d.tier]);
}

describe('tavern spell economy and timing', () => {
  it('buys exactly one seeded offer without minion reservations or mutation of prior state', () => {
    const run = recruit(),
      before = structuredClone(run),
      p = run.players[0];
    const offer = p.tavern!.offer!,
      d = TAVERN_SPELLS.find((s) => s.id === offer.definitionId)!;
    const bought = act(run, { type: 'buySpell', id: offer.id });
    expect(bought.players[0].gold).toBe(p.gold - d.cost);
    expect(bought.players[0].tavern!.hand).toEqual([offer]);
    expect(bought.players[0].tavern!.offer).toBeNull();
    expect(bought.pool).toEqual(run.pool);
    expect(run).toEqual(before);
    expect(transitionBG(bought, { type: 'buySpell', id: offer.id }).state).toBe(bought);
    expect(recruit()).toEqual(run);
    supply(bought);
  });
  it('uses the ten-slot cap for purchases, Discover and Recall together', () => {
    const run = recruit(),
      p = run.players[0];
    friendly(run);
    for (let i = 0; i < 10; i++) hold(run, 'pocket-change', `held-${i}`);
    expect(handSize(p)).toBe(10);
    for (const command of [
      { type: 'buy', id: p.shop[0].id },
      { type: 'buySpell', id: p.tavern!.offer!.id },
      { type: 'power', target: p.board[0].id },
    ] as BGCommand[]) {
      const result = transitionBG(run, command);
      expect(result.state).toBe(run);
      expect(result.error).toContain('full');
    }
    p.discover = [makeUnit('hydra', 'reward')];
    expect(transitionBG(run, { type: 'discover', id: 'reward' }).error).toContain('full');
  });
  it('rejects missing targets, enemy targets, stale IDs and wrong phases atomically', () => {
    const run = recruit();
    friendly(run);
    hold(run, 'guard-oath');
    const before = structuredClone(run);
    for (const command of [
      { type: 'castSpell', id: 'guard-oath' },
      { type: 'castSpell', id: 'guard-oath', target: run.players[1].shop[0].id },
      { type: 'castSpell', id: 'stale', target: 'ally' },
      { type: 'buySpell', id: 'stale' },
    ] as BGCommand[])
      expect(transitionBG(run, command).state).toBe(run);
    expect(run).toEqual(before);
    const combat = { ...run, phase: 'combat' as const };
    expect(
      transitionBG(combat, { type: 'castSpell', id: 'guard-oath', target: 'ally' }).state,
    ).toBe(combat);
  });
  it('blocks buying and casting until Discover is resolved', () => {
    const run = recruit(),
      p = run.players[0];
    hold(run, 'pocket-change');
    p.discover = [makeUnit('hydra', 'reward')];
    for (const command of [
      { type: 'castSpell', id: 'pocket-change' },
      { type: 'buySpell', id: p.tavern!.offer!.id },
    ] as BGCommand[])
      expect(transitionBG(run, command).error).toContain('Discover');
  });
  it('casts income once for free and holds purchased spells across rounds', () => {
    let run = recruit();
    hold(run, 'pocket-change');
    hold(run, 'hearth-bread');
    run = act(run, { type: 'castSpell', id: 'pocket-change' });
    expect(run.players[0].gold).toBe(5);
    expect(transitionBG(run, { type: 'castSpell', id: 'pocket-change' }).state).toBe(run);
    run = act(run, { type: 'endRecruit' });
    run = act(run, { type: 'nextRound' });
    expect(run.players[0].tavern!.hand).toEqual([
      { id: 'hearth-bread', definitionId: 'hearth-bread' },
    ]);
  });
  it('adds delayed income above the normal cap once, then resets it', () => {
    let run = recruit();
    run.round = 9;
    hold(run, 'promissory-note');
    hold(run, 'promissory-note', 'second-note');
    run = act(run, { type: 'castSpell', id: 'promissory-note' });
    run = act(run, { type: 'castSpell', id: 'second-note' });
    expect(run.players[0].gold).toBe(3);
    run = act(run, { type: 'endRecruit' });
    run = act(run, { type: 'nextRound' });
    expect(run.players[0].gold).toBe(16);
    expect(run.players[0].tavern!.nextGold).toBe(0);
    run = act(run, { type: 'endRecruit' });
    run = act(run, { type: 'nextRound' });
    expect(run.players[0].gold).toBe(10);
  });
  it.each(['whetstone', 'hearth-bread', 'guard-oath'])(
    '%s permanently buffs the chosen unit, without charging or adding pool copies',
    (definitionId) => {
      let run = recruit();
      const unit = friendly(run),
        original = structuredClone(unit);
      const d = TAVERN_SPELLS.find((s) => s.id === definitionId)!;
      if (d.effect.type !== 'buff') throw new Error('Expected buff');
      hold(run, definitionId);
      run = act(run, { type: 'castSpell', id: definitionId, target: unit.id });
      expect(run.players[0].board[0]).toMatchObject({
        attack: original.attack + d.effect.attack,
        health: original.health + d.effect.health,
        copies: 1,
      });
      if (d.effect.keyword) expect(run.players[0].board[0].keywords).toContain(d.effect.keyword);
      expect(run.players[0].gold).toBe(3);
      const board = structuredClone(run.players[0].board);
      run = act(run, { type: 'endRecruit' });
      expect(run.players[0].board).toEqual(board);
      supply(run);
    },
  );
  it('buffs only the current board with Banner and rejects an empty board', () => {
    let run = recruit();
    hold(run, 'warband-banner');
    expect(transitionBG(run, { type: 'castSpell', id: 'warband-banner' }).state).toBe(run);
    const a = friendly(run),
      b = friendly(run, 'imp', 'second');
    const original = [a.attack, b.attack];
    run = act(run, { type: 'castSpell', id: 'warband-banner' });
    expect(run.players[0].board.map((u) => u.attack)).toEqual(original.map((v) => v + 1));
  });
  it('shop buffs survive freezing and purchase, then contribute to a golden triple', () => {
    let run = recruit(),
      p = run.players[0];
    const d = p.shop[0].definitionId;
    const first = friendly(run, d, 'first'),
      second = friendly(run, d, 'second');
    expect(first.attack).toBe(second.attack);
    const id = p.shop[0].id,
      base = structuredClone(p.shop[0]);
    hold(run, 'market-polish');
    run = act(run, { type: 'castSpell', id: 'market-polish' });
    run = act(run, { type: 'freeze' });
    run = act(run, { type: 'endRecruit' });
    run = act(run, { type: 'nextRound' });
    expect(run.players[0].shop.find((u) => u.id === id)?.attack).toBe(base.attack + 2);
    run = act(run, { type: 'buy', id });
    const golden = run.players[0].hand.find((u) => u.definitionId === d)!;
    expect(golden).toMatchObject({
      golden: true,
      attack: base.attack * 2 + 2,
      maxHealth: base.maxHealth * 2 + 2,
      copies: 3,
    });
    supply(run);
  });
  it('shop buffs do not survive refresh and empty shops reject the spell', () => {
    const run = recruit(),
      p = run.players[0];
    hold(run, 'market-polish');
    returnUnits(run, p.shop);
    p.shop = [];
    expect(transitionBG(run, { type: 'castSpell', id: 'market-polish' }).state).toBe(run);
    refreshShop(run, p);
    const before = p.shop.map((u) => u.id);
    const cast = act(run, { type: 'castSpell', id: 'market-polish' });
    const refreshed = act(cast, { type: 'refresh' });
    expect(refreshed.players[0].shop.every((u) => !before.includes(u.id))).toBe(true);
    supply(refreshed);
  });
  it('coupons charge one legal minion purchase; failures, spells and Discover do not consume them', () => {
    let run = recruit();
    hold(run, 'recruit-coupon');
    hold(run, 'recruit-coupon', 'second');
    run = act(run, { type: 'castSpell', id: 'recruit-coupon' });
    expect(recruitPrice(run.players[0])).toBe(1);
    expect(transitionBG(run, { type: 'castSpell', id: 'second' }).state).toBe(run);
    expect(transitionBG(run, { type: 'buy', id: 'stale' }).state).toBe(run);
    run.pool.hydra--;
    run.players[0].discover = [makeUnit('hydra', 'coupon-reward')];
    run = act(run, { type: 'discover', id: 'coupon-reward' });
    expect(recruitPrice(run.players[0])).toBe(1);
    const offer = run.players[0].tavern!.offer!;
    run = act(run, { type: 'buySpell', id: offer.id });
    expect(recruitPrice(run.players[0])).toBe(1);
    run = act(run, { type: 'buy', id: run.players[0].shop[0].id });
    expect(run.players[0].gold).toBe(1);
    expect(recruitPrice(run.players[0])).toBe(3);
    supply(run);
  });
  it('expires coupons at the next recruitment and preserves or replaces frozen spell IDs correctly', () => {
    let run = recruit();
    const offer = structuredClone(run.players[0].tavern!.offer);
    hold(run, 'recruit-coupon');
    run = act(run, { type: 'castSpell', id: 'recruit-coupon' });
    run = act(run, { type: 'freeze' });
    run = act(run, { type: 'endRecruit' });
    run = act(run, { type: 'nextRound' });
    expect(run.players[0].tavern!.offer).toEqual(offer);
    expect(run.players[0].tavern!.discount).toBe(0);
    run = act(run, { type: 'refresh' });
    expect(run.players[0].tavern!.offer!.id).not.toBe(offer!.id);
    run = act(run, { type: 'buySpell', id: run.players[0].tavern!.offer!.id });
    run = act(run, { type: 'freeze' });
    run = act(run, { type: 'endRecruit' });
    run = act(run, { type: 'nextRound' });
    expect(run.players[0].tavern!.offer).not.toBeNull();
  });
  it('only offers tier-eligible spells, and upgrades affect later refreshes', () => {
    const run = recruit(),
      p = run.players[0];
    for (const tier of [1, 2, 3, 6]) {
      p.tier = tier;
      for (let i = 0; i < 8; i++) {
        refreshShop(run, p);
        expect(
          TAVERN_SPELLS.find((s) => s.id === p.tavern!.offer!.definitionId)!.tier,
        ).toBeLessThanOrEqual(tier);
      }
    }
    supply(run);
  });
  it('clears held spells and deferred income on elimination', () => {
    let run = recruit();
    run.players[0].hp = 1;
    run.round = 16;
    hold(run, 'whetstone');
    run.players[0].tavern!.nextGold = 3;
    run = act(run, { type: 'endRecruit' });
    expect(run.phase).toBe('lost');
    expect(run.players[0].tavern).toEqual({ offer: null, hand: [], nextGold: 0, discount: 0 });
    supply(run);
  });
});

describe('spell replay and observation contracts', () => {
  it('validates spell practice setups and reconstructs their replay separately', () => {
    const codec = replayCodec(bgSession.rules, true);
    const setup = { hero: 'archivist', tier: 3, gold: 10, board: ['wolf'], spells: ['whetstone'] };
    let session = codec.create('SPELL-PRACTICE', setup);
    const spell = session.state.players[0].tavern!.hand[0];
    session = codec.act(session, {
      type: 'castSpell',
      id: spell.id,
      target: session.state.players[0].board[0].id,
    }).session;
    expect(codec.decode(codec.encode(session))).toEqual(session);
    expect(() => bgSession.decode(codec.encode(session))).toThrow('Practice');
    expect(() => codec.create('SPELL-PRACTICE', { ...setup, spells: ['unknown'] })).toThrow(
      'unknown ID',
    );
    expect(() =>
      codec.create('SPELL-PRACTICE', { ...setup, spells: Array(11).fill('whetstone') }),
    ).toThrow('0–10');
  });

  it('journals purchase/cast with structured changes and keeps v5/v1 saves separate', () => {
    let session = bgSession.act(bgSession.create('SPELL-AGENT'), {
      type: 'chooseHero',
      hero: 'forgekeeper',
    }).session;
    const frame = hearthFrame(session),
      action = frame.actions.find((a) => a.command.type === 'buySpell')!;
    const result = actHearthAgent(session, { step: frame.step, action: action.id });
    expect(result.events.some((e) => e.type === 'tavern')).toBe(true);
    session = result.session;
    expect(bgSession.decode(bgSession.encode(session))).toEqual(session);
    expect(bgSession.key).toBe('card-workshop.last-hearth.v6');
    expect(arenaSession.key).toBe('card-workshop.last-hearth-arena.v2');
    expect(() => bgSession.decode(bgSessionV5.encode(bgSessionV5.create('OLD')))).toThrow(
      'Incompatible',
    );
    expect(() => arenaSession.decode(arenaSessionV1.encode(arenaSessionV1.create('OLD')))).toThrow(
      'Incompatible',
    );
    expect(hearthCatalogue().spells).toEqual(TAVERN_SPELLS);
  });
  it('retains the exact historical v5 win and loss hashes', () => {
    const expected = {
      win: 'ff7d695411b3a0722c5980445a8a5ae49f90c23c51142ad75cb1c0c6d776452e',
      loss: '5b62b0a3219cbd124ef98f5f97cde06887e9b6780d67278dc3f83ead0a63093b',
    };
    for (const [name, digest] of Object.entries(expected)) {
      const state = bgSessionV5.decode(
        readFileSync(`tests/fixtures/battlegrounds-${name}.json`, 'utf8'),
      ).state;
      expect(createHash('sha256').update(JSON.stringify(state)).digest('hex')).toBe(digest);
    }
  });
  it('redacts private rival spell hands and offers from the arena frame', () => {
    const session = arenaSession.act(arenaSession.create('SPELL-ARENA'), {
      type: 'configure',
      config: mixedRivalsConfig('SPELL-ARENA', 'oathkeeper'),
    }).session;
    const frame = arenaFrame(session, 0);
    session.state.players[1].tavern!.hand.push({
      id: 'private-spell',
      definitionId: 'warband-banner',
    });
    session.state.players[1].tavern!.nextGold = 999;
    session.state.players[1].tavern!.offer = null;
    expect(arenaFrame(session, 0)).toEqual(frame);
    expect(JSON.stringify(frame)).not.toContain('private-spell');
  });
  it('replays a complete spell-aware mixed lobby without executing policies', () => {
    let session = arenaSession.act(arenaSession.create('SPELL-FULL-ARENA'), {
      type: 'configure',
      config: mixedRivalsConfig('SPELL-FULL-ARENA', 'archivist'),
    }).session;
    let steps = 0;
    while (!['won', 'lost'].includes(session.state.phase) && steps++ < 1000) {
      const command =
        session.state.phase === 'combat'
          ? { type: 'nextRound' as const }
          : {
              type: 'seat' as const,
              seat: activeSeat(session.state)!,
              action: { type: 'endRecruit' as const },
            };
      session = arenaSession.act(session, command).session;
      for (const command of advanceRivals(session, 0))
        session = arenaSession.act(session, command).session;
      supply(session.state);
    }
    expect(['won', 'lost']).toContain(session.state.phase);
    expect(
      session.replay.commands.some((c) => c.type === 'seat' && c.action.type === 'castSpell'),
    ).toBe(true);
    expect([...session.state.players.map((p) => p.placement)].sort()).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
    expect(arenaSession.decode(arenaSession.encode(session))).toEqual(session);
  }, 20_000);
});
