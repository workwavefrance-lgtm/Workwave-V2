/**
 * Mesure la taille reelle du titre sur les appareils courants.
 * Prouve que la typographie fluide suit la largeur de fenetre, sans palier.
 */
import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const APPAREILS = [
  ["iPhone SE / 8", 375],
  ["iPhone 15 / 16", 393],
  ["iPhone 15 Pro Max", 430],
  ["iPad mini (portrait)", 744],
  ["iPad Air (portrait)", 820],
  ["iPad Pro (paysage)", 1024],
  ["MacBook Air 13\"", 1440],
  ["MacBook Pro 16\"", 1728],
  ["ecran externe 1080p", 1920],
  ["ecran 4K / 5K", 2560],
];

const b = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--hide-scrollbars", "--window-size=2560,1400"],
});

console.log("appareil                  ecran   titre    chiffre   debordement");
for (const [nom, w] of APPAREILS) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: 900, deviceScaleFactor: 1 });
  await p.goto("http://localhost:3000/", { waitUntil: "networkidle0", timeout: 90000 });
  const m = await p.evaluate(() => {
    const spans = document.querySelectorAll("h1 span");
    return {
      titre: getComputedStyle(spans[1]).fontSize,
      chiffre: getComputedStyle(spans[0]).fontSize,
      debord: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
  console.log(
    `${nom.padEnd(24)} ${String(w).padStart(5)}  ${m.titre.padStart(7)}  ${m.chiffre.padStart(8)}   ${m.debord ? "OUI (defaut)" : "non"}`
  );
  await p.close();
}
await b.close();
