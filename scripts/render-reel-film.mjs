/**
 * Rendu du reel 3D → images PNG (puis ffmpeg → MP4).
 *
 *   node scripts/render-reel-3d.mjs [--apercu t1,t2,...]
 *
 * Pre-requis : serveur local `python3 -m http.server 8877 --directory marketing`.
 *
 * La scene est DETERMINISTE : window.renderFrame(t) fixe entierement l etat a
 * l instant t, aucune horloge reelle n intervient. Deux rendus successifs
 * donnent donc des images identiques, ce qui permet de reprendre un rendu
 * interrompu et de comparer avant/apres une modification.
 *
 * WebGL sans interface : on force ANGLE + SwiftShader. Le rendu logiciel est
 * lent mais fonctionne partout et donne exactement le meme resultat d une
 * machine a l autre, contrairement au GPU.
 */
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import os from "os";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FPS = 30;
// Jamais sous ~/Desktop : iCloud y recree des copies "f00419 2.png" pendant
// que le script vide le dossier, ce qui a deja produit des videos tronquees
// en silence (ffmpeg s arrete a la premiere image manquante).
const OUT = process.env.REEL_FRAMES_DIR || path.join(os.tmpdir(), "workwave-frames-film");

const argApercu = process.argv.indexOf("--apercu");
const apercus = argApercu > -1 ? (process.argv[argApercu + 1] || "").split(",").map(Number) : null;

if (!apercus) {
  fs.rmSync(OUT, { recursive: true, force: true, maxRetries: 20, retryDelay: 150 });
}
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: [
    "--no-sandbox",
    "--force-device-scale-factor=1",
    "--hide-scrollbars",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--disable-gpu-sandbox",
    "--ignore-gpu-blocklist",
  ],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("  erreur page :", e.message));
page.on("console", (m) => { if (m.type() === "error") console.error("  console :", m.text()); });
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
await page.goto("http://localhost:8877/reel-film-render.html", { waitUntil: "networkidle0" });

// La police 3D et l environnement se chargent en differe : sans cette attente
// on capturerait des images vides.
await page.waitForFunction(() => window.PRET === true, { timeout: 120000 });

const total = await page.evaluate(() => window.TOTAL);

if (apercus) {
  for (const ms of apercus) {
    await page.evaluate((t) => window.renderFrame(t), ms);
    const f = path.join(OUT, "apercu-" + String(ms).padStart(5, "0") + ".png");
    await page.screenshot({ path: f, clip: { x: 0, y: 0, width: 1080, height: 1920 } });
    console.log("  apercu " + ms + " ms → " + f);
  }
  await browser.close();
  process.exit(0);
}

const nFrames = Math.ceil(total / (1000 / FPS));
console.log(`reel 3D · ${total}ms → ${nFrames} images`);
const debut = Date.now();
for (let i = 0; i < nFrames; i++) {
  await page.evaluate((tt) => window.renderFrame(tt), i * (1000 / FPS));
  await page.screenshot({
    path: path.join(OUT, "f" + String(i).padStart(5, "0") + ".png"),
    clip: { x: 0, y: 0, width: 1080, height: 1920 },
  });
  if (i % 30 === 0 && i > 0) {
    const parSec = i / ((Date.now() - debut) / 1000);
    const reste = Math.round((nFrames - i) / parSec);
    console.log(`  ${i}/${nFrames} · ${parSec.toFixed(1)} img/s · reste ~${reste}s`);
  }
}
await browser.close();
console.log(`OK · ${nFrames} frames dans ${OUT}`);
// Chrome garde parfois la boucle d evenements de Node en vie apres close().
process.exit(0);
