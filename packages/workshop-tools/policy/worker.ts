import { parentPort, workerData } from 'node:worker_threads';
import type { Runtime } from './runtime.ts';
import { runCase, type CaseJob } from './study.ts';
const port = parentPort;
if (!port) throw new Error('Policy worker requires a parent.');
const runtime = (await import((workerData as { moduleURL: string }).moduleURL)) as Omit<
  Runtime,
  'moduleURL'
>;
port.on('message', (message: { index: number; job: CaseJob }) => {
  void runCase(runtime, message.job).then(
    (row) => port.postMessage({ index: message.index, row }),
    (error: unknown) =>
      port.postMessage({
        index: message.index,
        error: error instanceof Error ? error.message : String(error),
      }),
  );
});
port.postMessage({ ready: true });
