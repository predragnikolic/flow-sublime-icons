import type { RenderJob } from "./types.ts";

export async function renderAll(jobs: RenderJob[], onProgress?: (done: number, total: number) => void) {
  if (jobs.length === 0) return;
  const size = Math.min(jobs.length, navigator.hardwareConcurrency || 4);
  const workers: Worker[] = [];
  let next = 0;
  let done = 0;

  try {
    await new Promise<void>((resolve, reject) => {
      let alive = size;
      const url = new URL("render-worker.ts", import.meta.url).href;

      for (let index = 0; index < size; index++) {
        const worker = new Worker(url, { type: "module" });
        workers.push(worker);
        worker.onmessage = (event: MessageEvent<{ ok: boolean; error?: string }>) => {
          if (!event.data.ok) {
            reject(new Error(event.data.error));
            return;
          }
          onProgress?.(++done, jobs.length);
          pump(worker);
        };
        worker.onerror = (event) => reject(event.error ?? new Error(event.message));
        pump(worker);
      }

      function pump(worker: Worker) {
        if (next < jobs.length) {
          worker.postMessage(jobs[next++]);
          return;
        }
        worker.postMessage(null);
        if (--alive === 0) resolve();
      }
    });
  } finally {
    for (const worker of workers) worker.terminate();
  }
}
