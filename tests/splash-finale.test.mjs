import test from "node:test";
import assert from "node:assert/strict";
import { prepareVisuals, prepareFinale } from "../src/lib/splash/finale.mjs";

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
  assert.deepEqual(worker.url, {
    kind: "finale",
    url: "https://dayangrah.am/splash/dg.json",
  });
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

test("opening consumes the document download and transfers it without a worker refetch", async () => {
  const controller = new AbortController(),
    buffer = new ArrayBuffer(16);
  let sends = 0,
    terminations = 0;
  const worker = {
    postMessage(message, transfer) {
      sends++;
      assert.deepEqual(message, { kind: "opening", buffer });
      assert.deepEqual(transfer, [buffer]);
    },
    terminate() {
      terminations++;
    },
  };
  const ready = prepareVisuals(
    controller.signal,
    { kind: "opening", url: "/opening.bin.gz" },
    () => worker,
    async () => buffer,
  );
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(sends, 1);
  worker.onmessage({ data: { textures: {} } });
  await ready;
  assert.equal(terminations, 1);
});

test("abort during a document download prevents its late transfer and terminates the worker", async () => {
  const controller = new AbortController();
  let deliver,
    sends = 0,
    terminations = 0;
  const worker = {
    postMessage() {
      sends++;
    },
    terminate() {
      terminations++;
    },
  };
  const ready = prepareVisuals(
    controller.signal,
    { kind: "opening", url: "/opening.bin.gz" },
    () => worker,
    () =>
      new Promise((resolve) => {
        deliver = resolve;
      }),
  );
  await new Promise((resolve) => setImmediate(resolve));
  controller.abort();
  await assert.rejects(ready, { name: "AbortError" });
  deliver(new ArrayBuffer(16));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(sends, 0);
  assert.equal(terminations, 1);
});
