import puppeteer from "puppeteer-core";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--no-sandbox"] });

const verdict = async (p) => {
  const t = await p.evaluate(() => document.body.innerText);
  const html = await p.evaluate(() => document.body.innerHTML);
  return {
    etape: (t.match(/Étape (\d) sur (\d)/) || []).slice(1).join("/") || "aucune",
    "sur 5 ecrans": /sur 5/.test(t),
    "3 portes": t.includes("Bâtiment et travaux"),
    "PLUS de budget": !/Budget estimé/.test(t),
    "PLUS de liste 57": !/<select[^>]*name="categoryId"/.test(html),
  };
};

// 1. page dediee
let p = await b.newPage();
await p.setViewport({ width: 1280, height: 900 });
await p.goto("https://workwave.fr/deposer-projet", { waitUntil: "networkidle2", timeout: 45000 });
await pause(1200);
console.log("PAGE /deposer-projet   :", JSON.stringify(await verdict(p)));
await p.close();

// 2. modale du header (le bouton signale par Willy)
p = await b.newPage();
await p.setViewport({ width: 1280, height: 900 });
await p.goto("https://workwave.fr/", { waitUntil: "networkidle2", timeout: 45000 });
await pause(1200);
const ouvert = await p.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => /déposer un projet/i.test(x.textContent));
  if (b) { b.click(); return b.textContent.trim(); }
  return null;
});
await pause(1600);
console.log(`MODALE header (« ${ouvert} ») :`, JSON.stringify(await verdict(p)));
await p.close();

// 3. formulaire integre aux pages metier x ville
p = await b.newPage();
await p.setViewport({ width: 1280, height: 900 });
await p.goto("https://workwave.fr/plombier/poitiers", { waitUntil: "networkidle2", timeout: 45000 });
await pause(1500);
console.log("FORMULAIRE page metier :", JSON.stringify(await verdict(p)));
await p.close();

await b.close();
