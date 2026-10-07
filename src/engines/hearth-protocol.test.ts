import { objectValue } from '../shared/json';
import { expect, it } from 'vitest';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { createHearthPolicy } from '../games/battlegrounds/ai/policy';
import { bgSession } from '../games/battlegrounds/application/session';
import type { HearthFrame } from '../games/battlegrounds/application/agent';

// This test drives the local protocol implementation and asserts its declared reply fields.
interface Reply {
  event?: string;
  ok?: boolean;
  id?: string;
  error?: string;
  frame: HearthFrame;
  catalogue: { heroes: { id: string }[] };
}

it('drives a complete external JSONL agent and preserves evaluator replay separately', async () => {
  const root = await mkdtemp(join(tmpdir(), 'hearth-protocol-test-'));
  const output = join(root, 'evaluator');
  const child = spawn(
    process.execPath,
    ['scripts/hearth-agent.mjs', 'PRIVATE-PROTOCOL-SEED', output],
    { stdio: ['pipe', 'pipe', 'pipe'] },
  );
  let stderr = '';
  child.stderr.on('data', (chunk) => {
    stderr += String(chunk);
  });
  const ended = new Promise<number | null>((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', resolve);
  });
  const lines = createInterface({ input: child.stdout, crlfDelay: Infinity });
  const iterator = lines[Symbol.asyncIterator]();
  const receive = async () => {
    const line = await iterator.next();
    if (line.done) throw new Error(`Agent ended unexpectedly: ${stderr}`);
    expect(line.value).not.toContain('PRIVATE-PROTOCOL-SEED');
    expect(line.value).not.toContain('"rng"');
    return JSON.parse(line.value) as Reply;
  };
  const request = async (value: unknown) => {
    child.stdin.write(JSON.stringify(value) + '\n');
    return receive();
  };
  try {
    const ready = await receive();
    expect(ready.event).toBe('ready');
    expect(ready.frame.step).toBe(0);
    child.stdin.write('{invalid json\n');
    expect((await receive()).ok).toBe(false);
    expect((await request({ op: 'act', step: 9, action: 'a0' })).ok).toBe(false);
    expect((await request({ op: 'act', step: 0, action: 'unknown' })).ok).toBe(false);
    const catalogue = await request({ id: 'catalogue', op: 'catalogue' });
    expect(catalogue.id).toBe('catalogue');
    expect(catalogue.catalogue.heroes.some((hero: { id: string }) => hero.id === 'archivist')).toBe(
      true,
    );
    let frame: HearthFrame = (await request({ op: 'observe' })).frame;
    expect(frame.step).toBe(0);
    const policy = createHearthPolicy({
      kind: 'heuristic-v1',
      hero: 'archivist',
      seed: 'PUBLIC-POLICY-SEED',
      samples: 4,
      maxOrders: 6,
    });
    for (let step = 0; frame.actions.length && step < 2000; step++) {
      const decision = policy.decide(frame);
      const action = frame.actions.find(
        (entry) => JSON.stringify(entry.command) === JSON.stringify(decision.command),
      )!;
      const result = await request({ op: 'act', step: frame.step, action: action.id });
      expect(result.ok, result.error).toBe(true);
      expect(result.frame.step).toBe(frame.step + 1);
      policy.accepted(decision.command);
      frame = result.frame;
    }
    expect(['won', 'lost']).toContain(frame.observation.phase);
    expect(frame.actions).toEqual([]);
    expect((await request({ op: 'quit' })).event).toBe('closed');
    child.stdin.end();
    expect(await ended, stderr).toBe(0);
    const session = bgSession.decode(await readFile(join(output, 'replay.json'), 'utf8'));
    expect(session.state.players[0].placement).toBe(frame.observation.self.placement);
    expect(
      objectValue(JSON.parse(await readFile(join(output, 'receipt.json'), 'utf8'))).replayVerified,
    ).toBe(true);
  } finally {
    lines.close();
    child.stdin.end();
    if (child.exitCode === null) child.kill();
    await ended;
    await rm(root, { recursive: true, force: true });
  }
}, 30000);
