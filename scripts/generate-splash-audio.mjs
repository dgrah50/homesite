import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { encodeWav, renderAudio } from "../src/lib/splash/audio-engine.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const inputs = [
  "public/splash/retail-audio.json",
  "src/lib/splash/audio-engine.mjs",
  "src/lib/splash/audio-filter.mjs",
];
const sourceHash = createHash("sha256");
for (const path of inputs) sourceHash.update(readFileSync(join(root, path)));
const rendered = renderAudio(JSON.parse(readFileSync(join(root, inputs[0]))));
const wav = encodeWav(rendered);
const temp = mkdtempSync(join(tmpdir(), "dg-boot-audio-"));
try {
  const input = join(temp, "boot.wav");
  writeFileSync(input, wav);
  const files = {};
  for (const [name, codec] of [
    ["boot.ogg", ["-c:a", "libopus", "-b:a", "96k"]],
    ["boot.m4a", ["-c:a", "aac", "-b:a", "128k"]],
  ]) {
    const output = join(root, "src/assets/splash", name);
    execFileSync(process.env.FFMPEG || "ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      input,
      "-map_metadata",
      "-1",
      "-fflags",
      "+bitexact",
      ...codec,
      output,
    ]);
    const bytes = readFileSync(output);
    files[name] = {
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
  }
  writeFileSync(
    join(root, "src/assets/splash/audio-manifest.json"),
    JSON.stringify(
      {
        sourceSha256: sourceHash.digest("hex"),
        pcm16Sha256: createHash("sha256").update(wav).digest("hex"),
        duration: rendered.duration,
        sampleRate: rendered.sampleRate,
        files,
      },
      null,
      2,
    ) + "\n",
  );
  console.log("Prepared splash audio:", files);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
