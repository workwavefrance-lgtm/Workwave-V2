import puppeteer from "puppeteer-core";
const OUT = "/private/tmp/claude-501/-Users-willygauvrit-Desktop-Workwave-V2/7e7a312b-ad81-47aa-837b-91f556f9fefa/scratchpad/captures";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true });
const err = []; p.on("pageerror", (e) => err.push(e.message));
await p.goto("http://localhost:3210/deposer-projet", { waitUntil: "networkidle2", timeout: 60000 });
await pause(1200);
await p.evaluate(() => [...document.querySelectorAll("button")].find(x=>x.textContent.includes("Bâtiment et travaux"))?.click());
await pause(900);
for (const n of ["Maçon", "Plombier"]) {
  const ok = await p.evaluate((x) => {
    const b = [...document.querySelectorAll("button")].find((e) => e.offsetParent !== null && e.textContent.replace("\u2713","").trim() === x);
    if (b) { b.click(); return true; } return false;
  }, n);
  console.log("  coche", n, ":", ok);
  await pause(400);
}
console.log("  champs :", await p.evaluate(() => document.querySelector('input[name="categoryIds"]')?.value));
// le bouton est-il DANS l'ecran, sans defiler ?
const visible = async () => p.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.offsetParent !== null && x.textContent.includes("Continuer avec"));
  if (!b) return "absent";
  const r = b.getBoundingClientRect();
  return r.top >= 0 && r.bottom <= window.innerHeight ? "VISIBLE a l'ecran" : `hors ecran (bas a ${Math.round(r.bottom)}px, ecran ${window.innerHeight}px)`;
});
console.log("sans defiler        :", await visible());
await p.screenshot({ path: `${OUT}/collant-haut.png` });
await p.evaluate(() => window.scrollBy(0, 600));
await pause(500);
console.log("apres defilement    :", await visible());
await p.screenshot({ path: `${OUT}/collant-bas.png` });
console.log("ERREURS JS :", err.length ? err : "aucune");
await b.close();
