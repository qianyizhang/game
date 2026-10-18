import { mkdir, open, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { freshDirectory, repositoryRoot, reportFailure } from '../io.ts';
import { policyMain, type PolicyMode } from '../night-passage/policy-cli.ts';
import { sha256 } from '../runtime-bundle.ts';
import { withRuntime } from './runtime.ts';
import { auditPassed, benchmark, cohortSeeds } from './study.ts';
import { readRolloutArtifact, writeRolloutArtifact } from './artifact.ts';
import { isGzip, rolloutFormat } from '../../../src/shared/policy/artifact.ts';
import type { JsonObject } from '../../../src/shared/policy/types';

const usage = `policy run|record --game blindside|spire|hearth|emberwake|cartographer|night-passage [--policy immediate|survival|growth | --policy-module ./policy.ts]
  [--seed SEED] [--setup JSON] [--difficulty relaxed|standard|severe] [--policy-seed SEED] [--policy-options JSON] [--max-decisions N]
policy record --game blindside|spire|hearth|emberwake|cartographer|night-passage --out NEW_DIRECTORY [same options]
policy benchmark --game blindside|spire|hearth|emberwake|cartographer|night-passage --split development|evaluation --out NEW_DIRECTORY [--max-decisions N]
policy audit --input ROLLOUT --out NEW_RECEIPT [--policy-module ./policy.ts]
Benchmark storage: --retain-rollouts none|all (default none; summaries keep every attempt and audit verdict).
Shared record/retained-benchmark storage (five adapters): --rollout-format json|gzip (default gzip).
Gzip retains exact rollout JSON inside a lossless container; replay/audit remain JSON. Night Passage compression is unsupported.
Shared study options (five adapters): --cohort UPPERCASE-NAMESPACE --blocks 10|20|40|60|100|400.
  --policies ID,ID selects a declared subset; default is every loaded policy.
Choose a NEW cohort namespace for fresh evidence; increasing --blocks reuses the same prefix.
A local TS module default-exports a game-typed PolicyFactory (Night Passage: native PolicyPlayer). It is trusted in-process code.
Night Passage policies are quick|balanced|deliberate; preserve --max-actions/--max-ticks and native PolicyPlayer timing. Benchmark uses recorded 10/20-block studies; explicit --suite training|held-out selects legacy summaries.
Run prints result/audit; record retains exact knowledge, replay, audit and compiled source-pinned bundle.
Benchmark freezes the protocol before execution; errors/timeouts remain attempted cases. Use record for selected diagnostic episodes.`;
async function main() {
  const [mode = 'help', ...args] = process.argv.slice(2);
  if (mode === 'help' || mode === '--help') console.log(usage);
  else {
    if (!['run', 'record', 'benchmark', 'audit'].includes(mode)) throw new Error(usage);
    const inputIndex = args.indexOf('--input');
    let nativeBySchema = false;
    let auditInput: Awaited<ReturnType<typeof readRolloutArtifact>> | undefined;
    if (mode === 'audit' && inputIndex >= 0 && args[inputIndex + 1] !== undefined) {
      const inputPath = resolve(args[inputIndex + 1]);
      const file = await open(inputPath, 'r');
      const prefix = Buffer.alloc(2);
      try {
        await file.read(prefix, 0, prefix.length, 0);
      } finally {
        await file.close();
      }
      // Native plaintext retains its existing unbounded UTF-8/schema routing contract.
      // The limit below bounds accepted shared artifacts, not this legacy routing allocation.
      auditInput = isGzip(prefix)
        ? await readRolloutArtifact(inputPath)
        : { text: await readFile(inputPath, 'utf8'), format: 'json' };
      const artifact: unknown = JSON.parse(auditInput.text.replace(/^\uFEFF/, ''));
      nativeBySchema =
        !!artifact &&
        typeof artifact === 'object' &&
        'schema' in artifact &&
        artifact.schema === 'night-passage-rollout-1';
      if (!nativeBySchema && auditInput.format === 'json')
        auditInput = await readRolloutArtifact(inputPath);
    }
    if (
      args.some((value, index) => value === '--game' && args[index + 1] === 'night-passage') ||
      nativeBySchema
    ) {
      if (args.includes('--rollout-format') || auditInput?.format === 'gzip')
        throw new Error(
          'Night Passage does not support compressed rollout containers or --rollout-format.',
        );
      await policyMain(mode as PolicyMode, args);
      return;
    }
    const allowed =
      mode === 'audit'
        ? ['input', 'out', 'policy-module']
        : mode === 'benchmark'
          ? [
              'game',
              'out',
              'split',
              'max-decisions',
              'policy-module',
              'pool',
              'cohort',
              'blocks',
              'policies',
              'rollout-format',
              'retain-rollouts',
            ]
          : [
              'game',
              'out',
              'policy',
              'policy-module',
              'seed',
              'difficulty',
              'setup',
              'policy-seed',
              'policy-options',
              'max-decisions',
              ...(mode === 'record' ? ['rollout-format'] : []),
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
    const format = rolloutFormat(options['rollout-format']);
    const retention = options['retain-rollouts'] ?? 'none';
    if (!['none', 'all'].includes(retention)) throw new Error('Use --retain-rollouts none|all.');
    const input = auditInput?.text;
    const wireGame = input ? (JSON.parse(input) as { game?: string }).game : options.game;
    const game =
      wireGame === 'slay-the-spire'
        ? 'spire'
        : wireGame === 'last-hearth-arena'
          ? 'hearth'
          : wireGame === 'dungeon-cartographer'
            ? 'cartographer'
            : wireGame;
    if (
      game !== 'blindside' &&
      game !== 'spire' &&
      game !== 'hearth' &&
      game !== 'emberwake' &&
      game !== 'cartographer'
    )
      throw new Error(
        'Select --game blindside, spire, hearth, emberwake, cartographer or night-passage.',
      );
    if (options.setup && options.difficulty)
      throw new Error('Choose --setup or --difficulty, not both.');
    if (game !== 'blindside' && options.difficulty)
      throw new Error('Use --setup for game-owned character/hero/difficulty configuration.');
    const maxDecisions = Number(options['max-decisions'] ?? 2000);
    if (!Number.isSafeInteger(maxDecisions) || maxDecisions < 1 || maxDecisions > 10000)
      throw new Error('Decision budget must be 1–10000.');
    const workers = Number(options.pool ?? 4);
    if (!Number.isInteger(workers) || workers < 1 || workers > 4)
      throw new Error('Use 1–4 independent case workers.');
    const split = options.split ?? 'development';
    if (!['development', 'evaluation'].includes(split)) throw new Error('Unknown study split.');
    const seeds = cohortSeeds(
      split as 'development' | 'evaluation',
      options.cohort,
      options.blocks === undefined ? undefined : Number(options.blocks),
    );
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
          if (options.policies) {
            const selected = options.policies.split(',');
            if (
              new Set(selected).size !== selected.length ||
              selected.some((id) => !Object.hasOwn(runtime.builtins, id))
            )
              throw new Error('Study policies must be unique available policy IDs.');
            runtime.builtins = Object.fromEntries(selected.map((id) => [id, runtime.builtins[id]]));
          }
          const protocol = {
            schema: 'policy-study-protocol-2',
            rolloutRetention: retention,
            rolloutFormat: format,
            rolloutSuffix: format === 'gzip' ? '.json.gzip' : '.json',
            game,
            identity: runtime.adapter.identity,
            split,
            seeds,
            policies: Object.values(runtime.builtins).map((p) => ({
              id: p.id,
              version: p.version,
            })),
            study: runtime.study,
            policySeed: 'POLICY-STREAM-1',
            maxDecisions,
            workers,
            provenance,
            ranking: runtime.study.ranking,
            analysis:
              'Independent paired seed blocks within each setup/stratum. 95% Wilson win intervals and approximate t intervals for mean/paired progress; paired wins report point estimates/discordance counts with intervals unavailable. No pooling across characters; no multiple-comparison adjustment. All attempt summaries and audit verdicts retained; full rollouts follow rolloutRetention. No tuning on evaluation.',
          };
          await writeFile(
            resolve(directory!, 'protocol.json'),
            JSON.stringify(protocol, null, 2) + '\n',
            { flag: 'wx' },
          );
          const report = await benchmark(runtime, {
            seeds,
            split: split as 'development' | 'evaluation',
            directory: directory!,
            workers,
            maxDecisions,
            provenance,
            rolloutFormat: format,
            retainRollouts: retention === 'all',
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
              setup: options.setup
                ? (JSON.parse(options.setup) as JsonObject)
                : options.difficulty
                  ? { difficulty: options.difficulty }
                  : runtime.study.defaultSetup,
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
            'replay.json': JSON.stringify(run.replay, null, 2) + '\n',
            'audit.json': JSON.stringify(audit, null, 2) + '\n',
          };
          if (directory) {
            const rollout = await writeRolloutArtifact(
              directory,
              'rollout',
              JSON.stringify(run) + '\n',
              format,
              runtime.study.reviewPath,
            );
            for (const [name, bytes] of Object.entries(artifacts))
              await writeFile(resolve(directory, name), bytes, { flag: 'wx' });
            await writeFile(
              resolve(directory, 'manifest.json'),
              JSON.stringify(
                {
                  schema: 'policy-manifest-1',
                  digest: run.digest,
                  rollout,
                  policy: run.policy,
                  episode: run.episode,
                  provenance,
                  artifacts: {
                    [rollout.file]: rollout.sha256,
                    ...Object.fromEntries(
                      Object.entries(artifacts).map(([name, bytes]) => [name, sha256(bytes)]),
                    ),
                  },
                  review: rollout.review,
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
}
try {
  await main();
} catch (error) {
  reportFailure(error);
}
