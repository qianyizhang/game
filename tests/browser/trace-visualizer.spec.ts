import { parseCase } from '../../packages/workshop-tools/trace/contracts';
import { relative, sep } from 'node:path';
import { expect, test } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

function bundleUrl(json: string): string {
  const value: unknown = JSON.parse(json);
  if (!value || typeof value !== 'object' || !('file' in value) || typeof value.file !== 'string')
    throw new Error('Expected trace bundle path');
  const path = relative(process.cwd(), value.file);
  if (path === '..' || path.startsWith('..' + sep))
    throw new Error('Trace bundle escaped repository');
  return '/' + path.split(sep).join('/');
}
const caseStudy = parseCase(
  JSON.parse(readFileSync('packages/workshop-tools/trace/case-study.json', 'utf8')),
);
const inputsAvailable = caseStudy.threads.every((thread: { id: string }) =>
  existsSync(`test-results/trace-visualizer-input/${thread.id}.json`),
);
test.describe('private sculpture case', () => {
  test.skip(
    !inputsAvailable,
    'Local example requires the authorized thread exports and artwork evidence.',
  );
  let url = '';
  test.beforeAll(() => {
    url = bundleUrl(
      execFileSync(process.execPath, ['packages/workshop-tools/trace/build.ts'], {
        encoding: 'utf8',
      }),
    );
  });
  test('creation story connects superseded review decisions to records and retained source', async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url);
    await expect(page.locator('#documents')).toContainText(
      '650cf196fc37e217349837040f95298f2645fdef',
    );
    await expect(
      page.getByRole('heading', { name: 'How the sculptures took shape' }),
    ).toBeVisible();
    await page.getByRole('button', { name: /Round 5 · reviewer acceptance/ }).click();
    await expect(page.locator('#stage-status')).toHaveText(
      'Reviewer accepted · later user-rejected',
    );
    await page.getByRole('button', { name: 'Inspect this episode’s actions' }).click();
    await expect(page.locator('#event-list .selected-event > details[open]')).toContainText(
      'Hydra now passes my visual review',
    );
    await page.getByRole('combobox', { name: 'Evidence scope', exact: true }).selectOption('all');
    await page.getByRole('combobox', { name: 'Record type', exact: true }).selectOption('command');
    await page.getByLabel('Search text, output or file').fill('roughness');
    await expect(page.locator('#event-list .event')).not.toHaveCount(0);
    await page.getByLabel('Search text, output or file').fill('no-such-record-zzzz');
    await expect(page.locator('#event-list')).toHaveText('No records match these filters.');
    await page.getByRole('button', { name: 'Source & provenance', exact: true }).click();
    await expect(page.locator('#source-meta')).toContainText('Compared with: Round 4');
    await page
      .getByRole('combobox', { name: 'Source file', exact: true })
      .selectOption({ label: 'newStudies.ts' });
    await expect(page.locator('#source-code')).toContainText('diff --git');
    await page.getByRole('combobox', { name: 'Display', exact: true }).selectOption('full');
    await expect(page.locator('#source-code')).toContainText('import');
    await page.getByRole('button', { name: 'Creation story', exact: true }).click();
    await page.reload();
    await expect(page.locator('#stage-title')).toHaveText('Round 5 · reviewer acceptance');
    await page.getByRole('button', { name: /Rebuild around gesture/ }).click();
    await expect(page.locator('#stage-status')).toHaveText('Rebuilt · Hydra later user-rejected');
    await page.screenshot({ path: info.outputPath('story-desktop.png'), fullPage: true });
    expect(errors).toEqual([]);
  });
  test('compares real captures, labels missing views, and works at phone width', async ({
    page,
  }, info) => {
    await page.goto(url);
    await page.getByRole('button', { name: 'Compare revisions', exact: true }).click();
    await page.getByRole('combobox', { name: 'Subject', exact: true }).selectOption('hydra');
    await page.getByRole('combobox', { name: 'Before', exact: true }).selectOption('4');
    await page.getByRole('combobox', { name: 'After', exact: true }).selectOption('11');
    await expect(page.locator('#compare-images img')).toHaveCount(2);
    await expect
      .poll(() =>
        page
          .locator('#compare-images img')
          .evaluateAll((imgs) => imgs.every((i) => (i as HTMLImageElement).naturalWidth > 0)),
      )
      .toBe(true);
    await page.screenshot({ path: info.outputPath('compare-desktop.png'), fullPage: true });
    await page.getByRole('combobox', { name: 'Subject', exact: true }).selectOption('nightjar');
    await page.getByRole('combobox', { name: 'Before', exact: true }).selectOption('0');
    await page.getByRole('combobox', { name: 'View', exact: true }).selectOption('back');
    await expect(page.locator('#compare-images')).toContainText(
      'No retained back capture of nightjar',
    );
    await page.setViewportSize({ width: 390, height: 844 });
    for (const view of [
      'Creation story',
      'Compare revisions',
      'Recorded actions',
      'Source & provenance',
    ]) {
      await page.getByRole('button', { name: view, exact: true }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    await page.getByRole('button', { name: 'Creation story', exact: true }).click();
    await page.screenshot({ path: info.outputPath('story-phone.png'), fullPage: true });
  });

  test('latest work preserves positive Hydra feedback and mixed bird authorship', async ({
    page,
  }, info) => {
    await page.goto(url + '#stage=15&view=story');
    await expect(page.locator('#stage-status')).toHaveText('Positive user feedback · Hydra');
    await page.getByText('Read the recorded statement behind this stage').click();
    await expect(page.locator('#quote')).toContainText('this is much better');
    await page.getByRole('button', { name: /Bird round 4/ }).click();
    await expect(page.locator('#finding')).toContainText('parent took over both');
    await expect(page.getByRole('combobox', { name: 'Stage subject', exact: true })).toHaveValue(
      'phoenix',
    );
    await page
      .getByRole('combobox', { name: 'Stage subject', exact: true })
      .selectOption('nightjar');
    await expect(page.locator('#story-images img').last()).toHaveAttribute(
      'alt',
      /nightjar.*Bird round 4/,
    );
    await page.getByRole('button', { name: /Phoenix · direct parent finishing/ }).click();
    await page.getByRole('button', { name: 'Inspect retained source changes' }).click();
    await page
      .getByRole('combobox', { name: 'Source file', exact: true })
      .selectOption({ label: 'phoenix.ts' });
    await expect(page.locator('#source-meta')).toContainText('Compared with: Bird round 4');
    await page.getByRole('button', { name: 'Creation story', exact: true }).click();
    await page.getByRole('button', { name: /Delivery · animation/ }).click();
    await expect(page.locator('#finding')).toContainText('252 unit tests');
    await page.screenshot({ path: info.outputPath('latest-delivery.png'), fullPage: true });
    await page.getByRole('button', { name: 'Compare revisions', exact: true }).click();
    await page.getByRole('combobox', { name: 'Subject', exact: true }).selectOption('phoenix');
    await page
      .getByRole('combobox', { name: 'After', exact: true })
      .selectOption(String(caseStudy.stages.length - 1));
    await page
      .getByRole('combobox', { name: 'View', exact: true })
      .selectOption('roundtrip-exported');
    await expect(page.locator('#compare-images img').last()).toHaveAttribute(
      'alt',
      /phoenix, roundtrip-exported, Delivery/,
    );
    await expect
      .poll(() =>
        page
          .locator('#compare-images img')
          .last()
          .evaluate((i) => (i as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
  });
  test('review checkpoints retain artifacts while inspecting consequential evidence', async ({
    page,
  }, info) => {
    for (const index of [0, 5, 16, 19, 20, 22]) {
      await page.goto(url + '#stage=' + index + '&view=story');
      await expect(page.locator('#stage-title')).toHaveText(caseStudy.stages[index].title);
      await expect(page.locator('#episode-evidence .evidence-row').first()).toBeVisible();
      await expect(page.locator('#story-images img').last()).toBeVisible();
      await page.screenshot({ path: info.outputPath('checkpoint-' + index + '.png') });
      await page.locator('#episode-evidence .evidence-row').first().click();
      await expect(page.locator('#evidence-drawer')).toBeVisible();
      await expect(page.locator('#story-images')).toBeVisible();
      await page.screenshot({ path: info.outputPath('evidence-' + index + '.png') });
      await page.keyboard.press('Escape');
    }
    await page.getByRole('button', { name: 'Compare revisions', exact: true }).click();
    await page.getByRole('combobox', { name: 'Subject', exact: true }).selectOption('nightjar');
    const cell = page
      .locator('#criterion-matrix tr')
      .filter({ has: page.getByRole('rowheader', { name: 'surface texture', exact: true }) })
      .getByRole('button', { name: 'rejected · reviewer', exact: true })
      .first();
    await cell.click();
    await expect(page.getByRole('combobox', { name: 'After', exact: true })).toHaveValue('18');
    await expect(page.locator('#drawer-title')).toContainText('surface texture');
    await page
      .locator('#drawer-artifact img')
      .evaluate((image) => (image as HTMLImageElement).decode());
    await expect
      .poll(() =>
        page
          .locator('#drawer-artifact img')
          .evaluate((image) => (image as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    await page
      .locator('#compare-images img')
      .evaluateAll((images) =>
        Promise.all(images.map((image) => (image as HTMLImageElement).decode())),
      );
    await page.screenshot({ path: info.outputPath('criterion-evidence.png') });
  });
});

test.describe('public synthetic behavior case', () => {
  let fixtureUrl = '';
  test.beforeAll(() => {
    fixtureUrl = bundleUrl(
      execFileSync(
        process.execPath,
        [
          '--input-type=module',
          '-e',
          `
      import {writeFixture} from './packages/workshop-tools/trace/fixture.ts';
      import {buildCase} from './packages/workshop-tools/trace/build.ts';
      import {resolve} from 'node:path';
      import {mkdir, mkdtemp} from 'node:fs/promises';
      await mkdir('test-results', {recursive: true});
      const root = await mkdtemp(resolve('test-results/trace-public-fixture-'));
      const data = await buildCase(await writeFixture(root));
      console.log(JSON.stringify({file: resolve(data.output, 'index.html')}));
    `,
        ],
        { encoding: 'utf8' },
      ),
    );
  });
  test('episode evidence selects an exact cross-thread event and retains artifact context', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(fixtureUrl);
    await expect(page.locator('#coverage-summary')).toContainText('1 unsupported');
    await expect(page.locator('#turn-filter option').filter({ hasText: 'Worker' })).toContainText(
      'Time unknown',
    );
    await expect(page.locator('#ownership')).toContainText('construction');
    await expect(page.locator('#ownership')).toContainText('exact interleaving unavailable');
    await expect(page.locator('#story-images')).toContainText('No retained hero capture');
    await expect(page.locator('#episode-evidence .evidence-row')).toHaveCount(6);
    await page
      .locator('#episode-evidence')
      .getByRole('button', { name: /edit.*Recorded file changes/ })
      .click();
    await expect(page.locator('#drawer-content')).toContainText('Source truncated upstream');
    await expect(page.locator('#story-images')).toBeVisible();
    await page.getByRole('button', { name: 'Open exact recorded action' }).click();
    await expect(page.locator('#event-list .selected-event')).toContainText('src/bird.ts');
    await expect(page.locator('#action-context')).toContainText('Wing review');
    await page.reload();
    await expect(page.locator('#drawer-content')).toContainText('src/bird.ts');
    await page.keyboard.press('Escape');
    await page
      .getByRole('combobox', { name: 'Evidence role', exact: true })
      .selectOption('verification');
    await expect(page.locator('#event-list .event')).toHaveCount(1);
    await page.getByRole('button', { name: 'Inspect evidence', exact: true }).click();
    await expect(page.locator('#drawer-content')).not.toContainText('Viewer preview shortened');
    await expect(page.locator('#drawer-content')).not.toContainText('Source truncated upstream');
    await expect(
      page
        .locator('#drawer-content pre:not(.record-preview)')
        .filter({ hasText: 'Complete available output.' }),
    ).toContainText('x'.repeat(17000));
    expect(errors).toEqual([]);
  });
  test('criterion cells expose assessor, artifact and limits; coverage preserves omitted identities', async ({
    page,
  }) => {
    await page.goto(fixtureUrl);
    await page.getByRole('button', { name: 'Compare revisions', exact: true }).click();
    await page
      .locator('#criterion-matrix')
      .getByRole('button', { name: 'issue · reviewer' })
      .click();
    await expect(page.locator('#drawer-content')).toContainText('Parent');
    await expect(page.locator('#drawer-content')).toContainText('Artifact revision: revision:bird');
    await page.locator('#drawer-content .evidence-row').click();
    await expect(page.locator('#drawer-content')).toContainText(
      'Wing attachment still needs revision.',
    );
    await page.keyboard.press('Escape');
    await page
      .locator('#criterion-matrix')
      .getByRole('button', { name: 'unrecorded · record limit' })
      .click();
    await expect(page.locator('#drawer-content')).toContainText('No supporting event recorded.');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Source & provenance', exact: true }).click();
    await page
      .locator('#coverage-details summary')
      .filter({ hasText: 'Parent · ReadThread' })
      .click();
    await expect(page.locator('#coverage-details')).toContainText('futureEvent ×1');
    await page.getByText('Unsupported: futureEvent ×1', { exact: true }).click();
    await expect(page.locator('#coverage-details')).toContainText('parent / turn / unknown');
    await expect(page.locator('body')).not.toContainText('Do not expose this');
  });
  test('process map filters authored lessons and exports notes with exact evidence links', async ({
    page,
  }, info) => {
    await page.goto(fixtureUrl);
    await page.getByRole('button', { name: 'Process map', exact: true }).click();
    await expect(page.locator('#process-count')).toContainText('1 of 1');
    await page
      .getByRole('combobox', { name: 'Show episodes', exact: true })
      .selectOption('lessons');
    await page.getByLabel('Find an episode or lesson').fill('acceptance');
    await page.reload();
    await expect(page.getByLabel('Find an episode or lesson')).toHaveValue('acceptance');
    await expect(page.locator('#process-list')).toContainText('Tests and acceptance differ.');
    await page
      .locator('#process-list')
      .getByRole('button', { name: /Inspection/ })
      .click();
    await expect(page.locator('#drawer-content .evidence-row')).toHaveCount(2);
    await page
      .locator('#drawer-content')
      .getByRole('button', { name: /verification/ })
      .click();
    await expect(page.locator('#drawer-content')).toContainText('npm test');
    await page.keyboard.press('Escape');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download learning notes' }).click();
    const file = info.outputPath('learning-notes.md');
    await (await download).saveAs(file);
    const notes = readFileSync(file, 'utf8');
    expect(notes).toContain('Lesson: Tests and acceptance differ.');
    expect(notes).toContain('worker / turn / check');
    expect(notes).toContain('./index.html#episode=revision');
    expect(notes).not.toContain('Complete available output.');
    await page.getByLabel('Find an episode or lesson').fill('absent lesson');
    await expect(page.locator('#process-list')).toContainText('No curated episodes match');
    await expect(page.getByRole('button', { name: 'Download learning notes' })).toBeDisabled();
    await page.getByLabel('Find an episode or lesson').fill('');
    await page.getByRole('button', { name: 'Open episode', exact: true }).click();
    await expect(page.locator('#stage-title')).toHaveText('Wing review');
  });
  test('mobile evidence drawer and views do not overflow', async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(fixtureUrl);
    for (const view of [
      'Conversation',
      'Process map',
      'Creation story',
      'Compare revisions',
      'Recorded actions',
      'Source & provenance',
    ]) {
      await page.getByRole('button', { name: view, exact: true }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    await page.getByRole('button', { name: 'Creation story', exact: true }).click();
    await page.locator('#episode-evidence .evidence-row').first().click();
    await expect(page.getByRole('button', { name: 'Close evidence ×' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath('evidence-phone.png') });
    await page.keyboard.press('Escape');
    await expect(page.locator('#evidence-drawer')).toBeHidden();
  });
});

test.describe('conversation overview and turn inspection', () => {
  let url = '';
  test.beforeAll(() => {
    url = bundleUrl(
      execFileSync(
        process.execPath,
        [
          '--input-type=module',
          '-e',
          `
      import {mkdir, mkdtemp, writeFile} from 'node:fs/promises';
      import {resolve} from 'node:path';
      import {normalizeSessionFile, sessionTrace, renderSessionTrace} from './packages/workshop-tools/trace/jsonl.ts';
      await mkdir('test-results', {recursive: true});
      const root = await mkdtemp(resolve('test-results/conversation-fixture-'));
      const row = (type, payload) => ({type, payload, timestamp:'2026-10-09T01:00:00Z'});
      const message = (role, text, phase) => row('response_item', {type:'message',role,phase,content:[{type:'input_text',text}]});
      const rows = [row('session_meta',{id:'conversation-fixture'}), row('turn_context',{turn_id:'first'}),
        message('user','# AGENTS.md instructions for /fixture\\n<INSTRUCTIONS>\\nCONTEXT_ONLY_MARKER\\n</INSTRUCTIONS>'),
        message('developer','<app-context>\\nSYSTEM_CONTEXT_MARKER\\n</app-context>'),
        message('user','Repair **the wing**.\\n\\n<INSTRUCTIONS>\\n## Local context\\nThese manually wrapped\\nlines should read as one paragraph.\\n\\n<environment_context>\\nFolded context details.\\n</environment_context>\\n\\n' + 'Long context '.repeat(350) + 'CONTEXT_TAIL\\n</INSTRUCTIONS>'),
        message('assistant','Inspecting the attachment.','commentary'),
        row('response_item',{type:'custom_tool_call',name:'functions.exec',call_id:'batch',input:'const results=await Promise.allSettled([tools.exec_command({cmd:"node check.js"})]);results.forEach(r=>text(r));'}),
        row('response_item',{type:'function_call',name:'exec_command',call_id:'inspect',arguments:JSON.stringify({cmd:'node check.js',cwd:'/fixture'})}),
        message('user','Keep the existing silhouette.'),
        row('response_item',{type:'function_call_output',call_id:'inspect',output:'Script completed\\nWall time 0.5 seconds\\nOutput:\\nCHECK_PASSED\\n<svg onload="throw new Error()">'}),
        message('assistant','**Attachment repaired.** Checks passed.\\n\\n| Status | Entries |\\n| --- | ---: |\\n| Reviewed | 13 / 205 |\\n\\n- First item\\n- Second item\\n\\n[Reference](https://example.com/trace)\\n\\n<oai-mem-citation>\\nAncillary citation metadata.\\n</oai-mem-citation>\\n\\n<img src="https://example.com/unrequested.png" onerror="throw new Error()">','final_answer'),
        row('turn_context',{turn_id:'unfinished'}),message('user','Now inspect the tail.')];
      for(let i=0;i<23;i++) rows.push(row('turn_context',{turn_id:'later-'+i}),message('user','Later request '+i),message('assistant','Later response '+i,'final_answer'));
      const path = resolve(root,'session.jsonl');
      await writeFile(path, rows.map(JSON.stringify).join('\\n'));
      const thread = await normalizeSessionFile(path,'conversation-fixture','Selected session');
      const html = await renderSessionTrace(sessionTrace([thread],'conversation-fixture'));
      const file = resolve(root,'index.html'); await writeFile(file,html);
      console.log(JSON.stringify({file}));
    `,
        ],
        { encoding: 'utf8' },
      ),
    );
  });
  test('starts with exchanges, drills into structured work, and restores the selected turn', async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url);
    await expect(page.locator('#conversation')).toBeVisible();
    await expect(page.locator('#conversation-list > article')).toHaveCount(20);
    const first = page.locator('#conversation-list > article').first();
    await expect(first).toContainText('Assistant response · final');
    await expect(first).not.toContainText('CONTEXT_ONLY_MARKER');
    await expect(first).toContainText('+1 further user messages');
    await expect(first.locator('strong')).toContainText(['the wing', 'Attachment repaired.']);
    await page.getByLabel('About conversation search', { exact: true }).hover();
    await expect(
      page.getByRole('tooltip').filter({ hasText: 'Filters turns by words' }),
    ).toBeVisible();
    await first.getByRole('button', { name: 'Inspect turn' }).click();
    await expect(page.locator('#turn-pair')).toContainText('Keep the existing silhouette.');
    await expect(page.locator('#turn-work')).not.toContainText('SYSTEM_CONTEXT_MARKER');
    await page.getByText('Session context (2 records)', { exact: true }).click();
    await expect(page.locator('.session-context')).toContainText('CONTEXT_ONLY_MARKER');
    await page.getByText('Session context (2 records)', { exact: true }).click();
    await expect(page.locator('#conversation-count')).toBeHidden();
    await expect(page.locator('#turn-pair table')).toContainText('13 / 205');
    await expect(page.locator('#turn-pair li')).toHaveCount(2);
    await expect(page.locator('#turn-pair .xml-section > summary')).toContainText([
      'INSTRUCTIONS',
      'environment_context',
      'oai-mem-citation',
    ]);
    await expect(
      page.locator('#turn-pair').getByText('environment_context', { exact: true }).locator('..'),
    ).not.toHaveAttribute('open', '');
    await expect(page.locator('#turn-pair')).toContainText('CONTEXT_TAIL');
    await expect(
      page.locator('#turn-pair p').filter({ hasText: 'These manually wrapped' }),
    ).toHaveText('These manually wrapped lines should read as one paragraph.');
    await expect(page.locator('#turn-pair img')).toHaveCount(0);
    await expect(page.getByText('Full recorded text', { exact: true })).toHaveCount(0);
    await expect(page.locator('#turn-work .tool-meta')).toContainText('Wall time 0.5 seconds');
    await expect(page.locator('#turn-work .code-block')).toContainText([
      'node check.js',
      '/fixture',
      'CHECK_PASSED',
    ]);
    await expect(page.locator('#turn-work .hljs-keyword')).not.toHaveCount(0);
    await page.getByRole('switch', { name: 'Raw text', exact: true }).check();
    await expect(page.locator('#turn-pair .raw-text')).toContainText([
      '**the wing**',
      'Keep the existing silhouette.',
      '| Status | Entries |',
    ]);
    await page.reload();
    await expect(page.getByRole('switch', { name: 'Raw text', exact: true })).toBeChecked();
    await page.getByRole('switch', { name: 'Raw text', exact: true }).uncheck();
    await page.locator('#turn-kind').selectOption('result');
    await expect(page.locator('#turn-work > article')).toHaveCount(1);
    await expect(page.locator('#turn-work')).toContainText('CHECK_PASSED');
    await page.locator('#turn-kind').selectOption('all');
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.getByRole('button', { name: 'Copy full session ID', exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe('conversation-fixture');
    const coverage = page.locator('#coverage-summary .help-target').first();
    await coverage.focus();
    await expect(coverage.getByRole('tooltip')).toBeVisible();

    await expect(page.locator('#turn-work dt').first()).toHaveText('cmd');
    await expect(page.locator('#turn-work dd').first()).toHaveText('node check.js');
    await expect(page.locator('#turn-work')).toContainText('CHECK_PASSED');
    await expect(page.locator('#turn-work svg')).toHaveCount(0);
    // Identical command text in a different call is not enough to merge the unpaired wrapper.
    const pairedCall = page.locator('#turn-work > article').filter({ hasText: 'CHECK_PASSED' });
    await expect(pairedCall).toHaveCount(1);
    await expect(pairedCall).toContainText('node check.js');
    await pairedCall.locator(':scope > details > .action-summary').click();
    await expect(
      pairedCall.locator('.code-block').filter({ hasText: 'CHECK_PASSED' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Jump to tool result' })).toHaveCount(0);
    await expect(page.getByText('Source & identity', { exact: true })).toHaveCount(0);
    await page.reload();
    await expect(page.locator('#turn-detail')).toBeVisible();
    await expect(page.locator('#turn-title')).toHaveText('Turn 1');
    await page.screenshot({ path: info.outputPath('conversation-turn.png'), fullPage: true });
    await page.getByRole('button', { name: 'Next turn →', exact: true }).click();
    await expect(page.locator('#turn-pair')).toContainText('Assistant message not recorded.');
    await expect(page.locator('#turn-pair')).toContainText('Final status unavailable.');
    await page.getByRole('button', { name: '← Conversation overview', exact: true }).click();
    await page.getByRole('button', { name: 'Later turns →', exact: true }).click();
    await expect(page.locator('#conversation-list > article')).toHaveCount(5);
    await page.reload();
    await expect(page.locator('#conversation-count')).toContainText('page 2 / 2');
    await page.getByLabel('Find a request or response').fill('Later request 22');
    await expect(page.locator('#conversation-list > article')).toHaveCount(1);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole('button', { name: 'Inspect turn' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath('conversation-phone.png'), fullPage: true });
    expect(errors).toEqual([]);
  });
});
