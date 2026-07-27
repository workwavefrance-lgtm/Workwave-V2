/**
 * Convertit le GeoJSON départements simplifié (/tmp/depts.geojson, france-geojson
 * ODbL) en tracés SVG statiques → lib/data/france-departements-paths.ts.
 * Projection simple (aspect-corrigée) adaptée à la métropole. 96 départements.
 */
import fs from "fs";
import path from "path";

const gj = JSON.parse(fs.readFileSync("/tmp/depts.geojson", "utf8"));
const feats = gj.features;

// bbox
let minLon = 1e9, maxLon = -1e9, minLat = 1e9, maxLat = -1e9;
function scanRing(ring) {
  for (const [lon, lat] of ring) {
    if (lon < minLon) minLon = lon; if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
  }
}
function rings(geom) {
  if (geom.type === "Polygon") return geom.coordinates;
  if (geom.type === "MultiPolygon") return geom.coordinates.flat();
  return [];
}
for (const f of feats) for (const r of rings(f.geometry)) scanRing(r);

const meanLat = (minLat + maxLat) / 2;
const kx = Math.cos((meanLat * Math.PI) / 180); // correction largeur
const W = 1000;
const xRange = (maxLon - minLon) * kx;
const scale = W / xRange;
const H = Math.round((maxLat - minLat) * scale);
const px = (lon) => +(((lon - minLon) * kx) * scale).toFixed(1);
const py = (lat) => +(((maxLat - lat) * scale)).toFixed(1);

function ringToPath(ring) {
  let d = "";
  for (let i = 0; i < ring.length; i++) {
    const [lon, lat] = ring[i];
    d += (i === 0 ? "M" : "L") + px(lon) + " " + py(lat);
  }
  return d + "Z";
}

const paths = {};
for (const f of feats) {
  const code = f.properties.code;
  let d = "";
  for (const r of rings(f.geometry)) d += ringToPath(r);
  paths[code] = d;
}

const out =
  `// Tracés SVG des 96 départements métropolitains (GeoJSON simplifié france-geojson, ODbL).\n` +
  `// Généré par scripts/build-france-map.mjs — NE PAS éditer à la main.\n\n` +
  `export const FRANCE_MAP_VIEWBOX = "0 0 ${W} ${H}";\n` +
  `export const FRANCE_DEPT_PATHS: Record<string, string> = ${JSON.stringify(paths)};\n`;
const dest = path.resolve(process.cwd(), "lib/data/france-departements-paths.ts");
fs.writeFileSync(dest, out);
console.log(`viewBox 0 0 ${W} ${H} · ${Object.keys(paths).length} départements · ${Math.round(out.length / 1024)} KB`);
console.log("écrit", dest);
