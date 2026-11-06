import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/** A hosted run may be reused only with the same configured and observed runtime. */
export function environmentStamp(): string {
  return JSON.stringify({
    image: process.env.ImageVersion ?? '',
    platform: process.platform,
    arch: process.arch,
    node: process.versions.node,
    chrome: existsSync('/opt/google/chrome/chrome')
      ? execFileSync('/opt/google/chrome/chrome', ['--version'], { encoding: 'utf8' }).trim()
      : '',
  });
}
export function verifyEnvironment(expected: string | undefined) {
  if (process.env.GITHUB_ACTIONS !== 'true') return;
  const actual = JSON.parse(environmentStamp()) as Record<string, string>;
  const wanted = JSON.parse(expected ?? '{}') as Record<string, string>;
  // Missing hosted Chrome is provisioned later; this run remains ineligible for reuse.
  if (wanted.chrome === '') actual.chrome = '';
  if (!expected || JSON.stringify(actual) !== JSON.stringify(wanted))
    throw new Error('Validation environment changed between jobs; rerun on one hosted image');
}
if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename)
  verifyEnvironment(
    (JSON.parse(process.env.CI_PLAN ?? '{}') as { environment?: string }).environment,
  );
