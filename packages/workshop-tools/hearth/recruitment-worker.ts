import type {
  RecruitmentCase,
  RecruitmentMetrics,
} from '../../../src/engines/hearth/recruitment-experiment';
import type { Runtime } from './recruitment-runtime.ts';
import { caseSpec, objectValue, text } from './contracts.ts';
import { parentPort, workerData } from 'node:worker_threads';
import { openSync, closeSync, readFileSync, writeFileSync, writeSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const data = objectValue(workerData);
const moduleURL = text(data.moduleURL),
  output = text(data.output);
if (data.mode !== 'run' && data.mode !== 'audit') throw new Error('Unknown worker mode.');
const mode = data.mode;
const port = parentPort;
if (!port) throw new Error('Recruitment worker requires a parent port.');
// The pool supplies the bundle built from the declared, checked runtime entry.
const engine = (await import(moduleURL)) as Runtime;
const sha = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');
const write = (name: string, value: unknown) =>
  writeFileSync(
    resolve(output, name),
    (typeof value === 'string' ? value : JSON.stringify(value, null, 2)) + '\n',
    { flag: 'wx' },
  );
function run(spec: RecruitmentCase) {
  const fd = openSync(resolve(output, `${spec.id}.decisions.jsonl`), 'wx');
  let report;
  try {
    report = engine.runRecruitmentEpisode(spec, ({ input, ...trace }) => {
      writeSync(
        fd,
        JSON.stringify({ ...trace, inputDigest: input ? sha(JSON.stringify(input)) : null }) + '\n',
      );
    });
  } finally {
    closeSync(fd);
  }
  const { replay, ...receipt } = report;
  write(`${spec.id}.replay.json`, replay);
  write(`${spec.id}.receipt.json`, { ...receipt, replayDigest: sha(replay) });
  return {
    id: spec.id,
    status: receipt.status,
    error: receipt.error,
    replayVerified: receipt.replayVerified,
  };
}
function audit(spec: RecruitmentCase) {
  const hashes: Record<string, string> = {};
  const read = (suffix: string) => {
    const bytes = readFileSync(resolve(output, `${spec.id}.${suffix}`));
    hashes[suffix] = sha(bytes);
    return bytes.toString('utf8');
  };
  const raw = read('replay.json'),
    replay = engine.arenaSession.decode(raw).replay,
    receipt = objectValue(JSON.parse(read('receipt.json')));
  const rows = read('decisions.jsonl')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => objectValue(JSON.parse(line)));
  const check = (condition: unknown, message: unknown) => {
    if (!condition) throw new Error(`${spec.id}: ${String(message)}`);
  };
  check(sha(raw.trimEnd()) === receipt.replayDigest, 'receipt hash mismatch');
  check(JSON.stringify(spec) === JSON.stringify(receipt.spec), 'case mismatch');
  check(rows.length === replay.commands.length - 1, 'missing trace rows');
  check(
    JSON.stringify(replay.commands[0]) ===
      JSON.stringify({ type: 'configure', config: engine.recruitmentSetup(spec) }),
    'setup mismatch',
  );
  let session = engine.arenaSession.act(
    engine.arenaSession.create(spec.seed),
    replay.commands[0],
  ).session;
  let diagnostics = 0;
  const metrics: RecruitmentMetrics = {
    turns: [],
    upgrades: [],
    changedChoices: 0,
    interventions: {},
  };
  for (const row of rows) {
    const command = replay.commands[session.replay.commands.length];
    check(row.step === session.replay.commands.length, 'step mismatch');
    check(JSON.stringify(command) === JSON.stringify(row.command), 'command mismatch');
    const input = command.type === 'seat' ? engine.arenaFrame(session, command.seat) : null;
    check(
      (input ? sha(JSON.stringify(input)) : null) === row.inputDigest,
      `input mismatch at ${String(row.step)}`,
    );
    const controller =
      input && command.type === 'seat'
        ? command.seat === spec.seat
          ? spec.policy
          : session.state.arena.config!.seats[command.seat].style
        : null;
    check(controller === row.controller, 'controller binding mismatch');
    const focalDecision =
      input && command.type === 'seat' && command.seat === spec.seat
        ? engine.decideRecruitmentV2(input, spec.policy)
        : null;
    const decision =
      focalDecision ??
      (input && command.type === 'seat'
        ? engine.decideRecruitment(input, session.state.arena.config!.seats[command.seat].style)
        : null);
    check(
      JSON.stringify(decision) === JSON.stringify(row.decision),
      `decision/diagnostics mismatch at ${String(row.step)}`,
    );
    diagnostics += Number(!!focalDecision);
    if (focalDecision && input && command.type === 'seat') {
      const p = input.observation.self;
      if (command.action.type === 'endRecruit')
        metrics.turns.push({
          step: session.replay.commands.length,
          round: input.observation.round,
          hp: p.hp,
          gold: p.gold,
          tier: p.tier,
          board: p.board.length,
        });
      if (command.action.type === 'upgrade')
        metrics.upgrades.push({
          step: session.replay.commands.length,
          round: input.observation.round,
          cost: p.upgradeCost,
          tierBefore: p.tier,
          reason: focalDecision.reason,
        });
      if (
        JSON.stringify(command.action) !==
        JSON.stringify(focalDecision.diagnostics.legacyDecision.command)
      )
        metrics.changedChoices++;
      for (const intervention of focalDecision.diagnostics.interventions)
        if (intervention.selected)
          metrics.interventions[intervention.id] =
            (metrics.interventions[intervention.id] ?? 0) + 1;
    }
    const result = engine.arenaSession.act(session, command);
    check(!result.error, result.error);
    session = result.session;
    check(row.round === session.state.round, 'round mismatch');
    check(
      row.resolved === (command.type === 'seat' && session.state.phase !== 'recruit'),
      'resolution mismatch',
    );
  }
  check(
    JSON.stringify(session) === JSON.stringify(engine.arenaSession.decode(raw)),
    'final replay mismatch',
  );
  check(
    JSON.stringify(session.state.players.map((p) => p.placement)) ===
      JSON.stringify(receipt.placements),
    'placement mismatch',
  );
  check(JSON.stringify(metrics) === JSON.stringify(receipt.metrics), 'metric summary mismatch');
  check(
    receipt.status === 'complete' &&
      receipt.replayVerified &&
      ['won', 'lost'].includes(session.state.phase),
    'incomplete lobby',
  );
  check(
    receipt.commands === replay.commands.length && receipt.rounds === session.state.round,
    'lifecycle summary mismatch',
  );
  check(
    JSON.stringify(receipt.survivalRounds) ===
      JSON.stringify(session.state.players.map((p) => p.eliminatedRound ?? session.state.round)),
    'survival summary mismatch',
  );
  return { id: spec.id, decisions: rows.length, diagnostics, hashes };
}
port.on('message', (message: unknown) => {
  try {
    const spec = caseSpec(message, engine);
    port.postMessage({ result: mode === 'audit' ? audit(spec) : run(spec) });
  } catch (error) {
    port.postMessage({ error: String(error) });
  }
});
port.postMessage({ ready: true });
