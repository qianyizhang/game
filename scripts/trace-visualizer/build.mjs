// Compatibility entry point for existing local commands. Implementation lives in tools.
import { runCli } from '../../packages/workshop-tools/trace/build.ts';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
export { buildCase } from '../../packages/workshop-tools/trace/build.ts';
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await runCli(process.argv.slice(2));
