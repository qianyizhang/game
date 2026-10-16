import { describe, expect, it } from 'vitest';
import { adapter, builtins } from './adapter';
import { observe } from './observation';
import { forecastState } from './forecast';
import { scoreHand } from '../domain/scoring';
import { blindsideSession } from '../application/session';

describe('Blindside restricted policy play', () => {
  it('keeps hidden seed, random state, draw order and later bosses out of detached inputs', () => {
    let session = adapter.create('POLICY-DEV-BOUNDARY', { difficulty: 'standard' });
    session = adapter.act(session, { type: 'startBlind' }).state;
    const changed = structuredClone(session.state);
    changed.seed = 'SECRET';
    changed.rng += 17;
    changed.nextId += 77;
    changed.draw.reverse();
    changed.bossIds.splice(changed.ante, 7, 'crown', 'thorn');
    const original = observe(session.state);
    const alternate = observe(changed);
    expect(alternate).toEqual(original);
    for (const factory of Object.values(builtins)) {
      const config = { setup: {}, options: {}, policySeed: 'INDEPENDENT' };
      expect(factory.create(config)(original)).toEqual(factory.create(config)(alternate));
    }
    const publicForecast = forecastState(original);
    const cards = session.state.hand.slice(0, 5);
    expect(scoreHand(publicForecast, cards)).toEqual(scoreHand(session.state, cards));
    original.hand[0].rank = 2;
    original.deck.length = 0;
    original.jokers.push({ id: 'tamper', definitionId: 'spark', growth: 0, paid: 0 });
    expect(observe(session.state)).toEqual(alternate);
    expect(adapter.isCommand({ type: 'configure', difficulty: 'relaxed' })).toBe(false);
    const rejected = adapter.act(session, { type: 'configure', difficulty: 'relaxed' });
    expect(rejected.state).toBe(session);
    expect(rejected.error).toBeTruthy();
  });

  it('completes ordinary episodes with all three priorities and reconstructs accepted commands', () => {
    for (const strategy of ['immediate', 'survival', 'growth'] as const) {
      let session = adapter.create('POLICY-DEV-COMPLETE', { difficulty: 'standard' });
      const decide = builtins[strategy].create({
        setup: { difficulty: 'standard' },
        options: {},
        policySeed: 'INDEPENDENT',
      });
      for (let action = 0; action < 1000 && !adapter.terminal(session); action++) {
        const proposal = decide(adapter.observe(session));
        expect(adapter.isCommand(proposal.command)).toBe(true);
        const result = adapter.act(session, proposal.command);
        expect(result.error, `${strategy}: ${JSON.stringify(proposal.command)}`).toBeUndefined();
        session = result.state;
      }
      expect(adapter.terminal(session), strategy).toBe(true);
      expect(adapter.restore(adapter.replay(session))).toEqual(session);
      expect(blindsideSession.at(session, 1).state.phase).toBe('ready');
      expect(adapter.metrics(session).progress).toBeGreaterThan(0);
    }
  }, 120_000);
});
