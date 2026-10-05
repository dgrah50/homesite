import test from "node:test";
import assert from "node:assert/strict";
import { createSplashAudio } from "../src/lib/splash/audio.ts";

const flush = () => new Promise((resolve) => setImmediate(resolve));

function setup(
  t,
  { allowed = false, load = async () => ({ duration: 8 }) } = {},
) {
  let time = 0;
  let context;
  const original = globalThis.AudioContext;
  class FakeContext extends EventTarget {
    state = "suspended";
    sources = [];
    closes = 0;
    constructor() {
      super();
      context = this;
    }
    resume() {
      if (!allowed) return new Promise(() => {});
      this.state = "running";
      this.dispatchEvent(new Event("statechange"));
      return Promise.resolve();
    }
    close() {
      this.closes++;
      this.state = "closed";
      return Promise.resolve();
    }
    createBufferSource() {
      const source = {
        starts: [],
        stops: 0,
        connect() {},
        disconnect() {},
        start(...args) {
          this.starts.push(args);
        },
        stop() {
          this.stops++;
        },
      };
      this.sources.push(source);
      return source;
    }
  }
  globalThis.AudioContext = FakeContext;
  const button = {
    textContent: "",
    attributes: new Map(),
    setAttribute(name, value) {
      this.attributes.set(name, value);
    },
  };
  const audio = createSplashAudio(
    button,
    () => time,
    new AbortController().signal,
    load,
  );
  t.after(() => {
    audio.dispose();
    if (original === undefined) delete globalThis.AudioContext;
    else globalThis.AudioContext = original;
  });
  return {
    audio,
    button,
    get context() {
      return context;
    },
    allow() {
      allowed = true;
    },
    seek(value) {
      time = value;
    },
  };
}

test("blocked autoplay does not hold up readiness; unlocking uses the current frame", async (t) => {
  const state = setup(t);
  state.audio.start();
  state.audio.play();
  assert.equal(state.audio.ready(), undefined);
  await flush();
  assert.equal(state.button.textContent, "Tap for sound");
  assert.equal(state.context.sources.length, 0);
  state.seek(2.5);
  state.allow();
  state.audio.unlock();
  await flush();
  assert.equal(state.button.textContent, "Sound on");
  assert.equal(state.context.sources.length, 1);
  assert.deepEqual(state.context.sources[0].starts, [[0, 2.5]]);
});

test("allowed autoplay waits for its buffer and never starts before the visual is ready", async (t) => {
  let resolve;
  const state = setup(t, {
    allowed: true,
    load: () =>
      new Promise((done) => {
        resolve = done;
      }),
  });
  state.audio.start();
  const ready = state.audio.ready();
  assert.ok(ready instanceof Promise);
  resolve({ duration: 8 });
  await ready;
  assert.equal(state.context.sources.length, 0);
  state.audio.play();
  assert.deepEqual(state.context.sources[0].starts, [[0, 0]]);
});

test("muting survives further unlock gestures; re-enabling resumes at the current frame", async (t) => {
  const state = setup(t, { allowed: true });
  state.audio.start();
  await state.audio.ready();
  state.audio.play();
  state.audio.toggle();
  state.audio.unlock();
  assert.equal(state.button.textContent, "Sound off");
  assert.equal(state.context.sources.length, 1);
  assert.equal(state.context.sources[0].stops, 1);
  state.seek(4);
  state.audio.toggle();
  await flush();
  assert.deepEqual(state.context.sources[1].starts, [[0, 4]]);
});

test("pausing prevents a context state change from restarting hidden playback", async (t) => {
  const state = setup(t, { allowed: true });
  state.audio.start();
  await state.audio.ready();
  state.audio.play();
  state.audio.pause();
  state.context.dispatchEvent(new Event("statechange"));
  assert.equal(state.context.sources.length, 1);
  state.seek(3);
  state.audio.play();
  assert.deepEqual(state.context.sources[1].starts, [[0, 3]]);
});

test("dismissal during loading cannot start sound later and closes only once", async (t) => {
  let resolve;
  const state = setup(t, {
    allowed: true,
    load: () =>
      new Promise((done) => {
        resolve = done;
      }),
  });
  state.audio.start();
  state.audio.play();
  state.audio.dispose();
  state.audio.dispose();
  resolve({ duration: 8 });
  await flush();
  assert.equal(state.context.sources.length, 0);
  assert.equal(state.context.closes, 1);
});
