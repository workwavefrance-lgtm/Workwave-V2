/**
 * Rendu du reel "La Belgique, on arrive" → frames PNG (puis ffmpeg → MP4).
 * HTML autonome (aucune dépendance externe) chargé en file://.
 *
 * Usage : node scripts/render-reel-histoire.mjs
 * Sortie : marketing/frames-histoire/ (frames). Encoder ensuite avec ffmpeg.
 */
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import os from "os";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const HTML = "file://" + path.resolve("marketing/reel-histoire.html");
// Les images NE DOIVENT PAS etre ecrites sous ~/Desktop : ce dossier est
// synchronise par iCloud, qui recree des copies "f00419 2.png" pendant que
// le script vide le dossier. D ou l echec ENOTEMPTY du nettoyage, puis des
// videos TRONQUEES en silence (5,9 s au lieu de 14 s le 17/08 : ffmpeg
// s arrete a la premiere image manquante). Mesure du 20/08 : 644 fichiers
// dans le dossier pour 420 images reelles, soit 224 doublons iCloud.
const OUT = process.env.REEL_FRAMES_DIR || path.join(os.tmpdir(), "workwave-frames-histoire");
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
console.log(`OK : ${nFrames} frames dans ${OUT}`);
