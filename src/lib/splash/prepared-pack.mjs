const MAGIC = 0x31504744; // DGP1
const types = {
  u8: Uint8Array,
  u16: Uint16Array,
  u32: Uint32Array,
  f32: Float32Array,
  f64: Float64Array,
};
const align = (n) => Math.ceil(n / 8) * 8;

// Preserve the source precision, including doubles used by blob deformation.
export function packPrepared(metadata, arrays) {
  const header = { metadata, arrays: {} },
    chunks = [];
  let offset = 0;
  for (const [name, array] of Object.entries(arrays)) {
    const type = Object.keys(types).find(
      (key) => array.constructor === types[key],
    );
    if (!type) throw new Error("Unsupported prepared array.");
    const bytes = new Uint8Array(
      array.buffer,
      array.byteOffset,
      array.byteLength,
    );
    const shared = chunks.find(
      (chunk) =>
        chunk.bytes.length === bytes.length &&
        bytes.every((value, i) => value === chunk.bytes[i]),
    );
    header.arrays[name] = {
      type,
      offset: shared?.offset ?? offset,
      count: array.length,
    };
    if (!shared) {
      chunks.push({ offset, bytes });
      offset += align(array.byteLength);
    }
  }
  const json = new TextEncoder().encode(JSON.stringify(header)),
    start = align(8 + json.length);
  const bytes = new Uint8Array(start + offset),
    view = new DataView(bytes.buffer);
  view.setUint32(0, MAGIC, true);
  view.setUint32(4, json.length, true);
  bytes.set(json, 8);
  for (const chunk of chunks) bytes.set(chunk.bytes, start + chunk.offset);
  return bytes;
}

export function unpackPrepared(buffer) {
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== MAGIC)
    throw new Error("Invalid prepared splash asset.");
  const length = view.getUint32(4, true),
    start = align(8 + length);
  const { metadata, arrays: header } = JSON.parse(
    new TextDecoder().decode(new Uint8Array(buffer, 8, length)),
  );
  const arrays = {};
  for (const [name, { type, offset, count }] of Object.entries(header)) {
    if (!types[type]) throw new Error("Invalid prepared splash array.");
    arrays[name] = new types[type](buffer, start + offset, count);
  }
  return { metadata, arrays };
}

// A reversible two-dimensional byte predictor keeps smooth texture planes small.
export function predictPlane(pixels, width) {
  return Uint8Array.from(
    pixels,
    (value, i) =>
      value -
      (i % width ? pixels[i - 1] : 0) -
      (i >= width ? pixels[i - width] : 0) +
      (i >= width && i % width ? pixels[i - width - 1] : 0),
  );
}
export function restorePlane(bytes, width) {
  const pixels = new Uint8Array(bytes.length);
  for (let i = 0; i < pixels.length; i++)
    pixels[i] =
      bytes[i] +
      (i % width ? pixels[i - 1] : 0) +
      (i >= width ? pixels[i - width] : 0) -
      (i >= width && i % width ? pixels[i - width - 1] : 0);
  return pixels;
}

export function predictRow(pixels, width) {
  return Uint8Array.from(
    pixels,
    (value, i) => value - (i % width ? pixels[i - 1] : 0),
  );
}
export function restoreRow(bytes, width) {
  const pixels = new Uint8Array(bytes.length);
  for (let i = 0; i < pixels.length; i++)
    pixels[i] = bytes[i] + (i % width ? pixels[i - 1] : 0);
  return pixels;
}

// Integer differences wrap in the source index type; no precision is discarded.
export function predictIndices(indices) {
  return indices.map((value, i) => value - (i ? indices[i - 1] : 0));
}
export function restoreIndices(bytes) {
  const indices = bytes.slice();
  for (let i = 1; i < indices.length; i++) indices[i] += indices[i - 1];
  return indices;
}

// Share the mirrored quarter's float bits, retaining every asymmetric bit as an
// XOR residual. Byte planes let gzip compress the long runs of equal exponents.
export function predictHeights(heights, width, height) {
  const bits = new Uint32Array(
    heights.buffer,
    heights.byteOffset,
    heights.length,
  );
  const bytes = new Uint8Array(heights.byteLength);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const source =
        Math.min(y, height - 1 - y) * width + Math.min(x, width - 1 - x);
      const residual = i === source ? bits[i] : bits[i] ^ bits[source];
      for (let c = 0; c < 4; c++)
        bytes[c * heights.length + i] = residual >>> (c * 8);
    }
  return bytes;
}
export function restoreHeights(bytes, width, height) {
  const count = width * height,
    bits = new Uint32Array(count);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      let residual = 0;
      for (let c = 0; c < 4; c++) residual |= bytes[c * count + i] << (c * 8);
      const source =
        Math.min(y, height - 1 - y) * width + Math.min(x, width - 1 - x);
      bits[i] = i === source ? residual : residual ^ bits[source];
    }
  return new Float32Array(bits.buffer);
}

// Source-order square/diamond prediction removes interpolated pixels from the
// download. Restoration uses integer averages, without random noise generation.
function intensityPrediction(pixels, size, restore) {
  const output = new Uint8Array(pixels.length);
  output[0] = pixels[0];
  let half = size >> 1,
    x = half,
    y = half,
    step = size,
    square = true,
    second = false;
  const source = restore ? output : pixels;
  const at = (x, y) => source[((y + size) % size) * size + ((x + size) % size)];
  while (half > 0) {
    const average = square
      ? (at(x - half, y - half) +
          at(x + half, y - half) +
          at(x - half, y + half) +
          at(x + half, y + half)) >>
        2
      : (at(x, y - half) +
          at(x, y + half) +
          at(x - half, y) +
          at(x + half, y)) >>
        2;
    const i = y * size + x;
    output[i] = restore ? pixels[i] + average : pixels[i] - average;
    x += step;
    if (x >= size) {
      y += step;
      if (y >= size) {
        if (square) {
          x = half;
          y = 0;
          square = false;
          continue;
        }
        if (second) {
          step = half;
          half >>= 1;
          x = y = half;
          square = true;
        } else {
          x = 0;
          y = half;
        }
        second = !second;
        continue;
      }
      x = square ? half : second ? 0 : half;
    }
  }
  return output;
}
export const predictIntensity = (pixels, size) =>
  intensityPrediction(pixels, size, false);
export const restoreIntensity = (pixels, size) =>
  intensityPrediction(pixels, size, true);
