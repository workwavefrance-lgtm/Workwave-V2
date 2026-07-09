/**
 * Rendu de la bannière LinkedIn Workwave → PNG retina.
 *
 * Usage :
 *   node scripts/render-linkedin-banner.mjs [html] [w] [h] [out.png]
 *   node scripts/render-linkedin-banner.mjs            # profil 1584x396 -> Bureau
 *
 * Pré-requis : Google Chrome installé (puppeteer-core).
 * deviceScaleFactor=2 → sortie 2x (nette, LinkedIn ré-échantillonne).
 */
import puppeteer from "puppeteer-core";
import path from "path";
import os from "os";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const html = process.argv[2] || path.resolve("marketing/linkedin-banner.html");
const W = parseInt(process.argv[3] || "1584", 10);
const H = parseInt(process.argv[4] || "396", 10);
const OUT =
  process.argv[5] || path.join(os.homedir(), "Desktop", "workwave-linkedin-banner.png");

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--hide-scrollbars", "--force-color-profile=srgb"],
});
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 2 });
await page.goto("file://" + html, { waitUntil: "networkidle0" });
await page.evaluate(async () => {
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
});
await page.screenshot({ path: OUT, clip: { x: 0, y: 0, width: W, height: H } });
await browser.close();
console.log(`OK — ${W}x${H} @2x → ${OUT}`);
