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
const etape = () => p.evaluate(() => (document.body.innerText.match(/Étape (\d) sur (\d)/) || []).slice(1).join("/"));

await p.goto("https://workwave.fr/deposer-projet", { waitUntil: "networkidle2", timeout: 60000 });
await pause(1400);
await p.evaluate(() => { const b=[...document.querySelectorAll("button")].find(x=>/refuser/i.test(x.textContent)); if(b) b.click(); });
await pause(600);
await p.evaluate(() => [...document.querySelectorAll("button")].find(x=>x.textContent.includes("Bâtiment et travaux"))?.click());
await pause(900);
console.log("ecran", await etape());

for (const m of ["Maçon", "Plombier", "Électricien"]) { console.log("  coche", m, ":", await clic(m)); await pause(350); }
console.log("champs :", JSON.stringify(await p.evaluate(() => ({
  principal: document.querySelector('input[name="categoryId"]')?.value,
  liste: document.querySelector('input[name="categoryIds"]')?.value,
}))));
await p.screenshot({ path: `${OUT}/prod-multi-3.png` });

await p.evaluate(() => [...document.querySelectorAll("button")].find(x=>x.offsetParent!==null && x.textContent.includes("Continuer avec"))?.click());
await pause(900);
console.log("ecran", await etape(), "(urgence)");
console.log("  Pas pressé :", await clic("Pas pressé")); await pause(800);
console.log("ecran", await etape(), "(description)");

await p.evaluate(() => {
  const t = document.querySelector("textarea");
  const set = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
  set.call(t, "TEST TECHNIQUE WORKWAVE - ne pas traiter. Verification du choix multi-metiers : trois demandes distinctes doivent etre creees et AUCUNE diffusee aux artisans.");
  t.dispatchEvent(new Event("input", { bubbles: true }));
});
await pause(400);
console.log("  Continuer :", await clic("Continuer →")); await pause(900);
console.log("ecran", await etape(), "(ville + coordonnees)");

const champ = await p.$('input[type="text"]');
await champ.click(); await champ.type("Poitiers", { delay: 70 });
await pause(1700); await p.click('[role="option"]'); await pause(1200);
for (const [n, v] of [["firstName","TestWorkwave"],["email","workwave.france@gmail.com"],["phone","0600000000"]]) {
  const el = await p.$(`input[name="${n}"]`); await el.click(); await el.type(v, { delay: 35 });
}
await p.evaluate(() => { const c = document.querySelector('input[name="consent"]'); if (c && !c.checked) c.click(); });
await pause(500);
console.log("\n>>> ENVOI");
await clic("Envoyer ma demande");
await pause(12000);
console.log("URL :", p.url());
console.log("ERREURS JS :", err.length ? err : "aucune");
await b.close();
