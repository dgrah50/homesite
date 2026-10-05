import openingUrl from "../../assets/splash/opening.bin.gz?url";
import { prepareVisuals } from "./prepared.mjs";

export function prepareOpening(signal) {
  return prepareVisuals(signal, { kind: "opening", url: openingUrl });
}
