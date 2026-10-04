import { Worker } from 'node:worker_threads';

/** Independent deterministic episodes; workers share no game state or RNG. */
export async function recruitmentPool({
  moduleURL,
  jobs,
  output,
  workers,
  mode = 'run',
  onResult = () => {},
}) {
  if (!Number.isInteger(workers) || workers < 1 || workers > 4) throw new Error('Use 1–4 workers.');
  const pool = [],
    results = [];
  let next = 0;
  try {
    await new Promise((resolve, reject) => {
      if (!jobs.length) {
        resolve();
        return;
      }
      const dispatch = (worker) => {
        if (next < jobs.length) worker.postMessage(jobs[next++]);
      };
      for (let i = 0; i < Math.min(workers, jobs.length); i++) {
        const worker = new Worker(new URL('./hearth-recruitment-worker.mjs', import.meta.url), {
          workerData: { moduleURL, output, mode },
          resourceLimits: { maxOldGenerationSizeMb: 512 },
        });
        pool.push(worker);
        worker.on('error', reject);
        worker.on('exit', (code) => {
          if (code !== 0 && results.length !== jobs.length)
            reject(new Error(`Worker exited with code ${code}.`));
        });
        worker.on('message', (message) => {
          if (message.ready) {
            dispatch(worker);
            return;
          }
          if (message.error) {
            reject(new Error(message.error));
            return;
          }
          try {
            results.push(message.result);
            onResult(message.result, results.length);
            if (results.length === jobs.length) resolve();
            else dispatch(worker);
          } catch (error) {
            reject(error);
          }
        });
      }
    });
    return results;
  } finally {
    await Promise.allSettled(pool.map((worker) => worker.terminate()));
  }
}
