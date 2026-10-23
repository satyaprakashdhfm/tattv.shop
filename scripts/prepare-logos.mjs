// Converts images/Bag logo into transparent black & white PNGs for the site.
import sharp from "sharp";

const SRC = "images/Bag logo.jpg.jpeg";
const OUT = "public/brand";

async function toTransparent(input, rgb, file) {
  const { data, info } = await sharp(input).greyscale().negate().raw().toBuffer({ resolveWithObject: true });
  // Crush near-white JPEG noise to fully transparent.
  for (let i = 0; i < data.length; i++) data[i] = data[i] < 18 ? 0 : Math.min(255, Math.round(data[i] * 1.08));
  await sharp({ create: { width: info.width, height: info.height, channels: 3, background: rgb } })
    .joinChannel(data, { raw: { width: info.width, height: info.height, channels: 1 } })
    .png()
    .toFile(`${OUT}/${file}`);
  return info;
}

const trimmed = await sharp(SRC).flatten({ background: "#fff" }).trim({ threshold: 40 }).toBuffer();
const { width, height } = await sharp(trimmed).metadata();
console.log("trimmed logo", width, height);

await toTransparent(trimmed, { r: 10, g: 10, b: 10 }, "logo-black.png");
await toTransparent(trimmed, { r: 255, g: 255, b: 255 }, "logo-white.png");

// The square monogram sits on the left; its width is ~0.86 of the logo height.
const markW = Math.round(height * 0.86);
const mark = await sharp(trimmed).extract({ left: 0, top: 0, width: markW, height }).toBuffer();
await toTransparent(mark, { r: 10, g: 10, b: 10 }, "mark-black.png");
await toTransparent(mark, { r: 255, g: 255, b: 255 }, "mark-white.png");

const pad = Math.round(height * 0.18);
await sharp(mark)
  .extend({ top: pad, bottom: pad, left: pad + Math.round((height - markW) / 2), right: pad + Math.round((height - markW) / 2), background: "#fff" })
  .resize(512, 512, { fit: "contain", background: "#fff" })
  .negate({ alpha: false })
  .png()
  .toFile("app/icon.png");
console.log("done");
