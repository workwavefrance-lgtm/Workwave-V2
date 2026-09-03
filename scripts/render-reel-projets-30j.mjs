/**
 * Rendu d'un reel "montage : les projets des 30 derniers jours" → frames PNG
 * (puis ffmpeg → MP4 via scripts/rendre-reel.sh projets-30j <json>).
 *
 * Usage :
 *   node scripts/render-reel-projets-30j.mjs marketing/projets/projets-30j-1.json
 *
 * Le JSON :
 *   { "slug": "projets-30j-1", "premierFond": "noir"|"blanc",
 *     "meta": { "titre": "30 derniers jours sur", "sousTitre": "...", "total": 44 },
 *     "projets": [ { "metier", "ville", "dept", "urgence", "budget"|null,
 *                    "besoin", "date": "AAAA-MM-JJ" }, ... 8 projets ... ] }
 *
 * Pre-requis : serveur local `python3 -m http.server 8877 --directory marketing`.
 * REGLE : JAMAIS de donnee personnelle (nom, tel, email, adresse) dans le JSON.
 * Le script refuse de rendre si un besoin ressemble a un tel, un email ou une
 * civilite ("Mr", "Mme"), parce que la video part sur Instagram.
 */
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import os from "os";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const dataPath = process.argv[2];
if (!dataPath) { console.error("Usage: node scripts/render-reel-projets-30j.mjs <projets-30j-N.json>"); process.exit(1); }
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
if (!data.slug || !Array.isArray(data.projets) || data.projets.length === 0) {
  console.error("JSON invalide : slug + projets[] requis"); process.exit(1);
}
if (data.projets.length < 6 || data.projets.length > 10) {
  console.error(`JSON invalide : ${data.projets.length} projets, le montage en attend 6 a 10 (8 conseille)`); process.exit(1);
}

// Garde-fou donnees personnelles : on ne rend pas si un champ visible contient
// un email, un numero de telephone, ou une civilite suivie d'un nom.
const TEL = /(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}/;
const EMAIL = /[\w.+-]+@[\w-]+\.[a-z]{2,}/i;
const CIVILITE = /\b(?:mr|mme|mlle|monsieur|madame|m\.)\s+[a-zà-ÿ]/i;
// Tirets cadratin et demi-cadratin : bannis partout (regle de style Willy).
const TIRETS = /[\u2013\u2014]/;
for (const p of data.projets) {
  const visible = [p.metier, p.ville, p.dept, p.urgence, p.budget, p.besoin].filter(Boolean).join(" | ");
  if (TEL.test(visible) || EMAIL.test(visible) || CIVILITE.test(visible)) {
    console.error(`REFUS : donnee personnelle probable dans "${visible}"`); process.exit(1);
  }
  if (TIRETS.test(visible)) {
    console.error(`REFUS : tiret cadratin ou demi-cadratin dans "${visible}"`); process.exit(1);
  }
  if (!p.metier || !p.ville || !p.besoin) {
    console.error(`JSON invalide : metier, ville et besoin requis (${JSON.stringify(p)})`); process.exit(1);
  }
}

// Injecte les donnees pour le gabarit
const meta = Object.assign({}, data.meta || {}, { premierFond: data.premierFond === "blanc" ? "blanc" : "noir" });
fs.writeFileSync(
  path.resolve("marketing/reel-projets-30j-data.js"),
  "window.PROJETS = " + JSON.stringify(data.projets, null, 2) + ";\n" +
  "window.META = " + JSON.stringify(meta, null, 2) + ";\n"
);

// Les images NE DOIVENT PAS etre ecrites sous ~/Desktop (dossier synchronise
// par iCloud, qui recree des copies "f00419 2.png" pendant le nettoyage et
// produisait des videos tronquees en silence). Cf. render-reel-projet.mjs.
const OUT = process.env.REEL_FRAMES_DIR || path.join(os.tmpdir(), "workwave-frames-projets-30j");
const FPS = 30;
fs.rmSync(OUT, { recursive: true, force: true, maxRetries: 20, retryDelay: 150 });
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--force-device-scale-factor=1", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
await page.goto("http://localhost:8877/reel-projets-30j-render.html", { waitUntil: "networkidle0" });

const total = await page.evaluate(() => window.TOTAL);
const nFrames = Math.ceil(total / (1000 / FPS));
console.log(`[${data.slug}] premierFond=${meta.premierFond} · ${data.projets.length} projets · ${total}ms → ${nFrames} frames`);

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
// Sortie forcee : apres browser.close(), Chrome garde parfois la boucle
// d'evenements de Node en vie et le script ne rend jamais la main.
process.exit(0);
