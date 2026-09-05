import puppeteer from "puppeteer-core";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--no-sandbox"] });

// Signature de la NOUVELLE version : 5 etapes, les 3 portes, la phrase multi-metiers.
const signature = async (p) => {
  const t = await p.evaluate(() => document.body.innerText);
  return {
    cinqEcrans: /Étape 1 sur 5/.test(t),
    troisPortes: t.includes("Bâtiment et travaux") && t.includes("Entretien de la maison"),
    plusBudget: !/Budget estimé/.test(t),
    plusDeListe57: !(await 0),
  };
};

const pages = [
  ["accueil", "https://workwave.fr/"],
  ["page metier x ville", "https://workwave.fr/plombier/poitiers"],
  ["page metier x dept", "https://workwave.fr/plombier/vienne-86"],
  ["guide des prix", "https://workwave.fr/guide-des-prix"],
  ["blog", "https://workwave.fr/blog"],
  ["fiche artisan", "https://workwave.fr/artisan/id-renov-latille"],
  ["barometre", "https://workwave.fr/barometre-artisans"],
];

for (const [nom, url] of pages) {
  const p = await b.newPage();
  await p.setViewport({ width: 1280, height: 900 });
  const err = []; p.on("pageerror", (e) => err.push(e.message));
  let code = "?";
  try {
    const r = await p.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    code = r?.status();
  } catch { code = "ERR"; }
  await pause(1200);
  // combien de CTA vers le depot, et sont-ils des liens ou des ouvre-modale ?
  const cta = await p.evaluate(() => {
    const liens = [...document.querySelectorAll('a[href*="/deposer-projet"]')].length;
    const boutons = [...document.querySelectorAll("button")]
      .filter((b) => /déposer|projet gratuit|devis/i.test(b.textContent)).length;
    return { liens, boutons };
  });
  console.log(`${nom.padEnd(20)} ${code}  liens=${cta.liens} boutons=${cta.boutons}${err.length ? "  ERREURS JS: " + err.length : ""}`);
  await p.close();
}
await b.close();
