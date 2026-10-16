import { strict as assert } from 'node:assert';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { repositoryRoot, sha256 } from '../runtime-bundle.ts';
import type { Rollout, RolloutAudit } from '../../../src/games/night-passage/agent/rollout';

const execute = promisify(execFile);
const cli = resolve(repositoryRoot, 'packages/workshop-tools/night-passage/cli.ts');
const backend = pathToFileURL(
  resolve(repositoryRoot, 'packages/workshop-tools/night-passage/policy-cli.ts'),
).href;
const example = resolve(repositoryRoot, 'src/games/night-passage/agent/example.ts');
const bridge = (mode: string, args: string[]) =>
  execute(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `import { policyMain } from ${JSON.stringify(backend)}; await policyMain(process.argv[1], process.argv.slice(2));`,
      mode,
      ...args,
    ],
    { cwd: repositoryRoot, maxBuffer: 2_000_000 },
  );
const allPassed = (audit: RolloutAudit) => {
  for (const key of ['integrity', 'replay', 'inputs', 'decisions'] as const)
    assert.equal(audit[key], 'passed', key);
};

// A CLI round trip catches missing custom-module pins, lost native work/timing and schema dispatch.
void test('native local module records original inputs and reproduces only with its implementation', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'night-passage-workflow-test-'));
  try {
    const run = await bridge('run', [
      '--game',
      'night-passage',
      '--policy-module',
      example,
      '--max-actions',
      '10',
      '--max-ticks',
      '8',
    ]);
    const result = JSON.parse(run.stdout) as { episode: Rollout['episode']; audit: RolloutAudit };
    allPassed(result.audit);
    assert.equal(result.episode.policy, 'example-balanced');
    assert.ok(result.episode.elapsedTicks <= 8);
    assert.ok(result.episode.actions <= 10);
    const out = resolve(directory, 'record');
    await execute(
      process.execPath,
      [
        cli,
        'record',
        '--out',
        out,
        '--policy-module',
        example,
        '--max-actions',
        '10',
        '--max-ticks',
        '8',
      ],
      { cwd: repositoryRoot },
    );
    const bytes = await readFile(resolve(out, 'rollout.json'), 'utf8');
    const rollout = JSON.parse(bytes) as Rollout;
    assert.equal(rollout.schema, 'night-passage-rollout-1');
    assert.ok(rollout.decisions.length > 0);
    assert.ok(rollout.decisions.some((row) => row.timing !== null));
    assert.ok(
      rollout.decisions.every(
        (row) =>
          row.work &&
          row.work.total === row.work.entities + row.work.candidates + row.work.geometry,
      ),
    );
    assert.ok(rollout.provenance?.sourceDigests['src/games/night-passage/agent/example.ts']);
    for (const path of Object.keys(rollout.provenance.sourceDigests))
      await readFile(resolve(repositoryRoot, path));
    const bundles = await readdir(resolve(out, 'bundles'));
    assert.deepEqual(bundles, [`${rollout.provenance.bundleDigest}.mjs`]);
    assert.equal(
      sha256(await readFile(resolve(out, 'bundles', bundles[0]))),
      rollout.provenance.bundleDigest,
    );
    const matching = await bridge('audit', [
      '--input',
      resolve(out, 'rollout.json'),
      '--out',
      resolve(directory, 'matching.json'),
      '--policy-module',
      example,
    ]);
    allPassed(JSON.parse(matching.stdout) as RolloutAudit);
    const unknown = await bridge('audit', [
      '--input',
      resolve(out, 'rollout.json'),
      '--out',
      resolve(directory, 'unknown.json'),
    ]);
    const unknownAudit = JSON.parse(unknown.stdout) as RolloutAudit;
    assert.equal(unknownAudit.inputs, 'passed');
    assert.equal(unknownAudit.replay, 'passed');
    assert.equal(unknownAudit.decisions, 'unavailable');
    await assert.rejects(
      bridge('audit', [
        '--input',
        resolve(out, 'rollout.json'),
        '--out',
        resolve(directory, 'unknown.json'),
      ]),
      /EEXIST/,
    );
    assert.equal(await readFile(resolve(out, 'rollout.json'), 'utf8'), bytes);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

void test('bridge labels the native benchmark and rejects misleading shared options or built-in identity collisions', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'night-passage-boundary-test-'));
  try {
    const run = await bridge('benchmark', [
      '--out',
      resolve(directory, 'benchmark'),
      '--suite',
      'training',
      '--max-actions',
      '1',
      '--max-ticks',
      '1',
    ]);
    const result = JSON.parse(run.stdout) as {
      seeds: string[];
      weapons: string[];
      workflow: { kind: string; scope: string };
    };
    assert.equal(result.seeds.length, 3);
    assert.equal(result.weapons.length, 5);
    assert.equal(result.workflow.kind, 'night-passage-native-benchmark');
    assert.match(result.workflow.scope, /not the shared 10\/20-block/);
    const studyDirectory = resolve(directory, 'audited');
    const studyRun = await bridge('benchmark', [
      '--out',
      studyDirectory,
      '--split',
      'development',
      '--policy',
      'quick',
      '--weapon',
      'bow',
      '--difficulty',
      'standard',
      '--max-actions',
      '5',
      '--max-ticks',
      '3',
    ]);
    const study = JSON.parse(studyRun.stdout) as {
      schema: string;
      protocol: { cases: number; provenance: { toolDigests: Record<string, string> } };
    };
    assert.equal(study.schema, 'night-passage-policy-study-1');
    assert.equal(study.protocol.cases, 10);
    for (const path of [
      'packages/workshop-tools/night-passage/study.ts',
      'packages/workshop-tools/policy/study.ts',
    ])
      assert.equal(
        study.protocol.provenance.toolDigests[path],
        sha256(await readFile(resolve(repositoryRoot, path))),
      );
    const report = JSON.parse(await readFile(resolve(studyDirectory, 'report.json'), 'utf8')) as {
      rows: { audit: RolloutAudit }[];
    };
    assert.equal(report.rows.length, 10);
    for (const row of report.rows) allPassed(row.audit);
    await assert.rejects(
      bridge('benchmark', [
        '--out',
        resolve(directory, 'ambiguous'),
        '--suite',
        'training',
        '--split',
        'development',
      ]),
      /Choose audited/,
    );
    for (const flag of ['--policy-seed', '--policy-options', '--max-decisions'])
      await assert.rejects(bridge('run', [flag, '1']), /does not accept/);
    const collision = resolve(directory, 'collision.ts');
    await writeFile(
      collision,
      `export default { id: 'balanced', version: 'custom', create() { return () => null; } };`,
    );
    await assert.rejects(
      bridge('run', ['--policy-module', collision, '--max-actions', '1']),
      /unique ID/,
    );
    await assert.rejects(bridge('run', ['--control', 'exact']), /constrained/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
