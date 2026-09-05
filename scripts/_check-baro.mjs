import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
for (const u of ["barometre-prix-artisans","barometre-metiers-artisans"]) {
  const p = await b.newPage(); const errs = [];
  p.on("pageerror", e => errs.push(e.message)); p.on("console", m => m.type()==="error" && errs.push(m.text()));
  await p.goto("http://localhost:3000/"+u, { waitUntil:"domcontentloaded", timeout:60000 });
  await new Promise(r=>setTimeout(r,1500));
  const info = await p.evaluate(()=>({h2:document.querySelectorAll("h2").length, links:document.querySelectorAll('a[href^="/"]').length}));
  console.log(u, "| erreurs:", errs.length?errs.slice(0,3):"AUCUNE", "| h2:", info.h2, "| liens internes:", info.links);
  await p.close();
}
await b.close();
