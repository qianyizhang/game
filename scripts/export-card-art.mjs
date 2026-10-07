// Compatibility entry point; maintained implementation lives in the tools workspace.
import { runCli } from '../packages/workshop-tools/art/export.ts';
import { reportFailure } from '../packages/workshop-tools/io.ts';
await runCli(process.argv.slice(2)).catch(reportFailure);
