import { createInterface } from 'node:readline';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { withRuntime } from './runtime.ts';
import { createProtocol } from './protocol.ts';
import type { WeaponId } from '../../../src/games/night-passage/domain/types';

const usage = `night-passage serve
night-passage play [--seed SEED] [--weapon sword|spear|shield|bow|fists] [--out REPORT] [--replay FILE]
night-passage benchmark [--suite training|held-out] [--out REPORT]

serve: newline-delimited JSON requests on stdin; one JSON response per line on stdout.
Operations: reset (seed), observe, step (command), suggest, export. Optional id is echoed.
play/benchmark: fresh profile, Root/Feather runes, fixed simulation budgets. No training occurs.`;

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
    if (!['serve', 'play', 'benchmark'].includes(mode)) throw new Error(usage);
    const allowed =
      mode === 'play'
        ? ['seed', 'weapon', 'out', 'replay']
        : mode === 'benchmark'
          ? ['suite', 'out']
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
    await withRuntime(async (runtime, provenance) => {
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
        mode === 'play'
          ? runtime.runEpisode({
              seed: options.seed ?? 'a-light-in-the-dark',
              weapon: weapon as WeaponId,
              includeReplay: Boolean(options.replay),
            })
          : runtime.runBenchmark({ suite });
      if ('replay' in result && typeof result.replay === 'string') {
        if (options.replay) await save(options.replay, result.replay);
        delete result.replay;
      }
      const report = JSON.stringify({ ...result, provenance }, null, 2) + '\n';
      if (options.out) await save(options.out, report);
      process.stdout.write(report);
    });
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
