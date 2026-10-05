const MAGIC = 0x4d474744; // DGGM
const align = (n) => (n + 3) & ~3;

// Store the same Float32 values that Three.js uploads, without decimal JSON.
export function packGeometry(meshes) {
  const header = {},
    chunks = [];
  let offset = 0;
  for (const [name, mesh] of Object.entries(meshes)) {
    header[name] = {};
    for (const [field, values] of Object.entries(mesh)) {
      const type =
        field !== "indices"
          ? "f32"
          : values.every((n) => n <= 65535)
            ? "u16"
            : "u32";
      const ArrayType =
        type === "f32"
          ? Float32Array
          : type === "u16"
            ? Uint16Array
            : Uint32Array;
      const array = ArrayType.from(values);
      header[name][field] = { offset, count: array.length, type };
      chunks.push({ offset, bytes: new Uint8Array(array.buffer) });
      offset += align(array.byteLength);
    }
  }
  const metadata = new TextEncoder().encode(JSON.stringify(header));
  const start = align(8 + metadata.length);
  const bytes = new Uint8Array(start + offset),
    view = new DataView(bytes.buffer);
  view.setUint32(0, MAGIC, true);
  view.setUint32(4, metadata.length, true);
  bytes.set(metadata, 8);
  for (const chunk of chunks) bytes.set(chunk.bytes, start + chunk.offset);
  return bytes;
}

export function unpackGeometry(buffer) {
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== MAGIC)
    throw new Error("Invalid splash geometry.");
  const length = view.getUint32(4, true),
    start = align(8 + length);
  const header = JSON.parse(
    new TextDecoder().decode(new Uint8Array(buffer, 8, length)),
  );
  const meshes = {};
  for (const [name, mesh] of Object.entries(header)) {
    meshes[name] = {};
    for (const [field, { offset, count, type }] of Object.entries(mesh)) {
      const ArrayType =
        type === "f32"
          ? Float32Array
          : type === "u16"
            ? Uint16Array
            : type === "u32"
              ? Uint32Array
              : null;
      if (!ArrayType) throw new Error("Invalid splash geometry array.");
      const array = new ArrayType(buffer, start + offset, count);
      meshes[name][field] = field === "indices" ? Array.from(array) : array;
    }
  }
  return meshes;
}
