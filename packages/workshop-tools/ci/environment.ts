import { execFileSync } from 'node:child_process';
import { appendFileSync, writeFileSync, existsSync } from 'node:fs';
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
export function verifyEnvironment(expected: string | undefined): boolean {
  return process.env.GITHUB_ACTIONS !== 'true' || expected === environmentStamp();
}
if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  const expected = (JSON.parse(process.env.CI_PLAN ?? '{}') as { environment?: string })
    .environment;
  const matching = verifyEnvironment(expected);
  appendFileSync(process.env.GITHUB_OUTPUT!, `matching=${matching}\n`);
  if (!matching) {
    writeFileSync(
      resolve(process.env.RUNNER_TEMP!, 'environment-mismatch.json'),
      JSON.stringify({ expected, actual: environmentStamp() }),
    );
    console.log(
      'Hosted runtime differs from planning: checks continue; cross-run reuse is disabled.',
    );
  }
}
