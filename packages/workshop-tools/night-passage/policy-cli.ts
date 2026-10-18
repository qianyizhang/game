/** Native workflow backend. Controller timing, work meters and rollout schema stay game-owned. */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { freshDirectory, repositoryRoot } from '../io.ts';
import { sha256 } from '../runtime-bundle.ts';
import { withRuntime } from './runtime.ts';
import { runStudy, auditPassed } from './study.ts';
import type { EpisodeOptions } from '../../../src/games/night-passage/agent/benchmark';
import type { RolloutAudit } from '../../../src/games/night-passage/agent/rollout';
import { isRecord } from '../../../src/shared/json.ts';

export type PolicyMode = 'run' | 'record' | 'benchmark' | 'audit';
const writeNew = async (path: string, bytes: string) => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, bytes, { flag: 'wx' });
};
const json = (value: unknown) => JSON.stringify(value, null, 2) + '\n';
const auditUsable = (audit: RolloutAudit) =>
  audit.integrity === 'passed' &&
  audit.replay === 'passed' &&
  audit.inputs === 'passed' &&
  audit.decisions !== 'failed';

/** Called by both CLI families. Native max-actions includes the evaluator-owned start action. */
export async function policyMain(mode: PolicyMode, args: string[]): Promise<void> {
  const allowed =
    mode === 'audit'
      ? ['input', 'out', 'policy-module', 'game']
      : [
          'out',
          'game',
          ...(mode === 'benchmark' ? ['weapon'] : ['seed', 'weapon']),
          'difficulty',
          'control',
          'policy',
          'rules',
          'max-actions',
          'max-ticks',
          'setup',
          'policy-module',
          ...(mode === 'benchmark' ? ['suite', 'split', 'retain-rollouts'] : []),
        ];
  const options: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].slice(2),
      value = args[i + 1];
    if (['policy-seed', 'policy-options', 'max-decisions', 'pool'].includes(key))
      throw new Error(
        `Night Passage does not accept --${key}. Use native --max-actions (including start), --max-ticks, --setup and benchmark --split development|evaluation (or explicit legacy --suite training|held-out). Its PolicyPlayer receives public PlayerConfig; policy seed/options are not part of this recorded contract.`,
      );
    if (
      !args[i].startsWith('--') ||
      !allowed.includes(key) ||
      key in options ||
      value === undefined ||
      value.startsWith('--')
    )
      throw new Error(`Invalid Night Passage ${mode} arguments.`);
    options[key] = value;
  }
  if (options.game && options.game !== 'night-passage')
    throw new Error('Expected --game night-passage.');
  if (options.policy && options['policy-module'])
    throw new Error('Choose a built-in OR a local module.');
  if (mode !== 'run' && !options.out) throw new Error('A fresh output path is required.');
  if (mode === 'audit' && !options.input) throw new Error('An input rollout is required.');
  const retention = options['retain-rollouts'] ?? 'none';
  if (!['none', 'all'].includes(retention)) throw new Error('Use --retain-rollouts none|all.');
  if (options.suite && retention === 'all')
    throw new Error('Legacy --suite benchmarks do not retain rollouts; use --split instead.');
  const setup: unknown = options.setup ? JSON.parse(options.setup) : {};
  if (
    !isRecord(setup) ||
    Object.keys(setup).some(
      (key) => !['weapon', 'difficulty', 'control', 'rules', 'config'].includes(key),
    )
  )
    throw new Error(
      'Night Passage setup accepts weapon, difficulty, control, rules and public player config only.',
    );
  for (const key of ['weapon', 'difficulty', 'control', 'rules'])
    if (options[key] !== undefined && setup[key] !== undefined)
      throw new Error(`Configure ${key} once, through --setup or its native flag.`);
  const weapon = options.weapon ?? setup.weapon ?? 'bow';
  const difficulty = options.difficulty ?? setup.difficulty ?? 'standard';
  const control = options.control ?? setup.control ?? 'standard';
  const policy = options.policy ?? 'balanced';
  const rules = options.rules ?? setup.rules ?? 'night-passage-5';
  if (typeof weapon !== 'string' || !['sword', 'spear', 'shield', 'bow', 'fists'].includes(weapon))
    throw new Error('Unknown weapon.');
  if (typeof difficulty !== 'string' || !['standard', 'veteran', 'ordeal'].includes(difficulty))
    throw new Error('Unknown difficulty.');
  if (typeof control !== 'string' || !['light', 'standard', 'heavy'].includes(control))
    throw new Error(
      'Policy workflows require constrained light, standard or heavy controls; exact is a separate native diagnostic.',
    );
  if (!['quick', 'balanced', 'deliberate'].includes(policy)) throw new Error('Unknown policy.');
  if (typeof rules !== 'string' || !['night-passage-4', 'night-passage-5'].includes(rules))
    throw new Error('Unknown rules version.');
  if (
    setup.config !== undefined &&
    (!isRecord(setup.config) ||
      Object.keys(setup.config).some(
        (key) => !['decisionTicks', 'bowDistance', 'meleeReachRatio'].includes(key),
      ))
  )
    throw new Error('Player config accepts decisionTicks, bowDistance and meleeReachRatio only.');
  if (
    mode === 'benchmark' &&
    options.suite &&
    (setup.weapon !== undefined || options.weapon !== undefined)
  )
    throw new Error(
      'The native benchmark always evaluates all five weapons; --setup weapon applies to run/record only.',
    );
  if (options.suite && options.split)
    throw new Error('Choose audited --split or legacy --suite, not both.');
  const split = options.split ?? 'development';
  if (!['development', 'evaluation'].includes(split))
    throw new Error('Unknown native study split.');
  const suite = options.suite ?? 'training';
  if (!['training', 'held-out'].includes(suite)) throw new Error('Unknown native benchmark suite.');
  const episodeOptions: EpisodeOptions = {
    seed: options.seed ?? 'a-light-in-the-dark',
    weapon: weapon as EpisodeOptions['weapon'],
    difficulty: difficulty as EpisodeOptions['difficulty'],
    control: control as EpisodeOptions['control'],
    policy: policy as EpisodeOptions['policy'],
    rules: rules as EpisodeOptions['rules'],
    maxActions: Number(options['max-actions'] ?? 20_000),
    maxTicks: Number(options['max-ticks'] ?? 120_000),
    ...(setup.config !== undefined ? { config: setup.config } : {}),
  };
  const directory =
    mode === 'record' || mode === 'benchmark'
      ? await freshDirectory(resolve(options.out))
      : undefined;
  await withRuntime(
    async (runtime, pins) => {
      const provenance = {
        ...pins,
        toolDigests: {
          ...pins.toolDigests,
          ...Object.fromEntries(
            await Promise.all(
              [
                'night-passage/study.ts',
                'policy/study.ts',
                'policy/pool.ts',
                'policy/worker.ts',
              ].map(async (file) => {
                const path = `packages/workshop-tools/${file}`;
                return [path, sha256(await readFile(resolve(repositoryRoot, path)))] as const;
              }),
            ),
          ),
        },
        runtime: `${process.version} / ${process.platform} / ${process.arch}`,
      };
      const checkSources = async () => {
        for (const [path, expected] of Object.entries({
          ...provenance.sourceDigests,
          ...provenance.toolDigests,
        }))
          if (sha256(await readFile(resolve(repositoryRoot, path))) !== expected)
            throw new Error(
              `Source drift during execution: ${path}. Retained evidence is not a frozen study.`,
            );
      };
      if (mode === 'audit') {
        const rollout = runtime.parseRollout(await readFile(resolve(options.input), 'utf8'));
        const audit = await runtime.auditRollout(rollout, runtime.custom);
        await checkSources();
        const receipt = {
          ...audit,
          rolloutDigest: rollout.digest,
          provenance,
          originalSourceMatches:
            JSON.stringify(rollout.provenance?.sourceDigests) ===
            JSON.stringify(pins.sourceDigests),
        };
        await writeNew(resolve(options.out), json(receipt));
        console.log(json(receipt).trimEnd());
        if (!auditUsable(audit)) process.exitCode = 1;
        return;
      }
      const configured = {
        ...episodeOptions,
        ...(runtime.custom ? { player: runtime.custom } : {}),
      };
      if (mode === 'benchmark') {
        if (!options.suite) {
          const report = await runStudy(runtime, {
            directory: directory!,
            retainRollouts: retention === 'all',
            split: split as 'development' | 'evaluation',
            provenance,
            base: {
              control: episodeOptions.control,
              rules: episodeOptions.rules,
              maxActions: episodeOptions.maxActions,
              maxTicks: episodeOptions.maxTicks,
              ...(episodeOptions.config ? { config: episodeOptions.config } : {}),
            },
            ...(options.weapon !== undefined || setup.weapon !== undefined
              ? { weapons: [episodeOptions.weapon] }
              : {}),
            ...(options.difficulty !== undefined || setup.difficulty !== undefined
              ? { difficulties: [episodeOptions.difficulty!] }
              : {}),
            ...(options.policy !== undefined ? { policies: [episodeOptions.policy!] } : {}),
          });
          await checkSources();
          await writeNew(resolve(directory!, 'report.json'), json(report));
          console.log(
            json({
              directory,
              schema: report.schema,
              protocol: report.protocol,
              summary: report.summary,
              paired: report.paired,
            }).trimEnd(),
          );
          if (report.rows.some((row) => row.status === 'error' || !auditPassed(row.audit)))
            process.exitCode = 1;
          return;
        }
        const report = runtime.runBenchmark({
          ...configured,
          suite: suite as 'training' | 'held-out',
        });
        await checkSources();
        const result = {
          ...report,
          provenance,
          workflow: {
            kind: 'night-passage-native-benchmark',
            scope:
              'Published native three-seed suite, five weapons, one selected policy and control. This is not the shared 10/20-block adoption study. Original decision inputs and per-case audits are not retained by this legacy benchmark.',
          },
        };
        await writeNew(resolve(directory!, 'report.json'), json(result));
        console.log(json({ directory, ...result }).trimEnd());
        if (report.summary.errors > 0) process.exitCode = 1;
        return;
      }
      const rollout = await runtime.recordEpisode(configured, provenance);
      const audit = await runtime.auditRollout(rollout, runtime.custom);
      await checkSources();
      if (directory) {
        const artifacts = {
          'rollout.json': JSON.stringify(rollout) + '\n',
          'replay.json': rollout.replay,
          'audit.json': json(audit),
        };
        for (const [name, bytes] of Object.entries(artifacts))
          await writeNew(resolve(directory, name), bytes);
        const location = relative(repositoryRoot, directory);
        const manifest = {
          schema: 'night-passage-rollout-manifest-1',
          episode: rollout.episode,
          decisions: rollout.decisions.length,
          provenance,
          artifacts: Object.fromEntries(
            Object.entries(artifacts).map(([name, bytes]) => [name, sha256(bytes)]),
          ),
          review: location.startsWith('..')
            ? null
            : `/?game=night-passage&watch=1&rollout=${encodeURIComponent('/' + location + '/rollout.json')}`,
        };
        await writeNew(resolve(directory, 'manifest.json'), json(manifest));
        console.log(json({ directory, ...manifest, audit }).trimEnd());
      } else {
        const result = {
          policy: rollout.episode.policy,
          episode: rollout.episode,
          audit,
          provenance,
        };
        if (options.out) await writeNew(resolve(options.out), json(result));
        console.log(json(result).trimEnd());
      }
      if (!auditUsable(audit) || rollout.episode.status === 'error') process.exitCode = 1;
    },
    directory ? resolve(directory, 'bundles') : undefined,
    options['policy-module'],
  );
}
