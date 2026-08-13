/**
 * Capture le hero de la home en mobile 375 px, tel que rendu par le dev
 * server. Sert aux demos de variantes visuelles : une capture par variante.
 * Usage : node scripts/_capture-hero.mjs <nom-sortie.png>
 */
import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sortie = process.argv[2] || "hero.png";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--force-device-scale-factor=2", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: 375, height: 1080, deviceScaleFactor: 2 });
await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
await page.goto("http://localhost:3000/", { waitUntil: "networkidle0", timeout: 90000 });
// laisser passer l'entree de l'animation pour capturer le halo a mi-course
await new Promise((r) => setTimeout(r, 1800));
await page.screenshot({ path: sortie });
await browser.close();
console.log("capture :", sortie);
