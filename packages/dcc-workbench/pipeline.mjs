import { main } from './pipeline.ts';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
export { root, readGlb, accessorValues, inspectGlb, verify, main } from './pipeline.ts';
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv[2], process.argv.includes('--rebuild'));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
