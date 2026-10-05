import { unpackPrepared } from "./prepared-pack.mjs";
import { restoreOpening, restoreFinale } from "./prepared-visuals.mjs";

self.onmessage = ({ data: { kind, buffer } }) => {
  try {
    const packed = unpackPrepared(buffer);
    const result =
      kind === "opening" ? restoreOpening(packed) : restoreFinale(packed);
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
