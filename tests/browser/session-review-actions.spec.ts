import { expect, test } from '@playwright/test';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { normalizeSessionFile, sessionTrace } from '../../packages/workshop-tools/trace/jsonl.ts';
import { renderReview } from '../../packages/session-review/build.ts';
let url = '';
test.beforeAll(async () => {
  const root = await mkdtemp(resolve('test-results/action-review-'));
  const call = (id: string, name: string, input: string) => ({
    type: 'response_item',
    payload: { type: 'custom_tool_call', name, call_id: id, input },
  });
  const result = (id: string, output: unknown) => ({
    type: 'response_item',
    payload: { type: 'custom_tool_call_output', call_id: id, output },
  });
  const native = (item: object) => ({
    type: 'event_msg',
    payload: {
      type: 'item_completed',
      turn_id: 'turn',
      started_at_ms: 100,
      completed_at_ms: 120,
      item,
    },
  });
  const message = (role: string, text: string, phase?: string) => ({
    type: 'response_item',
    payload: { type: 'message', role, phase, content: [{ type: 'input_text', text }] },
  });
  const usage = {
    type: 'token_usage_record',
    payload: {
      turn_id: 'turn',
      response_id: 'response',
      usage: { input_tokens: 1000, output_tokens: 100, cached_input_tokens: 800 },
    },
  };
  const rows = [
    { type: 'session_meta', payload: { id: 'session' } },
    {
      type: 'event_msg',
      timestamp: '2026-10-09T00:00:00Z',
      payload: { type: 'task_started', turn_id: 'turn' },
    },
    message('user', 'Review this session.\n' + 'Full input detail. '.repeat(100) + 'INPUT_END'),
    call(
      'patch',
      'exec',
      'text(await tools.apply_patch("*** Begin Patch\\n*** Update File: /project/example.ts\\n@@\\n-old\\n+new\\n*** End Patch"))',
    ),
    message('assistant', 'Checking the edit while other work continues.', 'commentary'),
    native({
      type: 'FileChange',
      id: 'native-edit',
      status: 'completed',
      changes: { '/project/example.ts': { unified_diff: '@@\n-old\n+new' } },
    }),
    usage,
    result('patch', 'Script completed\nOutput:\n{}'),
    call(
      'images',
      'exec',
      'for (const path of paths) image((await tools.view_image({path})).image_url)',
    ),
    native({ type: 'ImageView', id: 'native-image', path: 'file:///project/retained.png' }),
    result('images', [
      {
        type: 'input_image',
        image_url:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=',
      },
    ]),
    call('delegate', 'send_message', '{"target":"/root","message":"status"}'),
    native({
      type: 'SubAgentActivity',
      id: 'delegate',
      kind: 'interacted',
      agent_path: '/root',
      agent_thread_id: '01a0e024-3705-7a91-9181-d237131801fa',
    }),
    result('delegate', ''),
    message('user', 'Please focus on the image.'),
    call('failure', 'exec_command', '{"cmd":"false"}'),
    native({
      type: 'CommandExecution',
      id: 'failure',
      status: 'completed',
      command: ['false'],
      exit_code: 1,
      aggregated_output: 'CHECK_FAILED',
    }),
    result('failure', 'CHECK_FAILED'),
    call('rejection', 'exec', 'await tools.exec_command({cmd:"publish"})'),
    result(
      'rejection',
      'Script failed\nOutput:\nScript error:\nexec_command failed: CreateProcess { message: "Rejected(denied)" }',
    ),
    result('orphan', 'ORPHAN_RESULT'),
    call('unfinished', 'exec_command', '{"cmd":"pending"}'),
    call(
      'parallel',
      'exec',
      'await Promise.allSettled([tools.exec_command({cmd:"echo A"}),tools.exec_command({cmd:"echo B"}),tools.exec_command({cmd:"echo C"}),tools.mcp__codex_app__read_thread({threadId:"read-target",turnLimit:1})])',
    ),
    ...['A', 'B', 'C'].map((name) =>
      native({
        type: 'CommandExecution',
        id: 'shell-' + name,
        command: ['/bin/zsh', '-lc', 'echo ' + name],
        exit_code: 0,
        aggregated_output: 'RESULT_' + name,
      }),
    ),
    native({
      type: 'McpToolCall',
      id: 'mcp-read',
      server: 'codex_app',
      tool: 'read_thread',
      arguments: { turnLimit: 1, threadId: 'read-target' },
      result: {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              thread: { id: 'read-target', title: 'Blueprint review', status: { type: 'idle' } },
              page: { hasMore: true },
              turns: [
                {
                  id: 'read-turn',
                  status: 'completed',
                  items: [
                    {
                      type: 'userMessage',
                      content: [{ type: 'text', text: 'Review **the blueprint**.' }],
                    },
                    { type: 'agentMessage', phase: 'analysis', text: 'PRIVATE_NOT_FOR_OVERVIEW' },
                    {
                      type: 'agentMessage',
                      phase: 'final_answer',
                      text: '## Outcome\nThe blueprint is consistent.\n\n- Verified the boundaries.',
                    },
                  ],
                },
              ],
            }),
          },
        ],
      },
    }),
    result('parallel', 'Batch completed'),

    usage,
    message(
      'assistant',
      'The review is complete.\n' + 'Response detail. '.repeat(100) + 'RESPONSE_END',
      'final_answer',
    ),
    {
      type: 'event_msg',
      timestamp: '2026-10-09T00:01:00Z',
      payload: { type: 'task_complete', turn_id: 'turn' },
    },
  ];
  const source = resolve(root, 'session.jsonl');
  await writeFile(source, rows.map((row) => JSON.stringify(row)).join('\n'));
  const thread = await normalizeSessionFile(source, 'session');
  const html = resolve(root, 'index.html');
  await writeFile(html, await renderReview(sessionTrace([thread], 'session')));
  url = pathToFileURL(html).href;
});
test('full exchanges, semantic actions and recorded metrics stay readable with interleaved activity', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(url);
  await page.locator('.conversation-card .conversation-pair').click({ position: { x: 20, y: 25 } });
  await expect(page.locator('#turn-pair')).toContainText('INPUT_END');
  await expect(page.locator('#turn-pair')).toContainText('RESPONSE_END');
  await expect(page.locator('#turn-detail .turn-metadata')).toContainText('1K input tokens');
  await expect(page.locator('#turn-detail .turn-metadata')).toContainText('100 output tokens');
  await expect(page.locator('#turn-detail .turn-metadata')).toContainText('1m 0s elapsed');
  await page.goto(url + '#view=events');
  const edits = page.locator('#event-list > article').filter({ has: page.locator('.type-edit') });
  await expect(edits).toHaveCount(1);
  await edits.locator(':scope > details').first().locator(':scope > summary').click();
  await expect(edits).toContainText('+new');
  await edits
    .getByText('Source sequence · other activity occurred during this action', { exact: true })
    .click();
  await expect(edits.locator('.source-sequence')).toContainText(
    'Assistant message · separate action',
  );
  await expect(page.locator('#event-list .type-commentary')).toHaveCount(1);
  await expect(page.locator('#event-list .type-response')).toHaveCount(1);
  const image = page.locator('#event-list .image-gallery img');
  await expect(image).toHaveCount(1);
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBe(1);
  await expect(page.locator('#event-list .type-delegation')).toHaveCount(1);
  await page.locator('#turn-slider').fill('1');
  await expect(page.locator('#action-context .turn-metadata')).toContainText('800 cached');
  await page.screenshot({ path: info.outputPath('semantic-actions.png'), fullPage: true });
  expect(errors).toEqual([]);
});
test('review signals filter observable outcomes and restore the scoped action list', async ({
  page,
}, info) => {
  await page.goto(url + '#view=events&session=session');
  const signals = page.getByRole('navigation', { name: 'Review signals' });
  for (const label of [
    'Mid-turn input',
    'Rejected',
    'Errors',
    'No recorded result',
    'Unmatched result',
  ]) {
    await signals.getByRole('button', { name: label + ' 1', exact: true }).click();
    await expect(page.locator('#event-count')).toHaveText('1 actions');
    await page.reload();
    await expect(signals.getByRole('button', { name: label + ' 1', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await signals.getByRole('button', { name: 'All activity', exact: true }).click();
    await expect(page.locator('#thread-filter')).toHaveValue('session');
  }
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('actions-mobile.png'), fullPage: true });
});

test('parallel MCP reads join shell executions and present a chat overview instead of nested JSON', async ({
  page,
}, info) => {
  await page.goto(url + '#view=events');
  const batch = page.locator('#event-list > article').filter({ has: page.locator('.batch-count') });
  await expect(batch).toHaveCount(1);
  await expect(batch.locator('.batch-count')).toHaveText('4 parallel tool calls · 3 shell + 1 MCP');
  await batch.locator(':scope > details > .action-summary').click();
  await expect(batch.locator('.execution-pair')).toHaveCount(4);
  const overview = batch.locator('.thread-read');
  await expect(
    overview.getByRole('heading', { name: 'Blueprint review', exact: true }),
  ).toBeVisible();
  await expect(overview.getByRole('heading', { name: 'Outcome', exact: true })).toBeVisible();
  await expect(overview.locator('strong')).toHaveText('the blueprint');
  await expect(overview).toContainText('Partial overview');
  await expect(overview).not.toContainText('PRIVATE_NOT_FOR_OVERVIEW');
  await expect(batch.getByText('Complete tool input and result', { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('parallel-thread-read.png'), fullPage: true });
  await page.getByLabel('Raw text', { exact: true }).check();
  await expect(batch.locator('.thread-read')).toHaveCount(0);
  await page.getByLabel('Raw text', { exact: true }).uncheck();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
