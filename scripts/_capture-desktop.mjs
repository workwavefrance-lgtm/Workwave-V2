/**
 * Capture le hero en GRAND ECRAN (1280 px), mode clair, tel que rendu par le
 * dev server. Sert aux demos de largeur de cadre.
 * Usage : node scripts/_capture-desktop.mjs <sortie.png>
 */
import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sortie = process.argv[2] || "desktop.png";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--force-device-scale-factor=2", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
await page.goto("http://localhost:3000/", { waitUntil: "networkidle0", timeout: 90000 });
await new Promise((r) => setTimeout(r, 1600));
await page.screenshot({ path: sortie, clip: { x: 0, y: 120, width: 1280, height: 780 } });
await browser.close();
console.log("capture :", sortie);
