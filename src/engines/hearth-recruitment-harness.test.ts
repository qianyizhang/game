import { fileURLToPath } from 'node:url';
import { objectValue } from '../shared/json';
import { it, expect } from 'vitest';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

it('produces identical gameplay across worker counts and audits metrics against reconstructed decisions', () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'recruitment-harness-test-'));
  const cli = fileURLToPath(
    new URL('../../packages/workshop-tools/hearth/recruitment-experiment.ts', import.meta.url),
  );
  const run = (...args: string[]) =>
    execFileSync(process.execPath, [cli, ...args], { encoding: 'utf8', cwd: directory });
  try {
    const serial = resolve(directory, 'serial'),
      parallel = resolve(directory, 'parallel');
    run('smoke', serial, '1');
    run('smoke', parallel, '2');
    const files = readdirSync(serial).filter((f) => f.endsWith('.replay.json'));
    expect(files).toHaveLength(4);
    for (const file of files) {
      expect(readFileSync(resolve(serial, file), 'utf8')).toBe(
        readFileSync(resolve(parallel, file), 'utf8'),
      );
      const trace = file.replace('.replay.json', '.decisions.jsonl');
      const clean = (path: string) =>
        readFileSync(path, 'utf8')
          .trim()
          .split('\n')
          .map((line) => {
            const row = objectValue(JSON.parse(line));
            delete row.elapsedMs;
            return row;
          });
      expect(clean(resolve(serial, trace))).toEqual(clean(resolve(parallel, trace)));
    }
    run('audit', serial, '2');
    expect(
      objectValue(JSON.parse(readFileSync(resolve(serial, 'audit/audit.json'), 'utf8'))).lobbies,
    ).toBe(4);
    const manifestPath = resolve(parallel, 'manifest.json');
    const manifestBytes = readFileSync(manifestPath, 'utf8');
    const manifest = objectValue(JSON.parse(manifestBytes));
    const pins = objectValue(manifest.sourceDigests);
    expect(pins['packages/workshop-tools/hearth/recruitment-worker.ts']).toMatch(/^[0-9a-f]{64}$/);
    pins['packages/workshop-tools/hearth/recruitment-worker.ts'] = '0'.repeat(64);
    writeFileSync(manifestPath, JSON.stringify(manifest));
    const stale = spawnSync(process.execPath, [cli, 'audit', parallel, '1'], {
      encoding: 'utf8',
      cwd: directory,
    });
    expect(stale.status).not.toBe(0);
    expect(stale.stderr).toContain('Frozen source mismatch');
    writeFileSync(manifestPath, manifestBytes);
    const receipt = resolve(parallel, files[0].replace('.replay.json', '.receipt.json'));
    const data = objectValue(JSON.parse(readFileSync(receipt, 'utf8')));
    const metrics = objectValue(data.metrics);
    if (typeof metrics.changedChoices !== 'number')
      throw new Error('Expected numeric changedChoices');
    metrics.changedChoices++;
    writeFileSync(receipt, JSON.stringify(data));
    const failure = spawnSync(process.execPath, [cli, 'audit', parallel, '1'], {
      encoding: 'utf8',
      cwd: directory,
    });
    expect(failure.status).not.toBe(0);
    expect(failure.stderr).toContain('metric summary mismatch');
    const overwrite = spawnSync(process.execPath, [cli, 'smoke', serial, '1'], {
      encoding: 'utf8',
      cwd: directory,
    });
    expect(overwrite.status).not.toBe(0);
    expect(overwrite.stderr).toContain('EEXIST');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}, 30000);
