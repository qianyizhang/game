import { isList, isRecord } from '../../../shared/json';
import {
  createController,
  CONTROL_VERSION,
  type Sight,
  type ControlTrace,
} from '../application/control';
import { recordedCommands, restoreChronicle } from '../application/chronicle';
import { POLICIES, POLICY_VERSION, createPolicy, type Decision } from './policy';
import { runEpisode, type EpisodeOptions, type EpisodeResult } from './benchmark';
import type { PlayerConfig } from './player';
import { policyDecision, policyOutput } from './policy-output';

export const ROLLOUT_VERSION = 'night-passage-rollout-1';
export interface PolicyPlayer {
  id: string;
  version: string;
  create: (config: PlayerConfig) => (input: Sight) => Decision;
}
export interface DecisionEvent {
  input: Sight;
  command: unknown;
  work: Decision['work'] | null;
  /** Replay units: one per discrete command or requested simulation tick, independent of packing. */
  before: number;
  after: number;
  maxTicks: number;
  accepted: boolean;
  error: string | null;
  timing: ControlTrace | null;
  failureStage?: 'factory' | 'decision' | 'output';
  rawOutput?: unknown;
}
export type EpisodeSummary = Omit<EpisodeResult, 'replay' | 'trace'>;
export interface Rollout {
  schema: typeof ROLLOUT_VERSION;
  episode: EpisodeSummary;
  replay: string;
  decisions: (DecisionEvent & { inputDigest: string })[];
  provenance: null | {
    sourceDigests: Record<string, string>;
    toolDigests: Record<string, string>;
    bundleDigest: string;
    runtime?: string;
  };
  digest: string;
}
export interface RolloutAudit {
  replay: 'passed' | 'failed';
  integrity: 'passed' | 'failed';
  inputs: 'passed' | 'failed' | 'unavailable';
  decisions: 'passed' | 'failed' | 'unavailable';
  firstMismatch: { decision: number | null; message: string } | null;
  scope: string;
  numericDrift: { count: number; tolerance: number; first: string | null };
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
function difference(a: unknown, b: unknown, path = '$'): string {
  if (same(a, b)) return '';
  if (isRecord(a) && isRecord(b)) {
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const found = difference(a[key], b[key], `${path}.${key}`);
      if (found) return found;
    }
  }
  if (isList(a) && isList(b)) {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const found = difference(a[i], b[i], `${path}[${i}]`);
      if (found) return found;
    }
  }
  return `${path}: recorded ${JSON.stringify(b)}, reconstructed ${JSON.stringify(a)}`;
}
export async function digest(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), (n) =>
    n.toString(16).padStart(2, '0'),
  ).join('');
}
const payload = ({ schema, episode, replay, decisions, provenance }: Omit<Rollout, 'digest'>) => ({
  schema,
  episode,
  replay,
  decisions,
  provenance,
});

/** Capture evaluator-owned inputs before calling policy code. Recording never enters the game save. */
export async function recordEpisode(
  options: EpisodeOptions,
  provenance: Rollout['provenance'] = null,
): Promise<Rollout> {
  if (!options.control || options.control === 'exact')
    throw new Error(
      'Rollout recording requires light, standard or heavy controls. Exact remains a replay-only diagnostic.',
    );
  const events: DecisionEvent[] = [];
  const result = runEpisode({
    ...options,
    includeReplay: true,
    includeTrace: false,
    onDecision: (event) => events.push(event),
  });
  const { replay, ...episode } = result;
  delete episode.trace;
  const decisions = [];
  for (const event of events) decisions.push({ ...event, inputDigest: await digest(event.input) });
  const data = payload({
    schema: ROLLOUT_VERSION,
    episode,
    replay: replay!,
    decisions,
    provenance,
  });
  return { ...data, digest: await digest(data) };
}

/** Narrow imported evidence before use. Semantic checks remain visible in the audit, not silently repaired. */
export function parseRollout(text: string): Rollout {
  const value: unknown = JSON.parse(text);
  if (
    !isRecord(value) ||
    value.schema !== ROLLOUT_VERSION ||
    !isRecord(value.episode) ||
    typeof value.replay !== 'string' ||
    typeof value.digest !== 'string' ||
    !isList(value.decisions) ||
    value.decisions.length > 300_000 ||
    !(value.provenance === null || isRecord(value.provenance))
  )
    throw new Error(
      'Unsupported or malformed rollout. Plain replays have no recorded policy knowledge.',
    );
  const e = value.episode;
  const versions = e.versions;
  if (
    typeof e.seed !== 'string' ||
    typeof e.policy !== 'string' ||
    !(e.error === null || typeof e.error === 'string') ||
    !['sword', 'spear', 'shield', 'bow', 'fists'].includes(String(e.weapon)) ||
    !['standard', 'veteran', 'ordeal'].includes(String(e.difficulty)) ||
    !['light', 'standard', 'heavy'].includes(String(e.control)) ||
    !['won', 'lost', 'timeout', 'error'].includes(String(e.status)) ||
    !isRecord(e.config) ||
    !isRecord(e.controlConfig) ||
    !isRecord(versions) ||
    !isRecord(e.budgets) ||
    ![e.score, e.elapsedTicks, e.actions, e.combatClears, e.region, e.chamber, e.hp].every(
      (n) => typeof n === 'number' && Number.isFinite(n),
    ) ||
    ![e.budgets.maxActions, e.budgets.maxTicks].every(
      (n) => typeof n === 'number' && Number.isSafeInteger(n) && n > 0,
    ) ||
    !['benchmark', 'engine', 'rules', 'content', 'api', 'score'].every(
      (key) => typeof versions[key] === 'string',
    )
  )
    throw new Error('Malformed rollout episode.');
  for (const row of value.decisions) {
    const work = isRecord(row) ? row.work : undefined;
    if (
      !isRecord(row) ||
      !isRecord(row.input) ||
      row.input.version !== CONTROL_VERSION ||
      !isRecord(row.input.perception) ||
      !isRecord(row.input.player) ||
      typeof row.input.phase !== 'string' ||
      ![
        row.input.region,
        row.input.chamber,
        row.input.perception.observedTick,
        row.input.perception.decisionTick,
        row.input.perception.ageTicks,
      ].every((n) => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0) ||
      typeof row.inputDigest !== 'string' ||
      typeof row.accepted !== 'boolean' ||
      !(row.error === null || typeof row.error === 'string') ||
      ![row.before, row.after, row.maxTicks].every(
        (n) => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0,
      ) ||
      !(
        work === null ||
        (isRecord(work) &&
          ['total', 'entities', 'geometry', 'candidates'].every(
            (key) => typeof work[key] === 'number' && Number.isSafeInteger(work[key]),
          ))
      ) ||
      !(
        row.timing === null ||
        (isRecord(row.timing) &&
          (row.timing.deliveryTick === null || typeof row.timing.deliveryTick === 'number'))
      )
    )
      throw new Error('Malformed rollout decision.');
  }
  return value as unknown as Rollout;
}

/** Uses recorded proposals, never the policy, to reconstruct inputs and executed replay. */
export async function auditRollout(
  rollout: Rollout,
  player?: PolicyPlayer,
  options: { continuousTolerance?: number } = {},
): Promise<RolloutAudit> {
  const tolerance = options.continuousTolerance ?? 0;
  if (!Number.isFinite(tolerance) || tolerance < 0 || tolerance > 1e-9)
    throw new Error('Continuous audit tolerance must be between zero and 1e-9.');
  const audit: RolloutAudit = {
    replay: 'failed',
    integrity: 'passed',
    inputs: 'unavailable',
    decisions: 'unavailable',
    firstMismatch: null,
    scope:
      'Current-code reconstruction and cooperative information-boundary check; not proof against hostile code. Policy reproduction uses the current matching implementation. Original inputs and source pins remain recorded evidence.',
    numericDrift: { count: 0, tolerance, first: null },
  };
  let decisionIndex: number | null = null;
  const equivalent = (a: unknown, b: unknown, path = '$'): boolean => {
    if (same(a, b)) return true;
    if (
      typeof a === 'number' &&
      typeof b === 'number' &&
      /\.(x|y|aim|vx|vy)$|\.projectileAngles\[\d+\]$/.test(path) &&
      Math.abs(a - b) <= tolerance &&
      tolerance > 0
    ) {
      audit.numericDrift.count++;
      audit.numericDrift.first ??= `Decision ${decisionIndex === null ? 'replay' : decisionIndex + 1}: ${path}: recorded ${b}, reconstructed ${a}`;
      return true;
    }
    if (isList(a) && isList(b))
      return a.length === b.length && a.every((v, i) => equivalent(v, b[i], `${path}[${i}]`));
    if (isRecord(a) && isRecord(b))
      return (
        Object.keys(a).length === Object.keys(b).length &&
        Object.keys(a).every(
          (key) => Object.hasOwn(b, key) && equivalent(a[key], b[key], `${path}.${key}`),
        )
      );
    return false;
  };
  const equivalentReplay = (a: string, b: string): boolean => {
    if (a === b) return true;
    // Packing can differ when runtimes round trigonometry differently. Compare executed inputs
    // over matching spans, with exact discrete commands, tick counts and button masks.
    const spans = (text: string) => {
      const value: unknown = JSON.parse(text);
      if (!isRecord(value) || !isList(value.commands)) throw new Error('Malformed replay spans.');
      return value.commands.map((c) =>
        isList(c)
          ? {
              ticks: Number(c[0]),
              frame: true,
              value: { x: c[1], y: c[2], aim: c[3], buttons: c[4] },
            }
          : { ticks: 1, frame: false, value: c },
      );
    };
    const left = spans(a),
      right = spans(b);
    let i = 0,
      j = 0;
    while (i < left.length && j < right.length) {
      if (left[i].frame !== right[j].frame || !equivalent(left[i].value, right[j].value))
        return false;
      const used = Math.min(left[i].ticks, right[j].ticks);
      left[i].ticks -= used;
      right[j].ticks -= used;
      if (left[i].ticks === 0) i++;
      if (right[j].ticks === 0) j++;
    }
    const l: unknown = JSON.parse(a),
      r: unknown = JSON.parse(b);
    if (!isRecord(l) || !isRecord(r)) return false;
    delete l.commands;
    delete r.commands;
    return i === left.length && j === right.length && same(l, r);
  };
  const mismatch = (decision: number | null, message: string) => {
    audit.firstMismatch ??= { decision, message };
  };
  if ((await digest(payload(rollout))) !== rollout.digest) {
    audit.integrity = 'failed';
    mismatch(null, 'Rollout digest mismatch.');
  }
  for (const [index, row] of rollout.decisions.entries()) {
    if ((await digest(row.input)) !== row.inputDigest) {
      audit.integrity = 'failed';
      mismatch(index, 'Recorded policy input digest mismatch.');
    }
  }
  try {
    const restored = restoreChronicle(rollout.replay);
    const e = rollout.episode,
      s = restored.state;
    if (
      s.seed !== e.seed ||
      s.rulesVersion !== e.versions.rules ||
      s.tick !== e.elapsedTicks ||
      s.player.hp !== e.hp ||
      s.region !== e.region ||
      s.chamber !== e.chamber
    )
      throw new Error('Replay does not match the episode result.');
    const controller = createController(e.seed, {
      rules: s.rulesVersion,
      preset: e.control as 'light' | 'standard' | 'heavy',
      config: e.controlConfig,
    });
    const start = recordedCommands(restored)[0];
    if (start?.type !== 'start' || !controller.step(start).accepted)
      throw new Error('Rollout must start with an accepted passage start.');
    if (!same(start.runes, e.runes) || e.profile !== 'fresh')
      throw new Error('Starting profile/runes mismatch.');
    const score = controller.result().score;
    if (score.version !== e.versions.score) throw new Error('Score identity mismatch.');
    audit.replay = 'passed';
    const builtIn = POLICIES.find((id) => id === e.policy);
    const matchedPlayer =
      player && player.id === e.policy && player.version === e.versions.engine ? player : null;
    const reproduce = Boolean(matchedPlayer || (builtIn && e.versions.engine === POLICY_VERSION));
    let decide: ReturnType<typeof createPolicy> | null = null;
    let factoryError: string | null = null;
    if (reproduce) {
      try {
        decide = matchedPlayer
          ? matchedPlayer.create({ ...e.config })
          : createPolicy(builtIn, e.config);
        if (typeof decide !== 'function')
          throw new Error('Policy factory must return a decision function.');
      } catch (cause) {
        factoryError = cause instanceof Error ? cause.message : String(cause);
      }
    }
    let unit = 1,
      accepted = 1;
    for (const [index, row] of rollout.decisions.entries()) {
      decisionIndex = index;
      if (!row.accepted && index !== rollout.decisions.length - 1)
        throw new Error('A failed policy decision must end its episode.');
      const input = controller.observe();
      const current = controller.result();
      if (
        accepted >= e.budgets.maxActions ||
        current.tick >= e.budgets.maxTicks ||
        ['won', 'lost'].includes(current.phase)
      ) {
        mismatch(
          index,
          'Recorded decision exceeds the episode budget or follows a terminal state.',
        );
        throw new Error('Episode stop conditions were exceeded.');
      }
      if (!equivalent(input, row.input)) {
        audit.inputs = 'failed';
        mismatch(
          index,
          'Recorded knowledge differs from the permitted controller observation. ' +
            difference(input, row.input),
        );
      }
      if (unit !== row.before || row.maxTicks !== e.budgets.maxTicks - current.tick) {
        audit.inputs = 'failed';
        mismatch(index, 'Decision replay boundary or tick budget mismatch.');
      }
      if (reproduce) {
        let stage: 'factory' | 'decision' | 'output' =
          factoryError !== null ? 'factory' : 'decision';
        let raw: unknown;
        try {
          if (factoryError !== null) throw new Error(factoryError);
          raw = decide!(structuredClone(row.input));
          stage = 'output';
          const expected = policyDecision(raw);
          if (!equivalent(expected.command, row.command) || !same(expected.work, row.work)) {
            audit.decisions = 'failed';
            mismatch(
              index,
              'Policy proposal or metered work does not reproduce. ' +
                difference(expected, { command: row.command, work: row.work }),
            );
          }
        } catch (cause) {
          if (
            row.command !== null ||
            row.error !== (cause instanceof Error ? cause.message : String(cause)) ||
            (row.failureStage ?? 'decision') !== stage ||
            (stage === 'output' && !same(row.rawOutput, policyOutput(raw)))
          ) {
            audit.decisions = 'failed';
            mismatch(index, 'Policy failure or malformed output does not reproduce.');
          }
        }
      }
      if (row.command === null) {
        if (
          row.accepted ||
          row.after !== unit ||
          e.status !== 'error' ||
          index !== rollout.decisions.length - 1
        )
          throw new Error(`Decision ${index}: invalid exception record.`);
        continue;
      }
      const result = controller.step(row.command, row.work?.total, row.maxTicks);
      const next = controller.result();
      unit +=
        isRecord(row.command) && row.command.type === 'frame'
          ? next.tick - current.tick
          : Number(result.accepted);
      if (result.accepted) accepted++;
      if (
        row.after !== unit ||
        row.accepted !== result.accepted ||
        row.error !== result.error ||
        !same(row.timing, result.trace)
      ) {
        mismatch(index, 'Action acceptance, timing or replay boundary does not reconstruct.');
        throw new Error(`Decision ${index}: action reconstruction mismatch.`);
      }
    }
    if (audit.inputs !== 'failed') audit.inputs = 'passed';
    if (reproduce && audit.decisions !== 'failed') audit.decisions = 'passed';
    const final = controller.result();
    if (e.error !== (rollout.decisions.at(-1)?.error ?? null))
      throw new Error('Episode error does not match its final decision.');
    const status =
      e.error !== null ? 'error' : ['won', 'lost'].includes(final.phase) ? final.phase : 'timeout';
    decisionIndex = null;
    if (
      !equivalentReplay(controller.exportReplay(), rollout.replay) ||
      final.score.value !== e.score ||
      final.score.combatClears !== e.combatClears ||
      final.difficulty !== e.difficulty ||
      final.player.weapon !== e.weapon ||
      final.contentVersion !== e.versions.content ||
      e.versions.api !== CONTROL_VERSION ||
      accepted !== e.actions ||
      accepted > e.budgets.maxActions ||
      (status === 'timeout' &&
        final.tick < e.budgets.maxTicks &&
        accepted < e.budgets.maxActions) ||
      status !== e.status ||
      !same(controller.metrics(), e.controlMetrics)
    )
      throw new Error('Recorded proposals do not reconstruct the replay or episode totals.');
  } catch (cause) {
    audit.replay = 'failed';
    mismatch(null, cause instanceof Error ? cause.message : String(cause));
  }
  return audit;
}
