import { loadCompressed } from "./compressed.mjs";
import { unpackPrepared } from "./prepared-pack.mjs";
import { restoreOpening, restoreFinale } from "./prepared-visuals.mjs";

// Native decompression and linear expansion run away from the rendering thread.
self.onmessage = async ({ data: { kind, url, buffer } }) => {
  try {
    let result;
    if (kind === "finale" && url?.endsWith(".json")) {
      const [{ craterField }, response] = await Promise.all([
        import("./crater-field.mjs"),
        fetch(url),
      ]);
      if (!response.ok) throw new Error("Splash finale failed to load.");
      const study = await response.json();
      result = { study, field: craterField(study.polygons) };
    } else {
      const packed = unpackPrepared(buffer || (await loadCompressed(url)));
      result =
        kind === "opening" ? restoreOpening(packed) : restoreFinale(packed);
    }
    const buffers = new Set();
    const visit = (value) => {
      if (ArrayBuffer.isView(value)) buffers.add(value.buffer);
      else if (value && typeof value === "object")
        for (const item of Object.values(value)) visit(item);
    };
    visit(result);
    self.postMessage(result, [...buffers]);
  } catch (error) {
    self.postMessage({ error: String(error) });
  }
};
