import { describe, expect, it } from 'vitest';
import {
  actChallenge,
  attemptResult,
  beginChallenge,
  challengeDecisions,
  decodeChallenge,
  encodeChallenge,
  retryChallenge,
  type Attempt,
  type Challenge,
} from './challenges';
import { jokerOrderChallenge } from '../games/balatro/application/challenges';
import { poisonChallenge } from '../games/spire/application/challenges';
import { positioningChallenge } from '../games/battlegrounds/application/challenges';
import { currentIntent } from '../games/spire/domain/enemies';

function act<S extends { seed: string }, C>(
  definition: Challenge<S, C>,
  attempt: Attempt<S, C>,
  command: C,
) {
  const result = actChallenge(definition, attempt, command);
  expect(result.error).toBeUndefined();
  return result.attempt;
}
describe('curated tactical challenges', () => {
  it('Joker order changes the same Ace from 104 to 200, with an exact retry and trace', () => {
    const definition = jokerOrderChallenge;
    let attempt = beginChallenge(definition);
    const ace = attempt.session.state.deck.find((card) => card.rank === 14)!;
    attempt = act(definition, attempt, { type: 'play', cards: [ace.id] });
    expect(attemptResult(definition, attempt).status).toBe('not-yet');
    expect(attempt.session.state.lastScore?.total).toBe(104);
    expect(actChallenge(definition, attempt, { type: 'play', cards: [ace.id] }).error).toContain(
      'finished',
    );
    const progress = retryChallenge(definition, { current: attempt });
    let candidate = progress.current;
    candidate = act(definition, candidate, {
      type: 'moveJoker',
      id: candidate.session.state.jokers[1].id,
      direction: -1,
    });
    candidate = act(definition, candidate, { type: 'play', cards: [ace.id] });
    expect(candidate.session.state.lastScore?.total).toBe(200);
    expect(attemptResult(definition, candidate).status).toBe('cleared');
    expect(challengeDecisions(definition, candidate)[1].events.join(' ')).toContain('12.5');
    expect(progress.previous?.session.state.lastScore?.total).toBe(104);
    const saved = { current: candidate, previous: progress.previous };
    expect(decodeChallenge(definition, encodeChallenge(saved))).toEqual(saved);
  });
  it('restrictions reject discards and multi-card hands without spending resources or changing the replay', () => {
    const attempt = beginChallenge(jokerOrderChallenge);
    for (const command of [
      { type: 'discard' as const, cards: [attempt.session.state.hand[0]] },
      { type: 'play' as const, cards: attempt.session.state.hand.slice(0, 2) },
    ]) {
      const result = actChallenge(jokerOrderChallenge, attempt, command);
      expect(result.error).toBeTruthy();
      expect(result.attempt).toBe(attempt);
    }
  });
  it('Artifact must be removed before Poison, while the three Energy budget still pays for defense', () => {
    const definition = poisonChallenge;
    let attempt = beginChallenge(definition);
    expect(
      currentIntent(attempt.session.state.combat!.enemies[0], attempt.session.state.combat!).name,
    ).toBe('Beam');
    for (const name of ['neutralize', 'deadlyPoison', 'catalyst', 'defend']) {
      const combat = attempt.session.state.combat!;
      const id = combat.hand.find((id) => combat.cards[id].definitionId === name)!;
      attempt = act(definition, attempt, { type: 'playCard', id, target: combat.enemies[0].id });
    }
    expect(attempt.session.state.combat!.energy).toBe(0);
    attempt = act(definition, attempt, { type: 'endTurn' });
    expect(attemptResult(definition, attempt)).toMatchObject({
      status: 'cleared',
      metrics: { 'HP remaining': 70, 'Poison remaining': 14 },
    });
    expect(challengeDecisions(definition, attempt).at(-1)!.events.length).toBeGreaterThan(0);
    expect(decodeChallenge(definition, encodeChallenge({ current: attempt })).current).toEqual(
      attempt,
    );
    let wrong = beginChallenge(definition);
    const combat = wrong.session.state.combat!;
    wrong = act(definition, wrong, {
      type: 'playCard',
      id: combat.hand.find((id) => combat.cards[id].definitionId === 'deadlyPoison')!,
      target: combat.enemies[0].id,
    });
    wrong = act(definition, wrong, { type: 'endTurn' });
    expect(attemptResult(definition, wrong).status).toBe('not-yet');
    let unblocked = beginChallenge(definition);
    for (const name of ['neutralize', 'deadlyPoison', 'catalyst']) {
      const combat = unblocked.session.state.combat!;
      unblocked = act(definition, unblocked, {
        type: 'playCard',
        id: combat.hand.find((id) => combat.cards[id].definitionId === name)!,
        target: combat.enemies[0].id,
      });
    }
    unblocked = act(definition, unblocked, { type: 'endTurn' });
    expect(attemptResult(definition, unblocked)).toMatchObject({
      status: 'not-yet',
      metrics: { 'HP remaining': 61, 'Poison remaining': 14 },
    });
  });
  it('positioning converts the fixed tie into a win, preserving recruitment units and deterministic replays', () => {
    const definition = positioningChallenge;
    let attempt = beginChallenge(definition);
    const board = structuredClone(attempt.session.state.board);
    const first = act(definition, attempt, { type: 'fight' });
    expect(first.session.state.result?.winner).toBeNull();
    expect(first.session.state.board).toEqual(board);
    attempt = act(definition, attempt, { type: 'move', id: board[0].id, direction: 1 });
    attempt = act(definition, attempt, { type: 'move', id: board[0].id, direction: 1 });
    attempt = act(definition, attempt, { type: 'fight' });
    expect(attemptResult(definition, attempt).status).toBe('cleared');
    expect(decodeChallenge(definition, encodeChallenge({ current: attempt })).current).toEqual(
      attempt,
    );
    expect(challengeDecisions(definition, attempt).at(-1)!.events.join(' ')).toContain('Cub');
  });
  it('branches reconstruct a decision prefix and retain the completed comparison', () => {
    let attempt = beginChallenge(jokerOrderChallenge);
    attempt = act(jokerOrderChallenge, attempt, {
      type: 'moveJoker',
      id: attempt.session.state.jokers[1].id,
      direction: -1,
    });
    const prefix = attempt.session;
    attempt = act(jokerOrderChallenge, attempt, {
      type: 'play',
      cards: [attempt.session.state.hand[0]],
    });
    const branch = retryChallenge(jokerOrderChallenge, { current: attempt }, 1);
    expect(branch.current.session).toEqual(prefix);
    expect(branch.previous?.session).toEqual(attempt.session);
    expect(() => retryChallenge(jokerOrderChallenge, { current: attempt }, 2)).toThrow(
      'before the attempt finished',
    );
  });
  it('pins every exported attempt to its puzzle and revision, while reconstructing legacy archives', () => {
    const definition = jokerOrderChallenge;
    const current = beginChallenge(definition);
    const archive = JSON.parse(encodeChallenge({ current, previous: current }));
    expect(archive.current.challenge).toEqual({ id: definition.id, revision: definition.revision });
    for (const field of ['current', 'previous']) {
      for (const pin of [
        { id: 'another-puzzle', revision: definition.revision },
        { id: definition.id, revision: definition.revision + 1 },
      ]) {
        const invalid = structuredClone(archive);
        invalid[field].challenge = pin;
        expect(() => decodeChallenge(definition, JSON.stringify(invalid))).toThrow(
          'different challenge or puzzle revision',
        );
      }
    }
    delete archive.current.challenge;
    delete archive.previous.challenge;
    expect(decodeChallenge(definition, JSON.stringify(archive))).toEqual({
      current,
      previous: current,
    });
  });
  it('keeps a replay-backed completion across later failed retries and rejects a false completion', () => {
    const definition = jokerOrderChallenge;
    let attempt = beginChallenge(definition);
    attempt = act(definition, attempt, {
      type: 'moveJoker',
      id: attempt.session.state.jokers[1].id,
      direction: -1,
    });
    attempt = act(definition, attempt, {
      type: 'play',
      cards: [attempt.session.state.deck.find((card) => card.rank === 14)!.id],
    });
    let progress = retryChallenge(definition, { current: attempt });
    const failed = act(definition, progress.current, {
      type: 'play',
      cards: [progress.current.session.state.hand[0]],
    });
    progress = retryChallenge(definition, { ...progress, current: failed });
    const restored = decodeChallenge(definition, encodeChallenge(progress));
    expect(restored.cleared?.session.state.lastScore?.total).toBe(200);
    expect(attemptResult(definition, restored.previous!).status).toBe('not-yet');
    expect(() =>
      decodeChallenge(definition, encodeChallenge({ ...progress, cleared: failed })),
    ).toThrow('does not meet this challenge goal');
  });
  it('saved attempts cannot swap setups, use prohibited commands, or continue past the goal', () => {
    const definition = jokerOrderChallenge;
    const attempt = beginChallenge(definition);
    const saved = JSON.parse(encodeChallenge({ current: attempt }));
    saved.current.replay.setup.cash = 999;
    expect(() => decodeChallenge(definition, JSON.stringify(saved))).toThrow(
      'different challenge position',
    );
    saved.current.replay.setup.cash = 25;
    saved.current.replay.commands = [{ type: 'discard', cards: [attempt.session.state.hand[0]] }];
    expect(() => decodeChallenge(definition, JSON.stringify(saved))).toThrow('single-card play');
    saved.current.replay.commands = [
      { type: 'play', cards: [attempt.session.state.hand[0]] },
      { type: 'sortHand', by: 'rank' },
    ];
    expect(() => decodeChallenge(definition, JSON.stringify(saved))).toThrow('finished');
    saved.current.replay.commands = [];
    saved.current.hints = 99;
    expect(() => decodeChallenge(definition, JSON.stringify(saved))).toThrow(
      'Invalid challenge progress',
    );
  });
});
