import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { repositoryRoot } from '../runtime-bundle.ts';

void test('recorded Cartographer wire identity routes back through the public audit CLI', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'policy-cli-audit-'));
  const cli = resolve(repositoryRoot, 'packages/workshop-tools/policy/cli.ts');
  const run = (args: string[]) =>
    execFileSync(process.execPath, [cli, ...args], {
      cwd: repositoryRoot,
      encoding: 'utf8',
      stdio: 'pipe',
    });
  try {
    const episode = resolve(directory, 'recording');
    run([
      'record',
      '--game',
      'cartographer',
      '--seed',
      'POLICY-ADOPTION-1-DEV-01',
      '--max-decisions',
      '2',
      '--out',
      episode,
    ]);
    const rollout = JSON.parse(await readFile(resolve(episode, 'rollout.json'), 'utf8')) as {
      game: string;
    };
    assert.equal(rollout.game, 'dungeon-cartographer');
    const receipt = resolve(directory, 'audit.json');
    run(['audit', '--input', resolve(episode, 'rollout.json'), '--out', receipt]);
    const audit = JSON.parse(await readFile(receipt, 'utf8')) as Record<string, unknown>;
    for (const key of ['integrity', 'replay', 'inputs', 'decisions'])
      assert.equal(audit[key], 'passed');
    assert.equal(audit.originalSourceMatches, true);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

void test('fresh study subsets freeze the requested policy and independent seed population', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'policy-cli-subset-'));
  const cli = resolve(repositoryRoot, 'packages/workshop-tools/policy/cli.ts');
  try {
    assert.throws(
      () =>
        execFileSync(
          process.execPath,
          [
            cli,
            'benchmark',
            '--game',
            'spire',
            '--policies',
            'constructor',
            '--out',
            resolve(directory, 'invalid'),
          ],
          { cwd: repositoryRoot, encoding: 'utf8', stdio: 'pipe' },
        ),
      /unique available policy IDs/,
    );
    const out = resolve(directory, 'study');
    execFileSync(
      process.execPath,
      [
        cli,
        'benchmark',
        '--game',
        'spire',
        '--policies',
        'survival',
        '--cohort',
        'SUBSET-TEST',
        '--blocks',
        '10',
        '--max-decisions',
        '1',
        '--pool',
        '1',
        '--out',
        out,
      ],
      { cwd: repositoryRoot, stdio: 'pipe' },
    );
    const protocol = JSON.parse(await readFile(resolve(out, 'protocol.json'), 'utf8')) as {
      policies: { id: string }[];
      seeds: string[];
    };
    const report = JSON.parse(await readFile(resolve(out, 'report.json'), 'utf8')) as {
      rows: { policy: string }[];
      seeds: string[];
    };
    assert.deepEqual(
      protocol.policies.map((p) => p.id),
      ['survival'],
    );
    assert.equal(protocol.seeds.length, 10);
    assert.ok(protocol.seeds.every((seed) => seed.startsWith('SUBSET-TEST-DEV-')));
    assert.deepEqual(report.seeds, protocol.seeds);
    assert.equal(report.rows.length, 60);
    assert.ok(report.rows.every((row) => row.policy === 'survival'));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

void test('common CLI preserves native Night Passage schema, custom timing and unavailable unknown reproduction', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'policy-cli-native-'));
  const cli = resolve(repositoryRoot, 'packages/workshop-tools/policy/cli.ts');
  const example = resolve(repositoryRoot, 'src/games/night-passage/agent/example.ts');
  const run = (args: string[]) =>
    execFileSync(process.execPath, [cli, ...args], {
      cwd: repositoryRoot,
      encoding: 'utf8',
      stdio: 'pipe',
    });
  try {
    const episode = resolve(directory, 'recording');
    run([
      'record',
      '--game',
      'night-passage',
      '--policy-module',
      example,
      '--max-actions',
      '10',
      '--max-ticks',
      '8',
      '--out',
      episode,
    ]);
    const input = resolve(episode, 'rollout.json');
    const recorded = JSON.parse(await readFile(input, 'utf8')) as {
      schema: string;
      decisions: { timing: unknown }[];
    };
    assert.equal(recorded.schema, 'night-passage-rollout-1');
    assert.ok(recorded.decisions.some((row) => row.timing !== null));
    const receipt = resolve(directory, 'matching.json');
    run(['audit', '--input', input, '--policy-module', example, '--out', receipt]);
    const audit = JSON.parse(await readFile(receipt, 'utf8')) as Record<string, unknown>;
    for (const key of ['integrity', 'replay', 'inputs', 'decisions'])
      assert.equal(audit[key], 'passed');
    const unknown = resolve(directory, 'unknown.json');
    run(['audit', '--input', input, '--out', unknown]);
    const independent = JSON.parse(await readFile(unknown, 'utf8')) as Record<string, unknown>;
    for (const key of ['integrity', 'replay', 'inputs']) assert.equal(independent[key], 'passed');
    assert.equal(independent.decisions, 'unavailable');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

void test('calibration cannot certify a plan with empty source provenance', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'policy-analysis-empty-'));
  try {
    const plan = resolve(directory, 'plan.json');
    await writeFile(
      plan,
      JSON.stringify({
        schema: 'spire-strength-plan-2',
        namespace: 'SPIRE-STRENGTH-3',
        blocks: 100,
        references: { ironclad: 'survival', silent: 'survival' },
        sourceDigests: {},
      }),
    );
    assert.throws(
      () =>
        execFileSync(
          process.execPath,
          [
            resolve(repositoryRoot, 'packages/workshop-tools/policy/analyze-spire.ts'),
            directory,
            directory,
            plan,
            resolve(directory, 'analysis.json'),
          ],
          { cwd: repositoryRoot, encoding: 'utf8', stdio: 'pipe' },
        ),
      /complete analysis, policy and native source pins/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
