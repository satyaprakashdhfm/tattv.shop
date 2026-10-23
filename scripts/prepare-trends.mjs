// Crops the "Style Your Element" model photos to 3:4 portraits (full height, no upscaling)
// and saves them as public/images/trends/trend-N.jpg. Focus/inset boxes in lib/trends.ts are
// fractions of these crops, so re-check them if a crop offset changes.
// Usage: node scripts/prepare-trends.mjs
import fs from "node:fs";
import sharp from "sharp";

const OUT = "public/images/trends";
// [output number, source in images/, left edge of the crop in source pixels]
const CROPS = [
  [1, "person_chain.png", 400],
  [2, "person_ring.png", 380],
  [3, "person_bracelet.png", 300],
];

fs.mkdirSync(OUT, { recursive: true });
for (const [n, src, left] of CROPS) {
  const { width, height } = await sharp(`images/${src}`).metadata();
  const w = Math.min(width, Math.round((height * 3) / 4));
  const info = await sharp(`images/${src}`)
    .extract({ left: Math.min(left, width - w), top: 0, width: w, height })
    .jpeg({ quality: 90, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(`${OUT}/trend-${n}.jpg`);
  console.log(`trend-${n}: ${src} ${width}x${height} -> ${info.width}x${info.height}, ${Math.round(info.size / 1024)}KB`);
}
