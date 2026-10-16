import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { auditRollout, parseRollout } from './rollout';
import type { EpisodeAdapter, Json, PolicyAudit, PolicyFactory, PolicyRollout } from './types';
import { DecisionNavigator } from './Navigator';
import {
  assertFetchedArtifact,
  decodeArtifact,
  isGzip,
  MAX_ARTIFACT_BYTES,
  readArtifactStream,
} from './artifact';
import './review.css';

interface Entry {
  id: string;
  name: string;
  downloadName: string;
  original: Uint8Array<ArrayBuffer>;
  source: string | null;
  run: PolicyRollout;
  audit: PolicyAudit;
}
interface Props<S, O, C> {
  title: string;
  gameHref: string;
  adapter: EpisodeAdapter<S, O, C>;
  factories: readonly PolicyFactory<O, C>[];
  seek: (replay: Json, cursor: number) => S;
  renderState: (state: S) => ReactNode;
}
const json = (value: unknown) => JSON.stringify(value, null, 2);
function download(
  name: string,
  contents: string | Uint8Array<ArrayBuffer>,
  type = 'application/json',
) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Original evidence is retained even when its game replay cannot reconstruct. */
export function PolicyReview<S, O, C>({
  title,
  gameHref,
  adapter,
  factories,
  seek,
  renderState,
}: Props<S, O, C>) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [active, setActive] = useState<Entry | null>(null);
  const [index, setIndex] = useState(0);
  const [boundary, setBoundary] = useState<'before' | 'after'>('before');
  const [filter, setFilter] = useState('');
  const [notice, setNotice] = useState(
    'Open recorded rollouts to inspect original policy knowledge.',
  );
  const [evaluator, setEvaluator] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const generation = useRef(0);
  const link = useCallback((entry: Entry, next: number) => {
    const url = new URL(location.href);
    if (entry.source) url.searchParams.set('rollout', entry.source);
    else url.searchParams.delete('rollout');
    url.searchParams.set('run', entry.run.digest);
    url.searchParams.set('decision', String(next + 1));
    history.replaceState(null, '', url);
  }, []);
  const choose = useCallback(
    (entry: Entry, next = 0) => {
      generation.current++;
      setActive(entry);
      setIndex(next);
      setBoundary('before');
      setEvaluator(false);
      setPlaying(false);
      link(entry, next);
    },
    [link],
  );
  const read = useCallback(
    async (
      original: Uint8Array<ArrayBuffer>,
      name: string,
      source: string | null = null,
    ): Promise<Entry> => {
      const text = await decodeArtifact(original);
      const run = parseRollout(text);
      const factory = factories.find(
        (f) => f.id === run.policy.id && f.version === run.policy.version,
      );
      return {
        id: Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', original)), (byte) =>
          byte.toString(16).padStart(2, '0'),
        ).join(''),
        name,
        downloadName: source
          ? decodeURIComponent(
              new URL(source, location.href).pathname.split('/').at(-1) || 'rollout.json',
            )
          : name,
        original,
        source,
        run,
        audit: await auditRollout(adapter, run, factory),
      };
    },
    [adapter, factories],
  );
  useEffect(() => {
    const path = new URL(location.href).searchParams.get('rollout');
    if (!path) return;
    const controller = new AbortController();
    const current = ++generation.current;
    setNotice('Loading and auditing rollout…');
    void (async () => {
      const url = new URL(path, location.href);
      if (url.origin !== location.origin)
        throw new Error('Rollout links must use this site. Open a local file below.');
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error('Rollout file unavailable. Open a local file below.');
      if (!response.body) throw new Error('Rollout response has no readable body.');
      const original = await readArtifactStream(response.body);
      assertFetchedArtifact(original, url.pathname, response.headers.get('content-encoding'));
      const entry = await read(original, path, path);
      if (controller.signal.aborted || current !== generation.current) return;
      setEntries([entry]);
      const raw = new URL(location.href).searchParams.get('decision');
      const selected = raw === null ? 0 : Number(raw) - 1;
      if (
        !Number.isSafeInteger(selected) ||
        selected < 0 ||
        selected >= entry.run.decisions.length
      ) {
        choose(entry);
        setNotice('Decision link is outside this rollout. Select a decision below.');
      } else {
        choose(entry, selected);
        setNotice(
          'Original inputs loaded. Audit uses the current implementation and recorded source pins.',
        );
      }
    })().catch((error: unknown) => {
      if (!controller.signal.aborted && current === generation.current)
        setNotice(error instanceof Error ? error.message : 'Rollout could not load.');
    });
    return () => controller.abort();
  }, [choose, read]);
  const move = useCallback(
    (next: number, automatic = false) => {
      if (!active || !Number.isSafeInteger(next) || next < 0 || next >= active.run.decisions.length)
        return;
      generation.current++;
      setIndex(next);
      setBoundary('before');
      if (!automatic) setPlaying(false);
      link(active, next);
    },
    [active, link],
  );
  useEffect(() => {
    if (!playing || !active) return;
    const timer = setInterval(() => {
      if (index + 1 >= active.run.decisions.length) setPlaying(false);
      else move(index + 1, true);
    }, 1000 / speed);
    return () => clearInterval(timer);
  }, [active, index, move, playing, speed]);
  const row = active?.run.decisions[index];
  let playback: S | null = null;
  let playbackError: string | null = null;
  if (active && row) {
    try {
      playback = seek(active.run.replay, row[boundary]);
    } catch (error) {
      playbackError = error instanceof Error ? error.message : String(error);
    }
  }
  const visible = entries.filter((e) =>
    `${e.name} ${json(e.run.policy)} ${json(e.run.options.setup)} ${e.run.options.seed} ${json(e.run.episode.metrics)}`
      .toLowerCase()
      .includes(filter.toLowerCase()),
  );
  const groups = new Map<string, Entry[]>();
  for (const entry of visible) {
    const { identity, policy, options, provenance } = entry.run;
    const key = json({
      identity,
      policy,
      setup: options.setup,
      policyOptions: options.policyOptions,
      policySeed: options.policySeed,
      maxDecisions: options.maxDecisions,
      provenance,
    });
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }
  return (
    <main className="policy-review">
      <header>
        <h1>{title} policy review</h1>
        <a href={gameHref}>Return to game</a>
      </header>
      <label>
        Open rollouts{' '}
        <input
          type="file"
          multiple
          accept=".json,.gz,.gzip,application/json,application/gzip"
          aria-label="Open policy rollouts"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = '';
            if (!files.length) return;
            const current = ++generation.current;
            setPlaying(false);
            setNotice('Loading and auditing rollouts…');
            void (async () => {
              const loaded: Entry[] = [],
                failures: string[] = [];
              for (const file of files) {
                try {
                  if (file.size > MAX_ARTIFACT_BYTES)
                    throw new Error('Rollout exceeds its byte limit.');
                  loaded.push(await read(new Uint8Array(await file.arrayBuffer()), file.name));
                } catch (error) {
                  failures.push(
                    `${file.name}: ${error instanceof Error ? error.message : String(error)}`,
                  );
                }
              }
              if (current !== generation.current) return;
              setEntries((previous) => [
                ...previous.filter((e) => !loaded.some((n) => n.id === e.id)),
                ...loaded,
              ]);
              if (loaded[0]) choose(loaded[0]);
              setNotice(
                failures.length
                  ? failures.join(' ')
                  : 'Original inputs loaded. Select a run and a decision.',
              );
            })();
          }}
        />
      </label>
      <p role="status">{notice}</p>
      {entries.length > 0 && (
        <>
          <label>
            Filter runs{' '}
            <input
              aria-label="Filter rollouts"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Policy, setup, outcome or seed"
            />
          </label>
          <div className="policy-review-table">
            <table>
              <caption>Loaded episodes · compare matched conditions</caption>
              <thead>
                <tr>
                  <th>Run</th>
                  <th>Policy / setup</th>
                  <th>Result</th>
                  <th>Audit</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((entry) => (
                  <tr key={entry.id} aria-current={entry === active ? 'true' : undefined}>
                    <td>
                      <button onClick={() => choose(entry)}>{entry.name}</button>
                      <small>{entry.run.options.seed}</small>
                    </td>
                    <td>
                      {entry.run.policy.id}
                      <small>{json(entry.run.options.setup)}</small>
                    </td>
                    <td>
                      {entry.run.episode.status}
                      <details>
                        <summary>Game metrics</summary>
                        <pre>{json(entry.run.episode.metrics)}</pre>
                      </details>
                    </td>
                    <td>
                      {[
                        entry.audit.integrity,
                        entry.audit.replay,
                        entry.audit.inputs,
                        entry.audit.decisions,
                      ].includes('failed')
                        ? 'Failed'
                        : [
                              entry.audit.integrity,
                              entry.audit.replay,
                              entry.audit.inputs,
                              entry.audit.decisions,
                            ].includes('unavailable')
                          ? 'Unavailable'
                          : 'Passed'}{' '}
                      · {entry.run.decisions.length} decisions
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details>
            <summary>Descriptive results ({visible.length} loaded episodes)</summary>
            <p>
              These selected files are not a frozen evaluation. Each group keeps rules, policy,
              configuration, budgets and source provenance separate.
            </p>
            {[...groups].map(([key, group]) => (
              <details key={key}>
                <summary>
                  {group[0].run.policy.id} · {json(group[0].run.options.setup)} · {group.length}{' '}
                  episodes · {group.filter((e) => e.run.episode.status === 'error').length} errors
                </summary>
                <pre>{key}</pre>
              </details>
            ))}
          </details>
        </>
      )}
      {active && (
        <>
          <p data-testid="rollout-audit">
            Replay reconstruction: {active.audit.replay} · Artifact integrity:{' '}
            {active.audit.integrity} · Permitted inputs: {active.audit.inputs} · Policy
            reproduction: {active.audit.decisions}
          </p>
          <p>{active.audit.message}</p>
          {active.audit.firstMismatch && (
            <div role="alert">
              {active.audit.firstMismatch.decision === null
                ? 'Artifact'
                : `Decision ${active.audit.firstMismatch.decision + 1}`}{' '}
              · {active.audit.firstMismatch.path}
              {active.audit.firstMismatch.decision !== null && (
                <button onClick={() => move(active.audit.firstMismatch!.decision!)}>
                  Go to first mismatch
                </button>
              )}
              <pre>{json(active.audit.firstMismatch)}</pre>
            </div>
          )}
          <DecisionNavigator
            index={index}
            count={active.run.decisions.length}
            onMove={move}
            onBefore={() => {
              generation.current++;
              setBoundary('before');
              setPlaying(false);
            }}
            onAfter={() => {
              generation.current++;
              setBoundary('after');
              setPlaying(false);
            }}
          />
          <div className="policy-review-controls">
            <button
              disabled={!row}
              onClick={() => {
                generation.current++;
                setPlaying(!playing);
              }}
            >
              {playing ? 'Pause decisions' : 'Play decisions'}
            </button>
            <label>
              Speed{' '}
              <select
                aria-label="Playback speed"
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
              >
                {[0.5, 1, 2, 4, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} decisions / second
                  </option>
                ))}
              </select>
            </label>
            <label>
              Location{' '}
              <select
                aria-label="Rollout location"
                value={index}
                onChange={(event) => move(Number(event.target.value))}
              >
                {active.run.decisions.flatMap((r, i, rows) =>
                  i === 0 || r.marker !== rows[i - 1].marker || i === index
                    ? [
                        <option key={i} value={i}>
                          Decision {i + 1} · {r.marker}
                        </option>,
                      ]
                    : [],
                )}
              </select>
            </label>
          </div>
          {row && (
            <>
              <p data-testid="rollout-decision">
                Decision {index + 1} · {row.marker} · {boundary} · Replay units {row.before} →{' '}
                {row.after} · {row.accepted ? 'Accepted' : 'Rejected / error'}
              </p>
              {playbackError && <p role="alert">Playback unavailable: {playbackError}</p>}
              {playback !== null && renderState(playback)}
              <div className="policy-review-columns">
                <section>
                  <h2>Original policy knowledge</h2>
                  <p>This is the exact recorded input at this decision.</p>
                  <pre data-testid="policy-knowledge">{json(row.input)}</pre>
                </section>
                <section>
                  <h2>Original proposal</h2>
                  <pre data-testid="policy-proposal">
                    {json({
                      output: row.output,
                      accepted: row.accepted,
                      failureStage: row.failureStage,
                      error: row.error,
                    })}
                  </pre>
                </section>
              </div>
              <button onClick={() => setEvaluator(!evaluator)}>
                {evaluator ? 'Hide evaluator view' : 'Show evaluator view'}
              </button>
              {evaluator && (
                <section>
                  <h2>Privileged evaluator view</h2>
                  <p>
                    This reconstruction includes hidden state. It was not supplied to the policy.
                  </p>
                  {playback !== null ? (
                    <pre data-testid="evaluator-knowledge">{json(playback)}</pre>
                  ) : (
                    <p>Evaluator unavailable: playback could not reconstruct this boundary.</p>
                  )}
                </section>
              )}
            </>
          )}
          <details>
            <summary>Versions, configuration and provenance</summary>
            <pre>
              {json({
                game: active.run.game,
                identity: active.run.identity,
                policy: active.run.policy,
                options: active.run.options,
                provenance: active.run.provenance,
                digest: active.run.digest,
              })}
            </pre>
          </details>
          <div className="policy-review-controls">
            <button
              onClick={() =>
                download(
                  active.downloadName,
                  active.original,
                  isGzip(active.original) ? 'application/gzip' : 'application/json',
                )
              }
            >
              Download original rollout
            </button>
            <button onClick={() => download('replay.json', json(active.run.replay))}>
              Download replay
            </button>
            <button onClick={() => download('audit.json', json(active.audit))}>
              Download current audit
            </button>
          </div>
        </>
      )}
    </main>
  );
}
