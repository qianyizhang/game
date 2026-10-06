import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { withHearthRuntime } from './hearth-runtime.mjs';

const [directory, ...extra] = process.argv.slice(2);
if (!directory || extra.length)
  throw new Error('Usage: node scripts/hearth-arena-audit.mjs <experiment-directory>');
const root = resolve(directory);
const sha = (value) => createHash('sha256').update(value).digest('hex');
const names = (await readdir(root)).filter((name) => name.endsWith('.replay.json')).sort();
if (!names.length) throw new Error('No episode replays found.');
const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'));
const started = performance.now();
await withHearthRuntime(async ({ arenaSessionV1: arenaSession, arenaFrame, decideRecruitment }) => {
  let decisions = 0;
  const artifacts = {};
  for (const name of names) {
    const id = name.replace('.replay.json', '');
    const read = async (suffix) => {
      const bytes = await readFile(resolve(root, `${id}.${suffix}`));
      artifacts[`${id}.${suffix}`] = sha(bytes);
      return bytes.toString('utf8');
    };
    const raw = await read('replay.json');
    const replay = JSON.parse(raw);
    const receipt = JSON.parse(await read('receipt.json'));
    const trace = (await read('decisions.jsonl'))
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    const check = (condition, reason) => {
      if (!condition) throw new Error(`${id}: ${reason}`);
    };
    check(sha(raw.trimEnd()) === receipt.replayDigest, 'replay receipt hash mismatch');
    check(trace.length === replay.commands.length - 1, 'missing decision rows');
    let session = arenaSession.create(replay.seed);
    session = arenaSession.act(session, replay.commands[0]).session;
    for (const row of trace) {
      const command = replay.commands[session.replay.commands.length];
      check(row.step === session.replay.commands.length, 'step mismatch');
      check(JSON.stringify(command) === JSON.stringify(row.command), 'command mismatch');
      const input = command.type === 'seat' ? arenaFrame(session, command.seat) : null;
      check(
        (input ? sha(JSON.stringify(input)) : null) === row.inputDigest,
        `input digest mismatch at ${row.step}`,
      );
      const decision = input
        ? decideRecruitment(input, session.state.arena.config.seats[command.seat].style)
        : null;
      check(
        JSON.stringify(decision) === JSON.stringify(row.decision),
        `decision mismatch at ${row.step}`,
      );
      const result = arenaSession.act(session, command);
      check(!result.error, result.error);
      session = result.session;
      check(row.round === session.state.round, 'round mismatch');
      check(
        row.resolved === (command.type === 'seat' && session.state.phase !== 'recruit'),
        'resolution flag mismatch',
      );
      decisions++;
    }
    check(
      JSON.stringify(session) === JSON.stringify(arenaSession.decode(raw)),
      'final replay mismatch',
    );
    check(
      JSON.stringify(session.state.players.map((p) => p.placement)) ===
        JSON.stringify(receipt.placements),
      'placement mismatch',
    );
  }
  const audit = {
    schema: 'hearth.arena-audit.v1',
    cohort: manifest.cohort,
    configurationDigest: manifest.configurationDigest,
    manifestDigest: sha(await readFile(resolve(root, 'manifest.json'))),
    comparisonDigest: sha(await readFile(resolve(root, 'comparison.json'))),
    reconstructionSourceRevision: execFileSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8',
    }).trim(),
    lobbies: names.length,
    decisions,
    elapsedMs: performance.now() - started,
    artifacts,
  };
  await writeFile(resolve(root, 'audit.json'), JSON.stringify(audit, null, 2) + '\n', {
    flag: 'wx',
  });
  console.log(JSON.stringify({ ...audit, artifacts: undefined }, null, 2));
});
