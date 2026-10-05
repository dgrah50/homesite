import geometryUrl from "../../assets/splash/retail-geometry.bin.gz?url";
import { loadCompressed } from "./compressed.mjs";
import { unpackGeometry } from "./geometry-pack.mjs";

export async function loadGeometry(signal) {
  const packed = typeof DecompressionStream === "function";
  if (packed) return unpackGeometry(await loadCompressed(geometryUrl, signal));
  const response = await fetch("/splash/retail-geometry.json", { signal });
  if (!response.ok) throw new Error("Splash geometry failed to load.");
  return response.json();
}
