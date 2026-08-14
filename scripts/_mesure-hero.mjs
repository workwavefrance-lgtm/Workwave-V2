import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox","--hide-scrollbars","--window-size=2560,1400"] });
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
await p.goto("http://localhost:3000/", { waitUntil: "networkidle0", timeout: 90000 });
const m = await p.evaluate(() => {
  const sec = document.querySelector("main section");
  const img = sec.querySelector("img");
  const box = img.parentElement.getBoundingClientRect();
  return {
    sectionH: Math.round(sec.getBoundingClientRect().height),
    conteneurImg: Math.round(box.width) + "x" + Math.round(box.height),
    ratioConteneur: (box.width / box.height).toFixed(2),
    imgNaturelle: img.naturalWidth + "x" + img.naturalHeight,
    ratioImage: (img.naturalWidth / img.naturalHeight).toFixed(2),
  };
});
console.log("  hauteur de la section :", m.sectionH, "px");
console.log("  conteneur image       :", m.conteneurImg, "ratio", m.ratioConteneur);
console.log("  image source          :", m.imgNaturelle, "ratio", m.ratioImage);
const z = (parseFloat(m.ratioConteneur) > parseFloat(m.ratioImage))
  ? "l'image est agrandie pour couvrir la LARGEUR -> zoom vertical"
  : "l'image est agrandie pour couvrir la HAUTEUR -> zoom horizontal";
console.log("  ->", z);
await b.close();
