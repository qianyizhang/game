// Compatibility entry point; maintained implementation lives in the tools workspace.
import { runCli } from '../packages/workshop-tools/art/scaffold.ts';
import { reportFailure } from '../packages/workshop-tools/io.ts';
await runCli(process.argv.slice(2)).catch(reportFailure);
