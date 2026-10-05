import { restorePlane, restoreIntensity } from "./prepared-pack.mjs";

export function restoreOpening({ metadata, arrays }) {
  const textures = {};
  for (const [name, { size, planes, faces, prediction }] of Object.entries(
    metadata.textures,
  )) {
    const decoded = planes.map((key) =>
      (prediction === "intensity" ? restoreIntensity : restorePlane)(
        arrays[key],
        size,
      ),
    );
    textures[name] = faces.map((channels) => {
      const rgba = new Uint8Array(size * size * 4);
      for (let c = 0; c < 4; c++)
        for (let i = 0; i < size * size; i++) {
          const channel = channels[c];
          if (typeof channel === "number") {
            rgba[i * 4 + c] = channel;
            continue;
          }
          let x = i % size,
            y = Math.floor(i / size);
          if (channel.transform & 1) x = size - 1 - x;
          if (channel.transform & 2) y = size - 1 - y;
          if (channel.transform & 4) [x, y] = [y, x];
          rgba[i * 4 + c] = decoded[channel.plane][y * size + x];
        }
      return rgba;
    });
  }
  const camera = metadata.camera;
  return {
    textures,
    camera,
    unit: {
      positions: Array.from(arrays.unit),
      indices: Array.from(arrays.unitIndices),
    },
    smallUnit: {
      positions: arrays.smallUnit,
      indices: Array.from(arrays.smallIndices),
    },
  };
}

// Nearest-edge searches, inside/outside tests and Gaussian smoothing were baked.
// Only expand the lookup and finite differences needed for the GPU upload.
export function restoreFinale({ metadata, arrays }) {
  const { width, height, bounds } = metadata.field;
  const dx = (bounds.x1 - bounds.x0) / (width - 1),
    dz = (bounds.z1 - bounds.z0) / (height - 1);
  const heights = arrays.heights,
    distances = new Float32Array(width * height),
    texels = new Float32Array(width * height * 4);
  for (let j = 0; j < height; j++)
    for (let i = 0; i < width; i++) {
      const k = j * width + i,
        code = arrays.edges[k],
        id = (code & 32767) - 1;
      let nearest = 1024;
      if (id >= 0) {
        const x = bounds.x0 + i * dx,
          z = bounds.z0 + j * dz,
          s = id * 5;
        const sx = arrays.segments[s],
          sz = arrays.segments[s + 1],
          ex = arrays.segments[s + 2],
          ez = arrays.segments[s + 3],
          length2 = arrays.segments[s + 4];
        const t = Math.max(
          0,
          Math.min(1, ((x - sx) * ex + (z - sz) * ez) / length2),
        );
        nearest = (x - sx - t * ex) ** 2 + (z - sz - t * ez) ** 2;
      }
      distances[k] = (code & 32768 ? -1 : 1) * Math.sqrt(nearest);
      texels.set(
        [
          distances[k],
          heights[k],
          (heights[j * width + Math.min(width - 1, i + 1)] -
            heights[j * width + Math.max(0, i - 1)]) /
            (2 * dx),
          (heights[Math.min(height - 1, j + 1) * width + i] -
            heights[Math.max(0, j - 1) * width + i]) /
            (2 * dz),
        ],
        k * 4,
      );
    }
  const logo = {};
  for (const [name, keys] of Object.entries(metadata.logo)) {
    logo[name] = {};
    for (const [field, key] of Object.entries(keys))
      logo[name][field] =
        field === "indices" ? Array.from(arrays[key]) : arrays[key];
  }
  const geometry = craterGeometry({ width, height, heights });
  return {
    study: { logo },
    field: { width, height, bounds, distances, heights, texels, geometry },
  };
}

// Expand the regular grid in the worker, so the reveal only uploads buffers.
function craterGeometry({ width, height, heights }) {
  const cols = (width + 1) / 2,
    rows = (height + 1) / 2;
  const positions = new Float32Array(cols * rows * 3),
    uv = new Float32Array(cols * rows * 2),
    indices = new (cols * rows <= 65536 ? Uint16Array : Uint32Array)(
      (cols - 1) * (rows - 1) * 6,
    );
  let triangle = 0;
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const k = j * cols + i,
        u = i / (cols - 1),
        v = j / (rows - 1);
      positions.set(
        [
          -54 + 108 * u,
          -132.135 + heights[j * 2 * width + i * 2],
          -43 + 86 * v,
        ],
        k * 3,
      );
      uv.set([u, v], k * 2);
      if (i < cols - 1 && j < rows - 1) {
        indices.set(
          [k, k + 1, k + cols, k + 1, k + cols + 1, k + cols],
          triangle,
        );
        triangle += 6;
      }
    }
  return { positions, uv, indices };
}
