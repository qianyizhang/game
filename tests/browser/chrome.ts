import { execFileSync } from 'node:child_process';
import { isAbsolute } from 'node:path';

/** Keep the default Chrome channel; opt in to a locally extracted Google Chrome binary. */
export function chromeLaunchOptions(executablePath = process.env.CARD_WORKSHOP_CHROME_EXECUTABLE) {
  if (!executablePath) return { channel: 'chrome' as const };
  if (!isAbsolute(executablePath))
    throw new Error('Local Chrome executable path must be absolute.');
  const version = execFileSync(executablePath, ['--version'], {
    encoding: 'utf8',
    timeout: 5_000,
  }).trim();
  if (!/^Google Chrome \d+\.\d+\.\d+\.\d+$/.test(version))
    throw new Error(`Expected Google Chrome --version output, got: ${version}`);
  return { executablePath };
}

/** Playwright Test passes binary paths through worker launchOptions, not top-level use. */
export function chromeTestUseOptions() {
  const options = chromeLaunchOptions();
  return 'executablePath' in options ? { launchOptions: options } : options;
}
