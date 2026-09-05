import puppeteer from "puppeteer-core";
import os from "os";
import path from "path";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const DESK = path.join(os.homedir(), "Desktop");
const URL = "http://localhost:3000/barometre-artisans";

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox", "--hide-scrollbars"] });
const page = await browser.newPage();
await page.setViewport({ width: 1100, height: 1400, deviceScaleFactor: 2 });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));

// full page
await page.screenshot({ path: path.join(DESK, "barometre-full.png"), fullPage: true });
// hero + stats (haut)
await page.screenshot({ path: path.join(DESK, "barometre-hero.png"), clip: { x: 0, y: 0, width: 1100, height: 1300 } });
// carte : scroll jusqu'à "La carte de la densité"
const y = await page.evaluate(() => {
  const h = [...document.querySelectorAll("h2")].find((e) => e.textContent.includes("carte de la densité"));
  return h ? h.getBoundingClientRect().top + window.scrollY : 0;
});
await page.evaluate((yy) => window.scrollTo(0, yy - 20), y);
await new Promise((r) => setTimeout(r, 600));
await page.screenshot({ path: path.join(DESK, "barometre-carte.png"), clip: { x: 0, y: 0, width: 1100, height: 1300 } });

// contenu densifié : analyse + par région
const y2 = await page.evaluate(() => {
  const h = [...document.querySelectorAll("h2")].find((e) => e.textContent.includes("Pourquoi un tel"));
  return h ? h.getBoundingClientRect().top + window.scrollY : 0;
});
await page.evaluate((yy) => window.scrollTo(0, yy - 20), y2);
await new Promise((r) => setTimeout(r, 500));
await page.screenshot({ path: path.join(DESK, "barometre-contenu.png"), clip: { x: 0, y: 0, width: 1100, height: 1300 } });
// FAQ
const y3 = await page.evaluate(() => {
  const h = [...document.querySelectorAll("h2")].find((e) => e.textContent.includes("Questions fréquentes"));
  return h ? h.getBoundingClientRect().top + window.scrollY : 0;
});
await page.evaluate((yy) => window.scrollTo(0, yy - 20), y3);
await new Promise((r) => setTimeout(r, 500));
await page.screenshot({ path: path.join(DESK, "barometre-faq.png"), clip: { x: 0, y: 0, width: 1100, height: 1200 } });

console.log("erreurs console:", errors.length ? errors.slice(0, 5) : "AUCUNE");
const dims = await page.evaluate(() => ({ h: document.body.scrollHeight, paths: document.querySelectorAll("svg path").length }));
console.log("hauteur page:", dims.h, "px | <path> SVG:", dims.paths);
await browser.close();
