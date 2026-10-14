import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { test } from 'node:test';
import { repositoryRoot } from '../io.ts';

await test('JSONL agent process preserves its game after malformed input and exports accepted actions', async () => {
  const child = spawn(process.execPath, ['packages/workshop-tools/night-passage/cli.ts', 'serve'], {
    cwd: repositoryRoot,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  let stdout = '',
    stderr = '';
  child.stdout.setEncoding('utf8').on('data', (data: string) => {
    stdout += data;
  });
  child.stderr.setEncoding('utf8').on('data', (data: string) => {
    stderr += data;
  });
  const done = new Promise<number | null>((resolve, reject) => {
    child.once('error', reject);
    child.once('close', resolve);
  });
  const timer = setTimeout(() => child.kill(), 30_000);
  try {
    child.stdin.end(
      [
        JSON.stringify({ id: 'reset', op: 'reset', seed: 'protocol-roundtrip' }),
        JSON.stringify({
          id: 'start',
          op: 'step',
          command: { type: 'start', weapon: 'bow', runes: ['vigor', 'fleet'] },
        }),
        '{bad JSON',
        JSON.stringify({ id: 'illegal', op: 'step', command: { type: 'buy', item: 'heart' } }),
        JSON.stringify({ id: 'after', op: 'observe' }),
        JSON.stringify({ id: 'export', op: 'export' }),
      ].join('\n') + '\n',
    );
    assert.equal(await done, 0, stderr);
    const responses = stdout
      .trim()
      .split('\n')
      .map(
        (line) =>
          JSON.parse(line) as {
            id: string | null;
            ok: boolean;
            observation?: { phase: string; tick: number };
            replay?: string;
          },
      );
    assert.equal(responses.length, 6, stdout);
    assert.equal(responses[0].observation?.phase, 'hub');
    assert.equal(responses[1].observation?.phase, 'combat');
    assert.equal(responses[2].ok, false);
    assert.equal(responses[3].ok, false);
    assert.deepEqual(responses[4].observation, responses[1].observation);
    const replay = JSON.parse(responses[5].replay!) as { seed: string; commands: unknown[] };
    assert.equal(replay.seed, 'protocol-roundtrip');
    assert.deepEqual(replay.commands, [
      { type: 'start', weapon: 'bow', runes: ['vigor', 'fleet'] },
    ]);
  } finally {
    clearTimeout(timer);
    if (child.exitCode === null) child.kill();
  }
});

await test('constrained protocol uses redacted observations for every response and meters act', async () => {
  const { withRuntime } = await import('./runtime.ts');
  const { createProtocol } = await import('./protocol.ts');
  await withRuntime((runtime) => {
    const handle = createProtocol(runtime);
    assert.equal(
      handle({
        op: 'reset',
        seed: 'constrained-protocol',
        control: 'standard',
        policy: 'deliberate',
      }).ok,
      true,
    );
    const started = handle({
      op: 'step',
      command: { type: 'start', weapon: 'bow', runes: [], difficulty: 'veteran' },
    });
    const observation = started.observation as Record<string, unknown>;
    assert.equal((observation.player as Record<string, unknown>).dashCooldown, undefined);
    assert.equal(handle({ op: 'export' }).ok, false);
    const rejected = handle({ op: 'step', command: { type: 'buy', item: 'heart' } });
    assert.deepEqual(rejected.observation, observation);
    const suggested = handle({ op: 'suggest' });
    assert.equal(suggested.ok, true);
    assert.equal(handle({ op: 'reset', seed: '', control: 'standard', policy: 'quick' }).ok, false);
    assert.deepEqual(handle({ op: 'suggest' }), suggested);
    const acted = handle({ op: 'act' });
    assert.equal(acted.ok, true);
    assert.ok((acted.work as { total: number }).total > 0);
    const after = acted.observation as {
      player: Record<string, unknown>;
      perception: { ageTicks: number };
    };
    assert.equal(after.player.strike, undefined);
    assert.equal(after.perception.ageTicks, 1);
    assert.equal(handle({ op: 'step', command: { type: 'retire' } }).ok, true);
    const exported = handle({ op: 'export' });
    assert.equal(exported.ok, true);
    const replay = JSON.parse(exported.replay as string) as {
      controller: { version: string };
      commands: { difficulty?: string }[];
    };
    assert.equal(replay.controller.version, 'night-passage-control-1');
    assert.equal(replay.commands[0].difficulty, 'veteran');
  });
});
