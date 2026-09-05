import puppeteer from "puppeteer-core";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--no-sandbox"] });

const PAGES = [
  ["accueil", "https://workwave.fr/"],
  ["recherche", "https://workwave.fr/recherche"],
  ["metier racine", "https://workwave.fr/plombier"],
  ["metier x ville", "https://workwave.fr/plombier/poitiers"],
  ["metier x dept", "https://workwave.fr/plombier/vienne-86"],
  ["guide prix metier", "https://workwave.fr/plombier/prix"],
  ["hub guides prix", "https://workwave.fr/guide-des-prix"],
  ["blog", "https://workwave.fr/blog"],
  ["barometre", "https://workwave.fr/barometre-artisans"],
  ["landing pro", "https://workwave.fr/pro"],
];

let alertes = 0;
for (const [nom, url] of PAGES) {
  const p = await b.newPage();
  await p.setViewport({ width: 1280, height: 900 });
  const err = [];
  p.on("pageerror", (e) => err.push(e.message.slice(0, 70)));
  let code = "ERR";
  try { code = (await p.goto(url, { waitUntil: "networkidle2", timeout: 45000 }))?.status(); } catch {}
  await pause(1000);

  // 1. tous les liens vers le depot : destination valide ?
  const liens = await p.evaluate(() =>
    [...new Set([...document.querySelectorAll('a[href*="/deposer-projet"]')].map((a) => a.getAttribute("href")))]
  );

  // 2. le bouton qui ouvre la modale : quelle version affiche-t-il ?
  let modale = "aucun bouton";
  const aBouton = await p.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => /déposer un projet/i.test(x.textContent));
    if (b) { b.click(); return true; } return false;
  });
  if (aBouton) {
    await pause(1500);
    const t = await p.evaluate(() => document.body.innerText);
    const et = (t.match(/Étape (\d) sur (\d)/) || []).slice(1).join("/");
    const vieux = /Budget estimé/.test(t) || /Étape \d sur 4/.test(t);
    modale = vieux ? `⚠️ ANCIENNE VERSION (${et})` : `ok ${et}`;
    if (vieux) alertes++;
  }
  console.log(`${nom.padEnd(18)} ${code}  modale: ${modale.padEnd(16)} liens: ${liens.join(" ") || "-"}${err.length ? "  JS: " + err[0] : ""}`);
  await p.close();
}
console.log(`\n${alertes === 0 ? "AUCUNE ancienne version detectee" : alertes + " page(s) en ancienne version"}`);
await b.close();
