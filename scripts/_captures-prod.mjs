import puppeteer from "puppeteer-core";
const OUT = "/private/tmp/claude-501/-Users-willygauvrit-Desktop-Workwave-V2/7e7a312b-ad81-47aa-837b-91f556f9fefa/scratchpad/captures";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const erreurs = [];
p.on("pageerror", (e) => erreurs.push("JS: " + e.message));
p.on("console", (m) => { if (m.type() === "error") erreurs.push("console: " + m.text().slice(0, 120)); });

await p.goto("https://workwave.fr/deposer-projet", { waitUntil: "networkidle2", timeout: 60000 });
await pause(1200);
await p.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => /refuser/i.test(x.textContent));
  if (b) b.click();
});
await pause(700);
const etape = () => p.evaluate(() => (document.body.innerText.match(/Étape (\d) sur (\d)/) || []).slice(1).join("/") || "?");
const clic = async (txt) => p.evaluate((t) => {
  const b = [...document.querySelectorAll("button")].find((x) => x.offsetParent !== null && x.textContent.trim() === t);
  if (b) { b.click(); return true; } return false;
}, txt);

console.log("ecran 1 :", await etape());
await p.screenshot({ path: `${OUT}/prod-1.png` });

console.log("  clic « Bâtiment et travaux » :", await p.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.offsetParent !== null && x.textContent.includes("Bâtiment et travaux"));
  if (b) { b.click(); return true; } return false;
}));
await pause(700); console.log("ecran 2 :", await etape());
await p.screenshot({ path: `${OUT}/prod-2.png` });

console.log("  clic « Maçon » :", await clic("Maçon"));
await pause(700); console.log("ecran 3 :", await etape());
await p.screenshot({ path: `${OUT}/prod-3.png` });

console.log("  clic « Cette semaine » :", await clic("Cette semaine"));
await pause(700); console.log("ecran 4 :", await etape());
await p.evaluate(() => {
  const t = document.querySelector("textarea");
  const set = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
  set.call(t, "Construire un mur de cloture de 12 metres sur 1m80, en parpaings a enduire.");
  t.dispatchEvent(new Event("input", { bubbles: true }));
});
await pause(500);
await p.screenshot({ path: `${OUT}/prod-4.png` });
console.log("  clic « Continuer → » :", await clic("Continuer →"));
await pause(900); console.log("ecran 5 :", await etape());

// ville + coordonnees, SANS ENVOYER
const champ = await p.$('input[type="text"]');
if (champ) { await champ.click(); await champ.type("Poitiers", { delay: 80 }); }
await pause(1600);
await p.click('[role="option"]').catch(() => console.log("  (pas de suggestion cliquable)"));
await pause(1400);
await p.screenshot({ path: `${OUT}/prod-5.png` });

const etat = await p.evaluate(() => ({
  budgetCache: document.querySelector('input[name="budget"]')?.value ?? "ABSENT",
  urgenceCachee: document.querySelector('input[name="urgency"]')?.value ?? "ABSENT",
  categorie: document.querySelector('input[name="categoryId"]')?.value ?? "ABSENT",
  ville: document.querySelector('input[name="cityId"]')?.value ?? "ABSENT",
  boutonEnvoyer: !![...document.querySelectorAll("button")].find((b) => b.textContent.includes("Envoyer ma demande")),
  preuve: document.body.innerText.includes("professionnels référencés"),
  budgetVisible: /Budget estimé|Moins de 500/.test(document.body.innerText),
}));
console.log("\nCHAMPS ENVOYES AU SERVEUR :", JSON.stringify(etat, null, 2));
console.log("ERREURS JS :", erreurs.length ? erreurs : "aucune");
console.log("\n>>> RIEN N'A ETE ENVOYE (aucun clic sur Envoyer)");
await b.close();
