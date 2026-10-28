import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import config from '../../../playwright.config.ts';
import { chromeLaunchOptions } from '../../../tests/browser/chrome.ts';

void test('local Chrome path is explicit and retains the normal channel by default', () => {
  assert.deepEqual(chromeLaunchOptions(''), { channel: 'chrome' });
  assert.throws(() => chromeLaunchOptions('relative/chrome'), /must be absolute/);
});

void test('a non-Chrome executable cannot replace the browser channel', () => {
  assert.throws(() => chromeLaunchOptions(process.execPath), /Expected Google Chrome --version/);
});

void test('Playwright Test workers receive the same selected Chrome binary', () => {
  const selected = process.env.CARD_WORKSHOP_CHROME_EXECUTABLE;
  if (selected) {
    assert.equal(config.use?.launchOptions?.executablePath, selected);
    assert.equal(config.use?.channel, undefined);
  } else {
    assert.equal(config.use?.channel, 'chrome');
    assert.equal(config.use?.launchOptions?.executablePath, undefined);
  }
});
