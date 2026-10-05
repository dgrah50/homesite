export function prepareFinale(
  signal,
  createWorker = () =>
    new Worker(new URL("./finale-worker.mjs", import.meta.url), {
      type: "module",
    }),
) {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const worker = createWorker();
    let settled = false;
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", abort);
      worker.onmessage = worker.onerror = null;
      worker.terminate();
      if (error) reject(error);
      else resolve(result);
    };
    const abort = () => finish(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
    worker.onmessage = ({ data }) => {
      finish(data.error ? new Error(data.error) : null, data);
    };
    worker.onerror = () => {
      finish(new Error("Splash finale worker failed."));
    };
    if (signal.aborted) abort();
    else {
      try {
        worker.postMessage(new URL("/splash/dg.json", location.href).href);
      } catch (error) {
        finish(error);
      }
    }
  });
}
