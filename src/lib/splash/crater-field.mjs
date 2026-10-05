const smooth = (t) => {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
};
const distance2 = (x, z, s) => {
  const t = Math.max(
    0,
    Math.min(1, ((x - s.x) * s.dx + (z - s.z) * s.dz) / s.length2),
  );
  return (x - s.x - t * s.dx) ** 2 + (z - s.z - t * s.dz) ** 2;
};

// A single rounded height field, not scaled copies of the contour. Distance to
// both the outside edge and the counter controls one continuous recessed bowl.
export function craterField(polygons, { width = 513, height = 409 } = {}) {
  const bounds = { x0: -54, x1: 54, z0: -43, z1: 43 },
    dx = 108 / (width - 1),
    dz = 86 / (height - 1);
  const segments = polygons.flatMap((p) =>
    p.flatMap((r) =>
      r.slice(0, -1).flatMap(([x, z], i) => {
        const [xx, zz] = r[i + 1],
          length2 = (xx - x) ** 2 + (zz - z) ** 2;
        return length2 > 1e-16
          ? [{ x, z, dx: xx - x, dz: zz - z, length2 }]
          : [];
      }),
    ),
  );
  const cell = 6,
    nx = Math.ceil(108 / cell),
    nz = Math.ceil(86 / cell),
    bins = Array.from({ length: nx * nz }, () => []);
  for (const s of segments) {
    const minX = Math.max(
      0,
      Math.floor((Math.min(s.x, s.x + s.dx) + 54) / cell),
    );
    const maxX = Math.min(
      nx - 1,
      Math.floor((Math.max(s.x, s.x + s.dx) + 54) / cell),
    );
    const minZ = Math.max(
      0,
      Math.floor((Math.min(s.z, s.z + s.dz) + 43) / cell),
    );
    const maxZ = Math.min(
      nz - 1,
      Math.floor((Math.max(s.z, s.z + s.dz) + 43) / cell),
    );
    for (let j = minZ; j <= maxZ; j++)
      for (let i = minX; i <= maxX; i++) bins[j * nx + i].push(s);
  }
  const distances = new Float32Array(width * height),
    raw = new Float32Array(width * height);
  for (let j = 0; j < height; j++) {
    const z = bounds.z0 + j * dz;
    const cuts = segments
      .flatMap((s) =>
        (s.z <= z && s.z + s.dz > z) || (s.z + s.dz <= z && s.z > z)
          ? [s.x + (s.dx * (z - s.z)) / s.dz]
          : [],
      )
      .sort((a, b) => a - b);
    let cut = 0;
    for (let i = 0; i < width; i++) {
      const x = bounds.x0 + i * dx,
        k = j * width + i;
      while (cut < cuts.length && cuts[cut] <= x) cut++;
      const inside = cut % 2 === 1,
        bx = Math.floor((x + 54) / cell),
        bz = Math.floor((z + 43) / cell),
        radius = inside ? 2 : 1;
      let nearest = 1024;
      for (
        let yy = Math.max(0, bz - radius);
        yy <= Math.min(nz - 1, bz + radius);
        yy++
      )
        for (
          let xx = Math.max(0, bx - radius);
          xx <= Math.min(nx - 1, bx + radius);
          xx++
        )
          for (const s of bins[yy * nx + xx])
            nearest = Math.min(nearest, distance2(x, z, s));
      const d = Math.sqrt(nearest);
      distances[k] = inside ? d : -d;
      // The narrow six-unit join needs a shallower sill at the authored oblique
      // camera angle; otherwise its front rim hides the luminous connection.
      const sill = 1 - 0.65 * Math.exp(-((x / 5.5) ** 2 + (z / 7) ** 2));
      raw[k] = inside ? 32 * (1 - Math.exp((-d * d) / 10.5)) * sill : 0;
    }
  }
  // Smooth the medial-axis ridge as well as the slopes. Keeping the boundary
  // flat preserves the exact monogram outline and black counter islands.
  const sigma = 0.55 / dx,
    radius = Math.ceil(sigma * 3),
    kernel = Array.from({ length: 2 * radius + 1 }, (_, i) =>
      Math.exp(-0.5 * ((i - radius) / sigma) ** 2),
    );
  const sum = kernel.reduce((a, b) => a + b);
  for (let i = 0; i < kernel.length; i++) kernel[i] /= sum;
  const temp = new Float32Array(raw.length),
    heights = new Float32Array(raw.length);
  for (let j = 0; j < height; j++)
    for (let i = 0; i < width; i++) {
      let value = 0;
      for (let d = -radius; d <= radius; d++)
        value +=
          raw[j * width + Math.max(0, Math.min(width - 1, i + d))] *
          kernel[d + radius];
      temp[j * width + i] = value;
    }
  for (let j = 0; j < height; j++)
    for (let i = 0; i < width; i++) {
      let value = 0;
      for (let d = -radius; d <= radius; d++)
        value +=
          temp[Math.max(0, Math.min(height - 1, j + d)) * width + i] *
          kernel[d + radius];
      const k = j * width + i;
      heights[k] = value * smooth(distances[k] / 0.75);
    }
  const texels = new Float32Array(width * height * 4);
  for (let j = 0; j < height; j++)
    for (let i = 0; i < width; i++) {
      const k = j * width + i;
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
  return { width, height, bounds, distances, heights, texels };
}
