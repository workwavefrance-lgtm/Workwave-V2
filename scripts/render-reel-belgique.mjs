/**
 * Rendu du reel "La Belgique, on arrive" → frames PNG (puis ffmpeg → MP4).
 * HTML autonome (aucune dépendance externe) chargé en file://.
 *
 * Usage : node scripts/render-reel-belgique.mjs
 * Sortie : marketing/frames-belgique/ (frames). Encoder ensuite avec ffmpeg.
 */
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const HTML = "file://" + path.resolve("marketing/reel-belgique.html");
const OUT = path.resolve("marketing/frames-belgique");
const FPS = 30;

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--force-device-scale-factor=1", "--hide-scrollbars", "--force-color-profile=srgb"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
await page.goto(HTML, { waitUntil: "networkidle0" });
await page.evaluate(async () => { if (document.fonts && document.fonts.ready) await document.fonts.ready; });

const total = await page.evaluate(() => window.TOTAL);
const frameMs = 1000 / FPS;
const nFrames = Math.ceil(total / frameMs);
console.log(`Total ${total}ms → ${nFrames} frames @ ${FPS}fps`);

for (let i = 0; i < nFrames; i++) {
  await page.evaluate((tt) => window.renderFrame(tt), i * frameMs);
  await page.screenshot({
    path: path.join(OUT, "f" + String(i).padStart(5, "0") + ".png"),
    clip: { x: 0, y: 0, width: 1080, height: 1920 },
  });
  if (i % 60 === 0) console.log(`  ${i}/${nFrames}`);
}
await browser.close();
console.log(`OK — ${nFrames} frames dans ${OUT}`);
