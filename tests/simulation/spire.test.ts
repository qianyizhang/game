import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { spireSession } from '../../src/games/spire/application/session';
import { simulateSpire } from './spire-policy';

it('completes and reconstructs full unmodified Spire ascents', () => {
  mkdirSync('test-results/spire', { recursive: true });
  const summary = [
    'IRONCLAD-01',
    'IRONCLAD-02',
    'IRONCLAD-03',
    'IRONCLAD-04',
    'IRONCLAD-05',
    'IRONCLAD-06',
  ].map((seed) => {
    const session = simulateSpire(seed);
    expect(spireSession.decode(spireSession.encode(session))).toEqual(session);
    writeFileSync(`test-results/spire/${seed}.json`, spireSession.encode(session));
    return {
      seed,
      outcome: session.state.phase,
      act: session.state.act,
      floor: session.state.row + 1,
      hp: session.state.hp,
      cards: session.state.deck.length,
      relics: session.state.relics.length,
      commands: session.replay.commands.length,
    };
  });
  writeFileSync('test-results/spire/summary.json', JSON.stringify(summary, null, 2));
  expect(summary.some((row) => row.outcome === 'won')).toBe(true);
}, 120_000);
