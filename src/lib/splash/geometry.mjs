import geometryUrl from "../../assets/splash/retail-geometry.bin.gz?url";
import { unpackGeometry } from "./geometry-pack.mjs";

export async function loadGeometry(signal) {
  const packed = typeof DecompressionStream === "function";
  const response = await fetch(
    packed ? geometryUrl : "/splash/retail-geometry.json",
    { signal },
  );
  if (!response.ok) throw new Error("Splash geometry failed to load.");
  if (!packed) return response.json();
  const bytes = await response.arrayBuffer();
  const magic = new Uint8Array(bytes, 0, Math.min(2, bytes.byteLength));
  // A host may already have decompressed the file through HTTP Content-Encoding.
  const buffer =
    magic[0] === 0x1f && magic[1] === 0x8b
      ? await new Response(
          new Blob([bytes])
            .stream()
            .pipeThrough(new DecompressionStream("gzip")),
        ).arrayBuffer()
      : bytes;
  signal.throwIfAborted();
  return unpackGeometry(buffer);
}
