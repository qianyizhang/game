import { strict as assert } from 'node:assert';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { runStudy, cohortSeeds, auditPassed, summarize, type StudyRow } from './study.ts';
import { withRuntime } from './runtime.ts';
import { repositoryRoot, sha256 } from '../runtime-bundle.ts';
import type { RolloutAudit } from '../../../src/games/night-passage/agent/rollout';

void test('native studies freeze first and retain every bounded built-in/custom attempt with per-weapon paired evidence', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'night-passage-study-test-'));
  try {
    await withRuntime(
      async (runtime, pins) => {
        let observed = 0;
        const guarded = {
          ...runtime,
          recordEpisode: async (...args: Parameters<typeof runtime.recordEpisode>) => {
            const protocol = JSON.parse(
              await readFile(resolve(directory, 'protocol.json'), 'utf8'),
            ) as { cases: number; grid: { seeds: string[] } };
            assert.equal(protocol.cases, 20);
            assert.deepEqual(protocol.grid.seeds, cohortSeeds('development'));
            observed++;
            return runtime.recordEpisode(...args);
          },
        };
        const report = await runStudy(guarded, {
          directory,
          split: 'development',
          provenance: pins,
          base: { control: 'standard', rules: 'night-passage-5', maxActions: 5, maxTicks: 3 },
          weapons: ['bow'],
          difficulties: ['standard'],
          policies: ['quick'],
        });
        assert.equal(observed, 20);
        assert.equal(report.rows.length, 20);
        assert.equal(report.summary.length, 2);
        assert.ok(
          report.summary.every(
            (row) => row.attempts === 10 && row.timeouts === 10 && row.auditsPassed === 10,
          ),
        );
        assert.equal(report.paired.length, 1);
        assert.equal(report.paired[0].weapon, 'bow');
        assert.equal(report.paired[0].winDifference.n, 10);
        assert.equal(report.paired[0].winDifference.interval95, null);
        assert.equal(report.protocol.versions.builtins, runtime.POLICY_VERSION);
        const frozenBytes = await readFile(resolve(directory, 'protocol.json'), 'utf8');
        assert.equal(report.protocolDigest, sha256(frozenBytes));
        for (const row of report.rows) {
          const path = resolve(directory, row.artifacts);
          const rolloutBytes = await readFile(resolve(path, 'rollout.json'), 'utf8');
          const rollout = runtime.parseRollout(rolloutBytes);
          assert.ok(rollout.decisions.length > 0);
          assert.ok(rollout.decisions.some((decision) => decision.timing !== null));
          assert.ok(
            auditPassed(
              JSON.parse(await readFile(resolve(path, 'audit.json'), 'utf8')) as RolloutAudit,
            ),
          );
          assert.equal(row.digest, rollout.digest);
          assert.ok(rollout.episode.elapsedTicks <= 3);
          assert.ok(rollout.episode.actions <= 5);
          assert.deepEqual(rollout.provenance, pins);
          const manifest = JSON.parse(await readFile(resolve(path, 'manifest.json'), 'utf8')) as {
            protocolDigest: string;
            artifacts: Record<string, string>;
          };
          assert.equal(manifest.protocolDigest, report.protocolDigest);
          assert.equal(manifest.artifacts['rollout.json'], sha256(rolloutBytes));
          assert.equal(await readFile(resolve(path, 'replay.json'), 'utf8'), rollout.replay);
        }
        await assert.rejects(
          runStudy(guarded, {
            directory,
            split: 'development',
            provenance: pins,
            base: { control: 'standard' },
            weapons: ['bow'],
            difficulties: ['standard'],
            policies: ['quick'],
          }),
          /EEXIST/,
        );
        const first = report.rows[0];
        const retained = runtime.parseRollout(
          await readFile(resolve(directory, first.artifacts, 'rollout.json'), 'utf8'),
        );
        assert.ok(
          auditPassed(
            await runtime.auditRollout(
              retained,
              first.policy === runtime.custom!.id ? runtime.custom : undefined,
            ),
          ),
        );
      },
      resolve(directory, 'bundles'),
      resolve(repositoryRoot, 'src/games/night-passage/agent/example.ts'),
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

void test('reserved blocks are fresh and summary refuses duplicate or missing paired cases', () => {
  const dev = cohortSeeds('development'),
    reserved = cohortSeeds('evaluation');
  assert.equal(dev.length, 10);
  assert.equal(reserved.length, 20);
  assert.ok(
    reserved.every((seed) => !dev.includes(seed) && seed.startsWith('POLICY-ADOPTION-1-RESERVED-')),
  );
  const grid = {
    seeds: ['one', 'two'],
    weapons: ['bow'] as const,
    difficulties: ['standard'] as const,
    policies: ['quick'],
  };
  const audit: RolloutAudit = {
    integrity: 'passed',
    replay: 'passed',
    inputs: 'passed',
    decisions: 'passed',
    firstMismatch: null,
    scope: 'test',
    numericDrift: { count: 0, tolerance: 0, first: null },
  };
  const rows: StudyRow[] = grid.seeds.map((seed) => ({
    seed,
    weapon: 'bow',
    difficulty: 'standard',
    policy: 'quick',
    status: 'timeout',
    score: 0,
    elapsedTicks: 1,
    actions: 2,
    work: 0,
    digest: 'test',
    audit,
    artifacts: 'test',
  }));
  assert.equal(summarize(rows, grid).summary[0].attempts, 2);
  assert.throws(() => summarize(rows.slice(1), grid), /incomplete/);
  assert.throws(() => summarize([rows[0], rows[0]], grid), /unexpected/);
});
