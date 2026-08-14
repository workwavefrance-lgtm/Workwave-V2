import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox","--hide-scrollbars","--window-size=2560,1400"] });
for (const w of [1024, 1280, 1440, 1920]) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: 900, deviceScaleFactor: 1 });
  await p.goto("http://localhost:3000/", { waitUntil: "networkidle0", timeout: 90000 });
  const m = await p.evaluate(() => {
    const bloc = document.querySelector("main section form")?.closest("div[class*='rounded-3xl']");
    const form = document.querySelector("main section form");
    const btn = form?.querySelector("button[type=submit]");
    const rb = bloc?.getBoundingClientRect(), rf = form?.getBoundingClientRect(), rt = btn?.getBoundingClientRect();
    return {
      bloc: rb ? Math.round(rb.left)+" -> "+Math.round(rb.right) : "?",
      form: rf ? Math.round(rf.left)+" -> "+Math.round(rf.right) : "?",
      bouton: rt ? Math.round(rt.left)+" -> "+Math.round(rt.right) : "?",
      debordePx: rb && rt ? Math.round(rt.right - rb.right) : 0,
    };
  });
  console.log(`  ecran ${String(w).padStart(4)} | bloc ${m.bloc.padEnd(14)} | bouton ${m.bouton.padEnd(14)} | depassement ${m.debordePx > 0 ? "+"+m.debordePx+" px  DEFAUT" : "aucun"}`);
  await p.close();
}
await b.close();
