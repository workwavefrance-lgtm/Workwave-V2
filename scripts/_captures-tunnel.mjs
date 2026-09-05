import puppeteer from "puppeteer-core";

const OUT = "/private/tmp/claude-501/-Users-willygauvrit-Desktop-Workwave-V2/7e7a312b-ad81-47aa-837b-91f556f9fefa/scratchpad/captures";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

const clicTexte = async (page, texte) => {
  const ok = await page.evaluate((t) => {
    const b = [...document.querySelectorAll("button")].find(
      (x) => x.offsetParent !== null && x.textContent.trim().toLowerCase().includes(t.toLowerCase())
    );
    if (b) { b.click(); return true; }
    return false;
  }, texte);
  await pause(900);
  return ok;
};

const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await p.goto("https://workwave.fr/deposer-projet", { waitUntil: "networkidle2", timeout: 60000 });
await pause(1500);

await clicTexte(p, "Refuser");
await pause(600);

// ETAPE 1
await p.screenshot({ path: `${OUT}/1-metier.png` });
console.log("1-metier.png");

// choisir un metier puis continuer
await p.evaluate(() => {
  const s = document.querySelector("select");
  if (s) {
    const o = [...s.options].find((x) => x.textContent.trim() === "Maçon");
    if (o) { s.value = o.value; s.dispatchEvent(new Event("change", { bubbles: true })); }
  }
});
await pause(700);
console.log("continuer 1 ->", await clicTexte(p, "Continuer"));
await pause(1200);

// ETAPE 2 : ville
await p.screenshot({ path: `${OUT}/2-ville.png` });
console.log("2-ville.png");
const champ = await p.$('input[type="text"]');
if (champ) { await champ.click(); await champ.type("Poitiers", { delay: 90 }); }
await pause(1800);
await p.screenshot({ path: `${OUT}/2b-ville-suggestions.png` });
// choisir la 1re suggestion : VRAI clic souris (le handler est onMouseDown,
// un li.click() synthetique ne le declenche pas)
await p.waitForSelector('[role="option"]', { timeout: 8000 }).catch(() => {});
await p.click('[role="option"]').catch((e) => console.log("clic suggestion:", e.message));
await pause(1500);
await p.screenshot({ path: `${OUT}/2c-ville-confirmee.png` });
console.log("2c-ville-confirmee.png");
const etape = async () => await p.evaluate(() => (document.body.innerText.match(/Étape (\d) sur 4/) || [])[1] || "?");
console.log("  etape affichee :", await etape());
console.log("continuer 2 ->", await clicTexte(p, "Continuer"));
await pause(1200);

// ETAPE 3 : projet
await p.screenshot({ path: `${OUT}/3-projet.png` });
console.log("3-projet.png · etape affichee :", await etape());
await p.evaluate(() => {
  const t = document.querySelector("textarea");
  if (t) {
    const set = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
    set.call(t, "Construire un mur de cloture de 12 metres sur 1m80, en parpaings a enduire.");
    t.dispatchEvent(new Event("input", { bubbles: true }));
  }
  const parLabel = (txt) => {
    const l = [...document.querySelectorAll("label")].find((x) => x.textContent.trim() === txt);
    if (l) { const i = l.querySelector('input[type="radio"]') || document.getElementById(l.htmlFor); if (i) i.click(); }
  };
  parLabel("Cette semaine");
  parLabel("2 000 € à 5 000 €");
});
await pause(900);
await p.screenshot({ path: `${OUT}/3b-projet-rempli.png` });
console.log("continuer 3 ->", await clicTexte(p, "Continuer"));
await pause(1200);

// ETAPE 4 : contact — AUCUNE soumission
await p.screenshot({ path: `${OUT}/4-contact.png` });
console.log("4-contact.png · etape affichee :", await etape(), "(rien n'est envoye)");

await b.close();
