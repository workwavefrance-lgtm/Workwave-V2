/**
 * Capture le hero a PLUSIEURS LARGEURS d'ecran, pour verifier que la
 * typographie suit la taille de l'ecran et qu'il n'y a pas de vides lateraux.
 * Usage : node scripts/_capture-largeurs.mjs <prefixe-sortie>
 */
import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const prefixe = process.argv[2] || "largeur";
const LARGEURS = [1280, 1600, 1920, 2560];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--hide-scrollbars", "--window-size=2560,1400"],
});

for (const w of LARGEURS) {
  const page = await browser.newPage();
  // deviceScaleFactor 1 pour que l'image reflete la largeur reelle
  await page.setViewport({ width: w, height: 900, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle0", timeout: 90000 });
  await new Promise((r) => setTimeout(r, 1200));

  // mesure reelle : largeur du bloc de contenu vs largeur de l'ecran
  const m = await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    const conteneur = h1?.parentElement;
    const r = conteneur?.getBoundingClientRect();
    const style = h1 ? getComputedStyle(h1.querySelector("span:last-child") || h1) : null;
    return {
      ecran: window.innerWidth,
      contenu: Math.round(r?.width || 0),
      taillePolice: style?.fontSize || "?",
    };
  });
  const vide = m.ecran - m.contenu;
  console.log(
    `  ecran ${String(m.ecran).padStart(4)} px | contenu ${String(m.contenu).padStart(4)} px | ` +
    `vide lateral ${String(vide).padStart(4)} px (${Math.round((100 * vide) / m.ecran)} %) | titre ${m.taillePolice}`
  );

  await page.screenshot({ path: `${prefixe}-${w}.png`, clip: { x: 0, y: 80, width: w, height: 700 } });
  await page.close();
}
await browser.close();
