import { describe, it, expect } from 'vitest';
import { createRun, transition, handSize, rerollPrice } from './game';
import { openPack, prepareShopExtras, prepareTags } from './shopExtras';
import { blindsideSession } from '../application/session';

describe('packs, vouchers and skip strategy', () => {
  it('charges once, requires immediate choices, and discards unchosen options', () => {
    const r = createRun('PACKS');
    r.phase = 'shop';
    r.cash = 20;
    r.packs = [{ id: 'offer', definitionId: 'megaStandard', price: 8 }];
    const opened = transition(r, { type: 'buyPack', id: 'offer' }).state;
    expect(opened.cash).toBe(12);
    expect(opened.pack!.choices).toHaveLength(5);
    expect(transition(opened, { type: 'leaveShop' }).error).toBeTruthy();
    expect(transition(opened, { type: 'buyPack', id: 'offer' }).state).toBe(opened);
    const choice = opened.pack!.choices[0];
    const chosen = transition(opened, { type: 'choosePack', id: choice.id }).state;
    expect(chosen.deck).toHaveLength(53);
    expect(chosen.pack!.remaining).toBe(1);
    expect(transition(chosen, { type: 'choosePack', id: choice.id }).error).toBeTruthy();
    const closed = transition(chosen, { type: 'skipPack' }).state;
    expect(closed.phase).toBe('shop');
    expect(closed.deck).toHaveLength(53);
    expect(closed.cash).toBe(12);
  });
  it('uses planets immediately and keeps full Joker inventory atomic', () => {
    const r = createRun('CAPACITY');
    openPack(r, 'celestial', 4, 'shop');
    const total = Object.values(r.levels).reduce((a, b) => a + b, 0);
    const next = transition(r, { type: 'choosePack', id: r.pack!.choices[0].id }).state;
    expect(Object.values(next.levels).reduce((a, b) => a + b, 0)).toBe(total + 1);
    expect(next.consumables).toHaveLength(0);
    openPack(r, 'buffoon', 4, 'shop');
    r.jokers = Array.from({ length: 5 }, (_, i) => ({
      id: String(i),
      definitionId: 'spark',
      paid: 4,
      growth: 0,
    }));
    expect(transition(r, { type: 'choosePack', id: r.pack!.choices[0].id }).state).toBe(r);
  });
  it('offers one voucher per ante and leaves extra stock unchanged by rerolls', () => {
    const r = createRun('SHOP');
    r.phase = 'shop';
    r.cash = 100;
    prepareShopExtras(r);
    const bought = transition(r, { type: 'buyVoucher' }).state;
    expect(bought.vouchers).toEqual([r.voucherOffer]);
    expect(bought.cash).toBe(90);
    const rerolled = transition(bought, { type: 'reroll' }).state;
    expect(rerolled.packs).toEqual(bought.packs);
    expect(rerolled.voucherOffer).toBeNull();
    prepareShopExtras(rerolled);
    expect(rerolled.voucherOffer).toBeNull();
    rerolled.ante++;
    prepareShopExtras(rerolled);
    expect(rerolled.voucherOffer).toBeTruthy();
    expect(rerolled.vouchers).not.toContain(rerolled.voucherOffer);
  });
  it('applies permanent resource upgrades and never discounts an offer twice', () => {
    const r = createRun('UPGRADES');
    r.vouchers = ['extraHand', 'extraDiscard', 'handSize', 'rerolls'];
    const started = transition(r, { type: 'startBlind' }).state;
    expect([
      started.handsLeft,
      started.discardsLeft,
      handSize(started),
      rerollPrice(started),
    ]).toEqual([5, 4, 9, 3]);
    r.phase = 'shop';
    r.cash = 30;
    r.voucherOffer = 'discount';
    r.shop = [{ id: 'x', kind: 'joker', definitionId: 'spark', price: 7 }];
    const discounted = transition(r, { type: 'buyVoucher' }).state;
    expect(discounted.shop[0].price).toBe(5);
    expect(transition(discounted, { type: 'buyVoucher' }).state).toBe(discounted);
  });
  it('skips without blind income or shop and cannot skip a boss', () => {
    const r = createRun('SKIP');
    r.skipTags = [
      { id: 'investment', hand: 'pair' },
      { id: 'orbital', hand: 'pair' },
    ];
    const first = transition(r, { type: 'skipBlind' }).state;
    expect([first.phase, first.blind, first.cash]).toEqual(['ready', 1, 6]);
    expect(first.tags).toEqual(['investment']);
    const boss = transition(first, { type: 'skipBlind' }).state;
    expect(boss.levels.pair).toBe(4);
    expect(boss.blind).toBe(2);
    expect(transition(boss, { type: 'skipBlind' }).state).toBe(boss);
  });
  it('awards investment only after a boss and raises interest with Seed Money', () => {
    const r = createRun('PAYOUT');
    r.blind = 2;
    r.cash = 50;
    r.tags = ['investment'];
    r.vouchers = ['interest'];
    const active = transition(r, { type: 'startBlind' }).state;
    active.target = 1;
    const done = transition(active, { type: 'play', cards: [active.hand[0]] }).state;
    expect(done.cash).toBe(50 + 5 + 3 + 10 + 25);
    expect(done.tags).toEqual([]);
  });
  it('replays skip tags and pack choices deterministically', () => {
    for (let i = 0; i < 20; i++) {
      let session = blindsideSession.create(`SKIP-${i}`);
      session = blindsideSession.act(session, { type: 'skipBlind' }).session;
      if (session.state.pack)
        session = blindsideSession.act(session, {
          type: 'choosePack',
          id: session.state.pack.choices[0].id,
        }).session;
      expect(blindsideSession.decode(blindsideSession.encode(session))).toEqual(session);
      const a = createRun(String(i)),
        b = createRun(String(i));
      prepareTags(a);
      prepareTags(b);
      expect(a.skipTags).toEqual(b.skipTags);
    }
  });
});
