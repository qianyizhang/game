import { objectValue } from '../shared/json';
import { it, expect } from 'vitest';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

it('produces identical gameplay across worker counts and audits metrics against reconstructed decisions', () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'recruitment-harness-test-'));
  const cli = 'scripts/hearth-recruitment-experiment.mjs';
  const run = (...args: string[]) =>
    execFileSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
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
    const receipt = resolve(parallel, files[0].replace('.replay.json', '.receipt.json'));
    const data = objectValue(JSON.parse(readFileSync(receipt, 'utf8')));
    const metrics = objectValue(data.metrics);
    if (typeof metrics.changedChoices !== 'number')
      throw new Error('Expected numeric changedChoices');
    metrics.changedChoices++;
    writeFileSync(receipt, JSON.stringify(data));
    const failure = spawnSync(process.execPath, [cli, 'audit', parallel, '1'], {
      encoding: 'utf8',
    });
    expect(failure.status).not.toBe(0);
    expect(failure.stderr).toContain('metric summary mismatch');
    const overwrite = spawnSync(process.execPath, [cli, 'smoke', serial, '1'], {
      encoding: 'utf8',
    });
    expect(overwrite.status).not.toBe(0);
    expect(overwrite.stderr).toContain('EEXIST');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}, 30000);
