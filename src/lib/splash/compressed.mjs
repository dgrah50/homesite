export async function loadCompressed(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("Prepared splash asset failed to load.");
  const bytes = await response.arrayBuffer();
  const magic = new Uint8Array(bytes, 0, Math.min(2, bytes.byteLength));
  // Some hosts apply Content-Encoding and return an already decoded response.
  const buffer =
    magic[0] === 0x1f && magic[1] === 0x8b
      ? await new Response(
          new Blob([bytes])
            .stream()
            .pipeThrough(new DecompressionStream("gzip")),
        ).arrayBuffer()
      : bytes;
  signal?.throwIfAborted();
  return buffer;
}
