import puppeteer from "puppeteer-core";
const OUT = "/private/tmp/claude-501/-Users-willygauvrit-Desktop-Workwave-V2/7e7a312b-ad81-47aa-837b-91f556f9fefa/scratchpad/captures";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--no-sandbox"] });
for (const [nom, base] of [["cover-avant", "https://workwave.fr"], ["cover-apres", "http://localhost:3210"]]) {
  for (const [suffixe, w, h, mob] of [["", 375, 812, true], ["-desktop", 1280, 900, false]]) {
    const p = await b.newPage();
    await p.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: mob });
    try {
      await p.goto(`${base}/artisan/dawalls-00015`, { waitUntil: "domcontentloaded", timeout: 40000 });
      await pause(3500);
      await p.evaluate(() => { const x=[...document.querySelectorAll("button")].find(e=>/refuser/i.test(e.textContent)); if(x) x.click(); });
      await pause(700);
      const mes = await p.evaluate(() => {
        const d = document.querySelector('div[class*="rounded-2xl"][class*="overflow-hidden"] img');
        return d ? Math.round(d.closest("div").getBoundingClientRect().height) + "px" : "?";
      });
      await p.screenshot({ path: `${OUT}/${nom}${suffixe}.png` });
      console.log(`${nom}${suffixe} : ${mes}`);
    } catch (e) { console.log(`${nom}${suffixe} : ${e.message.slice(0,50)}`); }
    await p.close();
  }
}
await b.close();
