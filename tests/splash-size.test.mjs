import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import {
  measureSplash,
  checkSplashSize,
  budgets,
} from "../scripts/check-splash-size.mjs";

test("transfer audit counts shared imports and workers once and excludes unused assets", () => {
  const directory = mkdtempSync(join(tmpdir(), "splash-size-"));
  try {
    const root = join(directory, "_astro");
    mkdirSync(root);
    const modules = {
      "SplashScreen.hash.js":
        'import "./runtime.js"; import("./audio.js"); new Worker(new URL("/_astro/worker.js", import.meta.url));',
      "runtime.js": 'import "./shared.js"; import("./finale.js");',
      "finale.js": 'import "./shared.js";',
      "audio.js": "export const sound = true;",
      "shared.js": "export const shared = true;",
      "worker.js": 'import "./shared.js";',
    };
    for (const [name, source] of Object.entries(modules))
      writeFileSync(join(root, name), source);
    writeFileSync(join(root, "unrelated.js"), "x".repeat(1_000_000));
    for (const name of [
      "opening.bin.hash.gz",
      "retail-geometry.bin.hash.gz",
      "finale.bin.hash.gz",
      "boot.hash.ogg",
    ])
      writeFileSync(join(root, name), Buffer.alloc(10));
    const sizes = measureSplash(directory);
    assert.equal(
      sizes.javascript,
      Object.values(modules).reduce(
        (sum, source) => sum + gzipSync(source, { level: 9 }).length,
        0,
      ),
    );
    assert.equal(sizes.total, sizes.javascript + 40);
    assert.doesNotThrow(() => checkSplashSize(sizes));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("transfer budgets fail for either an oversized opening or complete download", () => {
  for (const kind of ["opening", "total"]) {
    const sizes = Object.fromEntries(
      Object.keys(budgets).map((key) => [key, 0]),
    );
    sizes[kind] = budgets[kind] + 1;
    assert.throws(
      () => checkSplashSize(sizes),
      new RegExp(`Splash ${kind} exceeds`),
    );
  }
});
