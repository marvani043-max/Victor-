// Builds responsive WebP images from the original Peak Side photo files.
// Usage: SRC=/path/to/originals npm run images
// Originals are named by their Wix media id prefix (e.g. 4e247516.jpg).
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SRC = process.env.SRC;
if (!SRC) {
  console.error("Set SRC to the folder holding the original images.");
  process.exit(1);
}
const OUT = path.resolve("public/images");
const MANIFEST = path.resolve("src/data/image-manifest.json");
fs.mkdirSync(OUT, { recursive: true });

// name: [source id, kind]. "studio" = product cut-out on white, "photo" = everything else.
const MAP = {
  // Campaign: trail
  "trail-falls-front": ["4e247516", "photo"],
  "trail-falls-back": ["49050a77", "photo"],
  "trail-falls-wide": ["3a99c8f1", "photo"],
  "trail-falls-rock": ["4bda614f", "photo"],
  "trail-falls-duo": ["123c3cd2", "photo"],
  "trail-path": ["4df96784", "photo"],
  "trail-ridge": ["bb87405a", "photo"],
  "trail-overlook": ["e1634e33", "photo"],
  // Campaign: tunnel
  "tunnel-crew": ["ae98079f", "photo"],
  "tunnel-pink-hoodie": ["226cd63e", "photo"],
  "tunnel-crop-duo": ["ba58e771", "photo"],
  "tunnel-crop-duo-2": ["462c9a3f", "photo"],
  "tunnel-crop-sit": ["c2405541", "photo"],
  "tunnel-zip-black": ["ce6b246c", "photo"],
  "tunnel-zip-black-2": ["248fb641", "photo"],
  "tunnel-zip-navy": ["aa938bae", "photo"],
  "tunnel-zip-navy-2": ["f31d30a2", "photo"],
  "tunnel-zip-grey": ["946ddfe7", "photo"],
  "tunnel-tee-black-front": ["7a9fbc4c", "photo"],
  "tunnel-tee-black-back": ["c7812b48", "photo"],
  "tunnel-tee-white-back": ["e323fe9b", "photo"],
  "tunnel-tee-white-back-2": ["02bc4e38", "photo"],
  "tunnel-tee-white-back-3": ["bc22474b", "photo"],
  "tunnel-crop-white": ["7968c4c8", "photo"],
  "tunnel-crop-white-2": ["f9e43210", "photo"],
  "tunnel-crop-white-3": ["5f5800e7", "photo"],
  "tunnel-crop-black": ["2f0175c6", "photo"],
  "tunnel-crop-black-2": ["3b3e46c6", "photo"],
  "tunnel-crop-black-3": ["847e038b", "photo"],
  "night-boxy-trio": ["012a2ce4", "photo"],
  "portrait-tee-black": ["c2bf0da5", "photo"],
  "portrait-tee-black-2": ["38a215bd", "photo"],
  // Details
  "detail-graphic-black": ["ae1389c6", "photo"],
  "detail-graphic-black-2": ["c4669276", "photo"],
  "detail-pks-navy": ["02cf65b5", "photo"],
  "detail-pks-darkgrey": ["5ae7a494", "photo"],
  "detail-pks-grey": ["619c64c4", "photo"],
  // Product: faded hoodie, front logo
  "hoodie-faded-black-front": ["403e319d", "studio"],
  "hoodie-faded-black-back": ["a3c60613", "studio"],
  "hoodie-faded-pink-front": ["20f5186e", "studio"],
  "hoodie-faded-pink-alt": ["8e3963c6", "studio"],
  // Product: faded hoodie, both sides
  "hoodie-both-black-front": ["b5a83e67", "studio"],
  "hoodie-both-black-back": ["6df54483", "studio"],
  "hoodie-both-pink-front": ["75530eed", "studio"],
  // Product: double zip hoodie
  "zip-grey-front": ["37c90b6c", "studio"],
  "zip-grey-back": ["00588874", "studio"],
  "zip-black-front": ["589ffd97", "studio"],
  "zip-black-back": ["6668856b", "studio"],
  "zip-navy-front": ["c8ffe324", "studio"],
  "zip-navy-back": ["de210c5e", "studio"],
  // Product: flat-lays
  "globe-front": ["276d7fbf", "photo"],
  "globe-back": ["693d7e0e", "photo"],
  "crew-front": ["408eb3d0", "photo"],
  "crew-back": ["39241450", "photo"],
  "zipup-navy-flat": ["07cc82e3", "photo"],
  "zipup-navy-flat-2": ["19b0b68f", "photo"],
  "zipup-grey-flat": ["eb17ab4c", "photo"],
  "zipup-grey-flat-2": ["38ef8b9f", "photo"],
  "zipup-darkgrey-flat": ["df17dc02", "photo"],
  "zipup-darkgrey-flat-2": ["f21449ec", "photo"],
  "tee-black-boxy-flat": ["678746ae", "photo"],
  "tee-black-boxy-flat-2": ["d88e299f", "photo"],
  "tee-black-flat": ["8158d37a", "photo"],
  "tee-black-flat-2": ["e4f7b588", "photo"],
  // Product: studio tees & crops
  "tee-black-front": ["8176f07b", "studio"],
  "tee-black-alt": ["41fb958b", "studio"],
  "tee-black-boxy-front": ["71ab48a6", "studio"],
  "tee-black-boxy-alt": ["49f311eb", "studio"],
  "tee-white-front": ["ba03dfd5", "studio"],
  "tee-white-back": ["9aa0a000", "studio"],
  "tee-white-boxy-front": ["55863e94", "studio"],
  "tee-white-boxy-back": ["28602fdf", "studio"],
  "crop-black-front": ["16c00348", "studio"],
  "crop-black-plain": ["ed1567ff", "studio"],
  "crop-white-front": ["2a0af473", "studio"],
  "crop-white-plain": ["05718d81", "studio"],
  "crop-grey-front": ["066f2888", "studio"],
  "crop-grey-back": ["c768e371", "studio"],
  // Winter drop (white-background photos supplied Nov 2026)
  "winter-hoodie-pink-front": ["0e1d0001", "studio"],
  "winter-hoodie-grey-front": ["0e1d0002", "studio"],
  "winter-pants-grey-front": ["0e1d0003", "studio"],
  "winter-pants-grey-back": ["0e1d0004", "studio"],
  "winter-pants-pink-front": ["0e1d0005", "studio"],
  "winter-pants-pink-back": ["0e1d0006", "studio"],
  // Brand marks
  "mark-pks": ["58fd8b0f", "mark"],
  "mark-blossom": ["c04fbb39", "mark"],
};

const WIDTHS = [480, 960, 1600];
const files = fs.readdirSync(SRC);
// Merge into the existing manifest so entries added by other scripts (e.g. "-cut") are kept.
const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};

for (const [name, [id, kind]] of Object.entries(MAP)) {
  const file = files.find((f) => f.startsWith(id));
  if (!file) {
    console.warn("missing", name, id);
    continue;
  }
  const input = sharp(path.join(SRC, file)).rotate();
  const meta = await input.metadata();
  const widths = WIDTHS.filter((w) => w < meta.width).concat(
    meta.width <= 1600 ? [meta.width] : []
  );
  const uniq = [...new Set(widths.length ? widths : [meta.width])];
  for (const w of uniq) {
    const out = path.join(OUT, `${name}-${w}.webp`);
    if (!fs.existsSync(out) || process.env.FORCE === kind || process.env.FORCE === "all") {
      let img = sharp(path.join(SRC, file)).rotate().resize({ width: w });
      // Studio cut-outs: push near-white to pure white so compression doesn't leave a faint box
      // when the image is multiplied onto a tinted card.
      if (kind === "studio") img = img.linear(1.025, 0);
      await img.webp({ quality: kind === "mark" ? 90 : 76, alphaQuality: 90, smartSubsample: true }).toFile(out);
    }
  }
  // Tiny blurred placeholder colour for photos
  const { dominant } = await sharp(path.join(SRC, file)).stats();
  manifest[name] = {
    w: meta.width,
    h: meta.height,
    kind,
    widths: uniq,
    color: `rgb(${dominant.r},${dominant.g},${dominant.b})`,
  };
}
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1));
console.log("processed", Object.keys(manifest).length, "images");
