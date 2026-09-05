import puppeteer from "puppeteer-core";
const OUT = "/private/tmp/claude-501/-Users-willygauvrit-Desktop-Workwave-V2/7e7a312b-ad81-47aa-837b-91f556f9fefa/scratchpad/captures";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true });
await p.goto("http://localhost:3210/deposer-projet", { waitUntil: "networkidle2", timeout: 60000 });
await pause(1100);
await p.evaluate(() => {
  const el = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Bâtiment et travaux"));
  if (el) el.click();
});
await pause(900);
await p.screenshot({ path: OUT + "/multi-0-avant-clic.png" });
const txt = await p.evaluate(() => document.body.innerText);
console.log("phrase presente :", txt.includes("un ou plusieurs métiers"));
await b.close();
