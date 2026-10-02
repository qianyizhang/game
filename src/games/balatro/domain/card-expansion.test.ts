import { describe, expect, it } from 'vitest';
import { exportReplay, importReplay, newSession, SAVE_KEY } from '../application/session';
import { createRun, RULES_VERSION, transition } from './game';
import { scoreHand } from './scoring';
import type { Card } from './types';

function fixture(jokers: string[]) {
  const run = transition(createRun('CARD-EXPANSION'), { type: 'startBlind' }).state;
  run.deck = [
    { id: 'seven', rank: 7, suit: 'hearts', enhancement: 'plain' },
    { id: 'ace', rank: 14, suit: 'spades', enhancement: 'plain' },
    { id: 'king', rank: 13, suit: 'clubs', enhancement: 'plain' },
    { id: 'two', rank: 2, suit: 'diamonds', enhancement: 'plain' },
    { id: 'three', rank: 3, suit: 'clubs', enhancement: 'plain' },
  ] satisfies Card[];
  run.hand = run.deck.map((c) => c.id);
  run.draw = [];
  run.target = 1_000_000;
  run.jokers = jokers.map((definitionId, i) => ({ id: `j${i}`, definitionId, growth: 0, paid: 5 }));
  return run;
}
const triggered = (run: ReturnType<typeof fixture>, ids: string[], name: string) =>
  scoreHand(run, ids).steps.some((step) => step.source === name);

describe('expanded Joker builds', () => {
  it('applies held-card effects in visible card order and respects boss debuffs', () => {
    const run = fixture(['observatory', 'locket']);
    expect(scoreHand(run, ['seven']).mult).toBeCloseTo(6.3);
    run.hand = ['seven', 'king', 'ace', 'two', 'three'];
    expect(scoreHand(run, ['seven']).mult).toBeCloseTo(7.8);
    run.blind = 2;
    run.bossIds[0] = 'mask';
    expect(scoreHand(run, ['seven']).mult).toBeCloseTo(1.3);
    expect(triggered(run, ['ace'], 'Observatory')).toBe(false);
  });
  it('distinguishes played, scored and held cards for the new build conditions', () => {
    const run = fixture(['harlequin', 'compass', 'undertow']);
    expect(triggered(run, ['seven'], 'Undertow')).toBe(true);
    expect(triggered(run, ['seven', 'two'], 'Undertow')).toBe(false);
    expect(triggered(run, ['seven', 'two', 'three'], 'Compass')).toBe(true);
    expect(triggered(run, ['seven', 'two', 'ace'], 'Compass')).toBe(false);
    expect(triggered(run, ['seven', 'two', 'three'], 'Harlequin')).toBe(false);
    run.jokers.push({ id: 'all', definitionId: 'splash', growth: 0, paid: 6 });
    expect(triggered(run, ['seven', 'two', 'three'], 'Harlequin')).toBe(true);
    run.deck.find((c) => c.id === 'three')!.suit = 'hearts';
    run.deck.find((c) => c.id === 'three')!.enhancement = 'wild';
    expect(triggered(run, ['seven', 'two', 'three'], 'Harlequin')).toBe(false);
  });
  it('makes resource bonuses depend on the scoring hand, not the preview count', () => {
    const run = fixture(['sundial', 'hourglass', 'palimpsest']);
    const before = structuredClone(run);
    expect(scoreHand(run, ['seven']).chips).toBe(132);
    expect(scoreHand(run, ['seven']).chips).toBe(132);
    expect(run).toEqual(before);
    const played = transition(run, { type: 'play', cards: ['seven'] });
    expect(played.error).toBeUndefined();
    expect(played.state.lastScore!.chips).toBe(132);
    expect(played.state.jokers[2].growth).toBe(20);
    expect(triggered(played.state, ['two'], 'Sundial')).toBe(false);
    expect(triggered(run, ['seven'], 'Hourglass')).toBe(false);
    run.discardsLeft = 0;
    expect(scoreHand(run, ['seven']).mult).toBe(2.5);
  });
  it('uses existing enhancement order and exposes earned cash to later hooks', () => {
    const run = fixture(['mosaic', 'glassblower', 'orchard', 'bankroll']);
    run.deck[0].enhancement = 'glass';
    run.cash = 24;
    const score = scoreHand(run, ['seven']);
    expect(score.chips).toBe(22);
    expect(score.mult).toBe(18.75); // (1 × 2 + 4) × 1.25 × 2.5
    expect(score.cash).toBe(1);
    expect(run.cash).toBe(24);
    run.deck[0].enhancement = 'plain';
    expect(scoreHand(run, ['seven']).mult).toBe(2.5);
  });
  it('grants Encore at blind start and resets Sundial for the next blind', () => {
    const run = fixture(['encore', 'sundial']);
    run.phase = 'ready';
    run.handsPlayed = 4;
    const next = transition(run, { type: 'startBlind' });
    expect(next.error).toBeUndefined();
    expect(next.state.discardsLeft).toBe(4);
    expect(next.state.handsPlayed).toBe(0);
    expect(triggered(next.state, [next.state.hand[0]], 'Sundial')).toBe(true);
  });
  it('separates the expanded seeded pool from v1 saves', () => {
    expect(RULES_VERSION).toBeGreaterThan(1);
    expect(SAVE_KEY).not.toBe('card-workshop.blindside.v1');
    const session = newSession('EXPANSION-REPLAY');
    expect(importReplay(exportReplay(session))).toEqual(session);
    expect(() => importReplay(JSON.stringify({ ...session.replay, version: 1 }))).toThrow(
      /version/i,
    );
  });
});
