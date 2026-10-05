import openingUrl from "../../assets/splash/opening.bin.gz?url";
import { loadCompressed } from "./compressed.mjs";
import { prepareVisuals } from "./finale.mjs";

export function prepareOpening(signal) {
  return typeof DecompressionStream === "function"
    ? prepareVisuals(
        signal,
        { kind: "opening", url: openingUrl },
        undefined,
        loadCompressed,
      )
    : Promise.resolve(null);
}
