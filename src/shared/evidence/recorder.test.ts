import { describe, it, expect } from 'vitest';
import { EVIDENCE_KEY, beginEvidence, readEvidence, recordAccepted, pickRates } from './recorder';
import { spireSession } from '../../games/spire/application/session';
import { replayCodec } from '../replay';
const memory = () => {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      data.set(k, v);
    },
    removeItem: (k: string) => {
      data.delete(k);
    },
  };
};
describe('local evidence', () => {
  it('continues a run after reload, separates restarted seeds, and leaves replays deterministic', () => {
    const storage = memory(),
      before = spireSession.create('RECORD');
    beginEvidence(storage, spireSession.rules, before, 'human', 'one', '2026-10-02');
    const command = { type: 'neow', choice: 'gold' } as const,
      after = spireSession.act(before, command).session;
    recordAccepted(storage, spireSession.rules, before, command, after, 'unused', '2026-10-02');
    const reloaded = spireSession.decode(spireSession.encode(after));
    const nextCommand = { type: 'chooseNode', id: reloaded.state.map[0].id } as const,
      next = spireSession.act(reloaded, nextCommand).session;
    recordAccepted(
      storage,
      spireSession.rules,
      reloaded,
      nextCommand,
      next,
      'unused',
      '2026-10-02',
    );
    expect(readEvidence(storage)).toHaveLength(1);
    expect(readEvidence(storage)[0].steps).toBe(2);
    beginEvidence(storage, spireSession.rules, before, 'human', 'two', '2026-10-02');
    recordAccepted(storage, spireSession.rules, before, command, after, 'unused', '2026-10-02');
    expect(readEvidence(storage).map((r) => r.steps)).toEqual([2, 1]);
    expect(spireSession.decode(spireSession.encode(next))).toEqual(next);
    storage.removeItem(EVIDENCE_KEY);
    expect(readEvidence(storage)).toEqual([]);
  });
  it('rejects malformed archive fields without replacing the retained input', () => {
    const storage = memory();
    const session = spireSession.create('INVALID-ARCHIVE');
    beginEvidence(storage, spireSession.rules, session, 'human', 'one', 'now');
    const row = readEvidence(storage)[0];
    const invalid: unknown[] = [
      null,
      [null],
      [{ ...row, mode: 1 }],
      [{ ...row, source: {} }],
      [{ ...row, steps: '0' }],
      [{ ...row, content: [null] }],
      [{ ...row, summary: [] }],
      [{ ...row, summary: { ...row.summary, metrics: { score: 'high' } } }],
      [{ ...row, events: [null] }],
      [{ ...row, events: [{ kind: 'pick', name: 'Reward', step: 1, offered: [42] }] }],
    ];
    for (const value of invalid) {
      const raw = JSON.stringify(value);
      storage.setItem(EVIDENCE_KEY, raw);
      expect(() => readEvidence(storage)).toThrow('Evidence archive is invalid');
      expect(storage.getItem(EVIDENCE_KEY)).toBe(raw);
    }
  });
  it('separates practice and imports from normal human play', () => {
    const storage = memory(),
      lab = replayCodec(spireSession.rules, true),
      practice = lab.create('SAME'),
      normal = spireSession.create('SAME');
    beginEvidence(storage, lab.rules, practice, 'human', 'practice', 'now');
    beginEvidence(storage, spireSession.rules, normal, 'imported', 'import', 'now');
    const command = { type: 'neow', choice: 'gold' } as const;
    recordAccepted(
      storage,
      lab.rules,
      practice,
      command,
      lab.act(practice, command).session,
      'id',
      'now',
    );
    expect(readEvidence(storage).map((r) => [r.mode, r.source, r.steps])).toEqual([
      ['practice', 'human', 1],
      ['normal', 'imported', 0],
    ]);
  });
  it('counts offered choices once per decision, including skips', () => {
    const storage = memory(),
      session = spireSession.create('COUNTS');
    beginEvidence(storage, spireSession.rules, session, 'human', 'x', 'now');
    const row = readEvidence(storage)[0];
    row.events = [
      {
        step: 1,
        kind: 'pick',
        name: 'Reward',
        offered: ['strike', 'defend', 'strike'],
        choice: 'strike',
      },
      { step: 2, kind: 'skip', name: 'Reward', offered: ['strike', 'bash'] },
    ];
    expect(pickRates([row]).find((r) => r.name === 'strike')).toEqual({
      name: 'strike',
      offered: 2,
      picked: 1,
    });
  });
});
