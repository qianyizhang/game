import { runCli } from '../packages/workshop-tools/hearth/arena-agent.ts';
import { reportFailure } from '../packages/workshop-tools/io.ts';
await runCli(process.argv.slice(2)).catch(reportFailure);
