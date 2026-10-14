import { createInterface } from 'node:readline';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { withRuntime } from './runtime.ts';
import { createProtocol } from './protocol.ts';
import { evaluate } from './evaluate.ts';
import type { Difficulty } from '../../../src/games/night-passage/domain/contracts';
import type { ControlPreset } from '../../../src/games/night-passage/application/control';
import type { Policy } from '../../../src/games/night-passage/agent/policy';
import type { WeaponId } from '../../../src/games/night-passage/domain/types';

const usage = `night-passage serve
night-passage play [--seed SEED] [--weapon sword|spear|shield|bow|fists] [--out REPORT] [--replay FILE]
night-passage benchmark [--suite training|held-out] [--out REPORT]
night-passage evaluate --split development|evaluation --pool N --seeds N --controls yes|no --witnesses yes|no --out REPORT

serve: newline-delimited JSON requests on stdin; one JSON response per line on stdout.
Operations: reset (seed, control, policy, rules), observe, step (command, workUnits), suggest, act, export. Optional id is echoed.
play/benchmark: fresh profile, Root/Feather runes, fixed simulation budgets. No training occurs.
Options: --difficulty standard|veteran|ordeal --control exact|light|standard|heavy --policy quick|balanced|deliberate --rules night-passage-4|night-passage-5.`;

async function save(path: string, content: string) {
  const target = resolve(path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content);
}

try {
  const [mode = 'help', ...args] = process.argv.slice(2);
  if (mode === 'help' || mode === '--help') {
    console.log(usage);
  } else {
    if (!['serve', 'play', 'benchmark', 'evaluate'].includes(mode)) throw new Error(usage);
    const allowed =
      mode === 'play'
        ? ['seed', 'weapon', 'out', 'replay', 'difficulty', 'control', 'policy', 'rules']
        : mode === 'benchmark'
          ? ['suite', 'out', 'difficulty', 'control', 'policy', 'rules']
          : mode === 'evaluate'
            ? ['split', 'pool', 'seeds', 'out', 'controls', 'witnesses', 'difficulty']
            : [];
    const options: Record<string, string> = {};
    for (let index = 0; index < args.length; index += 2) {
      const key = args[index].slice(2),
        value = args[index + 1];
      if (
        !args[index].startsWith('--') ||
        !allowed.includes(key) ||
        value === undefined ||
        value.startsWith('--') ||
        key in options
      )
        throw new Error(`Invalid arguments.\n${usage}`);
      options[key] = value;
    }
    const weapon = options.weapon ?? 'bow';
    if (!['sword', 'spear', 'shield', 'bow', 'fists'].includes(weapon))
      throw new Error('Unknown weapon.');
    const suite = options.suite ?? 'training';
    if (suite !== 'training' && suite !== 'held-out') throw new Error('Unknown suite.');
    if (
      mode === 'evaluate' &&
      options.split !== undefined &&
      !['development', 'evaluation'].includes(options.split)
    )
      throw new Error('Unknown evaluation split.');
    const difficulty = options.difficulty ?? 'standard';
    for (const key of ['controls', 'witnesses'])
      if (options[key] !== undefined && !['yes', 'no'].includes(options[key]))
        throw new Error(`${key} must be yes or no.`);
    const control = options.control ?? 'standard';
    const policy = options.policy ?? 'balanced';
    const rules = options.rules ?? 'night-passage-5';
    if (!['standard', 'veteran', 'ordeal'].includes(difficulty))
      throw new Error('Unknown difficulty.');
    if (!['exact', 'light', 'standard', 'heavy'].includes(control))
      throw new Error('Unknown control preset.');
    if (!['quick', 'balanced', 'deliberate'].includes(policy)) throw new Error('Unknown policy.');
    if (!['night-passage-4', 'night-passage-5'].includes(rules))
      throw new Error('Unknown rules version.');
    const episodeOptions = {
      difficulty: difficulty as Difficulty,
      control: control as ControlPreset | 'exact',
      policy: policy as Policy,
      rules: rules as 'night-passage-4' | 'night-passage-5',
    };
    await withRuntime(
      async (runtime, provenance) => {
        if (mode === 'serve') {
          const handle = createProtocol(runtime);
          const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
          for await (const line of lines) {
            try {
              if (line.length > 1_000_000) throw new Error('Request exceeds 1 MB.');
              const request: unknown = JSON.parse(line);
              process.stdout.write(`${JSON.stringify(handle(request))}\n`);
            } catch (error) {
              process.stdout.write(
                `${JSON.stringify({ id: null, ok: false, error: error instanceof Error ? error.message : String(error) })}\n`,
              );
            }
          }
          return;
        }
        const result =
          mode === 'evaluate'
            ? await evaluate(runtime, {
                ...(options.difficulty ? { difficulty: options.difficulty as Difficulty } : {}),
                split: options.split === 'evaluation' ? 'evaluation' : 'development',
                seeds: Number(options.seeds ?? 10),
                pool: Number(options.pool ?? 1),
                out: options.out ?? '',
                controls: options.controls === 'yes',
                witnesses: options.witnesses === 'yes',
              })
            : mode === 'play'
              ? runtime.runEpisode({
                  ...episodeOptions,
                  seed: options.seed ?? 'a-light-in-the-dark',
                  weapon: weapon as WeaponId,
                  includeReplay: Boolean(options.replay),
                })
              : runtime.runBenchmark({ suite, ...episodeOptions });
        if ('replay' in result && typeof result.replay === 'string') {
          if (options.replay) await save(options.replay, result.replay);
          delete result.replay;
        }
        const report = JSON.stringify({ ...result, provenance }, null, 2) + '\n';
        if (options.out) await save(options.out, report);
        process.stdout.write(report);
      },
      mode === 'evaluate' && options.out ? resolve(dirname(options.out), 'bundles') : undefined,
    );
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
