import puppeteer from "puppeteer-core";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width: 375, height: 812, isMobile: true });
const err = []; p.on("pageerror", (e) => err.push(e.message));
const clic = (t) => p.evaluate((x) => {
  const b = [...document.querySelectorAll("button")].find((e) => e.offsetParent !== null && e.textContent.replace("✓","").trim() === x);
  if (b) { b.click(); return true; } return false;
}, t);
const etat = () => p.evaluate(() => ({
  principal: document.querySelector('input[name="categoryId"]')?.value || "(vide)",
  liste: document.querySelector('input[name="categoryIds"]')?.value || "(vide)",
  boutonVisible: !![...document.querySelectorAll("button")].find(b=>b.offsetParent !== null && b.textContent.includes("Continuer")),
}));
await p.goto("http://localhost:3210/deposer-projet", { waitUntil: "networkidle2", timeout: 60000 });
await pause(1200);
await p.evaluate(() => [...document.querySelectorAll("button")].find(x=>x.textContent.includes("Bâtiment et travaux"))?.click());
await pause(800);
for (const m of ["Maçon", "Plombier", "Électricien"]) { await clic(m); await pause(300); }
console.log("3 choisis        :", JSON.stringify(await etat()));
console.log("retrait Maçon    :", await clic("Maçon")); await pause(400);
console.log("  -> le principal doit basculer :", JSON.stringify(await etat()));
console.log("retrait Plombier :", await clic("Plombier")); await pause(400);
console.log("  ->", JSON.stringify(await etat()));
console.log("retrait Électricien (dernier) :", await clic("Électricien")); await pause(400);
console.log("  -> plus aucun metier, bouton doit disparaitre :", JSON.stringify(await etat()));
console.log("ERREURS JS :", err.length ? err : "aucune");
await b.close();
