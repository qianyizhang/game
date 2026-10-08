import { createReadStream } from 'node:fs';
import { open, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromRoot, reportFailure } from '../io.ts';

type Obj = Record<string, unknown>;
const obj = (value: unknown): Obj =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Obj) : {};
const str = (value: unknown) => (typeof value === 'string' ? value : '');
const sha = (value: string) => createHash('sha256').update(value).digest('hex');
function timestamp(value: unknown) {
  const stamp = Date.parse(str(value));
  if (!Number.isFinite(stamp)) throw new Error('Expected an ISO timestamp');
  return stamp;
}
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
type Session = { id: string; parent: string; path: string; createdAt: number };
type Usage = { input: number; cached: number; output: number };
export type CreditOptions = {
  root: string;
  since: string;
  through?: string;
  sessionRoots?: string[];
};

async function paths(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await paths(path)));
    else if (entry.isFile() && entry.name.endsWith('.jsonl')) files.push(path);
  }
  return files;
}

// Inspect only session metadata during discovery; never retain message bodies.
async function metadata(path: string): Promise<Session> {
  const stream = createReadStream(path);
  const lines = createInterface({ input: stream, crlfDelay: Infinity });
  try {
    for await (const line of lines) {
      const data = obj(JSON.parse(line));
      const value = obj(data.payload);
      if (data.type !== 'session_meta' || !uuid.test(str(value.id)))
        throw new Error(`Invalid session metadata: ${path}`);
      const spawn = obj(obj(obj(value.source).subagent).thread_spawn);
      return {
        id: str(value.id),
        parent: str(spawn.parent_thread_id),
        path,
        createdAt: timestamp(value.timestamp ?? data.timestamp),
      };
    }
    throw new Error(`Empty session: ${path}`);
  } finally {
    lines.close();
    stream.destroy();
  }
}

function usage(value: unknown): Usage {
  const data = obj(value);
  const count = (key: string) => {
    const result = data[key];
    if (typeof result !== 'number' || !Number.isSafeInteger(result) || result < 0)
      throw new Error(`Invalid token counter ${key}`);
    return result;
  };
  const result = {
    input: count('input_tokens'),
    cached: count('cached_input_tokens'),
    output: count('output_tokens'),
  };
  if (result.cached > result.input) throw new Error('Cached input exceeds input');
  if (data.cache_write_input_tokens !== undefined && count('cache_write_input_tokens') !== 0)
    throw new Error('Nonzero cache-write usage needs a supported rate contract');
  if (
    data.reasoning_output_tokens !== undefined &&
    count('reasoning_output_tokens') > result.output
  )
    throw new Error('Reasoning output exceeds output');
  if (data.total_tokens !== undefined && count('total_tokens') !== result.input + result.output)
    throw new Error('Token total does not reconcile');
  return result;
}

export async function collectCredits(options: CreditOptions) {
  if (!uuid.test(options.root)) throw new Error('Provide an exact root thread UUID');
  const observedAt = new Date().toISOString();
  const through = options.through ?? observedAt;
  const cutoff = timestamp(through);
  const since = timestamp(options.since);
  if (since > cutoff || cutoff > timestamp(observedAt))
    throw new Error('Invalid accounting interval');
  const ratesText = await readFile(new URL('./credit-rates.json', import.meta.url), 'utf8');
  const rateCard = obj(JSON.parse(ratesText));
  const rates = obj(rateCard.rates);
  const codexDirectory = process.env.CODEX_HOME || resolve(homedir(), '.codex');
  const roots = options.sessionRoots ?? [resolve(codexDirectory, 'sessions')];
  if (!options.sessionRoots) {
    const archive = resolve(codexDirectory, 'archived_sessions');
    if (
      await stat(archive)
        .then((s) => s.isDirectory())
        .catch((e: unknown) => {
          if (obj(e).code === 'ENOENT') return false;
          throw e;
        })
    )
      roots.push(archive);
  }
  const files = [...new Set((await Promise.all(roots.map(paths))).flat())].sort();
  const sessions: Session[] = [];
  const discoveryErrors: string[] = [];
  for (const file of files) {
    try {
      sessions.push(await metadata(file));
    } catch (error) {
      discoveryErrors.push(error instanceof Error ? error.message : String(error));
    }
  }
  if (!sessions.some((session) => session.id === options.root))
    throw new Error('Root thread log not found');
  const selected = new Set([options.root]);
  let oldSize = 0;
  while (oldSize !== selected.size) {
    oldSize = selected.size;
    for (const session of sessions) if (selected.has(session.parent)) selected.add(session.id);
  }
  const gaps = [...discoveryErrors];
  const records: {
    thread: string;
    response: string;
    turn: string;
    at: string;
    model: string;
    effort: string;
    source: string;
    line: number;
    tokens: Usage;
    credits: number;
  }[] = [];
  const sources: { thread: string; path: string; bytes: number; sha256: string; lines: number }[] =
    [];
  const seen = new Map<string, string>();
  const activeTurns = new Map<string, Set<string>>();
  let duplicates = 0;
  let inheritedUsageIgnored = 0;
  let ignoredCumulativeCounters = 0;
  let lastUsageAt: string | null = null;
  const spawnExpectations = new Set<string>();
  for (const session of sessions.filter((item) => selected.has(item.id))) {
    const handle = await open(session.path, 'r');
    const size = (await handle.stat()).size;
    const digest = createHash('sha256');
    let lineNumber = 0;
    let lastByte = -1;
    const models = new Map<string, { model: string; effort: string }>();
    let current = { model: '', effort: '' };
    const turns = activeTurns.get(session.id) ?? new Set<string>();
    activeTurns.set(session.id, turns);
    const spawnCalls = new Set<string>();
    const output = size
      ? handle.createReadStream({ start: 0, end: size - 1, autoClose: false })
      : undefined;
    try {
      if (!output) {
        gaps.push(`Empty selected log: ${session.path}`);
        continue;
      }
      output.on('data', (chunk) => {
        const bytes = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
        digest.update(bytes);
        lastByte = bytes[bytes.length - 1] ?? -1;
      });
      const lines = createInterface({ input: output, crlfDelay: Infinity });
      for await (const line of lines) {
        lineNumber++;
        let data: Obj;
        try {
          data = obj(JSON.parse(line));
        } catch {
          gaps.push(`Malformed JSON: ${session.path}:${lineNumber}`);
          continue;
        }
        let at: number;
        try {
          at = timestamp(data.timestamp);
        } catch {
          gaps.push(`Missing timestamp: ${session.path}:${lineNumber}`);
          continue;
        }
        if (at > cutoff) continue;
        const value = obj(data.payload);
        if (data.type === 'turn_context') {
          current = { model: str(value.model), effort: str(value.effort) };
          if (str(value.turn_id)) models.set(str(value.turn_id), current);
        }
        if (data.type === 'event_msg' && at >= session.createdAt) {
          if (value.type === 'task_started') turns.add(str(value.turn_id));
          if (value.type === 'task_complete' || value.type === 'turn_aborted')
            turns.delete(str(value.turn_id));
          if (value.type === 'token_count' && at >= since) ignoredCumulativeCounters++;
        }
        if (at < since) continue;
        if (data.type === 'response_item') {
          const name = str(value.name);
          if (value.type === 'function_call' && /(?:^|__)spawn_agent$/.test(name))
            spawnCalls.add(str(value.call_id));
          if (value.type === 'function_call_output' && spawnCalls.has(str(value.call_id))) {
            // Spawn returns visible identity metadata. Do not export its body.
            for (const match of str(value.output).matchAll(
              /"(?:agent_id|thread_id)"\s*:\s*"([a-f0-9-]{36})"/g,
            ))
              spawnExpectations.add(match[1]);
          }
          if (
            (value.type === 'function_call' || value.type === 'custom_tool_call') &&
            (/imagegen|image_gen/.test(name) ||
              /(?:image_gen__imagegen|image_gen\.imagegen)\s*\(/.test(str(value.arguments)))
          )
            gaps.push(`Image generation requires separate metering: ${session.path}:${lineNumber}`);
        }
        if (data.type !== 'token_usage_record') continue;
        if (value.thread_id !== session.id) {
          inheritedUsageIgnored++;
          continue;
        }
        try {
          const response = str(value.response_id);
          const turn = str(value.turn_id);
          if (!response || !turn) throw new Error('Missing response/turn identity');
          const context = models.get(turn) ?? current;
          const tokens = usage(value.usage);
          const key = `${session.id}:${response}`;
          const identity = JSON.stringify({ tokens, model: context.model, turn });
          const prior = seen.get(key);
          if (prior) {
            if (prior !== identity) throw new Error('Conflicting duplicate response');
            duplicates++;
            continue;
          }
          seen.set(key, identity);
          const rate: unknown = rates[context.model];
          if (
            !Array.isArray(rate) ||
            rate.length !== 3 ||
            !rate.every((n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0)
          )
            throw new Error(`Unknown model rate: ${context.model || '(missing model)'}`);
          const [inputRate, cachedRate, outputRate] = rate as [number, number, number];
          const credits =
            ((tokens.input - tokens.cached) * inputRate +
              tokens.cached * cachedRate +
              tokens.output * outputRate) /
            1_000_000;
          records.push({
            thread: session.id,
            response,
            turn,
            at: str(data.timestamp),
            ...context,
            source: session.path,
            line: lineNumber,
            tokens,
            credits,
          });
          if (!lastUsageAt || at > timestamp(lastUsageAt)) lastUsageAt = str(data.timestamp);
        } catch (error) {
          gaps.push(
            `${error instanceof Error ? error.message : String(error)}: ${session.path}:${lineNumber}`,
          );
        }
      }
      if (lastByte !== 10) gaps.push(`Incomplete log tail: ${session.path}`);
      if ((await handle.stat()).size < size) gaps.push(`Log shrank during scan: ${session.path}`);
      sources.push({
        thread: session.id,
        path: session.path,
        bytes: size,
        sha256: digest.digest('hex'),
        lines: lineNumber,
      });
    } finally {
      output?.destroy();
      await handle.close();
    }
  }
  for (const expected of spawnExpectations)
    if (!selected.has(expected)) gaps.push(`Spawned agent log not discovered: ${expected}`);
  if (!records.length) gaps.push('No metered responses in the accounting interval');
  const byThread = [...selected].map((thread) => {
    const rows = records.filter((row) => row.thread === thread);
    return {
      thread,
      parent: sessions.find((s) => s.id === thread)?.parent ?? '',
      responses: rows.length,
      credits: rows.reduce((sum, row) => sum + row.credits, 0),
      models: [...new Set(rows.map((row) => row.model))],
      efforts: [...new Set(rows.map((row) => row.effort))],
    };
  });
  return {
    version: 1,
    collectionDurationMs: Date.now() - timestamp(observedAt),
    root: options.root,
    since: new Date(since).toISOString(),
    through: new Date(cutoff).toISOString(),
    observedAt,
    unit: 'modeled Standard credit-equivalents',
    credits: records.reduce((sum, row) => sum + row.credits, 0),
    coverage: gaps.length ? 'partial' : 'complete',
    coverageScope:
      'Persisted per-response usage in the discovered local root/descendant logs; live responses and external charges may remain unmetered. This is a checkpoint estimate, not billing.',
    rateCard: {
      id: rateCard.id,
      verifiedAt: rateCard.verifiedAt,
      source: rateCard.source,
      sha256: sha(ratesText),
      rates,
    },
    lastUsageAt,
    gaps,
    duplicates,
    inheritedUsageIgnored,
    ignoredCumulativeCounters,
    inFlightTurns: [...activeTurns].flatMap(([thread, turns]) =>
      [...turns].map((turn) => ({ thread, turn })),
    ),
    attribution:
      'Whole responses logged at or after asset start are included, even when they straddle the boundary; no timestamp proration. Descendants are selected by parent lineage, not session_id. Standard normalization does not apply speed-mode billing multipliers.',
    discovery: { roots, files: files.length, selectedThreads: selected.size },
    byThread,
    sources,
    records,
  };
}

export async function runCli(args: string[]) {
  if (args[0] === '--help') {
    console.log(
      'credits.ts --root THREAD_UUID --since ISO --out NEW.json [--through ISO] [--sessions-root DIR]\nOffline, pinned Standard credit-equivalents. Exit 2 means partial coverage; 1 means invalid inputs. Output never includes message bodies.',
    );
    return;
  }
  const flags = new Map<string, string>();
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    if (
      !key ||
      !value ||
      !['--root', '--since', '--out', '--through', '--sessions-root'].includes(key) ||
      flags.has(key)
    )
      throw new Error('Use --help for credit options');
    flags.set(key, value);
  }
  const root = flags.get('--root');
  const since = flags.get('--since');
  const out = flags.get('--out');
  if (!root || !since || !out) throw new Error('--root, --since and --out are required');
  const result = await collectCredits({
    root,
    since,
    through: flags.get('--through'),
    sessionRoots: flags.has('--sessions-root')
      ? [fromRoot(flags.get('--sessions-root')!)]
      : undefined,
  });
  await writeFile(fromRoot(out), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
  console.log(
    JSON.stringify({
      output: fromRoot(out),
      credits: result.credits,
      coverage: result.coverage,
      responses: result.records.length,
      gaps: result.gaps,
      inFlightTurns: result.inFlightTurns.length,
    }),
  );
  if (result.coverage !== 'complete') process.exitCode = 2;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await runCli(process.argv.slice(2)).catch(reportFailure);
