import type {
  DecisionRecord,
  EpisodeAdapter,
  EpisodeOptions,
  Json,
  JsonObject,
  PolicyAudit,
  PolicyFactory,
  PolicyRollout,
  Proposal,
} from './types';
export type { PolicyAudit, PolicyRollout } from './types';

/** Reject lossy JSON rather than silently dropping undefined fields or nonfinite values. */
export function jsonValue(value: unknown): Json {
  const seen = new Set<object>();
  const visit = (v: unknown): Json => {
    if (v === null || typeof v === 'string' || typeof v === 'boolean') return v;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v !== 'object' || seen.has(v)) throw new Error('Value is not finite JSON.');
    seen.add(v);
    let result: Json;
    if (Array.isArray(v)) result = v.map(visit);
    else {
      if (Object.getPrototypeOf(v) !== Object.prototype && Object.getPrototypeOf(v) !== null)
        throw new Error('Value must contain only plain JSON objects.');
      result = Object.fromEntries(Object.entries(v).map(([k, item]) => [k, visit(item)]));
    }
    seen.delete(v);
    return result;
  };
  return visit(value);
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const issue = (error: unknown) => (error instanceof Error ? error.message : String(error));
export async function digest(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('');
}
function rawOutput(output: unknown): Json {
  try {
    return jsonValue(output);
  } catch {
    return { unsupported: true, type: typeof output };
  }
}
function proposal<C>(value: unknown, valid: (v: unknown) => v is C): Proposal<C> {
  if (!value || typeof value !== 'object') throw new Error('Policy must return a proposal object.');
  const p = value as Partial<Proposal<C>>;
  if (!valid(p.command) || !Number.isSafeInteger(p.work) || p.work! < 0 || p.work! > 1_000_000_000)
    throw new Error('Invalid policy command or deterministic work.');
  jsonValue(p);
  return p as Proposal<C>;
}
function validOptions(o: EpisodeOptions) {
  if (
    typeof o.seed !== 'string' ||
    !o.seed ||
    o.seed.length > 64 ||
    typeof o.policySeed !== 'string' ||
    !o.policySeed ||
    o.policySeed.length > 64 ||
    !Number.isSafeInteger(o.maxDecisions) ||
    o.maxDecisions < 1 ||
    o.maxDecisions > 10000
  )
    throw new Error('Invalid episode seed or decision budget (1–10000).');
  for (const v of [o.setup, o.policyOptions])
    if (!v || Array.isArray(v) || typeof v !== 'object')
      throw new Error('Configuration must be an object.');
  jsonValue(o);
}
export async function recordEpisode<S, O, C>(
  adapter: EpisodeAdapter<S, O, C>,
  factory: PolicyFactory<O, C>,
  options: EpisodeOptions,
  provenance: JsonObject = {},
): Promise<PolicyRollout> {
  validOptions(options);
  const fixed = structuredClone(options);
  let state = adapter.create(fixed.seed, structuredClone(fixed.setup));
  const records: DecisionRecord[] = [];
  let decide: ((input: O) => Proposal<C>) | undefined;
  let work = 0;
  let failed = false;
  while (!adapter.terminal(state) && records.length < fixed.maxDecisions) {
    const observation = adapter.observe(state);
    const input = jsonValue(observation);
    const row: DecisionRecord = {
      index: records.length,
      marker: adapter.marker(state),
      before: adapter.cursor(state),
      after: adapter.cursor(state),
      input,
      inputDigest: await digest(input),
      output: null,
      accepted: false,
      error: null,
      failureStage: null,
    };
    let stage: DecisionRecord['failureStage'] = 'factory';
    try {
      decide ??= factory.create({
        setup: structuredClone(fixed.setup),
        policySeed: fixed.policySeed,
        options: structuredClone(fixed.policyOptions),
      });
      stage = 'decision';
      const output: unknown = decide(structuredClone(observation));
      row.output = rawOutput(output);
      stage = 'output';
      const p = proposal(output, adapter.isCommand);
      if (!Number.isSafeInteger(work + p.work))
        throw new Error('Episode work exceeds safe integer.');
      work += p.work;
      stage = 'command';
      const next = adapter.act(state, p.command);
      if (next.error !== undefined) throw new Error(next.error);
      state = next.state;
      row.accepted = true;
      row.after = adapter.cursor(state);
    } catch (error) {
      row.error = issue(error);
      row.failureStage = stage;
      failed = true;
    }
    records.push(row);
    if (failed) break;
  }
  const payload: Omit<PolicyRollout, 'digest'> = {
    schema: 'policy-rollout-1',
    game: adapter.game,
    identity: jsonValue(adapter.identity) as JsonObject,
    policy: { id: factory.id, version: factory.version },
    options: fixed,
    provenance: jsonValue(provenance) as JsonObject,
    decisions: records,
    episode: {
      status: failed ? 'error' : adapter.terminal(state) ? 'terminal' : 'timeout',
      metrics: jsonValue(adapter.metrics(state)) as JsonObject,
      decisions: records.length,
      work,
      cursor: adapter.cursor(state),
    },
    replay: jsonValue(adapter.replay(state)),
  };
  return { ...payload, digest: await digest(payload) };
}
export function parseRollout(text: string): PolicyRollout {
  if (text.length > 150_000_000) throw new Error('Rollout exceeds 150 MB.');
  const v = JSON.parse(text) as Partial<PolicyRollout>;
  if (
    !v ||
    v.schema !== 'policy-rollout-1' ||
    typeof v.game !== 'string' ||
    !v.identity ||
    !v.policy ||
    typeof v.policy.id !== 'string' ||
    typeof v.policy.version !== 'string' ||
    !v.options ||
    !v.episode ||
    !Array.isArray(v.decisions) ||
    typeof v.digest !== 'string' ||
    v.decisions.length > 10000 ||
    !('replay' in v)
  )
    throw new Error('Unsupported rollout envelope.');
  validOptions(v.options);
  if (
    !['terminal', 'timeout', 'error'].includes(v.episode.status) ||
    !v.episode.metrics ||
    typeof v.episode.metrics !== 'object' ||
    Array.isArray(v.episode.metrics) ||
    !Number.isSafeInteger(v.episode.decisions) ||
    v.episode.decisions < 0 ||
    !Number.isSafeInteger(v.episode.work) ||
    v.episode.work < 0 ||
    !Number.isSafeInteger(v.episode.cursor) ||
    v.episode.cursor < 0
  )
    throw new Error('Invalid episode result. Original file remains available for recovery.');
  jsonValue(v);
  for (const row of v.decisions) {
    if (
      !row ||
      typeof row !== 'object' ||
      typeof row.marker !== 'string' ||
      !Number.isSafeInteger(row.index) ||
      !Number.isSafeInteger(row.before) ||
      !Number.isSafeInteger(row.after) ||
      typeof row.inputDigest !== 'string' ||
      !('input' in row) ||
      !('output' in row) ||
      typeof row.accepted !== 'boolean' ||
      (row.error !== null && typeof row.error !== 'string') ||
      ![null, 'factory', 'decision', 'output', 'command'].includes(row.failureStage)
    )
      throw new Error('Invalid decision row. Original file remains available for recovery.');
  }
  return v as PolicyRollout;
}

/** Reconstruct proposals first. Policy reproduction never executes game transitions. */
export async function auditRollout<S, O, C>(
  adapter: EpisodeAdapter<S, O, C>,
  run: PolicyRollout,
  factory?: PolicyFactory<O, C>,
): Promise<PolicyAudit> {
  const audit: PolicyAudit = {
    integrity: 'unavailable',
    replay: 'unavailable',
    inputs: 'unavailable',
    decisions: 'unavailable',
    firstMismatch: null,
    message: '',
  };
  const mismatch = (decision: number | null, path: string, expected: unknown, actual: unknown) => {
    audit.firstMismatch ??= {
      decision,
      path,
      expected: rawOutput(expected),
      actual: rawOutput(actual),
    };
  };
  try {
    validOptions(run.options);
    const { digest: claimed, ...payload } = run;
    audit.integrity = (await digest(payload)) === claimed ? 'passed' : 'failed';
    if (audit.integrity === 'failed') mismatch(null, 'digest', await digest(payload), claimed);
    for (const row of run.decisions)
      if ((await digest(row.input)) !== row.inputDigest) {
        audit.integrity = 'failed';
        mismatch(row.index, 'inputDigest', await digest(row.input), row.inputDigest);
      }
    if (run.game !== adapter.game || !same(run.identity, adapter.identity))
      throw new Error('Game/rules/content/API identity unavailable in this runtime.');
    let state = adapter.create(run.options.seed, structuredClone(run.options.setup));
    let work = 0;
    let failed = false;
    let inputsPassed = true;
    for (const [index, row] of run.decisions.entries()) {
      if (failed || adapter.terminal(state) || index >= run.options.maxDecisions)
        throw new Error(`Decision ${index + 1} follows an episode stop.`);
      for (const [path, expected, actual] of [
        ['index', index, row.index],
        ['before', adapter.cursor(state), row.before],
        ['marker', adapter.marker(state), row.marker],
      ] as const)
        if (!same(expected, actual)) {
          mismatch(index, path, expected, actual);
          throw new Error(`Decision ${index + 1}: ${path} mismatch.`);
        }
      const permitted = jsonValue(adapter.observe(state));
      if (!same(permitted, row.input)) {
        inputsPassed = false;
        audit.inputs = 'failed';
        mismatch(index, 'input', permitted, row.input);
      }
      if (['factory', 'decision', 'output'].includes(row.failureStage ?? '')) {
        if (row.error === null || row.accepted || row.after !== row.before)
          throw new Error(`Decision ${index + 1}: invalid failed proposal boundary.`);
        if (row.failureStage === 'output') {
          let rejected = false;
          try {
            proposal(row.output, adapter.isCommand);
          } catch {
            rejected = true;
          }
          if (!rejected) throw new Error('Claimed malformed output is valid.');
        }
        failed = true;
      } else {
        const p = proposal(row.output, adapter.isCommand);
        work += p.work;
        const next = adapter.act(state, p.command);
        const error = next.error ?? null;
        if (
          error !== row.error ||
          row.accepted !== (error === null) ||
          row.failureStage !== (error === null ? null : 'command')
        ) {
          mismatch(index, 'acceptance', { error, accepted: error === null }, row);
          throw new Error(`Decision ${index + 1}: acceptance mismatch.`);
        }
        if (error !== null) failed = true;
        else state = next.state;
      }
      if (adapter.cursor(state) !== row.after) {
        mismatch(index, 'after', adapter.cursor(state), row.after);
        throw new Error('Replay span mismatch.');
      }
    }
    const episode = {
      status: failed ? 'error' : adapter.terminal(state) ? 'terminal' : 'timeout',
      metrics: jsonValue(adapter.metrics(state)),
      decisions: run.decisions.length,
      work,
      cursor: adapter.cursor(state),
    };
    if (episode.status === 'timeout' && run.decisions.length !== run.options.maxDecisions)
      throw new Error('Episode stopped before its declared budget or terminal outcome.');
    if (!same(episode, run.episode)) {
      mismatch(null, 'episode', episode, run.episode);
      throw new Error('Episode result mismatch.');
    }
    if (!same(jsonValue(adapter.replay(state)), run.replay)) {
      mismatch(null, 'replay', adapter.replay(state), run.replay);
      throw new Error('Accepted-command replay mismatch.');
    }
    // Exercise the delivered replay decoder independently of recorded policy proposals.
    const restored = adapter.restore(run.replay);
    if (
      !same(adapter.metrics(restored), run.episode.metrics) ||
      adapter.cursor(restored) !== run.episode.cursor
    )
      throw new Error('Delivered replay does not reconstruct final metrics/cursor.');
    audit.replay = 'passed';
    audit.inputs = inputsPassed ? 'passed' : 'failed';
  } catch (error) {
    audit.replay = 'failed';
    audit.message = issue(error);
  }
  if (!factory || factory.id !== run.policy.id || factory.version !== run.policy.version) {
    audit.message ||=
      'Matching policy unavailable; accepted-command and input checks are independent.';
    return audit;
  }
  // An incomplete replay cannot establish complete policy reproduction coverage.
  if (audit.replay !== 'passed') return audit;
  try {
    let decide: ((input: O) => Proposal<C>) | undefined;
    for (const row of run.decisions) {
      let stage: DecisionRecord['failureStage'] = 'factory';
      let output: Json = null;
      let error: string | null = null;
      try {
        decide ??= factory.create({
          setup: structuredClone(run.options.setup),
          policySeed: run.options.policySeed,
          options: structuredClone(run.options.policyOptions),
        });
        stage = 'decision';
        const value: unknown = decide(structuredClone(row.input) as O);
        output = rawOutput(value);
        stage = 'output';
        proposal(value, adapter.isCommand);
        stage = null;
      } catch (e) {
        error = issue(e);
      }
      const recordedPolicyStage = row.failureStage === 'command' ? null : row.failureStage;
      const recordedError = row.failureStage === 'command' ? null : row.error;
      if (!same(output, row.output) || stage !== recordedPolicyStage || error !== recordedError) {
        mismatch(
          row.index,
          'policyOutput',
          { output, stage, error },
          { output: row.output, stage: recordedPolicyStage, error: recordedError },
        );
        throw new Error(`Decision ${row.index + 1}: policy output mismatch.`);
      }
    }
    audit.decisions = 'passed';
  } catch (error) {
    audit.decisions = 'failed';
    audit.message = issue(error);
  }
  audit.message ||=
    'Complete checks finished. Input reconstruction does not prove hostile-code isolation.';
  return audit;
}
