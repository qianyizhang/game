import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import { extname } from 'node:path';

export const auditDefaults = { ref: 'HEAD', top: 20, minBytes: 256 * 1024, minLines: 1000 };
const jsonLimit = 8 * 1024 * 1024;

interface Metrics {
  lines: number | null;
  longestLineBytes: number | null;
  lfsPayloadBytes: number | null;
  json: {
    compactBytes: number;
    largestFields: { name: string; compactBytes: number; items: number | null }[];
  } | null;
}

interface FileRecord extends Metrics {
  path: string;
  object: string;
  mode: string;
  bytes: number;
  role: string;
  signals: string[];
  suggestion: string;
}

export function parseAuditArgs(args: string[]) {
  const options = { ...auditDefaults, json: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--json') options.json = true;
    else if (arg === '--ref') {
      const ref = args[++i];
      if (!ref || ref.startsWith('--')) throw new Error('--ref requires a commit reference');
      options.ref = ref;
    } else if (arg === '--top' || arg === '--min-bytes' || arg === '--min-lines') {
      const value = args[++i];
      const number = Number(value);
      if (!value || !/^\d+$/.test(value) || !Number.isSafeInteger(number) || number < 1)
        throw new Error(`${arg} requires a positive safe integer`);
      if (arg === '--top') options.top = number;
      else if (arg === '--min-bytes') options.minBytes = number;
      else options.minLines = number;
    } else throw new Error(`Unknown audit argument: ${arg}`);
  }
  return options;
}

function role(path: string) {
  if (/(^|\/)(package-lock\.json|uv\.lock|.*\.lock)$/.test(path)) return 'lockfile';
  if (/(^|\/)(releases|evidence|references)\/|^docs\/research\//.test(path)) return 'evidence';
  if (/\.(?:[cm]?js|jsx|tsx?|py|css|html|sh)$/.test(path)) return 'source';
  if (/\.jsonl?$/.test(path)) return 'data';
  if (path.endsWith('.md')) return 'document';
  return 'asset-or-config';
}

/** Stream the batch protocol so a large committed blob never needs a whole-file buffer. */
async function measureBlobs(
  root: string,
  objects: { object: string; bytes: number; json: boolean }[],
) {
  if (!objects.length) return new Map<string, Metrics>();
  const child = spawn('git', ['cat-file', '--batch'], {
    cwd: root,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const completion = once(child, 'close');
  let stderr = '';
  child.stderr.setEncoding('utf8').on('data', (text: string) => {
    stderr = (stderr + text).slice(-4096);
  });
  child.stdin.on('error', () => {}); // A failed Git process is reported by completion below.
  child.stdin.end(objects.map(({ object }) => object).join('\n') + '\n');
  const input = child.stdout[Symbol.asyncIterator]();
  let block: Buffer = Buffer.alloc(0);
  let offset = 0;
  async function read(max: number) {
    if (offset === block.length) {
      const next = await input.next();
      if (next.done || !(next.value instanceof Buffer))
        throw new Error('Truncated Git blob stream');
      block = next.value;
      offset = 0;
    }
    const part = block.subarray(offset, offset + max);
    offset += part.length;
    return part;
  }
  const metrics = new Map<string, Metrics>();
  try {
    for (const entry of objects) {
      let header = '';
      for (;;) {
        const byte = await read(1);
        if (byte[0] === 10) break;
        header += byte.toString('ascii');
        if (header.length > 200) throw new Error('Invalid Git blob header');
      }
      if (header !== `${entry.object} blob ${entry.bytes}`)
        throw new Error(`Unexpected Git blob: ${header}`);
      let remaining = entry.bytes;
      let lineBytes = 0;
      let longestLineBytes = 0;
      let lines = 0;
      let lastByte = 10;
      let binary = false;
      const decoder = new TextDecoder('utf-8', { fatal: true });
      const chunks: Buffer[] = [];
      let prefix: Buffer = Buffer.alloc(0);
      while (remaining > 0) {
        const part = await read(remaining);
        remaining -= part.length;
        if (prefix.length < 1024)
          prefix = Buffer.concat([prefix, part.subarray(0, 1024 - prefix.length)]);
        if (entry.json && entry.bytes <= jsonLimit) chunks.push(Buffer.from(part));
        if (!binary) {
          try {
            decoder.decode(part, { stream: true });
            binary = part.includes(0);
          } catch {
            binary = true;
          }
        }
        for (const byte of part) {
          if (byte === 10) {
            lines++;
            longestLineBytes = Math.max(longestLineBytes, lineBytes);
            lineBytes = 0;
          } else lineBytes++;
        }
        lastByte = part[part.length - 1];
      }
      if ((await read(1))[0] !== 10) throw new Error('Invalid Git blob delimiter');
      try {
        decoder.decode();
      } catch {
        binary = true;
      }
      if (entry.bytes > 0 && lastByte !== 10) lines++;
      longestLineBytes = Math.max(longestLineBytes, lineBytes);
      const pointer =
        entry.bytes <= 1024
          ? /^version https:\/\/git-lfs.github.com\/spec\/v1\r?\n(?:[^\n]*\n)*oid sha256:[a-f0-9]{64}\r?\nsize (\d+)\r?\n?$/.exec(
              prefix.toString('utf8'),
            )
          : null;
      let json: Metrics['json'] = null;
      if (chunks.length && !binary) {
        try {
          const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          const fields: [string, unknown][] =
            value && typeof value === 'object'
              ? Array.isArray(value)
                ? [['(root array)', value]]
                : Object.entries(value)
              : [];
          json = {
            compactBytes: Buffer.byteLength(JSON.stringify(value)),
            largestFields: fields
              .map(([name, item]) => ({
                name,
                compactBytes: Buffer.byteLength(JSON.stringify(item)),
                items: Array.isArray(item) ? item.length : null,
              }))
              .sort((a, b) => b.compactBytes - a.compactBytes)
              .slice(0, 3),
          };
        } catch {
          /* Invalid/oversized JSON still receives exact byte and line metrics. */
        }
      }
      metrics.set(entry.object, {
        lines: binary || pointer ? null : lines,
        longestLineBytes: binary || pointer ? null : longestLineBytes,
        lfsPayloadBytes: pointer ? Number(pointer[1]) : null,
        json,
      });
    }
    const [code] = (await completion) as [number | null, NodeJS.Signals | null];
    if (code !== 0) throw new Error(stderr || `git cat-file exited ${String(code)}`);
    return metrics;
  } finally {
    child.stdin.destroy();
    child.stdout.destroy();
    if (child.exitCode === null) child.kill();
    await completion.catch(() => {});
  }
}

function suggestion(file: FileRecord) {
  if (file.mode === '120000')
    return 'Keep symlink identity; its target is outside this blob audit.';
  if (file.lfsPayloadBytes !== null) return 'Keep LFS pointer; review payload lifetime separately.';
  if (file.role === 'lockfile')
    return 'Keep dependency authority; regenerate through the package manager, do not split manually.';
  if (file.role === 'evidence')
    return 'Preserve frozen evidence and hashes. For future outputs, separate a readable summary from bulk data; migrate storage only with verified recovery and updated consumers.';
  if (file.lines === null)
    return 'Review storage (LFS for large binaries) and delivery consumers; preserve artist sources and accepted captures.';
  if (file.role === 'source')
    return 'Review responsibilities and callers; split at a cohesive module boundary or simplify repeated logic/embedded data. Length alone does not prove complexity.';
  if (file.role === 'data')
    return 'Inspect producer and consumers; separate small metadata from bulk arrays or reproducible diagnostics. Remove only after checking use, rebuildability and recovery.';
  if (file.role === 'document')
    return 'Review topic boundaries; consolidate repetition or split independently useful topics and update links.';
  return 'Inspect purpose and callers; remove only after confirming obsolescence and recovery.';
}

/** Inspect a fixed committed tree, independent of index/worktree edits and LFS hydration. */
export async function auditCommittedFiles(root: string, options = auditDefaults) {
  const git = (args: string[]) =>
    execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  const commit = git([
    'rev-parse',
    '--verify',
    '--end-of-options',
    `${options.ref}^{commit}`,
  ]).trim();
  const entries = git(['ls-tree', '-r', '-l', '-z', commit]).split('\0').filter(Boolean);
  const files: FileRecord[] = [];
  const submodules: string[] = [];
  for (const entry of entries) {
    const match = /^(\d+) (blob|commit) ([a-f0-9]+) +([\d-]+)\t([\s\S]+)$/.exec(entry);
    if (!match) throw new Error(`Invalid Git tree entry: ${entry}`);
    const [, mode, type, object, size, path] = match;
    if (type === 'commit') {
      submodules.push(path);
      continue;
    }
    files.push({
      path,
      object,
      mode,
      bytes: Number(size),
      role: role(path),
      lines: null,
      longestLineBytes: null,
      lfsPayloadBytes: null,
      json: null,
      signals: [],
      suggestion: '',
    });
  }
  const objects = new Map<string, { object: string; bytes: number; json: boolean }>();
  for (const file of files) {
    const previous = objects.get(file.object);
    objects.set(file.object, {
      object: file.object,
      bytes: file.bytes,
      json: previous?.json === true || extname(file.path) === '.json',
    });
  }
  const measurements = await measureBlobs(root, [...objects.values()]);
  const groups = new Map<string, FileRecord[]>();
  for (const file of files) {
    Object.assign(file, measurements.get(file.object));
    if (file.mode === '120000') {
      file.lines = null;
      file.longestLineBytes = null;
    }
    if (file.bytes >= options.minBytes) file.signals.push('large-blob');
    if ((file.lines ?? 0) >= options.minLines) file.signals.push('many-lines');
    if ((file.longestLineBytes ?? 0) >= 2000) file.signals.push('long-lines');
    const group = groups.get(file.object) ?? [];
    group.push(file);
    groups.set(file.object, group);
    file.suggestion = suggestion(file);
  }
  const duplicateGroups = [...groups]
    .filter(([, group]) => group.length > 1 && group[0].bytes >= options.minBytes)
    .map(([object, group]) => {
      for (const file of group) file.signals.push('duplicate-blob');
      return { object, bytesPerFile: group[0].bytes, paths: group.map((file) => file.path) };
    });
  const sum = (select: (file: FileRecord) => number) =>
    files.reduce((total, file) => total + select(file), 0);
  return {
    schemaVersion: 1,
    commit,
    thresholds: { minBytes: options.minBytes, minLines: options.minLines, longLineBytes: 2000 },
    limits: {
      scope:
        'One committed tree; excludes index/worktree changes, earlier history and submodule contents.',
      bytes:
        'Uncompressed Git blob bytes per path, not pack size, network transfer or hydrated LFS payloads.',
      lines:
        'Physical UTF-8 lines including blank lines and a final unterminated line; binary, LFS pointers and symlinks have null lines. Not semantic code LOC.',
      json: `Estimated compact-size and largest top-level fields only for valid JSON up to ${jsonLimit} bytes; null means unavailable. Parsing/re-encoding is not a byte-preserving rewrite recipe.`,
      review:
        'Path-based role hints and size signals; no caller analysis, complexity verdict or deletion authority. Splitting alone does not save bytes or remove history.',
    },
    totals: {
      files: files.length,
      blobBytes: sum((file) => file.bytes),
      textLines: sum((file) => file.lines ?? 0),
      jsonFiles: files.filter((file) => file.path.endsWith('.json')).length,
      jsonBytes: sum((file) => (file.path.endsWith('.json') ? file.bytes : 0)),
      lfsFiles: files.filter((file) => file.lfsPayloadBytes !== null).length,
      lfsPayloadBytes: sum((file) => file.lfsPayloadBytes ?? 0),
      reviewCandidates: files.filter((file) => file.signals.length > 0).length,
      duplicatePathBytes: duplicateGroups.reduce(
        (total, group) => total + group.bytesPerFile * (group.paths.length - 1),
        0,
      ),
    },
    submodules,
    duplicateGroups,
    files,
  };
}

type Report = Awaited<ReturnType<typeof auditCommittedFiles>>;

export function formatCommittedAudit(report: Report, top: number) {
  const mib = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
  const safe = (text: string) =>
    text
      .replace(/[\n\r\t]/g, ' ')
      .replace(/\|/g, '\\|')
      .replace(/`/g, '\\`');
  const byBytes = [...report.files].sort(
    (a, b) => b.bytes - a.bytes || a.path.localeCompare(b.path),
  );
  const byLines = [...report.files]
    .filter((file) => file.lines !== null)
    .sort((a, b) => (b.lines ?? 0) - (a.lines ?? 0) || a.path.localeCompare(b.path));
  const table = (files: FileRecord[]) =>
    [
      '| File | Blob bytes | Physical lines | Role | Signals |',
      '| --- | ---: | ---: | --- | --- |',
      ...files
        .slice(0, top)
        .map(
          (file) =>
            `| ${safe(file.path)} | ${file.bytes} | ${file.lines ?? '—'} | ${file.lfsPayloadBytes !== null ? 'LFS pointer' : file.role} | ${file.signals.join(', ') || '—'} |`,
        ),
    ].join('\n');
  const candidates = byBytes.filter(
    (file) =>
      file.signals.length && !['evidence', 'lockfile'].includes(file.role) && file.lines !== null,
  );
  return (
    [
      `# Committed-file audit\n\nCommit: ${report.commit}`,
      `${report.totals.files} files; **${mib(report.totals.blobBytes)}** of Git blobs; **${mib(report.totals.jsonBytes)}** of JSON; ${report.totals.reviewCandidates} size/line review candidates.`,
      `LFS: ${report.totals.lfsFiles} pointers, **${mib(report.totals.lfsPayloadBytes)}** declared payload (separate from Git blob bytes).`,
      '## Largest blobs\n\n' + table(byBytes),
      '## Most physical lines\n\n' + table(byLines),
      '## Longest source files\n\n' + table(byLines.filter((file) => file.role === 'source')),
      '## Source/data review suggestions\n\n' +
        candidates
          .slice(0, top)
          .map((file) => {
            const field = file.json?.largestFields[0];
            const detail = file.json
              ? ` Compact JSON: ${mib(file.json.compactBytes)}; largest field: ${safe(field?.name ?? '(scalar)')}${field ? ` (${mib(field.compactBytes)})` : ''}.`
              : '';
            return `- **${safe(file.path)}**: ${file.suggestion}${detail}`;
          })
          .join('\n'),
      '## Large duplicate blobs\n\n' +
        (report.duplicateGroups.length
          ? report.duplicateGroups
              .slice(0, top)
              .map(
                (group) =>
                  `- ${group.bytesPerFile} bytes per occurrence: ${group.paths.map(safe).join(', ')}. Same Git object; preserve each occurrence\'s callers and evidence role before consolidating.`,
              )
              .join('\n')
          : 'None at the byte threshold.'),
      '## Interpretation limits\n\n' +
        Object.values(report.limits)
          .map((limit) => `- ${limit}`)
          .join('\n'),
      `\nThresholds: ${report.thresholds.minBytes} blob bytes, ${report.thresholds.minLines} physical lines, or ${report.thresholds.longLineBytes} bytes in one line. Rankings show up to ${top} rows each; --json includes every file.`,
    ].join('\n\n') + '\n'
  );
}
