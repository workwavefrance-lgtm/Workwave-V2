import puppeteer from "puppeteer-core";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--no-sandbox"] });
for (const [nom, base] of [["AVANT (prod)", "https://workwave.fr"], ["APRES (local)", "http://localhost:3210"]]) {
  const p = await b.newPage();
  await p.setViewport({ width: 1280, height: 900 });
  const rsc = new Set();
  p.on("request", (r) => { if (r.url().includes("_rsc=")) rsc.add(r.url().split("?")[0]); });
  try {
    await p.goto(`${base}/`, { waitUntil: "networkidle2", timeout: 45000 });
    await pause(4000);
    // simule un survol de la barre de navigation, ce qui declenche le prefetch "auto"
    await p.evaluate(() => window.scrollTo(0, 300));
    await pause(2500);
    console.log(`${nom.padEnd(16)} ${rsc.size} page(s) prechargee(s)`);
    if (rsc.size) [...rsc].slice(0, 6).forEach((u) => console.log("      " + u.replace(base, "")));
  } catch (e) { console.log(`${nom} : ${e.message.slice(0, 50)}`); }
  await p.close();
}
await b.close();
