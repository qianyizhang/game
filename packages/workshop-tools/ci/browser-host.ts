import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/** Keep the hosted Google Chrome channel; never silently substitute Chromium. */
export function chromeProvisioning(installedVersion: string | undefined): string[][] {
  if (
    installedVersion !== undefined &&
    !/^Google Chrome \d+\.\d+\.\d+\.\d+\s*$/.test(installedVersion)
  )
    throw new Error('Expected hosted Google Chrome version');
  return [
    ['npx', 'playwright', 'install-deps', 'chrome'],
    ...(!installedVersion ? [['npx', 'playwright', 'install', 'chrome']] : []),
  ];
}
if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  if (process.platform !== 'linux' || process.env.GITHUB_ACTIONS !== 'true')
    throw new Error('Browser provisioning is only for hosted Linux CI');
  const version = existsSync('/opt/google/chrome/chrome')
    ? execFileSync('/opt/google/chrome/chrome', ['--version'], { encoding: 'utf8' }).trim()
    : undefined;
  for (const [command, ...args] of chromeProvisioning(version))
    execFileSync(command, args, { stdio: 'inherit' });
  const actual = execFileSync('/opt/google/chrome/chrome', ['--version'], {
    encoding: 'utf8',
  }).trim();
  chromeProvisioning(actual);
  console.log(actual);
}
