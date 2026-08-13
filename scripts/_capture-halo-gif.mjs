/** Filme la respiration du halo V2 : 36 images sur 3,6 s, zone recherche. */
import puppeteer from "puppeteer-core";
import fs from "fs";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
fs.rmSync("/tmp/demos-cadre/frames", { recursive: true, force: true });
fs.mkdirSync("/tmp/demos-cadre/frames", { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new",
  args: ["--no-sandbox", "--force-device-scale-factor=2", "--hide-scrollbars"] });
const page = await browser.newPage();
await page.setViewport({ width: 375, height: 1080, deviceScaleFactor: 2 });
await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
await page.goto("http://localhost:3000/", { waitUntil: "networkidle0", timeout: 90000 });
for (let i = 0; i < 36; i++) {
  await page.screenshot({ path: `/tmp/demos-cadre/frames/f${String(i).padStart(3, "0")}.png`,
    clip: { x: 4, y: 440, width: 367, height: 330 } });
  await new Promise((r) => setTimeout(r, 100));
}
await browser.close();
console.log("36 images");
