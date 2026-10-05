import { loadCompressed } from "./compressed.mjs";

export function prepareVisuals(
  signal,
  { kind, url },
  {
    createWorker = () =>
      new Worker(new URL("./visual-worker.mjs", import.meta.url), {
        type: "module",
      }),
    loadBuffer = loadCompressed,
  } = {},
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
      if (error !== undefined && error !== null) reject(error);
      else resolve(result);
    };
    const abort = () =>
      finish(signal.reason ?? new DOMException("Aborted", "AbortError"));
    signal.addEventListener("abort", abort, { once: true });
    worker.onmessage = ({ data }) =>
      finish(data.error ? new Error(data.error) : null, data);
    worker.onerror = () => finish(new Error("Splash visual worker failed."));
    if (signal.aborted) {
      abort();
      return;
    }
    // Consume the document preload once, then transfer its data to the worker.
    Promise.resolve()
      .then(() => loadBuffer(url, signal))
      .then(
        (buffer) => {
          if (settled) return;
          try {
            worker.postMessage({ kind, buffer }, [buffer]);
          } catch (error) {
            finish(error);
          }
        },
        (error) => finish(error),
      );
  });
}
