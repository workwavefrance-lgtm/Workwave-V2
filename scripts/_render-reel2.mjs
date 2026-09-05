import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const URL = "http://localhost:8877/reel-2-offerts-render.html";
const OUT = path.resolve("marketing/frames2");
const FPS = 30;

// maxRetries : sur macOS, rmSync recursif echoue par intermittence en
// ENOTEMPTY quand le dossier contient les 420 images du rendu precedent.
// C'est ce qui produisait des videos TRONQUEES en silence le 17/08 : le
// nettoyage echouait, ffmpeg s'arretait a la premiere image manquante et
// sortait une video de 5,9 s au lieu de 14 s, sans erreur.
fs.rmSync(OUT, { recursive: true, force: true, maxRetries: 20, retryDelay: 150 });
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--force-device-scale-factor=1", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
await page.goto(URL, { waitUntil: "networkidle0" });

const total = await page.evaluate(() => window.TOTAL);
const frameMs = 1000 / FPS;
const nFrames = Math.ceil(total / frameMs);
console.log(`Total ${total}ms → ${nFrames} frames @ ${FPS}fps`);

for (let i = 0; i < nFrames; i++) {
  const t = i * frameMs;
  await page.evaluate((tt) => window.renderFrame(tt), t);
  await page.screenshot({
    path: path.join(OUT, "f" + String(i).padStart(5, "0") + ".png"),
    clip: { x: 0, y: 0, width: 1080, height: 1920 },
  });
  if (i % 120 === 0) console.log(`  ${i}/${nFrames}`);
}

await browser.close();
console.log(`OK · ${nFrames} frames dans ${OUT}`);
