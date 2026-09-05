/**
 * Capture AVANT (prod workwave.fr, ancienne version) vs APRÈS (localhost, nouvelle
 * version non déployée) du tunnel de dépôt : en-tête + carte réassurance étape Contact.
 * Sortie : 4 PNG sur le Bureau.
 */
import puppeteer from "puppeteer-core";
import os from "os";
import path from "path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const DESK = path.join(os.homedir(), "Desktop");
const AVANT = "https://workwave.fr/deposer-projet";
const APRES = "http://localhost:3000/deposer-projet";

async function shotHeader(page, url, out) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1000, height: 640 } });
  console.log("✓", out);
}

async function shotContact(page, url, out) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1000));
  // Révèle toutes les étapes (masquées par .hidden) puis renvoie le rect de l'étape "Vos coordonnées".
  const rect = await page.evaluate(() => {
    const form = document.querySelector("form");
    if (!form) return null;
    form.querySelectorAll(":scope > div.hidden").forEach((d) => d.classList.remove("hidden"));
    const label = [...document.querySelectorAll("label")].find((l) =>
      l.textContent.trim().startsWith("Vos coordonnées")
    );
    if (!label) return null;
    // Le conteneur de l'étape = le div parent direct du form
    let el = label;
    while (el && el.parentElement && el.parentElement !== form) el = el.parentElement;
    const r = el.getBoundingClientRect();
    window.scrollTo(0, 0);
    return { x: Math.max(0, r.left - 8), y: r.top + window.scrollY - 8, width: Math.min(1000, r.width + 16), height: r.height + 16 };
  });
  if (!rect) {
    console.log("✗ pas trouvé l'étape Contact pour", url);
    await page.screenshot({ path: out });
    return;
  }
  await page.screenshot({ path: out, clip: rect });
  console.log("✓", out);
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox", "--hide-scrollbars"] });
const page = await browser.newPage();
await page.setViewport({ width: 1000, height: 1500, deviceScaleFactor: 2 });

await shotHeader(page, AVANT, path.join(DESK, "depot-1-entete-AVANT.png"));
await shotHeader(page, APRES, path.join(DESK, "depot-2-entete-APRES.png"));
await shotContact(page, AVANT, path.join(DESK, "depot-3-contact-AVANT.png"));
await shotContact(page, APRES, path.join(DESK, "depot-4-contact-APRES.png"));

await browser.close();
console.log("Terminé.");
