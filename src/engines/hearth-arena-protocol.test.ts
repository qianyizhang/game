import { expect, it } from 'vitest';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { decideRecruitment } from '../games/battlegrounds/ai/recruitment-policy';
import { arenaSession, type ArenaFrame } from '../games/battlegrounds/application/arena';

it('binds an external controller to seat 6, hides styles, and records a complete lobby', async () => {
  const root = await mkdtemp(join(tmpdir(), 'hearth-arena-protocol-'));
  const output = join(root, 'evaluator');
  const child = spawn(
    process.execPath,
    ['scripts/hearth-arena-agent.mjs', 'SECRET-ARENA-PROTOCOL', output, '6', 'hidden'],
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
    if (line.done) throw new Error(`Unexpected exit: ${stderr}`);
    expect(line.value).not.toContain('SECRET-ARENA-PROTOCOL');
    expect(line.value).not.toContain('"rng"');
    expect(line.value).not.toContain('"style":');
    return JSON.parse(line.value);
  };
  const request = (value: unknown) => {
    child.stdin.write(JSON.stringify(value) + '\n');
    return receive();
  };
  try {
    const ready = await receive();
    expect(ready.event).toBe('ready');
    expect(ready.frame.observation.self.id).toBe(6);
    expect((await request({ op: 'inspect' })).ok).toBe(false);
    expect((await request({ op: 'act', seat: 0, step: ready.frame.step, action: 'a0' })).ok).toBe(
      false,
    );
    expect((await request({ op: 'act', step: 0, action: 'a0' })).ok).toBe(false);
    let frame: ArenaFrame = (await request({ op: 'observe' })).frame;
    expect(frame.step).toBe(ready.frame.step);
    for (let i = 0; frame.actions.length && i < 1500; i++) {
      const decision = decideRecruitment(frame, 'tempo-v1');
      const action = frame.actions.find(
        (a) => JSON.stringify(a.command) === JSON.stringify(decision.command),
      )!;
      const result = await request({ op: 'act', step: frame.step, action: action.id });
      expect(result.ok, result.error).toBe(true);
      expect(result.frame.step).toBeGreaterThan(frame.step);
      frame = result.frame;
    }
    expect(['won', 'lost']).toContain(frame.observation.phase);
    expect(frame.observation.self.placement).not.toBeNull();
    await request({ op: 'quit' });
    child.stdin.end();
    expect(await ended, stderr).toBe(0);
    const replay = arenaSession.decode(await readFile(join(output, 'replay.json'), 'utf8'));
    expect(new Set(replay.state.players.map((p) => p.placement)).size).toBe(8);
    expect(replay.state.players[6].placement).toBe(frame.observation.self.placement);
    expect(JSON.parse(await readFile(join(output, 'receipt.json'), 'utf8')).replayVerified).toBe(
      true,
    );
  } finally {
    lines.close();
    child.stdin.end();
    if (child.exitCode === null) child.kill();
    await ended;
    await rm(root, { recursive: true, force: true });
  }
}, 30000);
