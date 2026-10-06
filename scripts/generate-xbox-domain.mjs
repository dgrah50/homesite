import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { TTFLoader } from "three/addons/loaders/TTFLoader.js";

const input = process.argv[2];
if (!input)
  throw new Error(
    "Usage: node scripts/generate-xbox-domain.mjs /path/to/XboxOriginalBold.ttf",
  );
const bytes = readFileSync(input);
const font = new TTFLoader().parse(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
);
let advance = 0,
  minX = Infinity,
  maxX = -Infinity,
  minY = Infinity,
  maxY = -Infinity;
const paths = [];
for (const [index, character] of [..."dayangrah.am"].entries()) {
  const glyph = font.glyphs[character];
  if (!glyph?.o) throw new Error(`Missing glyph ${character}`);
  const tokens = glyph.o.trim().split(/\s+/);
  const commands = [];
  const point = () => {
    const x = Number(tokens.shift()),
      y = Number(tokens.shift());
    minX = Math.min(minX, x + advance);
    maxX = Math.max(maxX, x + advance);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
    return `${x} ${y}`;
  };
  while (tokens.length) {
    const command = tokens.shift();
    if (command === "m" || command === "l")
      commands.push(command.toUpperCase() + point());
    else if (command === "q") {
      const end = point(),
        control = point();
      commands.push(`Q${control} ${end}`);
    } else if (command === "b") {
      const end = point(),
        a = point(),
        b = point();
      commands.push(`C${a} ${b} ${end}`);
    } else if (command === "z") commands.push("Z");
    else throw new Error(`Unknown glyph command ${command}`);
  }
  const path = `<path transform="translate(${advance} 0)" d="${commands.join(" ")}"/>`;
  paths.push(
    index < 5 ? path : path.replace("<path ", '<path fill-opacity="0.6" '),
  );
  advance += glyph.ha;
}
const sourceHash = createHash("sha256").update(bytes).digest("hex");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${maxX - minX} ${maxY - minY}"><title>dayangrah.am</title><metadata>XBOX Original © Lyric West. 2020. All Rights Reserved. Listed use: non-commercial; private use. Source SHA-256: ${sourceHash}</metadata><g fill="#fff" fill-rule="evenodd" transform="translate(${-minX} ${maxY}) scale(1 -1)">${paths.join("")}</g></svg>\n`;
writeFileSync(
  new URL("../src/assets/splash/domain-xbox.svg", import.meta.url),
  svg,
);
console.log(`Prepared Xbox domain outlines: ${Buffer.byteLength(svg)} bytes`);
