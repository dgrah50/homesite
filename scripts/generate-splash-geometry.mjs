import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { packGeometry } from "../src/lib/splash/geometry-pack.mjs";

const source = new URL(
  "../public/splash/retail-geometry.json",
  import.meta.url,
);
const output = new URL(
  "../src/assets/splash/retail-geometry.bin.gz",
  import.meta.url,
);
const bytes = gzipSync(packGeometry(JSON.parse(readFileSync(source))), {
  level: 9,
});
writeFileSync(output, bytes);
console.log(`Packed splash geometry: ${bytes.length} bytes`);
