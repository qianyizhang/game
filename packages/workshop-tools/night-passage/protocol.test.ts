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
