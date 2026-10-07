import { mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

/** Keep each verification run distinct from prior experiment evidence. */
export function simulationOutput(name: string) {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new Error('Invalid simulation output label');
  const root = fileURLToPath(new URL('../../test-results/', import.meta.url));
  mkdirSync(root, { recursive: true });
  const output = mkdtempSync(join(root, `${name}-`));
  console.info(`Simulation evidence: ${output}`);
  return output;
}
