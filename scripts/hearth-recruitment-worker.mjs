import { parentPort, workerData } from 'node:worker_threads';
import { openSync, closeSync, readFileSync, writeFileSync, writeSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const engine = await import(workerData.moduleURL);
const sha = (value) => createHash('sha256').update(value).digest('hex');
const write = (name, value) =>
  writeFileSync(
    resolve(workerData.output, name),
    (typeof value === 'string' ? value : JSON.stringify(value, null, 2)) + '\n',
    { flag: 'wx' },
  );
function run(spec) {
  const fd = openSync(resolve(workerData.output, `${spec.id}.decisions.jsonl`), 'wx');
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
function audit(spec) {
  const hashes = {};
  const read = (suffix) => {
    const bytes = readFileSync(resolve(workerData.output, `${spec.id}.${suffix}`));
    hashes[suffix] = sha(bytes);
    return bytes.toString('utf8');
  };
  const raw = read('replay.json'),
    replay = JSON.parse(raw),
    receipt = JSON.parse(read('receipt.json'));
  const rows = read('decisions.jsonl')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const check = (condition, message) => {
    if (!condition) throw new Error(`${spec.id}: ${message}`);
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
  const metrics = { turns: [], upgrades: [], changedChoices: 0, interventions: {} };
  for (const row of rows) {
    const command = replay.commands[session.replay.commands.length];
    check(row.step === session.replay.commands.length, 'step mismatch');
    check(JSON.stringify(command) === JSON.stringify(row.command), 'command mismatch');
    const input = command.type === 'seat' ? engine.arenaFrame(session, command.seat) : null;
    check(
      (input ? sha(JSON.stringify(input)) : null) === row.inputDigest,
      `input mismatch at ${row.step}`,
    );
    const controller = input
      ? command.seat === spec.seat
        ? spec.policy
        : session.state.arena.config.seats[command.seat].style
      : null;
    check(controller === row.controller, 'controller binding mismatch');
    const decision = input
      ? command.seat === spec.seat
        ? engine.decideRecruitmentV2(input, spec.policy)
        : engine.decideRecruitment(input, controller)
      : null;
    check(
      JSON.stringify(decision) === JSON.stringify(row.decision),
      `decision/diagnostics mismatch at ${row.step}`,
    );
    diagnostics += Number(!!decision?.diagnostics);
    if (decision?.diagnostics) {
      const p = input.observation.self;
      if (command.action.type === 'endRecruit')
        metrics.turns.push({
          step: row.step,
          round: input.observation.round,
          hp: p.hp,
          gold: p.gold,
          tier: p.tier,
          board: p.board.length,
        });
      if (command.action.type === 'upgrade')
        metrics.upgrades.push({
          step: row.step,
          round: input.observation.round,
          cost: p.upgradeCost,
          tierBefore: p.tier,
          reason: decision.reason,
        });
      if (
        JSON.stringify(command.action) !==
        JSON.stringify(decision.diagnostics.legacyDecision.command)
      )
        metrics.changedChoices++;
      for (const intervention of decision.diagnostics.interventions)
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
parentPort.on('message', (spec) => {
  try {
    const expected = engine.recruitmentCases(spec.cohort).find((row) => row.id === spec.id);
    if (JSON.stringify(expected) !== JSON.stringify(spec))
      throw new Error('Unknown or modified case.');
    parentPort.postMessage({ result: workerData.mode === 'audit' ? audit(spec) : run(spec) });
  } catch (error) {
    parentPort.postMessage({ error: String(error) });
  }
});
parentPort.postMessage({ ready: true });
