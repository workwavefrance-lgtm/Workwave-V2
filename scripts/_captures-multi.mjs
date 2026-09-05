import puppeteer from "puppeteer-core";
const OUT = "/private/tmp/claude-501/-Users-willygauvrit-Desktop-Workwave-V2/7e7a312b-ad81-47aa-837b-91f556f9fefa/scratchpad/captures";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true });
const err = [];
p.on("pageerror", (e) => err.push(e.message));
const clic = (t) => p.evaluate((x) => {
  const b = [...document.querySelectorAll("button")].find((e) => e.offsetParent !== null && e.textContent.trim() === x);
  if (b) { b.click(); return true; } return false;
}, t);

await p.goto("http://localhost:3210/deposer-projet", { waitUntil: "networkidle2", timeout: 60000 });
await pause(1200);
await p.evaluate(() => [...document.querySelectorAll("button")].find(x=>x.textContent.includes("Bâtiment et travaux"))?.click());
await pause(800);

// un seul metier
console.log("Maçon      :", await clic("Maçon")); await pause(500);
await p.screenshot({ path: `${OUT}/multi-1metier.png` });

// puis trois
console.log("Plombier   :", await clic("Plombier")); await pause(400);
console.log("Électricien:", await clic("Électricien")); await pause(600);
await p.screenshot({ path: `${OUT}/multi-3metiers.png` });

const etat = await p.evaluate(() => ({
  principal: document.querySelector('input[name="categoryId"]')?.value,
  liste: document.querySelector('input[name="categoryIds"]')?.value,
  bouton: [...document.querySelectorAll("button")].map(b=>b.textContent.trim()).find(t=>t.includes("Continuer")),
  phrase: document.body.innerText.split("\n").find(l => l.includes("demandes distinctes")),
}));
console.log("\nETAT :", JSON.stringify(etat, null, 2));

// deselection : le principal doit basculer
console.log("\nretrait de Maçon :", await clic("Maçon")); await pause(500);
console.log("apres retrait :", JSON.stringify(await p.evaluate(() => ({
  principal: document.querySelector('input[name="categoryId"]')?.value,
  liste: document.querySelector('input[name="categoryIds"]')?.value,
}))));
console.log("ERREURS JS :", err.length ? err : "aucune");
await b.close();
