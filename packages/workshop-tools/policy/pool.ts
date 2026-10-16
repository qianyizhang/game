import { Worker } from 'node:worker_threads';
import type { CaseJob, StudyRow } from './study.ts';

/** Each worker owns independent episodes; assigned case identity is checked before collection. */
export async function casePool(moduleURL: string, jobs: CaseJob[], workers: number) {
  if (!Number.isInteger(workers) || workers < 1 || workers > 4) throw new Error('Use 1–4 workers.');
  const pool: Worker[] = [],
    rows: StudyRow[] = [],
    assigned = new Map<Worker, number>();
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
          const index = next++;
          assigned.set(worker, index);
          worker.postMessage({ index, job: jobs[index] });
        }
      };
      for (let i = 0; i < Math.min(workers, jobs.length); i++) {
        const worker = new Worker(new URL('./worker.ts', import.meta.url), {
          workerData: { moduleURL },
          // Original-input traces can approach the 150 MB parser limit. Recording,
          // hashing and independent audits need room for decoded graphs and JSON copies.
          // The pool still caps concurrency at four; each worker has a 2 GiB V8 old-generation limit, not an RSS limit.
          resourceLimits: { maxOldGenerationSizeMb: 2048 },
        });
        pool.push(worker);
        worker.on('error', reject);
        worker.on('exit', (code) => {
          if (completed !== jobs.length)
            reject(new Error(`Policy worker exited early with code ${code}.`));
        });
        worker.on('message', (value: unknown) => {
          try {
            const message = value as {
              ready?: boolean;
              index?: number;
              row?: StudyRow;
              error?: string;
            };
            if (message.ready) {
              if (assigned.has(worker)) throw new Error('Worker became ready during a case.');
              dispatch(worker);
              return;
            }
            if (message.error !== undefined) throw new Error(message.error);
            const index = assigned.get(worker),
              row = message.row;
            if (
              index === undefined ||
              message.index !== index ||
              !row ||
              row.seed !== jobs[index].seed ||
              row.setupId !== jobs[index].setupId ||
              row.policy !== jobs[index].policy ||
              row.stratum !== jobs[index].stratum ||
              row.difficulty !== jobs[index].difficulty
            )
              throw new Error('Policy worker result does not match its assigned case.');
            assigned.delete(worker);
            rows[index] = row;
            completed++;
            process.stderr.write(
              `Case ${completed}/${jobs.length}: ${row.seed}-${row.setupId}-${row.policy} ${row.status}\n`,
            );
            if (completed === jobs.length) resolve();
            else dispatch(worker);
          } catch (error) {
            reject(
              error instanceof Error ? error : new Error('Policy worker failed.', { cause: error }),
            );
          }
        });
      }
    });
    return rows;
  } finally {
    await Promise.allSettled(pool.map((worker) => worker.terminate()));
  }
}
