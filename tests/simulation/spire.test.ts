import { simulationOutput } from './output';
import { automatedEvidence } from './evidence';
import { writeFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { spireSession } from '../../src/games/spire/application/session';
import { simulateSpire } from './spire-policy';

it('completes and reconstructs full unmodified Spire ascents', () => {
  const output = simulationOutput('spire');
  const evidence: ReturnType<typeof automatedEvidence>[] = [];
  const summary = [
    'IRONCLAD-01',
    'IRONCLAD-02',
    'IRONCLAD-03',
    'IRONCLAD-04',
    'IRONCLAD-05',
    'IRONCLAD-06',
    'SILENT-01',
    'SILENT-02',
    'SILENT-03',
    'SILENT-04',
    'SILENT-A5-01',
    'IRONCLAD-A5-01',
  ].map((seed) => {
    const session = simulateSpire(
      seed,
      seed.startsWith('SILENT') ? 'silent' : 'ironclad',
      seed.includes('A5') ? 5 : 0,
    );
    evidence.push(automatedEvidence(spireSession, session));
    expect(spireSession.decode(spireSession.encode(session))).toEqual(session);
    writeFileSync(`${output}/${seed}.json`, spireSession.encode(session));
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
  writeFileSync(`${output}/evidence.json`, JSON.stringify(evidence, null, 2));
  writeFileSync(`${output}/summary.json`, JSON.stringify(summary, null, 2));
  expect(summary.some((row) => row.outcome === 'won')).toBe(true);
}, 120_000);
