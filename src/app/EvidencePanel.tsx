import { useState } from 'react';
import { contentDigest } from '../shared/contentPack';
import {
  EVIDENCE_KEY,
  pickRates,
  readEvidence,
  MAX_RUNS,
  MAX_EVENTS,
} from '../shared/evidence/recorder';
import type { RunEvidence } from '../shared/evidence/types';
import { downloadJSON } from './useLocalGame';
const cohort = (r: RunEvidence) =>
  `${r.game} · v${r.version}/${contentDigest(r.content)} · ${r.mode} · ${r.source} · ${r.summary.context}`;
export function EvidencePanel({ game }: { game: string }) {
  const [loaded, setLoaded] = useState(() => {
    try {
      return { rows: readEvidence(localStorage), error: '' };
    } catch (e) {
      return { rows: [] as RunEvidence[], error: String(e) };
    }
  });
  const [selected, setSelected] = useState('');
  const [confirm, setConfirm] = useState(false);
  const rows = loaded.rows.filter((r) => r.game === game),
    cohorts = [...new Set(rows.map(cohort))];
  const selectedCohort = selected || cohorts[cohorts.length - 1];
  const filtered = rows.filter((r) => cohort(r) === selectedCohort),
    finished = filtered.filter((r) => r.summary.outcome !== 'active');
  const encounters = new Map<
    string,
    { count: number; wins: number; damage: number; damageCount: number }
  >();
  for (const row of filtered)
    for (const event of row.events)
      if (event.kind === 'encounter') {
        const count = encounters.get(event.name) ?? {
          count: 0,
          wins: 0,
          damage: 0,
          damageCount: 0,
        };
        count.count++;
        count.wins += event.metrics?.won ?? 0;
        if (event.metrics?.damage !== undefined) {
          count.damage += event.metrics.damage;
          count.damageCount++;
        }
        encounters.set(event.name, count);
      }
  return (
    <section>
      <p className="eyebrow">LOCAL EVIDENCE</p>
      <h1>Playtesting workbench</h1>
      <p>
        Accepted choices and encounter outcomes record automatically on this device. Normal play,
        practice, and imported runs have separate cohorts. Counts describe this sample; they do not
        measure how fun or balanced a card is.
      </p>
      <div className="lab-actions">
        <button
          onClick={() => {
            try {
              downloadJSON(
                localStorage.getItem(EVIDENCE_KEY) ?? '[]',
                'card-workshop-evidence.json',
              );
            } catch (error) {
              setLoaded({ ...loaded, error: String(error) });
            }
          }}
        >
          Export all evidence
        </button>
        <button onClick={() => setConfirm(!confirm)}>Clear evidence…</button>
      </div>
      {confirm && (
        <div className="error-banner">
          <p>
            Delete the local evidence archive for all three games? Saves and practice branches
            remain available.
          </p>
          <button
            onClick={() => {
              try {
                localStorage.removeItem(EVIDENCE_KEY);
                setLoaded({ rows: [], error: '' });
                setConfirm(false);
              } catch (e) {
                setLoaded({ ...loaded, error: String(e) });
              }
            }}
          >
            Delete evidence
          </button>
          <button onClick={() => setConfirm(false)}>Cancel</button>
        </div>
      )}
      {loaded.error && <p role="alert">{loaded.error}</p>}
      {!rows.length ? (
        <p>No recorded actions yet. Play a card, buy a recruit, or start a run to begin.</p>
      ) : (
        <>
          <label>
            Comparable cohort{' '}
            <select
              aria-label="Evidence cohort"
              value={selectedCohort}
              onChange={(e) => setSelected(e.target.value)}
            >
              {cohorts.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <div className="evidence-stats">
            <span>
              <strong>{filtered.length}</strong> runs observed
            </span>
            <span>
              <strong>{finished.length}</strong> finished
            </span>
            <span>
              <strong>
                {finished.filter((r) => r.summary.outcome === 'won').length} / {finished.length}
              </strong>{' '}
              wins / finished
            </span>
          </div>
          {filtered.some((r) => r.startStep || r.droppedEvents) && (
            <p className="muted">
              This cohort includes partial histories. Offer and encounter counts cover recorded
              events only.
            </p>
          )}
          <h2>Choices made when offered</h2>
          <div className="table-scroll">
            <table className="lab-comparison">
              <thead>
                <tr>
                  <th>Content ID</th>
                  <th>Picked</th>
                  <th>Decision opportunities</th>
                  <th>Pick rate</th>
                </tr>
              </thead>
              <tbody>
                {pickRates(filtered).map((r) => (
                  <tr key={r.name}>
                    <th>{r.name}</th>
                    <td>{r.picked}</td>
                    <td>{r.offered}</td>
                    <td>{Math.round((r.picked / r.offered) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted small">
            Each recorded choice or skip counts once per offered ID. Multi-pick packs and successive
            shop purchases are separate decision opportunities, not unique shop visits.
          </p>
          <h2>Encounter outcomes</h2>
          <div className="table-scroll">
            <table className="lab-comparison">
              <thead>
                <tr>
                  <th>Encounter</th>
                  <th>Wins / attempts</th>
                  <th>Mean HP damage</th>
                </tr>
              </thead>
              <tbody>
                {[...encounters].map(([name, r]) => (
                  <tr key={name}>
                    <th>{name}</th>
                    <td>
                      {r.wins} / {r.count}
                    </td>
                    <td>{r.damageCount ? (r.damage / r.damageCount).toFixed(1) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h2>Run histories</h2>
          {[...filtered].reverse().map((r) => (
            <details className="evidence-run" key={r.id}>
              <summary>
                {r.seed} · {r.summary.outcome} · {r.steps} commands ·{' '}
                {new Date(r.updatedAt).toLocaleString()}
              </summary>
              <p>
                {Object.entries(r.summary.metrics)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(' · ')}
              </p>
              <p>
                Recording began at command {r.startStep}; {r.droppedEvents} older events dropped.
              </p>
              <button
                onClick={() =>
                  downloadJSON(
                    JSON.stringify([r], null, 2),
                    `${r.game}-${r.seed.replace(/[^a-z0-9_-]/gi, '_')}-evidence.json`,
                  )
                }
              >
                Export this run
              </button>
              <ol>
                {r.events.map((e, i) => (
                  <li key={i}>
                    #{e.step} · {e.name}
                    {e.choice ? ` → ${e.choice}` : e.kind === 'skip' ? ' → skipped' : ''}
                    {e.metrics
                      ? ` · ${Object.entries(e.metrics)
                          .map(([k, v]) => `${k} ${v}`)
                          .join(', ')}`
                      : ''}
                  </li>
                ))}
              </ol>
            </details>
          ))}
        </>
      )}
      <p className="muted small">
        Retention: newest {MAX_RUNS} runs, up to {MAX_EVENTS} events per run and 12,000 events
        across the archive. No network collection. Export before clearing or changing browsers.
      </p>
      <p className="muted small">
        Compare exported fixed-seed cohorts with{' '}
        <code>npm run playtest:compare -- baseline.json candidate.json</code>. Automated reports
        come from <code>npm run playtest</code>.
      </p>
    </section>
  );
}
