import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname, basename, relative } from 'node:path';
import { repositoryRoot } from '../io.ts';
import type { Runtime } from './runtime.ts';
import type { EpisodeResult } from '../../../src/games/night-passage/agent/benchmark';
import type { Difficulty } from '../../../src/games/night-passage/domain/contracts';
import type { Policy } from '../../../src/games/night-passage/agent/policy';
import type { ControlPreset } from '../../../src/games/night-passage/application/control';

export const EVALUATION_VERSION = 'night-passage-balance-1';
const weapons = ['sword', 'spear', 'shield', 'bow', 'fists'] as const;
const difficulties: Difficulty[] = ['standard', 'veteran', 'ordeal'];
const policies: Policy[] = ['quick', 'balanced', 'deliberate'];
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b),
    mid = Math.floor(sorted.length / 2);
  return sorted.length
    ? sorted.length % 2
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2
    : null;
};
export async function evaluate(
  runtime: Runtime,
  options: {
    split: 'development' | 'evaluation';
    seeds: number;
    pool?: number;
    out: string;
    controls?: boolean;
    difficulty?: Difficulty;
    witnesses?: boolean;
  },
) {
  if (!Number.isInteger(options.seeds) || options.seeds < 1 || options.seeds > 100)
    throw new Error('Seeds must be an integer from 1 to 100.');
  const pool = options.pool ?? 1;
  if (!Number.isSafeInteger(pool) || pool < 1) throw new Error('Pool must be a positive integer.');
  const seeds = Array.from(
    { length: options.seeds },
    (_, i) => `passage-control-${options.split}-${pool}-${String(i).padStart(2, '0')}`,
  );
  const results: EpisodeResult[] = [];
  const witnesses = new Set<string>();
  const witnessRecords: {
    difficulty: Difficulty;
    weapon: string;
    seed: string;
    policy: string;
    control: string;
    score: number;
    ticks: number;
    replaySha256: string;
    replayPath: string;
  }[] = [];
  const runs: { difficulty: Difficulty; policy: Policy; control: ControlPreset | 'exact' }[] = [];
  for (const difficulty of options.difficulty ? [options.difficulty] : difficulties)
    for (const policy of policies) runs.push({ difficulty, policy, control: 'standard' });
  // Light/standard/heavy hold balanced fixed; exact is a separate baseline diagnostic.
  if (options.controls)
    for (const difficulty of options.difficulty ? [options.difficulty] : difficulties)
      for (const control of ['light', 'heavy', 'exact'] as const)
        runs.push({ difficulty, policy: 'balanced', control });
  for (const condition of runs) {
    const group: EpisodeResult[] = [];
    for (const seed of seeds)
      for (const weapon of weapons) {
        const witnessKey = `${condition.difficulty}/${weapon}`;
        const r = runtime.runEpisode({
          ...condition,
          seed,
          weapon,
          includeReplay:
            options.witnesses && condition.control === 'standard' && !witnesses.has(witnessKey),
        });
        if (r.replay && r.status === 'won') {
          const directory = resolve(
            dirname(options.out || 'test-results/night-passage-control/run.json'),
            'witnesses',
            basename(options.out || options.split, '.json'),
            condition.difficulty,
          );
          await mkdir(directory, { recursive: true });
          await writeFile(resolve(directory, `${weapon}.replay.json`), r.replay);
          witnesses.add(witnessKey);
          witnessRecords.push({
            difficulty: r.difficulty,
            weapon: r.weapon,
            seed: r.seed,
            policy: r.policy,
            control: r.control,
            score: r.score,
            ticks: r.elapsedTicks,
            replayPath: relative(repositoryRoot, resolve(directory, `${weapon}.replay.json`)),
            replaySha256: createHash('sha256').update(r.replay).digest('hex'),
          });
        }
        delete r.replay;
        group.push(r);
        results.push(r);
      }
    const wins = group.filter((r) => r.status === 'won').length;
    process.stderr.write(
      `${condition.difficulty}/${condition.policy}/${condition.control}: ${wins}/${group.length} wins, ${group.filter((r) => r.status === 'error').length} errors\n`,
    );
  }
  const conditions = runs.map((c) => {
    const group = results.filter(
      (r) =>
        r.difficulty === c.difficulty &&
        r.control === c.control &&
        (c.control === 'exact' || r.policy === c.policy),
    );
    return {
      ...c,
      policy: c.control === 'exact' ? 'baseline' : c.policy,
      episodes: group.length,
      wins: group.filter((r) => r.status === 'won').length,
      losses: group.filter((r) => r.status === 'lost').length,
      timeouts: group.filter((r) => r.status === 'timeout').length,
      errors: group.filter((r) => r.status === 'error').length,
      meanScore: group.reduce((s, r) => s + r.score, 0) / group.length,
      medianWinTicks: median(group.filter((r) => r.status === 'won').map((r) => r.elapsedTicks)),
      workPerDecision:
        group.reduce((s, r) => s + (r.controlMetrics?.workUnits ?? 0), 0) /
        Math.max(
          1,
          group.reduce((s, r) => s + (r.controlMetrics?.decisions ?? 0), 0),
        ),
      delayTicksPerDecision:
        group.reduce((s, r) => s + (r.controlMetrics?.delayTicks ?? 0), 0) /
        Math.max(
          1,
          group.reduce((s, r) => s + (r.controlMetrics?.decisions ?? 0), 0),
        ),
      controlTicksPerDecision:
        group.reduce(
          (s, r) => s + (r.controlMetrics?.delayTicks ?? 0) + (r.controlMetrics?.holdTicks ?? 0),
          0,
        ) /
        Math.max(
          1,
          group.reduce((s, r) => s + (r.controlMetrics?.decisions ?? 0), 0),
        ),
      weapons: Object.fromEntries(
        weapons.map((weapon) => [
          weapon,
          {
            wins: group.filter((r) => r.weapon === weapon && r.status === 'won').length,
            episodes: group.filter((r) => r.weapon === weapon).length,
          },
        ]),
      ),
      config: group[0].controlConfig ?? null,
      versions: group[0].versions,
    };
  });
  return {
    version: EVALUATION_VERSION,
    split: options.split,
    pool,
    seeds,
    weapons,
    conditions,
    episodes: results,
    witnesses: witnessRecords,
    limitations: [
      'Seeded engine outcomes, not human win rates.',
      'Work units meter supplied cooperative policies, not arbitrary JavaScript.',
      'Exact uses the original baseline policy; it is not a fixed-policy control contrast.',
      'Compare different control presets and difficulties separately.',
    ],
  };
}
