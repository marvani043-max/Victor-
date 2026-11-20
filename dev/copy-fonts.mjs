// Copies the self-hosted, SIL OFL-licensed webfonts into the theme's assets.
// Overpass (variable, latin) + Overpass Mono 400/600 (latin). Licence text is copied alongside.
import fs from "node:fs";
import path from "node:path";

const out = path.resolve("theme/assets");
const files = [
  ["node_modules/@fontsource-variable/overpass/files/overpass-latin-wght-normal.woff2", "overpass-latin-wght-normal.woff2"],
  ["node_modules/@fontsource/overpass-mono/files/overpass-mono-latin-400-normal.woff2", "overpass-mono-latin-400-normal.woff2"],
  ["node_modules/@fontsource/overpass-mono/files/overpass-mono-latin-600-normal.woff2", "overpass-mono-latin-600-normal.woff2"],
];
for (const [src, dest] of files) fs.copyFileSync(src, path.join(out, dest));
fs.copyFileSync("node_modules/@fontsource-variable/overpass/LICENSE", path.join(out, "license-overpass-ofl.txt"));
fs.copyFileSync("node_modules/@fontsource/overpass-mono/LICENSE", path.join(out, "license-overpass-mono-ofl.txt"));
console.log("Fonts and OFL licences copied to theme/assets");
