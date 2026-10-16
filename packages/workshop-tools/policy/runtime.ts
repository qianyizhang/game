import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { relative, resolve } from 'node:path';
import { buildRuntime, runtimePins, repositoryRoot, sha256 } from '../runtime-bundle.ts';
import type {
  EpisodeAdapter,
  PolicyFactory,
  StudyDefinition,
} from '../../../src/shared/policy/types';
export interface Runtime {
  /** Evaluator-only retained-lifetime module used by independent study workers. */
  moduleURL: string;
  adapter: EpisodeAdapter<unknown, unknown, unknown>;
  study: StudyDefinition;
  builtins: Record<string, PolicyFactory<unknown, unknown>>;
  custom?: PolicyFactory<unknown, unknown>;
  recordEpisode: (typeof import('../../../src/shared/policy/rollout'))['recordEpisode'];
  auditRollout: (typeof import('../../../src/shared/policy/rollout'))['auditRollout'];
  parseRollout: (typeof import('../../../src/shared/policy/rollout'))['parseRollout'];
}
const adapters: Record<string, string> = {
  blindside: 'src/games/balatro/agent/adapter.ts',
  spire: 'src/games/spire/agent/adapter.ts',
  hearth: 'src/games/battlegrounds/agent/adapter.ts',
  emberwake: 'packages/diablo2/src/agent/adapter.ts',
  cartographer: 'src/games/cartographer/agent/adapter.ts',
};
/** Selected adapter/module is statically bundled: no unpinned runtime chunks. */
export async function withRuntime<T>(
  options: { game: string; policyModule?: string; retain?: string },
  use: (
    runtime: Runtime,
    provenance: {
      sourceDigests: Record<string, string>;
      toolDigests: Record<string, string>;
      bundleDigest: string;
      runtime: string;
    },
  ) => Promise<T>,
): Promise<T> {
  const adapterPath = adapters[options.game];
  if (!adapterPath) throw new Error(`Unsupported game: ${options.game}`);
  const directory = await mkdtemp(resolve(tmpdir(), 'workshop-policy-'));
  try {
    const entry = resolve(directory, 'entry.ts');
    await writeFile(
      entry,
      [
        `export { adapter, builtins, study } from ${JSON.stringify(resolve(repositoryRoot, adapterPath))};`,
        `export { recordEpisode, auditRollout, parseRollout } from ${JSON.stringify(resolve(repositoryRoot, 'src/shared/policy/rollout.ts'))};`,
        ...(options.policyModule
          ? [`export { default as custom } from ${JSON.stringify(resolve(options.policyModule))};`]
          : []),
      ].join('\n'),
    );
    const bundle = await buildRuntime({ entry, directory, fileName: 'policy.mjs' });
    bundle.sourcePaths.delete(entry);
    bundle.sourcePaths.delete(await realpath(entry));
    const pins = await runtimePins(bundle);
    const toolDigests = Object.fromEntries(
      await Promise.all(
        [
          'policy/runtime.ts',
          'policy/cli.ts',
          'policy/study.ts',
          'policy/calibration.ts',
          'policy/analyze-spire.ts',
          'policy/pool.ts',
          'policy/worker.ts',
          'runtime-bundle.ts',
          'io.ts',
        ].map(async (name) => {
          const path = resolve(repositoryRoot, 'packages/workshop-tools', name);
          return [relative(repositoryRoot, path), sha256(await readFile(path))] as const;
        }),
      ),
    );
    if (options.retain) {
      await mkdir(options.retain, { recursive: true });
      await writeFile(
        resolve(options.retain, `${pins.bundleDigest}.mjs`),
        await readFile(bundle.path),
        { flag: 'wx' },
      );
    }
    return await use(
      {
        ...((await import(bundle.moduleURL)) as Omit<Runtime, 'moduleURL'>),
        moduleURL: bundle.moduleURL,
      },
      {
        ...pins,
        toolDigests,
        runtime: `${process.version} / ${process.platform} / ${process.arch}`,
      },
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
