/** Blender process policy shared by native authoring and disposable verification. */
import { spawnSync } from 'node:child_process';

export function findBlender(root: string): string {
  const override = process.env.BLENDER_BIN;
  if (override !== undefined && !override.trim())
    throw new Error(
      'BLENDER_BIN must name a Blender executable; unset it for automatic discovery.',
    );
  const candidates =
    override !== undefined
      ? [override]
      : ['/Applications/Blender.app/Contents/MacOS/Blender', 'blender'];
  for (const binary of candidates) {
    const result = spawnSync(binary, ['--version'], { encoding: 'utf8' });
    if (result.status === 0) {
      if (!/^Blender 5\.2\.\d+(?:\s|$)/m.test(result.stdout))
        throw new Error(
          `Unsupported Blender runtime at ${binary}: ${result.stdout.split('\n')[0]}. Expected Blender 5.2 LTS.`,
        );
      return binary;
    }
    if (
      override === undefined &&
      result.error &&
      'code' in result.error &&
      result.error.code === 'ENOENT'
    )
      continue;
    throw new Error(
      `${override !== undefined ? 'BLENDER_BIN' : 'Blender'} startup failed for ${binary}: ${result.stderr || String(result.error ?? result.signal ?? result.status)}`,
    );
  }
  throw new Error(`Blender is missing for ${root}. Set BLENDER_BIN or install Blender 5.2 LTS.`);
}

export function runBlender(
  binary: string,
  script: string,
  args: string[],
  { source, cwd }: { source?: string; cwd?: string } = {},
): void {
  const flags = ['--background', '--factory-startup'];
  if (source) flags.push(source);
  flags.push('--python-exit-code', '1', '--python', script, '--', ...args);
  const result = spawnSync(binary, flags, { stdio: 'inherit', cwd });
  if (result.error) throw new Error(`Blender ${script} failed: ${String(result.error)}`);
  if (result.status !== 0)
    throw new Error(`Blender ${script} failed (${result.signal ?? result.status})`);
}
