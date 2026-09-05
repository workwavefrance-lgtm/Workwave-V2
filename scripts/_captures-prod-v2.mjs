import puppeteer from "puppeteer-core";
const OUT = "/private/tmp/claude-501/-Users-willygauvrit-Desktop-Workwave-V2/7e7a312b-ad81-47aa-837b-91f556f9fefa/scratchpad/captures";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true });
const err = []; p.on("pageerror", (e) => err.push(e.message));
const clic = (t) => p.evaluate((x) => {
  const b = [...document.querySelectorAll("button")].find((e) => e.offsetParent !== null && e.textContent.replace("✓","").trim() === x);
  if (b) { b.click(); return true; } return false;
}, t);
const clicContient = (t) => p.evaluate((x) => {
  const b = [...document.querySelectorAll("button")].find((e) => e.offsetParent !== null && e.textContent.includes(x));
  if (b) { b.click(); return true; } return false;
}, t);
const etape = () => p.evaluate(() => (document.body.innerText.match(/Étape (\d) sur (\d)/) || []).slice(1).join("/"));

await p.goto("https://workwave.fr/deposer-projet", { waitUntil: "networkidle2", timeout: 60000 });
await pause(1400);
await p.evaluate(() => { const b=[...document.querySelectorAll("button")].find(x=>/refuser/i.test(x.textContent)); if(b) b.click(); });
await pause(700);
await p.screenshot({ path: `${OUT}/final-1-besoin.png` });
console.log("1 · besoin      ", await etape());

await clicContient("Bâtiment et travaux"); await pause(900);
await p.screenshot({ path: `${OUT}/final-2-metier.png` });
console.log("2 · metier      ", await etape());

await clic("Maçon"); await pause(400);
await clic("Plombier"); await pause(600);
await p.screenshot({ path: `${OUT}/final-2b-multi.png` });
await clicContient("Continuer avec"); await pause(900);
console.log("3 · quand       ", await etape());
await p.screenshot({ path: `${OUT}/final-3-quand.png` });

await clic("Cette semaine"); await pause(900);
console.log("4 · chantier    ", await etape());
await p.evaluate(() => {
  const t = document.querySelector("textarea");
  const set = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
  set.call(t, "Ouvrir une cloison porteuse entre le salon et la cuisine, et deplacer deux arrivees d'eau.");
  t.dispatchEvent(new Event("input", { bubbles: true }));
});
await pause(500);
await p.screenshot({ path: `${OUT}/final-4-chantier.png` });

await clic("Continuer →"); await pause(1000);
console.log("5 · coordonnees ", await etape());
const champ = await p.$('input[type="text"]');
if (champ) { await champ.click(); await champ.type("Poitiers", { delay: 70 }); await pause(1700); await p.click('[role="option"]').catch(()=>{}); }
await pause(1300);
await p.screenshot({ path: `${OUT}/final-5-coordonnees.png` });
console.log("\nERREURS JS :", err.length ? err : "aucune");
console.log(">>> AUCUN envoi");
await b.close();
