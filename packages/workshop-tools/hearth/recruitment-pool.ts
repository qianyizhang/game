import { Worker } from 'node:worker_threads';
import type { RecruitmentCase } from '../../../src/engines/hearth/recruitment-experiment';
import { objectValue, text, number, boolean, status } from './contracts.ts';

interface RunResult {
  id: string;
  status: 'complete' | 'limit' | 'error';
  error?: string;
  replayVerified: boolean;
}
interface AuditResult {
  id: string;
  decisions: number;
  diagnostics: number;
  hashes: Record<string, string>;
}
interface Options {
  moduleURL: string;
  jobs: RecruitmentCase[];
  output: string;
  workers: number;
}
interface RunOptions extends Options {
  mode?: 'run';
  onResult?: (result: RunResult, count: number) => void;
}
interface AuditOptions extends Options {
  mode: 'audit';
  onResult?: (result: AuditResult, count: number) => void;
}
export function recruitmentPool(options: AuditOptions): Promise<AuditResult[]>;
export function recruitmentPool(options: RunOptions): Promise<RunResult[]>;
/** Independent episodes share no game state/RNG; each worker may report only its assigned job. */
export async function recruitmentPool(
  options: RunOptions | AuditOptions,
): Promise<RunResult[] | AuditResult[]> {
  const { moduleURL, jobs, output, workers, mode = 'run' } = options;
  if (!Number.isInteger(workers) || workers < 1 || workers > 4) throw new Error('Use 1–4 workers.');
  const pool: Worker[] = [],
    runs: RunResult[] = [],
    audits: AuditResult[] = [];
  const assigned = new Map<Worker, string>();
  let next = 0,
    completed = 0;
  try {
    await new Promise<void>((resolve, reject) => {
      if (!jobs.length) {
        resolve();
        return;
      }
      const dispatch = (worker: Worker) => {
        if (next < jobs.length) {
          const job = jobs[next++];
          assigned.set(worker, job.id);
          worker.postMessage(job);
        }
      };
      for (let i = 0; i < Math.min(workers, jobs.length); i++) {
        const worker = new Worker(new URL('./recruitment-worker.ts', import.meta.url), {
          workerData: { moduleURL, output, mode },
          resourceLimits: { maxOldGenerationSizeMb: 512 },
        });
        pool.push(worker);
        worker.on('error', reject);
        worker.on('exit', (code) => {
          if (completed !== jobs.length)
            reject(new Error(`Worker exited early with code ${code}.`));
        });
        worker.on('message', (value: unknown) => {
          try {
            const message = objectValue(value);
            if (message.ready === true) {
              if (assigned.has(worker)) throw new Error('Worker signaled ready during a job.');
              dispatch(worker);
              return;
            }
            if (message.error !== undefined) throw new Error(text(message.error));
            const row = objectValue(message.result),
              id = text(row.id);
            if (assigned.get(worker) !== id)
              throw new Error('Worker result does not match assigned job.');
            assigned.delete(worker);
            if (options.mode === 'audit') {
              const result = {
                id,
                decisions: number(row.decisions),
                diagnostics: number(row.diagnostics),
                hashes: Object.fromEntries(
                  Object.entries(objectValue(row.hashes)).map(([key, value]) => [key, text(value)]),
                ),
              };
              audits.push(result);
              options.onResult?.(result, ++completed);
            } else {
              const result = {
                id,
                status: status(row.status),
                ...(row.error === undefined ? {} : { error: text(row.error) }),
                replayVerified: boolean(row.replayVerified),
              };
              runs.push(result);
              options.onResult?.(result, ++completed);
            }
            if (completed === jobs.length) resolve();
            else dispatch(worker);
          } catch (error) {
            reject(
              error instanceof Error
                ? error
                : new Error('Recruitment pool failed', { cause: error }),
            );
          }
        });
      }
    });
    return options.mode === 'audit' ? audits : runs;
  } finally {
    await Promise.allSettled(pool.map((worker) => worker.terminate()));
  }
}
