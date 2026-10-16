import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtemp, open, readFile, rm, writeFile } from 'node:fs/promises';
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
    const bomInput = resolve(directory, 'bom-original.json');
    await writeFile(
      bomInput,
      Buffer.concat([
        Buffer.from([0xef, 0xbb, 0xbf]),
        await readFile(resolve(episode, 'rollout.json')),
      ]),
    );
    const bomReceipt = resolve(directory, 'bom-audit.json');
    run(['audit', '--input', bomInput, '--out', bomReceipt]);
    const bomAudit = JSON.parse(await readFile(bomReceipt, 'utf8')) as Record<string, unknown>;
    for (const key of ['integrity', 'replay', 'inputs', 'decisions'])
      assert.equal(bomAudit[key], 'passed');
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
        '2',
        '--rollout-format',
        'gzip',
        '--out',
        out,
      ],
      { cwd: repositoryRoot, stdio: 'pipe' },
    );
    const protocol = JSON.parse(await readFile(resolve(out, 'protocol.json'), 'utf8')) as {
      policies: { id: string }[];
      seeds: string[];
      rolloutFormat: string;
      rolloutSuffix: string;
    };
    const report = JSON.parse(await readFile(resolve(out, 'report.json'), 'utf8')) as {
      rows: { policy: string; rollout: { file: string; format: string; sha256: string } }[];
      seeds: string[];
      rolloutFormat: string;
      rolloutSuffix: string;
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
    assert.equal(protocol.rolloutFormat, 'gzip');
    assert.equal(report.rolloutFormat, 'gzip');
    assert.equal(protocol.rolloutSuffix, '.json.gzip');
    assert.equal(report.rolloutSuffix, '.json.gzip');
    const { sha256 } = await import('../runtime-bundle.ts');
    const { readRolloutArtifact } = await import('./artifact.ts');
    for (const row of report.rows) {
      assert.equal(row.rollout.format, 'gzip');
      assert.ok(row.rollout.file.endsWith('.rollout.json.gzip'));
      const path = resolve(out, row.rollout.file);
      assert.equal(sha256(await readFile(path)), row.rollout.sha256);
      assert.equal((await readRolloutArtifact(path)).format, 'gzip');
    }
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
        schema: 'spire-strength-plan-3',
        namespace: 'SPIRE-STRENGTH-4',
        blocks: 400,
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

void test('gzip record receipts pin original bytes and audit without a format flag', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'policy-cli-gzip-'));
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
      '--max-decisions',
      '2',
      '--rollout-format',
      'gzip',
      '--out',
      episode,
    ]);
    const manifest = JSON.parse(await readFile(resolve(episode, 'manifest.json'), 'utf8')) as {
      rollout: { format: string; file: string; sha256: string; decodedSha256: string };
      artifacts: Record<string, string>;
    };
    assert.equal(manifest.rollout.format, 'gzip');
    assert.equal(manifest.rollout.file, 'rollout.json.gzip');
    assert.equal(manifest.artifacts['rollout.json.gzip'], manifest.rollout.sha256);
    const { readRolloutArtifact } = await import('./artifact.ts');
    const { sha256 } = await import('../runtime-bundle.ts');
    const encoded = await readFile(resolve(episode, manifest.rollout.file));
    assert.equal(sha256(encoded), manifest.rollout.sha256);
    const decoded = await readRolloutArtifact(resolve(episode, manifest.rollout.file));
    assert.equal(sha256(decoded.text), manifest.rollout.decodedSha256);
    const receipt = resolve(directory, 'audit.json');
    run(['audit', '--input', resolve(episode, manifest.rollout.file), '--out', receipt]);
    const audit = JSON.parse(await readFile(receipt, 'utf8')) as Record<string, unknown>;
    for (const key of ['integrity', 'replay', 'inputs', 'decisions'])
      assert.equal(audit[key], 'passed');
    // Native replay and audit artifacts remain ordinary JSON.
    JSON.parse(await readFile(resolve(episode, 'replay.json'), 'utf8'));
    JSON.parse(await readFile(resolve(episode, 'audit.json'), 'utf8'));
    assert.throws(
      () =>
        run([
          'record',
          '--game',
          'night-passage',
          '--rollout-format',
          'gzip',
          '--out',
          resolve(directory, 'unsupported'),
        ]),
      /Night Passage does not support compressed/,
    );
    const { gzipSync } = await import('node:zlib');
    const native = resolve(directory, 'night-passage.json.gzip');
    await writeFile(native, gzipSync('{"schema":"night-passage-rollout-1"}'));
    assert.throws(
      () =>
        run(['audit', '--input', native, '--out', resolve(directory, 'unsupported-audit.json')]),
      /Night Passage does not support compressed/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

void test('shared byte limits preserve oversized native Night Passage auto-schema audit', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'policy-cli-native-large-'));
  const cli = resolve(repositoryRoot, 'packages/workshop-tools/policy/cli.ts');
  const run = (args: string[]) =>
    execFileSync(process.execPath, [cli, ...args], {
      cwd: repositoryRoot,
      encoding: 'utf8',
      stdio: 'pipe',
    });
  try {
    const record = resolve(directory, 'native');
    run(['record', '--game', 'night-passage', '--max-actions', '1', '--out', record]);
    const original = await readFile(resolve(record, 'rollout.json'));
    const input = resolve(directory, 'native-padded.json');
    const file = await open(input, 'wx');
    try {
      await file.write(original);
      // Trailing JSON whitespace preserves the artifact and native parser contract.
      const spaces = Buffer.alloc(1024 * 1024, 0x20);
      let remaining = 150_000_001 - original.byteLength;
      while (remaining > 0) {
        const chunk = spaces.subarray(0, Math.min(remaining, spaces.byteLength));
        await file.write(chunk);
        remaining -= chunk.byteLength;
      }
    } finally {
      await file.close();
    }
    for (const game of [[], ['--game', 'night-passage']]) {
      const out = resolve(directory, game.length ? 'explicit.json' : 'automatic.json');
      run(['audit', ...game, '--input', input, '--out', out]);
      const receipt = JSON.parse(await readFile(out, 'utf8')) as Record<string, unknown>;
      for (const key of ['integrity', 'replay', 'inputs', 'decisions'])
        assert.equal(receipt[key], 'passed');
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
