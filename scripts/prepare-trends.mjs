// Crops images/trend-1..3 to 3:4 and saves them as public/images/trends/trend-N.jpg for the "Style Your Element" panels.
// Usage: node scripts/prepare-trends.mjs   (accepts .png, .jpg, .jpeg or .webp sources)
import fs from "node:fs";
import sharp from "sharp";

const OUT = "public/images/trends";
fs.mkdirSync(OUT, { recursive: true });

for (const n of [1, 2, 3]) {
  const src = fs.readdirSync("images").find((f) => new RegExp(`^trend-${n}\\.(png|jpe?g|webp)$`, "i").test(f));
  if (!src) {
    console.warn(`images/trend-${n}.* not found, skipped`);
    continue;
  }
  const { width, height } = await sharp(`images/${src}`).metadata();
  const w = Math.min(width, Math.round((height * 3) / 4));
  const h = Math.round((w * 4) / 3);
  const info = await sharp(`images/${src}`)
    .extract({ left: Math.round((width - w) / 2), top: Math.round((height - h) / 2), width: w, height: h })
    .resize({ width: Math.min(w, 1500), kernel: "lanczos3" })
    .jpeg({ quality: 88, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(`${OUT}/trend-${n}.jpg`);
  console.log(`trend-${n}: ${src} ${width}x${height} -> ${info.width}x${info.height}`);
}
