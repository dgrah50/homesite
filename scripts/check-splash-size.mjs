import { readFileSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

// Decimal bytes on the wire, not expanded texture/GPU memory. Keep separate
// opening limits: a small complete intro can still have a slow first frame.
export const budgets = {
  opening: 120_000,
  chamber: 100_000,
  finale: 160_000,
  audio: 85_000,
  javascript: 145_000,
  total: 610_000,
};

export function measureSplash(directory) {
  const root = join(directory, "_astro");
  const files = readdirSync(root);
  const entries = files.filter((name) => /^SplashScreen\..*\.js$/.test(name));
  if (entries.length !== 1) throw new Error("Expected one built splash entry.");
  const visited = new Set();
  let javascript = 0;
  function visit(name) {
    if (visited.has(name)) return;
    visited.add(name);
    const bytes = readFileSync(join(root, name));
    javascript += gzipSync(bytes, { level: 9 }).length;
    // Follow static/dynamic imports, Vite preload lists and worker URL literals.
    // Each emitted module is counted once, including shared dependencies.
    for (const match of bytes.toString().matchAll(/["'`]([^"'`\s]+\.js)["'`]/g))
      visit(basename(match[1]));
  }
  visit(entries[0]);
  const sizes = { javascript };
  for (const [kind, prefix, suffix] of [
    ["opening", "opening.bin.", ".gz"],
    ["chamber", "retail-geometry.bin.", ".gz"],
    ["finale", "finale.bin.", ".gz"],
    ["audio", "boot.", ".ogg"],
  ]) {
    const matches = files.filter(
      (name) => name.startsWith(prefix) && name.endsWith(suffix),
    );
    if (matches.length !== 1)
      throw new Error(`Expected one built ${kind} asset.`);
    sizes[kind] = readFileSync(join(root, matches[0])).length;
  }
  sizes.total = Object.values(sizes).reduce((sum, bytes) => sum + bytes, 0);
  return sizes;
}

export function checkSplashSize(sizes) {
  for (const [kind, limit] of Object.entries(budgets))
    if (sizes[kind] > limit)
      throw new Error(
        `Splash ${kind} exceeds its transfer budget: ${sizes[kind]} > ${limit} bytes.`,
      );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const sizes = measureSplash(resolve(process.argv[2] ?? "dist"));
  for (const [kind, bytes] of Object.entries(sizes))
    console.log(`Splash ${kind}: ${bytes} / ${budgets[kind]} bytes`);
  checkSplashSize(sizes);
}
