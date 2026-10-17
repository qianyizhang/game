/** Audited native policy studies; episode timing and artifacts stay Night Passage-owned. */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { repositoryRoot, sha256 } from '../runtime-bundle.ts';
import { cohortSeeds, meanInterval, pairedWins, winInterval } from '../policy/study.ts';
import type { Runtime } from './runtime.ts';
import type {
  EpisodeOptions,
  EpisodeResult,
} from '../../../src/games/night-passage/agent/benchmark';
import type {
  PolicyPlayer,
  Rollout,
  RolloutAudit,
} from '../../../src/games/night-passage/agent/rollout';
import type { Policy } from '../../../src/games/night-passage/agent/policy';
import type { Difficulty } from '../../../src/games/night-passage/domain/contracts';
import type { WeaponId } from '../../../src/games/night-passage/domain/types';

export const STUDY_VERSION = 'night-passage-policy-study-1';
export interface StudyOptions {
  directory: string;
  split: 'development' | 'evaluation';
  provenance: NonNullable<Rollout['provenance']>;
  base: Pick<
    EpisodeOptions,
    'control' | 'controlConfig' | 'rules' | 'config' | 'maxActions' | 'maxTicks'
  >;
  /** Explicit bounded matrix selections remain recorded in the frozen protocol. */
  weapons?: readonly WeaponId[];
  difficulties?: readonly Difficulty[];
  policies?: readonly Policy[];
  includeCustom?: boolean;
}
export interface StudyRow {
  seed: string;
  difficulty: Difficulty;
  weapon: WeaponId;
  policy: string;
  status: EpisodeResult['status'];
  score: number;
  elapsedTicks: number;
  actions: number;
  work: number;
  digest: string;
  audit: RolloutAudit;
  artifacts: string;
}
const json = (value: unknown) => JSON.stringify(value, null, 2) + '\n';
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const m = Math.floor(sorted.length / 2);
  return !sorted.length ? null : sorted.length % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2;
};
export const auditPassed = (audit: RolloutAudit) =>
  audit.integrity === 'passed' &&
  audit.replay === 'passed' &&
  audit.inputs === 'passed' &&
  audit.decisions === 'passed';

/** Reject partial/duplicate grids before presenting paired denominators. No weapon pooling. */
export function summarize(
  rows: readonly StudyRow[],
  grid: {
    seeds: readonly string[];
    weapons: readonly WeaponId[];
    difficulties: readonly Difficulty[];
    policies: readonly string[];
  },
) {
  const expected = new Set(
    grid.seeds.flatMap((seed) =>
      grid.difficulties.flatMap((difficulty) =>
        grid.weapons.flatMap((weapon) =>
          grid.policies.map((policy) => JSON.stringify([seed, difficulty, weapon, policy])),
        ),
      ),
    ),
  );
  if (rows.length !== expected.size)
    throw new Error('Native study grid is incomplete or duplicated.');
  for (const row of rows)
    if (
      !expected.delete(JSON.stringify([row.seed, row.difficulty, row.weapon, row.policy])) ||
      !Number.isFinite(row.score)
    )
      throw new Error('Native study contains an unexpected or malformed case.');
  const summary = grid.difficulties.flatMap((difficulty) =>
    grid.weapons.flatMap((weapon) =>
      grid.policies.map((policy) => {
        const cases = rows.filter(
          (row) => row.difficulty === difficulty && row.weapon === weapon && row.policy === policy,
        );
        const wins = cases.filter((row) => row.status === 'won');
        return {
          difficulty,
          weapon,
          policy,
          attempts: cases.length,
          wins: wins.length,
          losses: cases.filter((row) => row.status === 'lost').length,
          timeouts: cases.filter((row) => row.status === 'timeout').length,
          errors: cases.filter((row) => row.status === 'error').length,
          auditsPassed: cases.filter((row) => auditPassed(row.audit)).length,
          winRate: winInterval(wins.length, cases.length),
          meanScore: meanInterval(cases.map((row) => row.score)),
          medianWinTicks: median(wins.map((row) => row.elapsedTicks)),
          work: meanInterval(cases.map((row) => row.work)),
        };
      }),
    ),
  );
  const paired = grid.difficulties.flatMap((difficulty) =>
    grid.weapons.flatMap((weapon) =>
      grid.policies.flatMap((a, i) =>
        grid.policies.slice(i + 1).map((b) => {
          const pairs = grid.seeds.map((seed) => {
            const matching = (policy: string) =>
              rows.find(
                (row) =>
                  row.seed === seed &&
                  row.difficulty === difficulty &&
                  row.weapon === weapon &&
                  row.policy === policy,
              )!;
            return [matching(a), matching(b)] as const;
          });
          return {
            difficulty,
            weapon,
            a,
            b,
            winDifference: pairedWins(
              pairs.map(
                ([left, right]) =>
                  [Number(left.status === 'won'), Number(right.status === 'won')] as const,
              ),
            ),
            scoreDifference: meanInterval(pairs.map(([left, right]) => left.score - right.score)),
          };
        }),
      ),
    ),
  );
  return { summary, paired };
}

/** Freeze first, then retain every attempt, including errors/timeouts and their original inputs. */
export async function runStudy(runtime: Runtime, options: StudyOptions) {
  const seeds = cohortSeeds(options.split);
  const weapons = [
    ...(options.weapons ?? ['sword', 'spear', 'shield', 'bow', 'fists']),
  ] as WeaponId[];
  const difficulties = [
    ...(options.difficulties ?? ['standard', 'veteran', 'ordeal']),
  ] as Difficulty[];
  const policies = [...(options.policies ?? runtime.POLICIES)];
  if (
    !['development', 'evaluation'].includes(options.split) ||
    !weapons.length ||
    new Set(weapons).size !== weapons.length ||
    weapons.some((w) => !['sword', 'spear', 'shield', 'bow', 'fists'].includes(w)) ||
    !difficulties.length ||
    new Set(difficulties).size !== difficulties.length ||
    difficulties.some((d) => !['standard', 'veteran', 'ordeal'].includes(d)) ||
    new Set(policies).size !== policies.length ||
    policies.some((p) => !runtime.POLICIES.includes(p)) ||
    !options.base.control ||
    options.base.control === 'exact' ||
    (options.base.rules === 'night-passage-4' && difficulties.some((d) => d !== 'standard'))
  )
    throw new Error('Invalid native policy study matrix or control/rules configuration.');
  const custom = options.includeCustom !== false ? runtime.custom : undefined;
  if (!policies.length && !custom) throw new Error('Native study needs at least one policy.');
  const policyIds = [...policies, ...(custom ? [custom.id] : [])];
  if (
    new Set(policyIds).size !== policyIds.length ||
    policyIds.some((id) => !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(id))
  )
    throw new Error('Study policy identities must be unique, safe local identifiers.');
  const grid = { seeds, weapons, difficulties, policies: policyIds };
  const protocol = {
    schema: 'night-passage-policy-study-protocol-1',
    split: options.split,
    versions: { study: STUDY_VERSION, builtins: runtime.POLICY_VERSION },
    grid,
    base: options.base,
    policies: [
      ...policies.map((id) => ({ id, version: runtime.POLICY_VERSION })),
      ...(custom ? [{ id: custom.id, version: custom.version }] : []),
    ],
    cases: seeds.length * weapons.length * difficulties.length * policyIds.length,
    ranking: ['wins', 'meanScore', 'medianWinTicks'],
    analysis:
      'Within each difficulty/weapon stratum, independent paired seed blocks. Wilson 95% win intervals, approximate Student t mean/paired score intervals; paired wins show discordance and point differences with interval unavailable. Constant samples do not imply zero uncertainty. No weapon pooling, multiple-comparison adjustment or human-difficulty claim. Errors/timeouts remain attempts. No tuning on evaluation.',
    provenance: options.provenance,
  };
  await mkdir(options.directory, { recursive: true });
  const protocolBytes = json(protocol);
  await writeFile(resolve(options.directory, 'protocol.json'), protocolBytes, { flag: 'wx' });
  const rows: StudyRow[] = [];
  for (const seed of seeds)
    for (const difficulty of difficulties)
      for (const weapon of weapons)
        for (const policy of policyIds) {
          const player: PolicyPlayer | undefined = custom?.id === policy ? custom : undefined;
          const rollout = await runtime.recordEpisode(
            {
              ...options.base,
              seed,
              weapon,
              difficulty,
              ...(player ? { player } : { policy: policy as Policy }),
            },
            options.provenance,
          );
          const audit = await runtime.auditRollout(rollout, player);
          const artifacts = `cases/${difficulty}/${weapon}/${policy}/${seed}`;
          const directory = resolve(options.directory, artifacts);
          await mkdir(directory, { recursive: true });
          const files = {
            'rollout.json': JSON.stringify(rollout) + '\n',
            'replay.json': rollout.replay,
            'audit.json': json(audit),
          };
          for (const [name, bytes] of Object.entries(files))
            await writeFile(resolve(directory, name), bytes, { flag: 'wx' });
          const location = relative(repositoryRoot, directory);
          await writeFile(
            resolve(directory, 'manifest.json'),
            json({
              schema: 'night-passage-rollout-manifest-1',
              protocolDigest: sha256(protocolBytes),
              digest: rollout.digest,
              episode: rollout.episode,
              decisions: rollout.decisions.length,
              provenance: options.provenance,
              artifacts: Object.fromEntries(
                Object.entries(files).map(([name, bytes]) => [name, sha256(bytes)]),
              ),
              review: location.startsWith('..')
                ? null
                : `/?game=night-passage&watch=1&rollout=${encodeURIComponent('/' + location + '/rollout.json')}`,
            }),
            { flag: 'wx' },
          );
          rows.push({
            seed,
            difficulty,
            weapon,
            policy,
            status: rollout.episode.status,
            score: rollout.episode.score,
            elapsedTicks: rollout.episode.elapsedTicks,
            actions: rollout.episode.actions,
            work: rollout.decisions.reduce((total, row) => total + (row.work?.total ?? 0), 0),
            digest: rollout.digest,
            audit,
            artifacts,
          });
          process.stderr.write(
            `Native case ${rows.length}/${protocol.cases}: ${seed}/${difficulty}/${weapon}/${policy} ${rollout.episode.status}\n`,
          );
        }
  // Detect mutation of the frozen protocol before publishing a complete report.
  if ((await readFile(resolve(options.directory, 'protocol.json'), 'utf8')) !== protocolBytes)
    throw new Error('Frozen native study protocol changed during execution.');
  return {
    schema: STUDY_VERSION,
    protocolDigest: sha256(protocolBytes),
    protocol,
    ...summarize(rows, grid),
    rows,
  };
}
