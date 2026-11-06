import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chromeProvisioning } from './browser-host.ts';
void test('hosted Chrome avoids a redundant browser download while retaining OS dependency installation', () => {
  assert.deepEqual(chromeProvisioning('Google Chrome 156.0.8078.47'), [
    ['npx', 'playwright', 'install-deps', 'chrome'],
  ]);
  assert.deepEqual(chromeProvisioning(undefined), [
    ['npx', 'playwright', 'install-deps', 'chrome'],
    ['npx', 'playwright', 'install', 'chrome'],
  ]);
  for (const value of ['Chromium 156.0.8078.47', '', 'Google Chrome garbage'])
    assert.throws(() => chromeProvisioning(value), /Expected hosted/);
});
