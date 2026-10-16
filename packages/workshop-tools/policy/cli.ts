import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { freshDirectory, repositoryRoot, reportFailure } from '../io.ts';
import { sha256 } from '../runtime-bundle.ts';
import { withRuntime } from './runtime.ts';
import { auditPassed, benchmark, cohortSeeds } from './study.ts';
import type { JsonObject } from '../../../src/shared/policy/types';

const usage = `policy run|record --game blindside [--policy immediate|survival|growth | --policy-module ./policy.ts]
  [--seed SEED] [--difficulty relaxed|standard|severe] [--policy-seed SEED] [--policy-options JSON] [--max-decisions N]
policy record --game blindside --out NEW_DIRECTORY [same options]
policy benchmark --game blindside --split development|evaluation --out NEW_DIRECTORY [--max-decisions N]
policy audit --input ROLLOUT --out NEW_RECEIPT [--policy-module ./policy.ts]
A local TS module default-exports a game-typed PolicyFactory. It is trusted in-process code.
Run prints result/audit; record retains exact knowledge, replay, audit and compiled source-pinned bundle.
Benchmark freezes the protocol before execution; errors/timeouts remain attempted cases.`;
try {
  const [mode = 'help', ...args] = process.argv.slice(2);
  if (mode === 'help' || mode === '--help') console.log(usage);
  else {
    if (!['run', 'record', 'benchmark', 'audit'].includes(mode)) throw new Error(usage);
    const allowed =
      mode === 'audit'
        ? ['input', 'out', 'policy-module']
        : mode === 'benchmark'
          ? ['game', 'out', 'split', 'max-decisions', 'policy-module']
          : [
              'game',
              'out',
              'policy',
              'policy-module',
              'seed',
              'difficulty',
              'policy-seed',
              'policy-options',
              'max-decisions',
            ];
    const options: Record<string, string> = {};
    for (let i = 0; i < args.length; i += 2) {
      const key = args[i].slice(2),
        value = args[i + 1];
      if (
        !args[i].startsWith('--') ||
        !allowed.includes(key) ||
        key in options ||
        value === undefined ||
        value.startsWith('--')
      )
        throw new Error(`Invalid arguments.\n${usage}`);
      options[key] = value;
    }
    if (options.policy && options['policy-module'])
      throw new Error('Choose a built-in OR a local module.');
    if (mode !== 'run' && !options.out) throw new Error('A fresh output path is required.');
    if (mode === 'audit' && !options.input) throw new Error('An input rollout is required.');
    const input = mode === 'audit' ? await readFile(resolve(options.input), 'utf8') : undefined;
    const game = input ? (JSON.parse(input) as { game?: string }).game : options.game;
    if (game !== 'blindside')
      throw new Error('Select --game blindside. Other adapters are not adopted yet.');
    const maxDecisions = Number(options['max-decisions'] ?? 2000);
    if (!Number.isSafeInteger(maxDecisions) || maxDecisions < 1 || maxDecisions > 10000)
      throw new Error('Decision budget must be 1–10000.');
    const split = options.split ?? 'development';
    if (!['development', 'evaluation'].includes(split)) throw new Error('Unknown study split.');
    const directory = ['record', 'benchmark'].includes(mode)
      ? await freshDirectory(resolve(options.out))
      : undefined;
    await withRuntime(
      {
        game,
        policyModule: options['policy-module'],
        retain: directory ? resolve(directory, 'bundles') : undefined,
      },
      async (runtime, pins) => {
        const factory = runtime.custom ?? runtime.builtins[options.policy ?? 'immediate'];
        if (
          !factory ||
          typeof factory.id !== 'string' ||
          !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(factory.id) ||
          typeof factory.version !== 'string' ||
          typeof factory.create !== 'function'
        )
          throw new Error('Policy module must default-export {id, version, create}.');
        const provenance: JsonObject = { ...pins };
        const checkSources = async () => {
          for (const [file, hash] of Object.entries({ ...pins.sourceDigests, ...pins.toolDigests }))
            if (sha256(await readFile(resolve(repositoryRoot, file))) !== hash)
              throw new Error(
                `Source drift during execution: ${file}. Evidence retained; do not treat this as a frozen study.`,
              );
        };
        if (mode === 'audit') {
          const run = runtime.parseRollout(input!);
          const matching =
            runtime.custom ??
            Object.values(runtime.builtins).find(
              (p) => p.id === run.policy.id && p.version === run.policy.version,
            );
          const audit = await runtime.auditRollout(runtime.adapter, run, matching);
          await checkSources();
          const receipt = {
            ...audit,
            rolloutDigest: run.digest,
            provenance,
            originalSourceMatches:
              JSON.stringify(run.provenance.sourceDigests) === JSON.stringify(pins.sourceDigests),
          };
          await mkdir(dirname(resolve(options.out)), { recursive: true });
          await writeFile(resolve(options.out), JSON.stringify(receipt, null, 2) + '\n', {
            flag: 'wx',
          });
          console.log(JSON.stringify(receipt, null, 2));
          if (
            audit.integrity !== 'passed' ||
            audit.replay !== 'passed' ||
            audit.inputs !== 'passed' ||
            audit.decisions === 'failed'
          )
            process.exitCode = 1;
        } else if (mode === 'benchmark') {
          if (runtime.custom && runtime.builtins[runtime.custom.id])
            throw new Error('Custom study policy ID must differ from built-ins.');
          if (runtime.custom)
            runtime.builtins = { ...runtime.builtins, [runtime.custom.id]: runtime.custom };
          const protocol = {
            schema: 'policy-study-protocol-1',
            game,
            identity: runtime.adapter.identity,
            split,
            seeds: cohortSeeds(split as 'development' | 'evaluation'),
            policies: Object.values(runtime.builtins).map((p) => ({
              id: p.id,
              version: p.version,
            })),
            difficulties: ['relaxed', 'standard', 'severe'],
            policySeed: 'POLICY-STREAM-1',
            maxDecisions,
            provenance,
            ranking:
              'won, then blind stages passed (cleared or skipped) + current-blind score fraction, then cash; win rates and progress reported separately',
            analysis:
              'Paired independent environment-seed blocks. 95% t intervals on mean progress and paired differences. All attempts retained. No tuning on evaluation.',
          };
          await writeFile(
            resolve(directory!, 'protocol.json'),
            JSON.stringify(protocol, null, 2) + '\n',
            { flag: 'wx' },
          );
          const report = await benchmark(runtime, {
            split: split as 'development' | 'evaluation',
            directory: directory!,
            maxDecisions,
            provenance,
          });
          await checkSources();
          await writeFile(
            resolve(directory!, 'report.json'),
            JSON.stringify(report, null, 2) + '\n',
            { flag: 'wx' },
          );
          console.log(
            JSON.stringify({ directory, summary: report.summary, paired: report.paired }, null, 2),
          );
          if (report.rows.some((r) => !auditPassed(r.audit) || r.status === 'error'))
            process.exitCode = 1;
        } else {
          const run = await runtime.recordEpisode(
            runtime.adapter,
            factory,
            {
              seed: options.seed ?? 'POLICY-ADOPTION-1-DEV-01',
              setup: { difficulty: options.difficulty ?? 'standard' },
              policySeed: options['policy-seed'] ?? 'POLICY-STREAM-1',
              policyOptions: options['policy-options']
                ? (JSON.parse(options['policy-options']) as JsonObject)
                : {},
              maxDecisions,
            },
            provenance,
          );
          const audit = await runtime.auditRollout(runtime.adapter, run, factory);
          await checkSources();
          const artifacts = {
            'rollout.json': JSON.stringify(run) + '\n',
            'replay.json': JSON.stringify(run.replay, null, 2) + '\n',
            'audit.json': JSON.stringify(audit, null, 2) + '\n',
          };
          if (directory) {
            for (const [name, bytes] of Object.entries(artifacts))
              await writeFile(resolve(directory, name), bytes, { flag: 'wx' });
            const location = relative(repositoryRoot, directory);
            await writeFile(
              resolve(directory, 'manifest.json'),
              JSON.stringify(
                {
                  schema: 'policy-manifest-1',
                  digest: run.digest,
                  policy: run.policy,
                  episode: run.episode,
                  provenance,
                  artifacts: Object.fromEntries(
                    Object.entries(artifacts).map(([name, bytes]) => [name, sha256(bytes)]),
                  ),
                  review: location.startsWith('..')
                    ? null
                    : `/?game=balatro&review=policy&rollout=${encodeURIComponent('/' + location + '/rollout.json')}`,
                },
                null,
                2,
              ) + '\n',
              { flag: 'wx' },
            );
          } else if (options.out) {
            await writeFile(
              resolve(options.out),
              JSON.stringify({ episode: run.episode, audit }, null, 2) + '\n',
              { flag: 'wx' },
            );
          }
          console.log(
            JSON.stringify({ directory, policy: run.policy, episode: run.episode, audit }, null, 2),
          );
          if (!auditPassed(audit) || run.episode.status === 'error') process.exitCode = 1;
        }
      },
    );
  }
} catch (error) {
  reportFailure(error);
}
