import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new", args: ["--no-sandbox","--force-device-scale-factor=1","--hide-scrollbars"],
});
const p = await b.newPage();
await p.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
await p.goto("http://localhost:8877/../rituel/typo/carte.html", { waitUntil: "networkidle0" }).catch(()=>{});
await p.goto("file:///Users/willygauvrit/Desktop/Workwave-V2/marketing/rituel/typo/carte.html", { waitUntil: "networkidle0" });
for (const k of ["c2","c3","c4","c5","c6"]) {
  await p.evaluate((kk) => window.poser(kk), k);
  await p.screenshot({ path: `marketing/rituel/typo/${k}.png`, omitBackground: true,
    clip: { x:0, y:0, width:1080, height:1920 } });
  console.log("  " + k + ".png");
}
await b.close(); process.exit(0);
