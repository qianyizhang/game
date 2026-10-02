import { describe, expect, it } from 'vitest';
import { jokerOrderChallenge } from '../games/balatro/application/challenges';
import { blindsideCommands } from '../games/balatro/application/engine';
import { poisonChallenge } from '../games/spire/application/challenges';
import { spireCommands } from '../games/spire/application/engine';
import { positioningChallenge } from '../games/battlegrounds/application/challenges';
import { positioningCommands } from '../games/battlegrounds/application/engine';
import { solveChallenge, solveWorkshopChallenges } from './challenges';
import { challengeEngine } from '../shared/challenge-engine';
import { actChallenge, beginChallenge, decodeChallenge } from '../shared/challenges';
import { legalActions, search } from '../shared/engine';

describe('searching the live challenge definitions', () => {
  it('discovers all three solutions without a scripted line and verifies their importable replays', () => {
    const reports = solveWorkshopChallenges();
    expect(reports.map((report) => report.status)).toEqual(['solved', 'solved', 'solved']);
    expect(reports.map((report) => report.solution!.commands.length)).toEqual([2, 5, 3]);
    expect(reports.map((report) => report.solution!.result.status)).toEqual([
      'cleared',
      'cleared',
      'cleared',
    ]);
    expect(reports[0].solution!.result.metrics['Score (points)']).toBe(200);
    expect(reports[1].solution!.result.metrics).toMatchObject({
      'HP remaining': 70,
      'Poison remaining': 14,
    });
    expect(reports[2].solution!.result.metrics['Battle result']).toBe('Win');
    expect(
      decodeChallenge(jokerOrderChallenge, reports[0].solution!.archive).cleared,
    ).toBeDefined();
    expect(decodeChallenge(poisonChallenge, reports[1].solution!.archive).cleared).toBeDefined();
    expect(
      decodeChallenge(positioningChallenge, reports[2].solution!.archive).cleared,
    ).toBeDefined();
    expect(solveWorkshopChallenges()).toEqual(reports);
  });
  it('keeps constraints authoritative, input immutable and terminal attempts closed', () => {
    const initial = beginChallenge(jokerOrderChallenge);
    const before = structuredClone(initial);
    const engine = challengeEngine(jokerOrderChallenge, blindsideCommands);
    const actions = [...legalActions(engine, initial)];
    expect(
      actions.every((c) => c.type === 'moveJoker' || (c.type === 'play' && c.cards.length === 1)),
    ).toBe(true);
    const rejected = engine.step(initial, {
      type: 'discard',
      cards: initial.session.state.hand.slice(0, 1),
    });
    expect(rejected.error).toBeTruthy();
    expect(rejected.position).toBe(initial);
    const result = search(engine, initial);
    expect(initial).toEqual(before);
    expect(result.status).toBe('solved');
    if (result.status !== 'solved') throw new Error('Expected solution');
    expect([...legalActions(engine, result.position)]).toEqual([]);
    expect(engine.step(result.position, result.commands[0]).error).toContain('finished');
  });
  it('can continue a legal decision prefix and does not count it as a newly selected action', () => {
    let prefix = beginChallenge(positioningChallenge);
    prefix = actChallenge(positioningChallenge, prefix, {
      type: 'move',
      id: prefix.session.state.board[0].id,
      direction: 1,
    }).attempt;
    const result = search(challengeEngine(positioningChallenge, positioningCommands), prefix);
    expect(result.status).toBe('solved');
    if (result.status !== 'solved') throw new Error('Expected solution');
    expect(result.commands).toHaveLength(2);
    expect(result.position.session.replay.commands).toHaveLength(3);
  });
  it('adapts to changed card IDs, ordering and objectives rather than a challenge ID or hint text', () => {
    const variant = {
      ...jokerOrderChallenge,
      id: 'unseen-order-variant',
      hints: [],
      explanation: '',
      setup: {
        cash: 25,
        jokers: ['spark', 'bankroll'],
        deck: [14, 2, 3, 4, 5, 6, 7, 8].map((rank) => ({ rank, suit: 'hearts' })),
      },
    };
    const report = solveChallenge(variant, blindsideCommands);
    expect(report.status).toBe('solved');
    expect(report.solution!.commands).toHaveLength(1);
    const impossible = {
      ...variant,
      evaluate: (state: Parameters<typeof variant.evaluate>[0]) => {
        const result = variant.evaluate(state);
        return {
          ...result,
          status: result.status === 'cleared' ? ('not-yet' as const) : result.status,
        };
      },
    };
    expect(solveChallenge(impossible, blindsideCommands)).toMatchObject({
      status: 'exhausted',
      solution: null,
    });
    expect(solveChallenge(poisonChallenge, spireCommands, { maxDepth: 1 })).toMatchObject({
      status: 'limit',
      reason: 'depth',
      solution: null,
    });
  });
});
