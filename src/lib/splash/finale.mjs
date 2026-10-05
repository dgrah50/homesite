export function prepareVisuals(
  signal,
  asset,
  createWorker = () =>
    new Worker(new URL("./finale-worker.mjs", import.meta.url), {
      type: "module",
    }),
  loadBuffer,
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
    worker.onmessage = ({ data }) => {
      finish(data.error ? new Error(data.error) : null, data);
    };
    worker.onerror = () => {
      finish(new Error("Splash finale worker failed."));
    };
    if (signal.aborted) abort();
    else {
      const send = (buffer) => {
        if (settled) return;
        try {
          if (buffer)
            worker.postMessage({ kind: asset.kind, buffer }, [buffer]);
          else
            worker.postMessage({
              ...asset,
              url: new URL(asset.url, location.href).href,
            });
        } catch (error) {
          finish(error);
        }
      };
      // Document fetches consume its preload. Transfer to the worker instead of
      // issuing a second request from a different browsing context.
      if (loadBuffer)
        Promise.resolve()
          .then(() => loadBuffer(asset.url, signal))
          .then(send, (error) => finish(error));
      else send();
    }
  });
}

export function prepareFinale(signal, createWorker, url = "/splash/dg.json") {
  return prepareVisuals(signal, { kind: "finale", url }, createWorker);
}
