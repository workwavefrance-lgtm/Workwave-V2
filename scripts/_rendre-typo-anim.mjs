import puppeteer from "puppeteer-core";
import fs from "fs";
// Chaque carte est rendue en suite d images transparentes : c est la seule
// facon d obtenir une vraie animation (montee, nettete, resserrement) plutot
// qu un fondu plat.
const CARTES = [
  { k:"c1", dur:2800, sortie:2100 },
  { k:"c2", dur:3200, sortie:2450 },
  { k:"c3", dur:3600, sortie:2850 },
  { k:"c4", dur:3600, sortie:2900 },
  { k:"c5", dur:3000, sortie:2300 },
  { k:"c6", dur:3800, sortie:null },
];
const FPS = 30;
const b = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new", args: ["--no-sandbox","--force-device-scale-factor=1","--hide-scrollbars"],
});
const p = await b.newPage();
await p.setViewport({ width:1080, height:1920, deviceScaleFactor:1 });
await p.goto("file:///Users/willygauvrit/Desktop/Workwave-V2/marketing/rituel/typo/anim.html", { waitUntil:"networkidle0" });
for (const c of CARTES) {
  const dir = `marketing/rituel/typo/${c.k}`;
  fs.rmSync(dir, { recursive:true, force:true, maxRetries:20, retryDelay:150 });
  fs.mkdirSync(dir, { recursive:true });
  await p.evaluate((k,d,s)=>window.poser(k,d,s), c.k, c.dur, c.sortie);
  const n = Math.ceil(c.dur / (1000/FPS));
  for (let i=0;i<n;i++){
    await p.evaluate((t)=>window.rendre(t), i*(1000/FPS));
    await p.screenshot({ path:`${dir}/f${String(i).padStart(4,"0")}.png`, omitBackground:true,
      clip:{x:0,y:0,width:1080,height:1920} });
  }
  console.log(`  ${c.k} : ${n} images`);
}
await b.close(); process.exit(0);
