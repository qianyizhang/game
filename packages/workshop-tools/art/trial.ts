import { createHash, randomUUID } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, parse, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromRoot, reportFailure } from '../io.ts';
import { collectCredits, type CreditOptions } from './credits.ts';

// Historical v1 receipts keep the original contract regardless of future defaults.
const legacyLimits = Object.freeze({
  assetMinutes: 90,
  packageMinutes: 30,
  failedRevisions: 2,
  credits: 250,
});
type Limits = { [Key in keyof typeof legacyLimits]: number };
const freshnessMs = 120_000;
type ObjectValue = Record<string, unknown>;
type Entry = { previous: string; value: ObjectValue };
export const hash = (text: string) => createHash('sha256').update(text).digest('hex');
const encode = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
function object(value: unknown): ObjectValue {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected an object');
  return value as ObjectValue;
}
function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Expected nonempty text');
  return value;
}
function time(value: unknown): number {
  const source = text(value);
  const result = Date.parse(source);
  if (!Number.isFinite(result) || new Date(result).toISOString() !== source)
    throw new Error('Timestamps must be canonical UTC ISO strings');
  return result;
}
function strings(value: unknown): string[] {
  if (!Array.isArray(value) || !value.length) throw new Error('Expected a nonempty list');
  return value.map(text);
}
function finite(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
    throw new Error('Expected a finite nonnegative number');
  return value;
}
function pin(value: unknown): { path: string; sha256: string } {
  const data = object(value);
  const sha256 = text(data.sha256);
  if (!/^[a-f0-9]{64}$/.test(sha256)) throw new Error('Expected SHA-256');
  return { path: text(data.path), sha256 };
}
function participant(value: unknown) {
  const data = object(value);
  return { id: text(data.id), model: text(data.model), effort: text(data.effort) };
}
function policy(value: ObjectValue) {
  if (value.version === 1) {
    if (value.limits !== undefined || value.reserve !== undefined)
      throw new Error('Legacy v1 limits cannot be overridden');
    return { limits: legacyLimits, reserve: { minutes: 0, credits: 0 } };
  }
  const declared = object(value.limits);
  const limits = Object.fromEntries(
    Object.keys(legacyLimits).map((key) => {
      const amount = finite(declared[key]);
      if (amount === 0) throw new Error('Limits must be positive');
      return [key, amount];
    }),
  ) as Limits;
  if (!Number.isInteger(limits.failedRevisions))
    throw new Error('Failed revisions must be an integer');
  const held = object(value.reserve);
  const reserve = { minutes: finite(held.minutes), credits: finite(held.credits) };
  if (
    reserve.minutes <= 0 ||
    reserve.minutes >= limits.assetMinutes ||
    reserve.credits <= 0 ||
    reserve.credits >= limits.credits
  )
    throw new Error('Reserve must be positive and below the asset limits');
  return { limits, reserve };
}
function estimate(value: unknown) {
  const data = object(value);
  const minutes = finite(data.minutes);
  const credits = finite(data.credits);
  if (minutes === 0 || credits === 0) throw new Error('Step estimate must be positive');
  return { minutes, credits, basis: text(data.basis) };
}
function config(value: ObjectValue) {
  if (value.kind !== 'init' || (value.version !== 1 && value.version !== 2))
    throw new Error('Expected trial v1 or v2 init');
  policy(value);
  text(value.trial);
  text(value.asset);
  time(value.at);
  text(value.spec);
  if (!Array.isArray(value.baseline) || !value.baseline.length)
    throw new Error('Pin at least one baseline artifact');
  value.baseline.forEach(pin);
  const roles = object(value.roles);
  const author = participant(roles.author);
  const verifier = participant(roles.verifier);
  const director = participant(roles.director);
  if (new Set([author.id, verifier.id, director.id]).size !== 3)
    throw new Error('Author, verifier and director must be distinct');
  return { author, verifier, director };
}

type Package = {
  started: number;
  ended?: number;
  failures: number;
  brief: ObjectValue;
  clearance?: ObjectValue;
};
export function evaluate(values: ObjectValue[], now = Date.now()) {
  const initial = values[0];
  if (!initial) throw new Error('Empty trial');
  const roles = config(initial);
  let { limits, reserve } = policy(initial);
  const started = time(initial.at);
  let previousAt = started;
  let spec = text(initial.spec);
  let audited = false;
  let pausedAt: number | undefined;
  const pauses: { start: number; end: number }[] = [];
  const packages = new Map<string, Package>();
  let usage: { credits: number; through: number; complete: boolean; source: string } | undefined;
  let stopped = false;
  const reasons: string[] = [];
  for (const event of values.slice(1)) {
    const at = time(event.at);
    if (at < previousAt || at > now) throw new Error('Events must be ordered and not future dated');
    previousAt = at;
    switch (event.kind) {
      case 'allowance': {
        if (initial.version !== 2) throw new Error('Allowance extension: v2 required');
        const fields = [
          'kind',
          'at',
          'director',
          'credits',
          'reserveCredits',
          'authorization',
          'evidence',
        ];
        if (Object.keys(event).some((key) => !fields.includes(key)))
          throw new Error('Allowance may change only credits and credit reserve');
        if (event.director !== roles.director.id)
          throw new Error('Director must record allowance authorization');
        text(event.authorization);
        strings(event.evidence);
        const credits = finite(event.credits);
        const reserveCredits = finite(event.reserveCredits);
        if (credits <= limits.credits) throw new Error('Allowance must strictly increase credits');
        if (reserveCredits <= 0 || reserveCredits >= credits)
          throw new Error('Credit reserve must be positive and below the new allowance');
        limits = { ...limits, credits };
        reserve = { ...reserve, credits: reserveCredits };
        break;
      }
      case 'spec':
        if (event.director !== roles.director.id) throw new Error('Director must own spec changes');
        spec = text(event.text);
        text(event.reason);
        audited = false;
        break;
      case 'audit':
        if (event.reviewer !== roles.verifier.id || event.specHash !== hash(spec))
          throw new Error('Audit must come from the verifier and pin the current shared spec');
        strings(event.evidence);
        text(event.findings);
        if (typeof event.approved !== 'boolean') throw new Error('Audit needs approved boolean');
        audited = event.approved;
        break;
      case 'start': {
        if (!audited) throw new Error('Audit the specification before starting work');
        if (pausedAt !== undefined || stopped) throw new Error('Trial is paused or stopped');
        const id = text(event.package);
        if (packages.has(id)) throw new Error('Package IDs cannot restart their clocks');
        if ([...packages.values()].some((item) => item.ended === undefined))
          throw new Error('Integrate and clear the active package first');
        text(event.defect);
        strings(event.ownedPaths);
        text(event.interfaces);
        text(event.acceptance);
        if (initial.version === 2) estimate(event.estimate);
        packages.set(id, { started: at, failures: 0, brief: event });
        break;
      }
      case 'prototype-rejection': {
        if (initial.version === 1) throw new Error('Prototype rejection requires v2 or v3');
        const item = packages.get(text(event.package));
        if (!audited || !item || item.ended !== undefined || item !== [...packages.values()].at(-1))
          throw new Error('Prototype rejection needs the latest audited active package');
        if (
          ![roles.director.id, roles.verifier.id].includes(text(event.reviewer)) ||
          event.specHash !== hash(spec)
        )
          throw new Error(
            'Prototype rejection must name the director or verifier and current spec',
          );
        if (
          values
            .slice(0, values.indexOf(event))
            .some(
              (prior) =>
                prior.package === event.package &&
                (prior.kind === 'prototype' || prior.kind === 'review'),
            )
        )
          throw new Error('Opening prototype rejection must precede proof and candidate review');
        pin(event.source);
        const views = object(event.views);
        for (const view of ['whole', 'detail', 'motion']) pin(views[view]);
        text(event.critique);
        text(event.cause);
        text(event.correction);
        text(event.successEvidence);
        item.failures++;
        break;
      }
      case 'review': {
        if (!audited) throw new Error('Audit the current specification before review');
        const item = packages.get(text(event.package));
        if (!item || item.ended !== undefined) throw new Error('Review needs an active package');
        if (event.reviewer !== roles.verifier.id || event.specHash !== hash(spec))
          throw new Error('Review must pin the shared spec and name the independent verifier');
        pin(event.candidate);
        strings(event.evidence);
        text(event.critique);
        if (event.verdict === 'clear') {
          item.ended = at;
          item.clearance = event;
        } else if (event.verdict === 'fail') item.failures++;
        else throw new Error('Review verdict must be clear or fail');
        break;
      }
      case 'usage': {
        const credits = finite(event.credits);
        const through = time(event.through);
        if (through > at || through < started || (usage && through < usage.through))
          throw new Error('Usage coverage must advance within the trial');
        if (usage && credits < usage.credits) throw new Error('Cumulative credits cannot decrease');
        if (event.coverage !== 'complete' && event.coverage !== 'partial')
          throw new Error('Usage needs complete or partial coverage');
        usage = {
          credits,
          through,
          complete: event.coverage === 'complete',
          source: text(event.source),
        };
        break;
      }
      case 'pause':
        if (pausedAt !== undefined || event.reason !== 'user-wait')
          throw new Error('Only a documented user-wait pause is excluded');
        text(event.evidence);
        pausedAt = at;
        break;
      case 'resume':
        if (pausedAt === undefined) throw new Error('No pause to resume');
        pauses.push({ start: pausedAt, end: at });
        pausedAt = undefined;
        break;
      case 'intervention':
        text(event.actor);
        text(event.model);
        text(event.effort);
        text(event.detail);
        strings(event.evidence);
        break;
      case 'stop':
        text(event.reason);
        strings(event.evidence);
        stopped = true;
        break;
      default:
        throw new Error(`Unknown event kind: ${String(event.kind)}`);
    }
  }
  if (now < previousAt) throw new Error('Evaluation predates trial history');
  if (pausedAt !== undefined) pauses.push({ start: pausedAt, end: now });
  const elapsed = (start: number, end: number) =>
    (end -
      start -
      pauses.reduce(
        (total, p) => total + Math.max(0, Math.min(end, p.end) - Math.max(start, p.start)),
        0,
      )) /
    60_000;
  const minutes = elapsed(started, now);
  if (stopped) reasons.push('Trial explicitly stopped');
  if (pausedAt !== undefined) reasons.push('Waiting for user');
  if (minutes >= limits.assetMinutes) reasons.push('Asset time cap reached');
  if (!usage || !usage.complete || now - usage.through > freshnessMs)
    reasons.push('Complete cumulative usage must be refreshed within 120 seconds');
  if (usage && usage.credits >= limits.credits) reasons.push('Asset credit cap reached');
  const reserveReasons: string[] = [];
  if (initial.version === 2) {
    if (minutes >= limits.assetMinutes - reserve.minutes)
      reserveReasons.push('Reserved final-review time reached');
    if (usage && usage.credits >= limits.credits - reserve.credits)
      reserveReasons.push('Reserved final-review credits reached');
  }
  const work = [...packages.entries()].map(([id, item]) => {
    const packageMinutes = elapsed(item.started, item.ended ?? now);
    if (packageMinutes >= limits.packageMinutes) reasons.push(`${id}: package time cap reached`);
    if (item.failures >= limits.failedRevisions) reasons.push(`${id}: failed revision cap reached`);
    return {
      id,
      minutes: packageMinutes,
      failures: item.failures,
      cleared: item.ended !== undefined,
      brief: item.brief,
      clearance: item.clearance,
    };
  });
  const reviewReasons = [...reasons];
  reasons.push(...reserveReasons);
  return {
    trial: initial.trial,
    asset: initial.asset,
    spec,
    specHash: hash(spec),
    roles,
    audited,
    minutes,
    usage,
    packages: work,
    limits,
    reserve,
    remaining: {
      minutes: limits.assetMinutes - minutes,
      credits: usage ? limits.credits - usage.credits : null,
    },
    reasons,
    allowed: reasons.length === 0,
    reviewReasons,
    reviewAllowed: reviewReasons.length === 0,
    reserveReached: reserveReasons.length > 0,
  };
}

async function noSymlinks(path: string) {
  let current = resolve(path);
  const root = parse(current).root;
  while (current !== root) {
    const info = await lstat(current).catch((error: unknown) => {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')
        return undefined;
      throw error;
    });
    if (info?.isSymbolicLink()) throw new Error('Trial paths must not contain symlinks');
    current = dirname(current);
  }
}
const receiptName = (index: number) => `${String(index).padStart(6, '0')}.json`;
export async function load(directory: string) {
  await noSymlinks(directory);
  const files = (await readdir(directory)).filter((name) => /^\d+\.json$/.test(name)).sort();
  const values: ObjectValue[] = [];
  let previous = '';
  for (const [index, file] of files.entries()) {
    if (file !== receiptName(index)) throw new Error('Missing or reordered trial receipts');
    const path = resolve(directory, file);
    await noSymlinks(path);
    const bytes = await readFile(path, 'utf8');
    const receipt = object(JSON.parse(bytes));
    if (receipt.previous !== previous) throw new Error('Trial receipt hash chain changed');
    values.push(object(receipt.value));
    previous = hash(bytes);
  }
  evaluate(values);
  return { values, previous };
}
async function verifyPins(event: ObjectValue) {
  if (event.kind === 'prototype-rejection') {
    await verifyPins({
      kind: 'init',
      baseline: [
        event.source,
        ...['whole', 'detail', 'motion'].map((view) => object(event.views)[view]),
      ],
    });
    return;
  }
  const pins =
    event.kind === 'init' ? event.baseline : event.kind === 'review' ? [event.candidate] : [];
  if (!Array.isArray(pins)) throw new Error('Expected artifact pins');
  for (const value of pins) {
    const artifact = pin(value);
    const bytes = await readFile(fromRoot(artifact.path));
    if (createHash('sha256').update(bytes).digest('hex') !== artifact.sha256)
      throw new Error(`Artifact pin changed: ${artifact.path}`);
  }
}
export async function initialize(directory: string, value: ObjectValue) {
  evaluate([value]);
  await verifyPins(value);
  await noSymlinks(directory);
  await mkdir(directory); // Deliberately exclusive; the parent must already exist.
  const receipt: Entry = { previous: '', value };
  await writeFile(resolve(directory, receiptName(0)), encode(receipt), { flag: 'wx' });
}
export async function record(directory: string, value: ObjectValue) {
  const ledger = await load(directory);
  // Fresh dispatches are denied at a cap; late evidence and telemetry remain recordable.
  if (value.kind === 'start') {
    const gate = evaluate(ledger.values);
    if (!gate.allowed) throw new Error(gate.reasons.join('; '));
    if (ledger.values[0]?.version === 2) {
      const next = estimate(value.estimate);
      if (
        next.minutes > gate.limits.packageMinutes ||
        next.minutes + gate.reserve.minutes >= gate.remaining.minutes ||
        gate.remaining.credits === null ||
        next.credits + gate.reserve.credits >= gate.remaining.credits
      )
        throw new Error(
          'Whole-step estimate does not fit remaining allowance plus final-review reserve',
        );
    }
  }
  evaluate([...ledger.values, value]);
  await verifyPins(value);
  await writeFile(
    resolve(directory, receiptName(ledger.values.length)),
    encode({ previous: ledger.previous, value }),
    { flag: 'wx' },
  );
}

export async function refreshCredits(directory: string, root: string, sessionRoots?: string[]) {
  const ledger = await load(directory);
  const initial = ledger.values[0];
  const options: CreditOptions = { root, since: text(initial.at), sessionRoots };
  const report = await collectCredits(options);
  for (const event of ledger.values) {
    if (event.kind !== 'usage' || !event.accounting) continue;
    const accounting = object(event.accounting);
    if (accounting.root !== root || accounting.rateCardHash !== report.rateCard.sha256)
      throw new Error(
        'Accounting root/rates changed; reconcile explicitly without resetting totals',
      );
  }
  const output = resolve(directory, `usage-${randomUUID()}.json`);
  const bytes = encode(report);
  await writeFile(output, bytes, { flag: 'wx' });
  await record(directory, {
    kind: 'usage',
    at: new Date().toISOString(),
    through: report.through,
    credits: report.credits,
    coverage: report.coverage,
    source: output,
    accounting: {
      root,
      rateCardHash: report.rateCard.sha256,
      reportHash: hash(bytes),
      scope: report.coverageScope,
    },
  });
  return {
    output,
    credits: report.credits,
    coverage: report.coverage,
    responses: report.records.length,
    gaps: report.gaps,
    inFlightTurns: report.inFlightTurns.length,
  };
}

export function handoff(values: ObjectValue[], role: string, now = Date.now()) {
  const state = evaluate(values, now);
  if (!['auditor', 'author', 'verifier', 'director'].includes(role))
    throw new Error('Unknown role');
  const reviewRole = role === 'verifier' || role === 'director';
  if (!(reviewRole ? state.reviewAllowed : state.allowed))
    throw new Error((reviewRole ? state.reviewReasons : state.reasons).join('; '));
  if (role !== 'auditor' && role !== 'director' && !state.audited)
    throw new Error('Specification audit is required');
  const active = state.packages.find((item) => !item.cleared);
  const latest = state.packages.at(-1);
  const closeout = role === 'verifier' && !active;
  if (role === 'author' && !active) throw new Error('Start a bounded package first');
  if (closeout && (!latest?.cleared || latest.clearance?.specHash !== state.specHash))
    throw new Error('Verifier closeout requires the latest package cleared under the current spec');
  const instructions: Record<string, string> = {
    auditor:
      'Audit this specification for ambiguity, feasibility, whole-creature identity, attachment/motion interfaces, ownership and observable acceptance. Return findings and an approved/rejected audit pinned to specHash. Do not author geometry.',
    author:
      "You own only the active package paths and are not alone in the codebase. Preserve others' edits. Reuse the pinned baseline and execute the specified import/save, native edit and export. Capture additional baseline evidence only for a named missing or changed requirement; reuse unchanged captures. Inspect clay and motion, then freeze a candidate manifest plus captures. Keep self-assessment separate for the verifier to read after independently inspecting the candidate.",
    verifier:
      'Independently inspect candidate pixels before reading author self-assessment. Inspect matched whole-creature clay views and early motion probes. Run existing gates and prepare pinned evidence. Return clear/fail plus view / visible defect / intended correction. You may clear this package or request repair within budget; author no geometry and do not lower the spec.',
    director:
      'Resolve ambiguity and representation choices; record any takeover with model/effort and evidence. Review the final source and consumer pixels independently. Existing native/export/browser/publication gates still apply. Verifier clearance is not final acceptance or user approval.',
  };
  const reserveInstruction = state.reserveReached
    ? '\n\nReview-only reserve: inspect and integrate the already frozen candidate, record evidence and close out. Do not model, repair, start another package or dispatch an author. If review fails, preserve the failure and report the bounded result.'
    : '';
  const assignment = closeout
    ? 'Verifier closeout: operate only on the latest cleared package and its pinned candidate. Run outstanding existing checks, prepare one evidence packet and record closeout. Do not model, repair, start another package or dispatch an author. Clearance and this handoff cannot grant or stand in for Astra parent acceptance. Publish only after actual Astra acceptance of these exact source, delivery and evidence bytes; preserve the existing release reviewer.role parent schema. Perform cleanup only within existing retention authority and commit only explicitly owned paths. If checks fail or bytes change, preserve evidence and return to the director.'
    : instructions[role];
  const mode = closeout ? 'closeout' : active ? 'active-package' : 'specification';
  return `# ${String(state.asset)} — ${role}\n\nShared specification SHA-256: ${state.specHash}\n\n${state.spec}\n\n## Assignment\n\n${assignment}${reserveInstruction}\n\n${JSON.stringify({ mode, roles: state.roles, activePackage: active ?? null, clearedPackage: closeout ? latest : null, limits: state.limits, reserve: state.reserve, remaining: state.remaining, elapsedMinutes: state.minutes, cumulativeUsage: state.usage }, null, 2)}\n\nRead docs/art/delegation.md. The reviewer/operations role alone runs existing credits/status at dispatch, repair and closeout checkpoints; the director consumes its receipt and owns budget decisions. Reuse one fresh snapshot; no duplicate parent/helper polling. Return one completion or failure packet. Report shared-tool failures with a concise diagnosis and proposed fix to the director before editing shared tools; asset-local fixes stay within owned paths. All roles, renders and rework share the same asset cap; restarts and takeovers never reset it. At a cap freeze evidence and report the bounded unfinished result.\n`;
}

export async function runCli(args: string[]) {
  const [command, directoryArg, input, ...extra] = args;
  if (command === '--help') {
    console.log(
      'trial.ts init DIR config.json | record DIR event.json | credits DIR ROOT_THREAD_UUID | status DIR | handoff DIR auditor|author|verifier|director\ncredits collects offline pinned-rate usage and appends a receipt; exits 2 for partial coverage or a blocked gate. Paths resolve from the repository. status exits 2 when dispatch is blocked; malformed data exits 1. See docs/art/delegation.md.',
    );
    return;
  }
  if (!command || !directoryArg || extra.length) throw new Error('Use --help for trial commands');
  const directory = fromRoot(directoryArg);
  if (command === 'init' || command === 'record') {
    if (!input) throw new Error('Provide a JSON input file');
    const value = object(JSON.parse(await readFile(fromRoot(input), 'utf8')));
    if (command === 'init') await initialize(directory, value);
    else await record(directory, value);
    console.log(`Recorded ${String(value.kind)} in ${directory}`);
  } else if (command === 'credits' && input) {
    console.log(JSON.stringify(await refreshCredits(directory, input), null, 2));
    const state = evaluate((await load(directory)).values);
    if (!state.allowed) {
      console.error(state.reasons.join('; '));
      process.exitCode = 2;
    }
  } else if (command === 'status' && !input) {
    const state = evaluate((await load(directory)).values);
    console.log(JSON.stringify(state, null, 2));
    if (!state.allowed) process.exitCode = 2;
  } else if (command === 'handoff' && input) {
    console.log(handoff((await load(directory)).values, input));
  } else throw new Error('Use --help for trial commands');
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await runCli(process.argv.slice(2)).catch(reportFailure);
