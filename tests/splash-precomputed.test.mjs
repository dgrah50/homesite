import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { unpackPrepared } from "../src/lib/splash/prepared-pack.mjs";
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
import { fissureCrater } from "../src/lib/splash/fissure-crater.mjs";
import { craterField } from "../src/lib/splash/crater-field.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url));
function asset(name) {
  const bytes = gunzipSync(read(`src/assets/splash/${name}.bin.gz`));
  return unpackPrepared(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  );
}
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
  const originalCrater = fissureCrater(study.polygons, {}, source);
  assert.deepEqual(
    field.geometry.positions,
    originalCrater.mesh.geometry.attributes.position.array,
  );
  assert.deepEqual(
    field.geometry.uv,
    originalCrater.mesh.geometry.attributes.uv.array,
  );
  assert.deepEqual(
    field.geometry.indices,
    originalCrater.mesh.geometry.index.array,
  );
  originalCrater.mesh.geometry.dispose();
  originalCrater.material.uniforms.bowlMap.value.dispose();
  originalCrater.material.dispose();
  for (const [name, mesh] of Object.entries(study.logo))
    for (const [key, values] of Object.entries(mesh))
      assert.deepEqual(
        prepared.logo[name][key],
        key === "indices" ? values : Float32Array.from(values.flat()),
        `${name}.${key}`,
      );
});
