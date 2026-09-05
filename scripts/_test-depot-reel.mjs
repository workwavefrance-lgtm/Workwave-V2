import puppeteer from "puppeteer-core";
const OUT = "/private/tmp/claude-501/-Users-willygauvrit-Desktop-Workwave-V2/7e7a312b-ad81-47aa-837b-91f556f9fefa/scratchpad/captures";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const err = [];
p.on("pageerror", (e) => err.push(e.message));
const clic = (txt) => p.evaluate((t) => {
  const b = [...document.querySelectorAll("button")].find((x) => x.offsetParent !== null && x.textContent.trim() === t);
  if (b) { b.click(); return true; } return false;
}, txt);
const etape = () => p.evaluate(() => (document.body.innerText.match(/Étape (\d) sur (\d)/) || []).slice(1).join("/"));

await p.goto("https://workwave.fr/deposer-projet", { waitUntil: "networkidle2", timeout: 60000 });
await pause(1200);
await p.evaluate(() => { const b=[...document.querySelectorAll("button")].find(x=>/refuser/i.test(x.textContent)); if(b) b.click(); });
await pause(600);

await p.evaluate(() => [...document.querySelectorAll("button")].find(x=>x.textContent.includes("Bâtiment et travaux"))?.click());
await pause(700);
console.log("metier Ascensoriste :", await clic("Ascensoriste"), "| ecran", await etape());
await pause(700);
console.log("urgence Pas pressé  :", await clic("Pas pressé"), "| ecran", await etape());
await pause(700);

await p.evaluate(() => {
  const t = document.querySelector("textarea");
  const set = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
  set.call(t, "TEST TECHNIQUE WORKWAVE - ne pas traiter, ce projet sera supprime dans la minute. Verification du nouveau formulaire de depot en cinq ecrans.");
  t.dispatchEvent(new Event("input", { bubbles: true }));
});
await pause(400);
console.log("continuer          :", await clic("Continuer →"), "| ecran", await etape());
await pause(900);

const champ = await p.$('input[type="text"]');
await champ.click(); await champ.type("Poitiers", { delay: 70 });
await pause(1600);
await p.click('[role="option"]');
await pause(1200);

const remplir = async (nom, valeur) => {
  const el = await p.$(`input[name="${nom}"]`);
  if (!el) return console.log("champ absent :", nom);
  await el.click(); await el.type(valeur, { delay: 40 });
};
await remplir("firstName", "TestWorkwave");
await remplir("email", "workwave.france@gmail.com");
await remplir("phone", "0600000000");
await p.evaluate(() => { const c = document.querySelector('input[name="consent"]'); if (c && !c.checked) c.click(); });
await pause(500);
await p.screenshot({ path: `${OUT}/test-avant-envoi.png` });

console.log("\n>>> ENVOI");
await clic("Envoyer ma demande");
await pause(9000);
console.log("URL apres envoi :", p.url());
console.log("page :", (await p.evaluate(() => document.body.innerText)).slice(0, 180).replace(/\n+/g, " | "));
await p.screenshot({ path: `${OUT}/test-apres-envoi.png` });
console.log("ERREURS JS :", err.length ? err : "aucune");
await b.close();
