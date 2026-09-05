import puppeteer from "puppeteer-core";
const OUT = "/private/tmp/claude-501/-Users-willygauvrit-Desktop-Workwave-V2/7e7a312b-ad81-47aa-837b-91f556f9fefa/scratchpad/captures";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--no-sandbox"] });
for (const [nom, slug] of [["pro", "dawalls-00015"], ["google", "er-carrelage-00019"]]) {
  const p = await b.newPage();
  await p.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true });
  try {
    await p.goto(`http://localhost:3210/artisan/${slug}`, { waitUntil: "domcontentloaded", timeout: 40000 });
    await pause(3500);
    const h = await p.evaluate(() => {
      const f = document.querySelector("figure img");
      if (!f) return "pas de galerie";
      f.scrollIntoView({ block: "center" });
      return Math.round(f.getBoundingClientRect().height) + "px";
    });
    await pause(1200);
    await p.screenshot({ path: `${OUT}/gal-${nom}.png` });
    console.log(`${nom.padEnd(8)} ${slug.padEnd(20)} hauteur rendue : ${h}`);
  } catch (e) { console.log(`${nom} : ${e.message.slice(0, 60)}`); }
  await p.close();
}
await b.close();
