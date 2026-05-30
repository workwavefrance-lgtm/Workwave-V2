// Génère le set favicon Workwave (branché : coral #FF5A36 + "W" blanc).
// Source = un SVG géométrique (W dessiné en path, AUCUNE dépendance police).
// Sorties (conventions de fichiers Next.js, auto-liées par le framework) :
//   app/favicon.ico      (32x32, PNG-in-ICO -> legacy + favicon Google search)
//   app/icon.png         (512x512 -> favicon moderne <link rel="icon">)
//   app/apple-icon.png   (180x180 -> apple-touch-icon, iOS arrondit lui-même)
//
// Lancer : node scripts/_gen-favicons.mjs
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// SVG 512x512 : carré coral plein + "W" blanc épais (zigzag à 5 points).
// W centré : x de 120 à 392 (largeur 272, marges égales) ; sommet milieu à 244
// (entre le haut 150 et les bas 384) => forme de W lisible jusqu'à 16px.
const svg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#FF5A36"/>
  <path d="M120 150 L205 384 L256 244 L307 384 L392 150"
        fill="none" stroke="#FFFFFF" stroke-width="48"
        stroke-linejoin="round" stroke-linecap="round"/>
</svg>`;
const svgBuf = Buffer.from(svg);

async function png(size) {
  return await sharp(svgBuf).resize(size, size).png().toBuffer();
}

// Conteneur ICO minimal embarquant un seul PNG (spec Vista+, lu par tous les
// navigateurs modernes) : ICONDIR(6) + ICONDIRENTRY(16) + PNG.
function pngToIco(pngBuf, size) {
  const header = Buffer.alloc(6 + 16);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type = icon
  header.writeUInt16LE(1, 4); // count = 1
  header.writeUInt8(size >= 256 ? 0 : size, 6); // width
  header.writeUInt8(size >= 256 ? 0 : size, 7); // height
  header.writeUInt8(0, 8); // palette
  header.writeUInt8(0, 9); // reserved
  header.writeUInt16LE(1, 10); // planes
  header.writeUInt16LE(32, 12); // bpp
  header.writeUInt32LE(pngBuf.length, 14); // size of PNG
  header.writeUInt32LE(6 + 16, 18); // offset
  return Buffer.concat([header, pngBuf]);
}

const icon512 = await png(512);
const apple180 = await png(180);
const ico32 = pngToIco(await png(32), 32);

writeFileSync(resolve(ROOT, "app/icon.png"), icon512);
writeFileSync(resolve(ROOT, "app/apple-icon.png"), apple180);
writeFileSync(resolve(ROOT, "app/favicon.ico"), ico32);

console.log("OK :");
console.log("  app/icon.png        ", icon512.length, "bytes (512x512)");
console.log("  app/apple-icon.png  ", apple180.length, "bytes (180x180)");
console.log("  app/favicon.ico     ", ico32.length, "bytes (32x32 PNG-in-ICO)");
