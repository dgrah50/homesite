import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import {
  normalizationCube,
  roughNormalTexture,
  glowTexture,
  intensityTextures,
} from "../src/lib/splash/retail-materials.mjs";
import {
  BlobSimulation,
  cubeSphere,
  makeCamera,
} from "../src/lib/splash/simulation.mjs";
import { craterField } from "../src/lib/splash/crater-field.mjs";
import {
  packPrepared,
  predictPlane,
  predictIntensity,
  predictRow,
  predictIndices,
  predictHeights,
} from "../src/lib/splash/prepared-pack.mjs";

const arrays = {},
  textures = {};
function addTexture(name, size, faces) {
  const unique = [],
    recipes = [];
  for (const rgba of faces) {
    const channels = [];
    for (let c = 0; c < 4; c++) {
      const p = Uint8Array.from(
        { length: size * size },
        (_, i) => rgba[i * 4 + c],
      );
      if (p.every((v) => v === p[0])) {
        channels.push(p[0]);
        continue;
      }
      let match;
      // Deduplicate only when every byte agrees, including reflected faces.
      for (let plane = 0; plane < unique.length && !match; plane++)
        for (let transform = 0; transform < 8 && !match; transform++) {
          const q = unique[plane];
          let same = true;
          for (let y = 0; y < size && same; y++)
            for (let x = 0; x < size; x++) {
              let xx = transform & 1 ? size - 1 - x : x,
                yy = transform & 2 ? size - 1 - y : y;
              if (transform & 4) [xx, yy] = [yy, xx];
              if (p[y * size + x] !== q[yy * size + xx]) {
                same = false;
                break;
              }
            }
          if (same) match = { plane, transform };
        }
      if (!match) {
        match = { plane: unique.length, transform: 0 };
        unique.push(p);
      }
      channels.push(match);
    }
    recipes.push(channels);
  }
  const planes = unique.map((p, i) => {
    const key = `${name}_${i}`;
    const candidates =
      name === "plasma"
        ? [{ prediction: "intensity", bytes: predictIntensity(p, size) }]
        : [
            { prediction: "raw", bytes: p },
            { prediction: "row", bytes: predictRow(p, size) },
            { prediction: "plane", bytes: predictPlane(p, size) },
          ];
    const smallest = candidates
      .map((candidate) => ({
        ...candidate,
        size: gzipSync(candidate.bytes, { level: 9 }).length,
      }))
      .sort((a, b) => a.size - b.size)[0];
    arrays[key] = smallest.bytes;
    return { key, prediction: smallest.prediction };
  });
  textures[name] = {
    size,
    planes,
    faces: recipes,
  };
}
for (const size of [64, 256])
  addTexture(
    `cube${size}`,
    size,
    normalizationCube(size).images.map((t) => t.image.data),
  );
addTexture("rough", 128, [roughNormalTexture().image.data]);
addTexture("glow", 256, [glowTexture().image.data]);
const plasma = intensityTextures(
  256,
  3,
  425,
  new BlobSimulation().plasmaSeed,
  true,
).map((a) => {
  const rgba = new Uint8Array(a.length * 4);
  for (let i = 0; i < a.length; i++) rgba[i * 4 + 3] = a[i];
  return rgba;
});
addTexture("plasma", 256, plasma);
const unit = cubeSphere(),
  small = cubeSphere(4);
arrays.unit = Float64Array.from(unit.positions);
arrays.unitIndices = predictIndices(Uint16Array.from(unit.indices));
arrays.smallUnit = Float32Array.from(small.positions);
arrays.smallIndices = predictIndices(Uint16Array.from(small.indices));
function write(name, metadata, arrays) {
  const bytes = gzipSync(packPrepared(metadata, arrays), { level: 9 });
  writeFileSync(
    new URL(`../src/assets/splash/${name}.bin.gz`, import.meta.url),
    bytes,
  );
  console.log(`Prepared ${name}: ${bytes.length} bytes`);
}
const retail = JSON.parse(
  readFileSync(new URL("../public/splash/retail.json", import.meta.url)),
);
const { transform, ...camera } = makeCamera(retail.cameraPaths[0]);
const data = Object.fromEntries(
  ["quats", "positions", "posSequences", "rotSequences", "textAnimation"].map(
    (key) => [key, retail[key]],
  ),
);
data.primitives = Object.fromEntries(
  Object.entries(retail.primitives).map(([kind, { instances }]) => [
    kind,
    { instances },
  ]),
);
write("opening", { textures, camera, data }, arrays);
const study = JSON.parse(
  readFileSync(new URL("../public/splash/dg.json", import.meta.url)),
);
const field = craterField(study.polygons, { prepare: true });
const finale = {
    heights: predictHeights(field.heights, field.width, field.height),
    edges: field.edges,
    segments: field.segments,
  },
  logo = {};
for (const [name, mesh] of Object.entries(study.logo)) {
  logo[name] = {};
  for (const [key, values] of Object.entries(mesh)) {
    const id = `${name}_${key}`;
    finale[id] =
      key === "indices"
        ? predictIndices(
            (values.every((value) => value <= 65535)
              ? Uint16Array
              : Uint32Array
            ).from(values),
          )
        : Float32Array.from(values.flat());
    logo[name][key] = id;
  }
}
write(
  "finale",
  {
    field: { width: field.width, height: field.height, bounds: field.bounds },
    logo,
  },
  finale,
);
