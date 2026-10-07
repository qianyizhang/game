// Compatibility entry point; maintained implementation lives in the tools workspace.
import { runCli } from '../packages/workshop-tools/experiments/compare-playtests.ts';
import { reportFailure } from '../packages/workshop-tools/io.ts';
try {
  runCli(process.argv.slice(2));
} catch (error) {
  reportFailure(error);
}
