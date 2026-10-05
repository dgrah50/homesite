import {
  packPrepared,
  unpackPrepared,
  predictIndices,
  restoreIndices,
} from "./prepared-pack.mjs";

// Chamber meshes share the same lossless packet format as the prepared visuals.
export function packGeometry(meshes) {
  const metadata = { meshes: {} },
    arrays = {};
  for (const [name, mesh] of Object.entries(meshes)) {
    metadata.meshes[name] = {};
    for (const [field, values] of Object.entries(mesh)) {
      const key = `${name}_${field}`;
      arrays[key] =
        field === "indices"
          ? predictIndices(
              (values.every((value) => value <= 65535)
                ? Uint16Array
                : Uint32Array
              ).from(values),
            )
          : Float32Array.from(values);
      metadata.meshes[name][field] = key;
    }
  }
  return packPrepared(metadata, arrays);
}

export function unpackGeometry(buffer) {
  const { metadata, arrays } = unpackPrepared(buffer),
    meshes = {};
  for (const [name, fields] of Object.entries(metadata.meshes)) {
    meshes[name] = {};
    for (const [field, key] of Object.entries(fields))
      meshes[name][field] =
        field === "indices"
          ? Array.from(restoreIndices(arrays[key]))
          : arrays[key];
  }
  return meshes;
}
