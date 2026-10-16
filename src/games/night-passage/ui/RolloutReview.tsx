import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { auditRollout, parseRollout, type Rollout, type RolloutAudit } from '../agent/rollout';
import type { StateView } from '../domain/types';
import './rollout-review.css';
import { DecisionNavigator } from '../../../shared/policy/Navigator';

interface Entry {
  name: string;
  original: string;
  sourceUrl: string | null;
  rollout: Rollout;
  audit: RolloutAudit;
}
interface Props {
  open: (text: string, unit: number) => void;
  seek: (unit: number) => void;
  evaluator: StateView | null;
  beginImport: () => number;
  isCurrentImport: (generation: number) => boolean;
  children: ReactNode;
}
const json = (value: unknown) => JSON.stringify(value, null, 2);
function download(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function linkedDecision(count: number) {
  const raw = new URL(location.href).searchParams.get('decision');
  if (raw === null) return 0;
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n < 1 || n > count)
    throw new Error('Decision link is outside this rollout. Select a decision below.');
  return n - 1;
}
export default function RolloutReview({
  open,
  seek,
  evaluator,
  children,
  beginImport,
  isCurrentImport,
}: Props) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [active, setActive] = useState<Entry | null>(null);
  const [index, setIndex] = useState(0);
  const [filter, setFilter] = useState('');
  const [notice, setNotice] = useState(
    'Open recorded rollouts to inspect original policy knowledge. Plain replays contain executed actions only.',
  );
  const [showEvaluator, setShowEvaluator] = useState(false);
  const choose = useCallback(
    (entry: Entry, next = 0) => {
      beginImport();
      const row = entry.rollout.decisions[next];
      open(entry.rollout.replay, row?.before ?? 1);
      setActive(entry);
      setIndex(next);
      setShowEvaluator(false);
      const url = new URL(location.href);
      url.searchParams.delete('replay');
      if (entry.sourceUrl) url.searchParams.set('rollout', entry.sourceUrl);
      else url.searchParams.delete('rollout');
      url.searchParams.set('run', entry.rollout.digest);
      if (row) url.searchParams.set('decision', String(next + 1));
      else url.searchParams.delete('decision');
      history.replaceState(null, '', url);
    },
    [open, beginImport],
  );
  const read = useCallback(
    async (text: string, name: string, sourceUrl: string | null = null): Promise<Entry> => {
      const rollout = parseRollout(text);
      return {
        name,
        original: text,
        sourceUrl,
        rollout,
        audit: await auditRollout(rollout, undefined, { continuousTolerance: 1e-10 }),
      };
    },
    [],
  );
  useEffect(() => {
    const path = new URL(location.href).searchParams.get('rollout');
    if (!path) return;
    const controller = new AbortController();
    const generation = beginImport();
    setNotice('Loading and auditing rollout…');
    void (async () => {
      const url = new URL(path, location.href);
      if (url.origin !== location.origin)
        throw new Error('Rollout links must use this site. Open a local file below.');
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error('Rollout file unavailable. Open a local file below.');
      const entry = await read(await response.text(), path, path);
      if (controller.signal.aborted || !isCurrentImport(generation)) return;
      setEntries([entry]);
      let selected = 0;
      try {
        selected = linkedDecision(entry.rollout.decisions.length);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'Invalid decision link.');
        choose(entry);
        return;
      }
      choose(entry, selected);
      setNotice(
        'Original inputs loaded. Audit uses the current implementation; original source pins remain in the artifact.',
      );
    })().catch((error: unknown) => {
      if (!controller.signal.aborted && isCurrentImport(generation))
        setNotice(error instanceof Error ? error.message : 'Rollout could not load.');
    });
    return () => controller.abort();
  }, [choose, read, beginImport, isCurrentImport]);
  const move = (next: number) => {
    if (
      !active ||
      !Number.isSafeInteger(next) ||
      next < 0 ||
      next >= active.rollout.decisions.length
    )
      return;
    beginImport();
    setIndex(next);
    seek(active.rollout.decisions[next].before);
    const url = new URL(location.href);
    url.searchParams.set('decision', String(next + 1));
    history.replaceState(null, '', url);
  };
  const visible = entries.filter(({ rollout: { episode: e }, name }) =>
    `${name} ${e.policy} ${e.difficulty} ${e.control} ${e.status} ${e.weapon} ${e.seed}`
      .toLowerCase()
      .includes(filter.toLowerCase()),
  );
  const row = active?.rollout.decisions[index];
  const groups = new Map<string, Entry[]>();
  for (const entry of visible) {
    const e = entry.rollout.episode;
    const key = json({
      versions: e.versions,
      bundle: entry.rollout.provenance?.bundleDigest ?? null,
      policy: e.policy,
      difficulty: e.difficulty,
      control: e.control,
      config: e.config,
      controlConfig: e.controlConfig,
      budgets: e.budgets,
      profile: e.profile,
      runes: e.runes,
    });
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }
  return (
    <section className="np-review" aria-label="Policy rollout review">
      <header className="np-tools">
        <h2>Policy rollout review</h2>
        <label className="np-import">
          Open rollouts
          <input
            type="file"
            multiple
            accept=".json,application/json"
            aria-label="Open policy rollouts"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              if (!files.length) return;
              const generation = beginImport();
              event.target.value = '';
              setNotice('Loading and auditing rollouts…');
              void (async () => {
                const loaded: Entry[] = [],
                  failures: string[] = [];
                for (const file of files) {
                  try {
                    loaded.push(await read(await file.text(), file.name));
                  } catch (error) {
                    failures.push(
                      `${file.name}: ${error instanceof Error ? error.message : 'Invalid rollout.'}`,
                    );
                  }
                }
                if (!isCurrentImport(generation)) return;
                setEntries((previous) => [
                  ...previous.filter(
                    (p) => !loaded.some((e) => e.rollout.digest === p.rollout.digest),
                  ),
                  ...loaded,
                ]);
                if (loaded[0]) {
                  try {
                    choose(loaded[0]);
                  } catch (error) {
                    failures.push(String(error));
                  }
                }
                setNotice(
                  failures.length
                    ? failures.join(' ')
                    : 'Original inputs loaded. Select a run and a decision.',
                );
              })();
            }}
          />
        </label>
      </header>
      <p aria-live="polite">{notice}</p>
      {!row && children}
      {entries.length > 0 && (
        <>
          <label>
            Filter runs{' '}
            <input
              aria-label="Filter rollouts"
              value={filter}
              placeholder="Policy, difficulty, controls, outcome, weapon or seed"
              onChange={(e) => setFilter(e.target.value)}
            />
          </label>
          <div className="np-review-table">
            <table>
              <caption>Loaded episodes · filter to compare matched conditions</caption>
              <thead>
                <tr>
                  <th>Run</th>
                  <th>Policy / difficulty / controls</th>
                  <th>Result</th>
                  <th>Audit</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((entry) => {
                  const e = entry.rollout.episode;
                  return (
                    <tr
                      key={entry.rollout.digest}
                      aria-current={active === entry ? 'true' : undefined}
                    >
                      <td>
                        <button
                          onClick={() => {
                            try {
                              choose(entry);
                            } catch (error) {
                              setNotice(String(error));
                            }
                          }}
                        >
                          {entry.name}
                        </button>
                        <small>
                          {e.weapon} · {e.seed}
                        </small>
                      </td>
                      <td>
                        {e.policy} / {e.difficulty} / {e.control}
                      </td>
                      <td>
                        {e.status} · {e.score} points
                      </td>
                      <td>
                        {entry.audit.firstMismatch ? 'Mismatch' : 'Checked'} ·{' '}
                        {entry.rollout.decisions.length} decisions
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <details>
            <summary>Descriptive results for loaded runs ({visible.length} episodes)</summary>
            <p>
              Loaded files are a selected sample, not a frozen experiment or independent strength
              estimate. Match seeds, weapons, rules, policy configuration and control configuration
              before comparing.
            </p>
            {[...groups].map(([key, group]) => (
              <p key={key} className="np-review-group" title={key}>
                {group[0].rollout.episode.policy} / {group[0].rollout.episode.difficulty} /{' '}
                {group[0].rollout.episode.control}:{' '}
                {group.filter((e) => e.rollout.episode.status === 'won').length}/{group.length} wins
                · mean score{' '}
                {(
                  group.reduce((sum, e) => sum + e.rollout.episode.score, 0) / group.length
                ).toFixed(1)}{' '}
                · {group.filter((e) => e.rollout.episode.status === 'error').length} errors
              </p>
            ))}
          </details>
        </>
      )}
      {active && (
        <>
          <p className="np-review-verdict" data-testid="rollout-audit">
            Replay reconstruction: {active.audit.replay} · Artifact integrity:{' '}
            {active.audit.integrity} · Permitted inputs: {active.audit.inputs} · Policy
            reproduction: {active.audit.decisions}
          </p>
          <p>{active.audit.scope}</p>
          <p>
            Browser cross-runtime check: coordinates and angles allow absolute drift up to{' '}
            {active.audit.numericDrift.tolerance}; hashes, field visibility, button choices, timing
            and outcomes remain exact. {active.audit.numericDrift.count} numeric differences
            observed.
          </p>
          {active.audit.numericDrift.first && (
            <details>
              <summary>First numeric difference</summary>
              <p>{active.audit.numericDrift.first}</p>
            </details>
          )}
          {active.audit.firstMismatch && (
            <p role="alert">
              {active.audit.firstMismatch.decision === null
                ? 'Artifact'
                : `Decision ${active.audit.firstMismatch.decision + 1}`}
              : {active.audit.firstMismatch.message}
              {active.audit.firstMismatch.decision !== null && (
                <button onClick={() => move(active.audit.firstMismatch!.decision!)}>
                  Go to first mismatch
                </button>
              )}
            </p>
          )}
          {row ? (
            <>
              <DecisionNavigator
                index={index}
                count={active.rollout.decisions.length}
                onMove={move}
                onBefore={() => {
                  beginImport();
                  seek(row.before);
                }}
                onAfter={() => {
                  beginImport();
                  seek(row.after);
                }}
              />
              <label>
                Location{' '}
                <select
                  aria-label="Rollout location"
                  value={index}
                  onChange={(e) => move(Number(e.target.value))}
                >
                  {active.rollout.decisions.flatMap((r, i, rows) =>
                    i === 0 ||
                    r.input.phase !== rows[i - 1].input.phase ||
                    r.input.region !== rows[i - 1].input.region ||
                    r.input.chamber !== rows[i - 1].input.chamber
                      ? [
                          <option key={i} value={i}>
                            Decision {i + 1} · Region {r.input.region + 1}, chamber{' '}
                            {r.input.chamber + 1} · {r.input.phase}
                          </option>,
                        ]
                      : i === index
                        ? [
                            <option key={i} value={i}>
                              Decision {i + 1} · {r.input.phase}
                            </option>,
                          ]
                        : [],
                  )}
                </select>
              </label>
              <p data-testid="rollout-decision">
                Decision {index + 1} · Region {row.input.region + 1}, chamber{' '}
                {row.input.chamber + 1} · {row.input.phase} ·{' '}
                {row.accepted ? 'Accepted' : 'Rejected / error'}
                {row.error ? `: ${row.error}` : ''}
              </p>
              <dl className="np-review-facts">
                <div>
                  <dt>Policy observed tick</dt>
                  <dd data-testid="policy-observed-tick">{row.input.perception.observedTick}</dd>
                </div>
                <div>
                  <dt>Decision tick</dt>
                  <dd>{row.input.perception.decisionTick}</dd>
                </div>
                <div>
                  <dt>Snapshot age</dt>
                  <dd>
                    {row.input.perception.ageTicks} ticks
                    {row.input.perception.bootstrap ? ' · bootstrap' : ''}
                  </dd>
                </div>
                <div>
                  <dt>Delivery tick</dt>
                  <dd>
                    {row.timing ? (row.timing.deliveryTick ?? 'Cancelled') : 'Menu / no delivery'}
                  </dd>
                </div>
                <div>
                  <dt>Replay units</dt>
                  <dd>
                    {row.before} → {row.after}
                  </dd>
                </div>
                <div>
                  <dt>Declared work</dt>
                  <dd>{row.work?.total ?? 'Unavailable'}</dd>
                </div>
              </dl>
              {children}
              <div className="np-review-columns">
                <section>
                  <h3>Recorded policy knowledge</h3>
                  <p>
                    Original input, including legal menus and control bounds. The contract withholds
                    enemy clocks, player cooldown clocks and future RNG; the audit checks this
                    boundary. Projectile velocity is inferred from adjacent aged samples.
                  </p>
                  <details open>
                    <summary>Exact policy input</summary>
                    <pre data-testid="policy-knowledge">{json(row.input)}</pre>
                  </details>
                </section>
                <section>
                  <h3>Recorded proposal</h3>
                  <pre data-testid="policy-proposal">
                    {json({
                      command: row.command,
                      work: row.work,
                      timing: row.timing,
                      failureStage: row.failureStage,
                      rawOutput: row.rawOutput,
                    })}
                  </pre>
                  <p>
                    Decision reasons and alternative values were not supplied by these heuristics.
                    Work and proposal are recorded diagnostics.
                  </p>
                  <button
                    aria-pressed={showEvaluator}
                    onClick={() => setShowEvaluator(!showEvaluator)}
                  >
                    {showEvaluator ? 'Hide evaluator view' : 'Show evaluator view'}
                  </button>
                  {showEvaluator && evaluator && (
                    <>
                      <h3>Evaluator at playback tick {evaluator?.tick}</h3>
                      <p>
                        Privileged review data: exact clocks, seed, RNG and journal-independent game
                        state. The policy contract excludes these privileged fields. Select Before
                        decision for the decision-time comparison.
                      </p>
                      <pre data-testid="evaluator-knowledge">{json(evaluator)}</pre>
                    </>
                  )}
                  {showEvaluator && !evaluator && (
                    <p>Evaluator unavailable: playback could not reconstruct this boundary.</p>
                  )}
                </section>
              </div>
            </>
          ) : (
            <p>No policy decisions: this episode stopped after setup.</p>
          )}
          <div className="np-tools">
            <button onClick={() => download('rollout.json', active.original)}>
              Download original rollout
            </button>
            <button onClick={() => download('replay.json', active.rollout.replay)}>
              Download replay
            </button>
            <button onClick={() => download('audit.json', json(active.audit))}>
              Download current audit
            </button>
          </div>
          <details>
            <summary>Original versions, configuration and source pins</summary>
            <pre>
              {json({
                episode: active.rollout.episode,
                provenance: active.rollout.provenance,
                digest: active.rollout.digest,
              })}
            </pre>
          </details>
        </>
      )}
    </section>
  );
}
