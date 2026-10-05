import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import {
  unpackPrepared,
  packPrepared,
  predictIndices,
  restoreIndices,
  predictHeights,
  restoreHeights,
} from "../src/lib/splash/prepared-pack.mjs";
import {
  restoreOpening,
  restoreFinale,
} from "../src/lib/splash/prepared-visuals.mjs";
import {
  normalizationCube,
  roughNormalTexture,
  glowTexture,
  intensityTextures,
} from "../src/lib/splash/retail-materials.mjs";
import {
  BlobSimulation,
  cubeSphere,
  deformSphere,
  makeCamera,
  sampleCamera,
  restoreCamera,
} from "../src/lib/splash/simulation.mjs";
import { craterField } from "../src/lib/splash/crater-field.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url));
function asset(name) {
  const bytes = gunzipSync(read(`src/assets/splash/${name}.bin.gz`));
  return unpackPrepared(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  );
}
test("lossless predictors retain asymmetric float bits and wrapping indices", () => {
  for (const [width, height] of [
    [3, 3],
    [4, 4],
  ]) {
    const bits = Uint32Array.from(
      { length: width * height },
      (_, i) => [0, 0x80000000, 0x3f800001, 0xbf800001, 0x7f7fffff][i % 5],
    );
    const decoded = restoreHeights(
      predictHeights(new Float32Array(bits.buffer), width, height),
      width,
      height,
    );
    assert.deepEqual(new Uint32Array(decoded.buffer), bits);
  }
  for (const Type of [Uint16Array, Uint32Array]) {
    const indices = Type.from([0, 65535, 1, 42, 0, 65536, 3]);
    assert.deepEqual(restoreIndices(predictIndices(indices)), indices);
  }
  const floats = Float32Array.of(0, -0, 1);
  const packed = packPrepared({}, { a: floats, b: floats.slice() });
  const { arrays } = unpackPrepared(packed.buffer);
  assert.deepEqual(arrays.a, floats);
  assert.equal(arrays.a.byteOffset, arrays.b.byteOffset);
});
test("prepared textures preserve every byte, face orientation and source sphere precision", () => {
  const opening = restoreOpening(asset("opening"));
  for (const size of [64, 256])
    assert.deepEqual(
      opening.textures[`cube${size}`],
      normalizationCube(size).images.map((t) => t.image.data),
    );
  assert.deepEqual(opening.textures.rough[0], roughNormalTexture().image.data);
  assert.deepEqual(opening.textures.glow[0], glowTexture().image.data);
  const plasma = intensityTextures(
    256,
    3,
    425,
    new BlobSimulation().plasmaSeed,
    true,
  );
  for (let i = 0; i < 3; i++)
    for (let k = 0; k < plasma[i].length; k++)
      assert.deepEqual(
        [...opening.textures.plasma[i].subarray(k * 4, k * 4 + 4)],
        [0, 0, 0, plasma[i][k]],
      );
  const retail = JSON.parse(read("public/splash/retail.json"));
  for (const key of [
    "quats",
    "positions",
    "posSequences",
    "rotSequences",
    "textAnimation",
  ])
    assert.deepEqual(opening.data[key], retail[key], key);
  assert.deepEqual(
    opening.data.primitives,
    Object.fromEntries(
      Object.entries(retail.primitives).map(([kind, { instances }]) => [
        kind,
        { instances },
      ]),
    ),
  );
  assert.doesNotThrow(() => structuredClone(opening));
  const camera = restoreCamera(opening.camera);
  const sourceCamera = makeCamera(
    JSON.parse(read("public/splash/retail.json")).cameraPaths[0],
  );
  for (const time of [0, 0.6, 2, 4.7, 5.2, 5.88, 6, 7, 8])
    assert.deepEqual(
      sampleCamera(camera, time),
      sampleCamera(sourceCamera, time),
    );
  assert.deepEqual(
    camera.transform([0, -camera.offset, 0]),
    sourceCamera.transform([0, -sourceCamera.offset, 0]),
  );
  assert.deepEqual(opening.unit, cubeSphere());
  assert.deepEqual(
    opening.smallUnit.positions,
    Float32Array.from(cubeSphere(4).positions),
  );
  assert.deepEqual(opening.smallUnit.indices, cubeSphere(4).indices);
  // Float64 unit vectors matter to the original deformation, before GPU rounding.
  for (const time of [0.6, 1.5, 3, 4.7]) {
    const sim = new BlobSimulation().seek(time);
    assert.deepEqual(
      deformSphere(opening.unit.positions, sim),
      deformSphere(cubeSphere().positions, sim),
    );
  }
});
test("prepared crater and DG meshes preserve all original GPU values without approximating the lighting", () => {
  const study = JSON.parse(read("public/splash/dg.json"));
  const { field, study: prepared } = restoreFinale(asset("finale"));
  assert.doesNotThrow(() => structuredClone({ field, study: prepared }));
  const source = craterField(study.polygons);
  for (const key of [
    "width",
    "height",
    "bounds",
    "distances",
    "heights",
    "texels",
  ])
    assert.deepEqual(field[key], source[key], key);
  // Captured from the original crater mesh before removing its runtime builder.
  const expected = {
    positions:
      "49b93c595f78eebcdd27c853f1cc3a40f79566b0675d393e67e9c933b25e779c",
    uv: "9157bf17027a4a4724717ac5f5ce674b482def67252ec08d40e44d14b166cfec",
    indices: "d488a6e7df6d127c8dbf6a5be88d4e42d9b1d77891e8a840a4629a91eb62732b",
  };
  for (const [name, array] of Object.entries(field.geometry))
    assert.equal(
      createHash("sha256")
        .update(
          new Uint8Array(array.buffer, array.byteOffset, array.byteLength),
        )
        .digest("hex"),
      expected[name],
    );
  for (const [name, mesh] of Object.entries(study.logo))
    for (const [key, values] of Object.entries(mesh))
      assert.deepEqual(
        prepared.logo[name][key],
        key === "indices" ? values : Float32Array.from(values.flat()),
        `${name}.${key}`,
      );
});
