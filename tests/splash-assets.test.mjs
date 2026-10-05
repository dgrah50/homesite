import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { unpackGeometry } from "../src/lib/splash/geometry-pack.mjs";

test("prepared soundtrack matches its synthesis sources and asset manifest", () => {
  const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url));
  const manifest = JSON.parse(read("src/assets/splash/audio-manifest.json"));
  const sourceHash = createHash("sha256");
  for (const path of [
    "public/splash/retail-audio.json",
    "src/lib/splash/audio-engine.mjs",
    "src/lib/splash/audio-filter.mjs",
  ])
    sourceHash.update(read(path));
  assert.equal(sourceHash.digest("hex"), manifest.sourceSha256);
  assert.equal(manifest.duration, 8);
  for (const [file, expected] of Object.entries(manifest.files)) {
    const bytes = read(`src/assets/splash/${file}`);
    assert.equal(bytes.length, expected.bytes);
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      expected.sha256,
    );
  }
});

test("packed meshes preserve every rendered attribute and triangle from the original", () => {
  const source = JSON.parse(
    readFileSync(
      new URL("../public/splash/retail-geometry.json", import.meta.url),
    ),
  );
  const bytes = gunzipSync(
    readFileSync(
      new URL("../src/assets/splash/retail-geometry.bin.gz", import.meta.url),
    ),
  );
  const meshes = unpackGeometry(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  );
  assert.deepEqual(Object.keys(meshes), Object.keys(source));
  for (const [name, mesh] of Object.entries(source)) {
    assert.deepEqual(Object.keys(meshes[name]), Object.keys(mesh));
    for (const [field, values] of Object.entries(mesh)) {
      const actual = meshes[name][field];
      assert.deepEqual(
        actual,
        field === "indices" ? values : Float32Array.from(values),
        `${name}.${field}`,
      );
    }
  }
});
