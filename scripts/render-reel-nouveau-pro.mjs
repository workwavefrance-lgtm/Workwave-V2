/**
 * Rendu d'un reel "Nouveau pro" (remerciement + mise en avant) → frames PNG.
 *
 * Usage :
 *   node scripts/render-reel-nouveau-pro.mjs marketing/nouveaux-pros/<slug>.json
 *
 * Le JSON :
 *   { "slug": "couvreur-valdoie", "theme": "light"|"dark", "metier": "Couvreur",
 *     "ville": "Valdoie", "dept": "Territoire de Belfort (90)",
 *     "sonMetier": "son couvreur", "unMetier": "un couvreur",
 *     "secteur": "Il intervient dans tout le secteur." }
 *
 * RÈGLE ABSOLUE : JAMAIS le nom du pro, ni aucune de ses coordonnées.
 * Le reel met en avant un MÉTIER dans une VILLE, pas une personne. Le pro
 * n'a jamais demandé à être exposé publiquement.
 *
 * `sonMetier` / `unMetier` sont fournis à la main pour éviter toute faute de
 * genre ("son couvreur" mais "sa femme de ménage") : on ne devine pas.
 *
 * Pré-requis : serveur local `python3 -m http.server 8877 --directory marketing`.
 * Sortie : marketing/frames-nouveau-pro/, encoder ensuite avec ffmpeg.
 */
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import os from "os";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const dataPath = process.argv[2];
if (!dataPath) { console.error("Usage: node scripts/render-reel-nouveau-pro.mjs <pro.json>"); process.exit(1); }
const pro = JSON.parse(fs.readFileSync(dataPath, "utf8"));
if (!pro.slug || !pro.metier || !pro.ville) { console.error("JSON invalide: slug + metier + ville requis"); process.exit(1); }

// Garde-fou anti-PII : un champ qui ressemble a une identite = on refuse.
for (const k of ["nom", "name", "gerant", "email", "phone", "telephone", "siret"]) {
  if (pro[k]) { console.error(`JSON refuse: le champ "${k}" expose le pro. Metier + ville uniquement.`); process.exit(1); }
}

fs.writeFileSync(
  path.resolve("marketing/reel-nouveau-pro-data.js"),
  "window.PRO = " + JSON.stringify(pro, null, 2) + ";\n"
);

// Les images NE DOIVENT PAS etre ecrites sous ~/Desktop : ce dossier est
// synchronise par iCloud, qui recree des copies "f00419 2.png" pendant que
// le script vide le dossier. D ou l echec ENOTEMPTY du nettoyage, puis des
// videos TRONQUEES en silence (5,9 s au lieu de 14 s le 17/08 : ffmpeg
// s arrete a la premiere image manquante). Mesure du 20/08 : 644 fichiers
// dans le dossier pour 420 images reelles, soit 224 doublons iCloud.
const OUT = process.env.REEL_FRAMES_DIR || path.join(os.tmpdir(), "workwave-frames-nouveau-pro");
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
await page.goto("http://localhost:8877/reel-nouveau-pro-render.html", { waitUntil: "networkidle0" });

const total = await page.evaluate(() => window.TOTAL);
const nFrames = Math.ceil(total / (1000 / FPS));
console.log(`[${pro.slug}] theme=${pro.theme} · ${total}ms → ${nFrames} frames`);

for (let i = 0; i < nFrames; i++) {
  await page.evaluate((tt) => window.renderFrame(tt), i * (1000 / FPS));
  await page.screenshot({
    path: path.join(OUT, "f" + String(i).padStart(5, "0") + ".png"),
    clip: { x: 0, y: 0, width: 1080, height: 1920 },
  });
  if (i % 150 === 0) console.log(`  ${i}/${nFrames}`);
}
await browser.close();
console.log(`OK · ${nFrames} frames dans ${OUT}`);
