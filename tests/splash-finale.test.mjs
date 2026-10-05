import test from "node:test";
import assert from "node:assert/strict";
import { prepareFinale } from "../src/lib/splash/finale.mjs";

function setup(t) {
  const previous = globalThis.location;
  globalThis.location = { href: "https://dayangrah.am/" };
  t.after(() => {
    if (previous === undefined) delete globalThis.location;
    else globalThis.location = previous;
  });
  const controller = new AbortController();
  const worker = {
    terminations: 0,
    postMessage(url) {
      this.url = url;
    },
    terminate() {
      this.terminations++;
    },
  };
  const ready = prepareFinale(controller.signal, () => worker);
  return { controller, worker, ready };
}

test("worker returns prepared geometry and terminates after delivery", async (t) => {
  const { worker, ready } = setup(t);
  assert.equal(worker.url, "https://dayangrah.am/splash/dg.json");
  const result = { study: {}, field: {} };
  worker.onmessage({ data: result });
  assert.equal(await ready, result);
  assert.equal(worker.terminations, 1);
});

test("skipping during preparation terminates the worker and ignores queued replies", async (t) => {
  const { worker, ready, controller } = setup(t);
  const lateReply = worker.onmessage;
  controller.abort();
  await assert.rejects(ready, { name: "AbortError" });
  lateReply({ data: { study: {}, field: {} } });
  assert.equal(worker.terminations, 1);
  assert.equal(worker.onmessage, null);
});

test("asset and worker failures reject instead of leaving playback waiting", async (t) => {
  const { worker, ready } = setup(t);
  worker.onmessage({ data: { error: "Asset unavailable" } });
  await assert.rejects(ready, /Asset unavailable/);
  assert.equal(worker.terminations, 1);
});
