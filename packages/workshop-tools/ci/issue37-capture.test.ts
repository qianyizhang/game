import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const workflow = readFileSync(
  new URL('../../../.github/workflows/asset-build.yml', import.meta.url),
  'utf8',
);

function verifyCaptureScope(text: string) {
  const input = text.match(/  workflow_dispatch:\n([\s\S]*?)  workflow_call:/)?.[1] ?? '';
  const plan = text.match(/  plan:\n([\s\S]*?)  geometry:/)?.[1] ?? '';
  const regularBrowser =
    text.match(/  browser-delivery:\n([\s\S]*?)  blindside-joker-capture:/)?.[1] ?? '';
  const capture = text.split('  blindside-joker-capture:\n')[1] ?? '';
  assert.match(input, /blindside_joker_capture:\n[\s\S]*?type: boolean\n\s+default: false/);
  assert.match(plan, /if: inputs\.blindside_joker_capture != true/);
  assert.match(regularBrowser, /if: failure\(\)\n\s+with:\n\s+name: asset-browser-failures/);
  assert.match(regularBrowser, /path: test-results\/browser\n\s+retention-days: 14/);
  assert.match(
    capture,
    /if: github\.event_name == 'workflow_dispatch' && inputs\.blindside_joker_capture == true/,
  );
  assert.match(capture, /test "\$GITHUB_REF" = refs\/heads\/art\/issue-37-opening-jokers/);
  assert.match(capture, /fetch-depth: 0\n\s+lfs: true\n\s+persist-credentials: false/);
  assert.match(capture, /git worktree add --detach .*"\$BASE_SHA"/);
  assert.match(capture, /BLINDSIDE_JOKER_BASE_SHA: 73a24f5c98e77c365c909bbeac9f37347ef845c7/);
  assert.match(capture, /path: test-results\/issue37-context\n\s+retention-days: 7/);
  assert.match(
    capture,
    /name: blindside-joker-context-\$\{\{ job\.status \}\}-\$\{\{ github\.sha \}\}/,
  );
  assert.doesNotMatch(capture, /secrets\.|pull_request_target|path: test-results\/browser/);
}

void test('issue 37 capture is manual, branch scoped and uploads only short-lived review output', () => {
  verifyCaptureScope(workflow);
});

void test('capture contract rejects auto-run and broad artifact changes', () => {
  assert.throws(() => verifyCaptureScope(workflow.replace('default: false', 'default: true')));
  assert.throws(() =>
    verifyCaptureScope(
      workflow.replace('path: test-results/issue37-context', 'path: test-results'),
    ),
  );
  assert.throws(() =>
    verifyCaptureScope(workflow.replace('if: inputs.blindside_joker_capture != true', 'if: true')),
  );
});
