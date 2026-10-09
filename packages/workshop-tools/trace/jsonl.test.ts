import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { normalizeSessionFile, sessionTrace, renderSessionTrace } from './jsonl.ts';

// Controlled malformed/encrypted records exercise gaps that a normal UI journey cannot.
await test('JSONL trace keeps observable evidence and physical identity, with reconciled private/unknown omissions', async () => {
  const dir = await mkdtemp(resolve(tmpdir(), 'jsonl-trace-'));
  try {
    const path = resolve(dir, 'session.jsonl');
    const rows = [
      { type: 'session_meta', payload: { id: 'session', parent_thread_id: 'parent' } },
      { type: 'turn_context', payload: { turn_id: 'turn-a' } },
      { type: 'event_msg', payload: { type: 'user_message', message: 'Request' } },
      {
        type: 'response_item',
        payload: {
          type: 'message',
          role: 'user',
          content: [
            { type: 'input_text', text: 'Request' },
            { type: 'input_image', image_url: 'data:image/png;base64,aGVsbG8=' },
          ],
        },
      },
      {
        type: 'response_item',
        payload: { type: 'reasoning', encrypted_content: 'PRIVATE_SECRET' },
      },
      {
        type: 'response_item',
        payload: {
          type: 'message',
          channel: 'analysis',
          role: 'assistant',
          content: [{ type: 'output_text', text: 'PRIVATE_SECRET' }],
        },
      },
      { type: 'response_item', payload: { type: 'message', encrypted_content: 'PRIVATE_SECRET' } },
      { type: 'future_record', payload: { text: 'PRIVATE_SECRET' } },
      {
        type: 'response_item',
        timestamp: '2026-10-09T00:00:00Z',
        payload: {
          type: 'function_call',
          name: 'exec_command',
          call_id: 'call',
          arguments: '{"cmd":"echo safe"}',
        },
      },
      {
        type: 'response_item',
        payload: {
          type: 'function_call_output',
          call_id: 'call',
          output: 'Long output: ' + 'x'.repeat(4000),
          truncated: true,
        },
      },
      { type: 'turn_context', payload: { turn_id: 'turn-b' } },
      { type: 'event_msg', payload: { type: 'user_message', message: 'Request' } },
    ];
    const raw = rows.map((row) => JSON.stringify(row)).join('\n') + '\n\n{"partial":';
    await writeFile(path, raw);
    const trace = await normalizeSessionFile(path, 'session');
    const events = trace.turns.flatMap((turn) => turn.events);
    assert.equal(trace.parent, 'parent');
    assert.equal(trace.source.sha256, createHash('sha256').update(raw).digest('hex'));
    assert.equal(trace.source.bytes, Buffer.byteLength(raw));
    assert.equal(trace.source.lines, 14);
    assert.equal(trace.coverage.totalItems, 13);
    assert.equal(trace.coverage.normalizedItems, 4);
    assert.equal(
      trace.coverage.unsupportedItems.reduce((sum, item) => sum + item.count, 0),
      3,
    );
    assert.equal(
      trace.coverage.excludedItems.reduce((sum, item) => sum + item.count, 0),
      6,
    );
    assert.equal(events[0].sourceLine, 3);
    assert.deepEqual(events[0].imageUrls, ['data:image/png;base64,aGVsbG8=']);
    assert.equal(events[1].timestamp, '2026-10-09T00:00:00Z');
    assert.equal(events[1].callId, 'call');
    assert.equal(events[2].output?.length, 4013);
    assert.equal(events[2].sourceTruncated, true);
    assert.equal(events[3].turnId, 'turn-b');
    assert.ok(!JSON.stringify(trace).includes('PRIVATE_SECRET'));
    await assert.rejects(normalizeSessionFile(path, 'other'), /identity changed/);
    const html = await renderSessionTrace(sessionTrace([trace], 'session'));
    assert.ok(html.includes('trace-data'));
    assert.ok(!html.includes('/*TRACE_RUNTIME*/'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

await test('lazy trace keeps bounded previews and retrieves byte-pinned complete UTF-8 records and duplicate-envelope images', async () => {
  const dir = await mkdtemp(resolve(tmpdir(), 'lazy-jsonl-trace-'));
  try {
    const path = resolve(dir, 'session.jsonl');
    const request = '🦊 Request\n' + 'é'.repeat(180000) + 'REQUEST_TAIL';
    const output = 'OUTPUT_START ' + 'x'.repeat(200000) + 'OUTPUT_TAIL';
    const image = 'data:image/png;base64,aGVsbG8=';
    const rows = [
      { type: 'session_meta', payload: { id: 'session' } },
      { type: 'turn_context', payload: { turn_id: 'turn' } },
      { type: 'event_msg', payload: { type: 'user_message', message: request } },
      {
        type: 'response_item',
        payload: {
          type: 'message',
          role: 'user',
          content: [
            { type: 'input_text', text: request },
            { type: 'input_image', image_url: image },
          ],
        },
      },
      { type: 'event_msg', payload: { type: 'user_message', message: request + '_DISTINCT' } },
      {
        type: 'response_item',
        payload: { type: 'custom_tool_call_output', call_id: 'result', output },
      },
      { type: 'response_item', payload: { type: 'reasoning', encrypted_content: 'SECRET' } },
    ];
    // Include a blank line and leave the last record without a newline.
    const raw = rows.map((row) => JSON.stringify(row)).join('\r\n\r\n');
    await writeFile(path, raw);
    const lazy = await normalizeSessionFile(path, 'session', 'Session', { lazyBodies: true });
    const events = lazy.turns.flatMap((turn) => turn.events);
    assert.equal(events.length, 3);
    assert.ok(JSON.stringify(sessionTrace([lazy], 'session')).length < 20000);
    assert.equal(events[0].text.length, 1200);
    assert.equal(events[0].body?.imageCount, 1);
    assert.equal(events[0].body?.sources.length, 2);
    assert.equal(events[2].output?.length, 1200);
    const { readSessionBody } = await import('./jsonl.ts');
    assert.deepEqual(await readSessionBody(lazy, events[0]), { text: request, imageUrls: [image] });
    assert.equal((await readSessionBody(lazy, events[1])).text, request + '_DISTINCT');
    assert.equal((await readSessionBody(lazy, events[2])).output, output);
    // A same-length rewrite cannot be served using a historic byte pin.
    await writeFile(path, raw.replace('OUTPUT_TAIL', 'CHANGED_END'));
    await assert.rejects(readSessionBody(lazy, events[2]), /Source record changed/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

await test('native completed items recover public actions, deduplicate messages, classify runtime requests, and reconcile omissions', async () => {
  const dir = await mkdtemp(resolve(tmpdir(), 'native-jsonl-'));
  try {
    const path = resolve(dir, 'session.jsonl');
    const goal =
      '<codex_internal_context source="goal">\n<objective>\nFinish the local tool\n</objective>\nContinuation behavior\n</codex_internal_context>';
    const review =
      'The following is the Codex agent history added since your last approval assessment. Continue the same review conversation.';
    const image = 'data:image/png;base64,aGVsbG8=';
    const complete = (item: unknown) => ({
      type: 'event_msg',
      payload: { type: 'item_completed', turn_id: 'turn', item },
    });
    const message = (role: string, value: string) => ({
      type: 'response_item',
      payload: { type: 'message', role, content: value },
    });
    const rows = [
      { type: 'session_meta', payload: { id: 'session' } },
      { type: 'turn_context', payload: { turn_id: 'turn', model: 'model-main' } },
      // Native copies can appear before or after the canonical message. Preserve their images.
      complete({
        type: 'UserMessage',
        content: [
          { type: 'input_text', text: 'Duplicate request' },
          { type: 'input_image', image_url: image },
        ],
      }),
      message('user', 'Duplicate request'),
      message('assistant', 'Duplicate reply'),
      complete({
        type: 'AgentMessage',
        content: [{ type: 'Text', text: 'Duplicate reply' }],
        phase: 'final_answer',
      }),
      complete({
        type: 'AgentMessage',
        content: [{ type: 'Text', text: 'Native-only reply' }],
        phase: 'commentary',
      }),
      complete({
        type: 'CommandExecution',
        command: ['printf', 'safe'],
        aggregated_output: 'SAFE_OUTPUT',
        exit_code: 0,
        duration: { secs: 1, nanos: 250000000 },
      }),
      complete({
        type: 'FileChange',
        changes: {
          'tool.ts': { type: 'update', unified_diff: '@@\n+safe', move_path: null },
          'new.ts': { type: 'add', content: 'export const safe = 1;' },
        },
        status: 'completed',
      }),
      complete({
        type: 'McpToolCall',
        server: 'fixture',
        tool: 'inspect',
        arguments: { id: 1 },
        result: { text: 'MCP_SAFE' },
      }),
      complete({ type: 'ImageView', path: '/fixture/image.png' }),
      complete({
        type: 'SubAgentActivity',
        kind: 'spawn',
        agent_thread_id: 'child',
        agent_path: '/root/child',
      }),
      complete({
        type: 'Extension',
        kind: 'search',
        query: 'safe reference',
        results: ['safe result'],
      }),
      complete({
        type: 'CollabAgentToolCall',
        tool: 'wait',
        sender_thread_id: 'session',
        receiver_thread_ids: ['worker'],
        agents_states: { worker: 'completed' },
      }),
      complete({
        type: 'Reasoning',
        summary_text: 'PRIVATE_NATIVE',
        raw_content: 'PRIVATE_NATIVE',
      }),
      complete({ type: 'AgentMessage', phase: 'analysis', content: 'PRIVATE_NATIVE' }),
      complete({ type: 'ContextCompaction', content: 'PRIVATE_NATIVE' }),
      { type: 'world_state', payload: { state: 'PRIVATE_NATIVE' } },
      { type: 'inter_agent_communication_metadata', payload: { trigger_turn: true } },
      { type: 'event_msg', payload: { type: 'thread_settings_applied', model: 'model-main' } },
      complete({ type: 'FutureItem', content: 'UNKNOWN_NATIVE' }),
      message('user', goal),
      message('user', review),
      message('user', 'Please debug goals and auto-review; ordinary request'),
      {
        type: 'event_msg',
        payload: {
          type: 'thread_goal_updated',
          goal: { objective: 'Updated objective', status: 'active' },
        },
      },
      {
        type: 'response_item',
        payload: {
          type: 'agent_message',
          content: 'INTER_AGENT_SAFE',
          internal_chat_message_metadata_passthrough: { turn_id: 'agent-turn' },
        },
      },
    ];
    await writeFile(path, rows.map((row) => JSON.stringify(row)).join('\n'));
    const trace = await normalizeSessionFile(path, 'session', 'Main', { lazyBodies: true });
    const events = trace.turns.flatMap((turn) => turn.events);
    const { readSessionBody } = await import('./jsonl.ts');
    assert.equal(events.filter((e) => e.text === 'Duplicate request').length, 1);
    const request = events.find((e) => e.text === 'Duplicate request')!;
    assert.equal(request.sourceLine, 4);
    assert.deepEqual((await readSessionBody(trace, request)).imageUrls, [image]);
    assert.equal(events.filter((e) => e.text === 'Duplicate reply').length, 1);
    assert.equal(events.find((e) => e.text === 'Duplicate reply')?.messagePhase, 'final_answer');
    const nativeReply = events.find((e) => e.text === 'Native-only reply')!;
    assert.equal(nativeReply.messagePhase, 'commentary');
    assert.equal((await readSessionBody(trace, nativeReply)).text, 'Native-only reply');
    const command = events.find((e) => e.title === 'Shell command')!;
    assert.equal(command.exitCode, 0);
    assert.equal(command.durationMs, 1250);
    assert.equal((await readSessionBody(trace, command)).output, 'SAFE_OUTPUT');
    assert.equal(
      events.find((e) => e.kind === 'edit')?.text,
      'tool.ts\n@@\n+safe\n\nnew.ts\nexport const safe = 1;',
    );
    assert.equal(command.text, '[\n  \"printf\",\n  \"safe\"\n]');
    assert.ok(events.some((e) => e.output?.includes('MCP_SAFE')));
    assert.deepEqual(events.find((e) => e.kind === 'delegation')?.relatedThreads, ['child']);
    assert.deepEqual(events.find((e) => e.title === 'Agent coordination · wait')?.relatedThreads, [
      'worker',
    ]);
    assert.equal(events.find((e) => e.text === goal)?.kind, 'goal');
    assert.equal(events.find((e) => e.text === review)?.kind, 'auto-review');
    assert.equal(events.find((e) => e.text.includes('ordinary request'))?.kind, 'request');
    assert.equal(events.find((e) => e.text === 'Updated objective')?.kind, 'goal');
    assert.equal(events.find((e) => e.text === 'INTER_AGENT_SAFE')?.turnId, 'agent-turn');
    assert.ok(!JSON.stringify(trace).includes('PRIVATE_NATIVE'));
    assert.ok(!JSON.stringify(trace).includes('UNKNOWN_NATIVE'));
    assert.deepEqual(
      trace.coverage.unsupportedItems.map((g) => [g.type, g.count]),
      [['event_msg/item_completed/FutureItem', 1]],
    );
    const excluded = trace.coverage.excludedItems.reduce((n, g) => n + g.count, 0);
    assert.equal(excluded + trace.coverage.normalizedItems + 1, rows.length);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

await test('review-only session models are classified, while mixed model sessions retain ordinary content', async () => {
  const dir = await mkdtemp(resolve(tmpdir(), 'review-jsonl-'));
  try {
    const path = resolve(dir, 'session.jsonl');
    const rows = [
      { type: 'session_meta', payload: { id: 'session' } },
      { type: 'turn_context', payload: { model: 'codex-auto-review' } },
    ];
    await writeFile(path, rows.map((row) => JSON.stringify(row)).join('\n'));
    assert.equal((await normalizeSessionFile(path, 'session')).purpose, 'auto-review');
    rows.push({ type: 'turn_context', payload: { model: 'model-main' } });
    await writeFile(path, rows.map((row) => JSON.stringify(row)).join('\n'));
    assert.equal((await normalizeSessionFile(path, 'session')).purpose, undefined);
    await writeFile(
      path,
      JSON.stringify({
        type: 'session_meta',
        payload: { id: 'session', source: { subagent: 'guardian_review' } },
      }),
    );
    assert.equal((await normalizeSessionFile(path, 'session')).purpose, 'auto-review');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

// A delayed shell completion can arrive after a newer exec call; a source interval alone gives a wrong pairing.
await test('delayed and parallel shell results keep their invocation, while ambiguous and dynamic commands stay separate', async () => {
  const { traceActions } = await import('./actions.ts');
  const directory = await mkdtemp(resolve(tmpdir(), 'execution-links-'));
  try {
    const path = resolve(directory, 'session.jsonl');
    const call = (id: string, input: string, time: number) => ({
      type: 'response_item',
      timestamp: new Date(time).toISOString(),
      payload: { type: 'custom_tool_call', name: 'exec', call_id: id, input },
    });
    const result = (id: string) => ({
      type: 'response_item',
      payload: { type: 'custom_tool_call_output', call_id: id, output: 'Wrapper status' },
    });
    const native = (id: string, command: string, time?: number) => ({
      type: 'event_msg',
      payload: {
        type: 'item_completed',
        ...(time === undefined ? {} : { started_at_ms: time }),
        item: {
          type: 'CommandExecution',
          id,
          command: ['/bin/zsh', '-lc', command],
          aggregated_output: id + ' output',
          exit_code: 0,
        },
      },
    });
    const base = Date.parse('2026-10-09T00:00:00Z');
    const records = [
      { type: 'session_meta', payload: { id: 'session' } },
      { type: 'turn_context', payload: { turn_id: 'turn' } },
      call('slow-call', 'await tools.exec_command({cmd:"echo slow"});', base),
      result('slow-call'),
      call(
        'batch-call',
        'await Promise.all([tools.exec_command({cmd:"echo one"}),tools.exec_command({cmd:`echo two`})]);',
        base + 100,
      ),
      native('two', 'echo two', base + 200),
      native('one', 'echo one', base + 200),
      result('batch-call'),
      native('slow', 'echo slow', base + 10),
      call('repeat-one', 'await tools.exec_command({cmd:"echo repeat"});', base + 300),
      call('repeat-two', 'await tools.exec_command({cmd:"echo repeat"});', base + 400),
      native('ambiguous', 'echo repeat'),
      call('dynamic', 'await tools.exec_command({cmd: secret});', base + 500),
      native('unmatched', 'echo secret', base + 600),
      { type: 'turn_context', payload: { turn_id: 'different-turn' } },
      native('different-turn', 'echo slow', base + 700),
    ];
    await writeFile(path, records.map((r) => JSON.stringify(r)).join('\n') + '\n');
    const trace = await normalizeSessionFile(path, 'session');
    const groups = traceActions(trace.turns.flatMap((t) => t.events));
    const slow = groups.find((a) => a.anchor.callId === 'slow-call')!;
    assert.equal(slow.executions.length, 1);
    assert.equal(slow.executions[0].output, 'slow output');
    assert.equal(slow.results.length, 1);
    const batch = groups.find((a) => a.anchor.callId === 'batch-call')!;
    assert.deepEqual(
      batch.executions.map((e) => e.output),
      ['two output', 'one output'],
    );
    for (const id of ['ambiguous', 'unmatched', 'different-turn']) {
      const action = groups.find((a) => a.anchor.output === id + ' output')!;
      assert.equal(action.records.length, 1);
      assert.equal(action.anchor.parentCall, undefined);
    }
    assert.equal(groups.flatMap((a) => a.records).length, trace.coverage.normalizedItems);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
