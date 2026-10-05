import geometryUrl from "../../assets/splash/retail-geometry.bin.gz?url";
import { loadCompressed } from "./compressed.mjs";
import { unpackGeometry } from "./geometry-pack.mjs";

export async function loadGeometry(signal) {
  return unpackGeometry(await loadCompressed(geometryUrl, signal));
}
