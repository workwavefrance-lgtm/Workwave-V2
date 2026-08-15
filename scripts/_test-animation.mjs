/**
 * Test de NON-REGRESSION du champ de recherche avec les exemples animes.
 * Le but n'est pas de voir si c'est joli, mais que RIEN n'est casse.
 */
import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox","--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto("http://localhost:3000/", { waitUntil: "networkidle0", timeout: 90000 });

const q = 'main form:first-of-type input[type="text"]';
let ok = true;
const dit = (t, v) => { console.log(`  ${v ? "OK  " : "ECHEC"}  ${t}`); if (!v) ok = false; };

// 1. le calque existe au repos
const calqueAuRepos = await p.evaluate(() => !!document.querySelector("main form .animate-defile-exemples"));
dit("les exemples defilent quand le champ est vide", calqueAuRepos);

// 2. le calque ne capte pas les clics
const nonCliquable = await p.evaluate(() => {
  const s = document.querySelector("main form .animate-defile-exemples")?.parentElement;
  return s ? getComputedStyle(s).pointerEvents === "none" : false;
});
dit("le calque ne capte aucun clic", nonCliquable);

// 3. cliquer dans le champ le fait disparaitre
await p.click(q);
await new Promise(r => setTimeout(r, 250));
const apresClic = await p.evaluate(() => {
  const f = document.querySelector("main form");
  return !!f.querySelector(".animate-defile-exemples");
});
dit("il disparait des le clic dans le champ", !apresClic);

// 4. la saisie fonctionne normalement
await p.type(q, "plombier", { delay: 25 });
const saisie = await p.$eval(q, (el) => el.value);
dit(`la saisie fonctionne (valeur lue : "${saisie}")`, saisie === "plombier");

// 5. la liste de suggestions s'ouvre toujours
await new Promise(r => setTimeout(r, 350));
const suggestions = await p.evaluate(() => document.querySelector("main form").querySelectorAll("button[type=button]").length);
dit(`la liste des metiers s'ouvre (${suggestions} propositions)`, suggestions > 0);

// 6. le vrai placeholder reste dans le HTML (secours si le CSS ne charge pas)
const ph = await p.$eval(q, (el) => el.getAttribute("placeholder"));
dit(`le vrai placeholder reste present ("${String(ph).slice(0,28)}...")`, !!ph && ph.includes("plombier"));

// 7. aucune erreur console
const erreurs = [];
p.on("console", (m) => m.type() === "error" && erreurs.push(m.text()));
await p.reload({ waitUntil: "networkidle0" });
await new Promise(r => setTimeout(r, 1200));
dit(`aucune erreur dans la console (${erreurs.length})`, erreurs.length === 0);
if (erreurs.length) erreurs.slice(0,3).forEach(e => console.log("      " + e.slice(0,110)));

// 8. animations coupees si l'utilisateur les a desactivees
await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
await p.reload({ waitUntil: "networkidle0" });
const coupe = await p.evaluate(() => {
  const el = document.querySelector("main form .animate-defile-exemples");
  return el ? getComputedStyle(el).animationName === "none" : null;
});
dit("animation coupee si 'reduire les animations' est actif", coupe === true);

console.log(`\n  ${ok ? "TOUS LES CONTROLES PASSENT" : "AU MOINS UN CONTROLE ECHOUE"}`);
await b.close();
process.exit(ok ? 0 : 1);
