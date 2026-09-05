// Parcours en largeur depuis la home, profondeur limitee, pour mesurer la distance en clics.
const BASE = "https://workwave.fr";
const MAX_DEPTH = Number(process.env.MAXD || 3);
const MAX_FETCH = Number(process.env.MAXF || 700);

const CIBLES = (process.env.CIBLES || "").split(",").filter(Boolean);

const vus = new Map<string, number>(); // url -> profondeur
let fetched = 0;

function normalise(h: string): string | null {
  if (!h) return null;
  if (h.startsWith("https://workwave.fr")) h = h.slice("https://workwave.fr".length);
  if (!h.startsWith("/")) return null;
  h = h.split("#")[0].split("?")[0];
  if (h.startsWith("/_next") || /^\/(favicon|icon|apple-icon|manifest|robots|sitemap)/.test(h)) return null;
  if (h.endsWith(".xml") || h.endsWith(".txt") || h.endsWith(".png") || h.endsWith(".ico")) return null;
  if (h.length > 1 && h.endsWith("/")) h = h.slice(0, -1);
  return h || "/";
}

async function liens(u: string): Promise<string[]> {
  try {
    const r = await fetch(BASE + u, { headers: { "user-agent": "Mozilla/5.0 (compatible; mesure-maillage)" } });
    if (!r.ok) return [];
    const html = await r.text();
    const out = new Set<string>();
    for (const m of html.matchAll(/href="([^"]+)"/g)) {
      const n = normalise(m[1]);
      if (n) out.add(n);
    }
    return [...out];
  } catch { return []; }
}

async function main() {
  let front = ["/"];
  vus.set("/", 0);
  for (let d = 0; d < MAX_DEPTH; d++) {
    const suivant: string[] = [];
    // paralleliser par paquets de 10
    for (let i = 0; i < front.length; i += 10) {
      if (fetched >= MAX_FETCH) break;
      const lot = front.slice(i, i + 10);
      const res = await Promise.all(lot.map(async (u) => { fetched++; return [u, await liens(u)] as const; }));
      for (const [, ls] of res) {
        for (const l of ls) {
          if (!vus.has(l)) { vus.set(l, d + 1); suivant.push(l); }
        }
      }
    }
    console.log(`profondeur ${d + 1}: ${suivant.length} nouvelles URL decouvertes, cumul ${vus.size}, pages telechargees ${fetched}`);
    front = suivant;
    if (fetched >= MAX_FETCH) { console.log("plafond de telechargements atteint"); break; }
  }

  // repartition par type
  const parType = new Map<string, { n: number; minD: number }>();
  for (const [u, d] of vus) {
    let t = "autre";
    if (u === "/") t = "home";
    else if (u.startsWith("/artisan/")) t = "/artisan/*";
    else if (u.startsWith("/guide-des-prix")) t = "/guide-des-prix/*";
    else if (u.startsWith("/trouver-des-chantiers")) t = "/trouver-des-chantiers/*";
    else if (u.startsWith("/trouver-des-clients")) t = "/trouver-des-clients/*";
    else if (u.startsWith("/blog")) t = "/blog/*";
    else if (u.startsWith("/barometre")) t = "/barometre-*";
    else if (u.startsWith("/ai")) t = "/ai/*";
    else if (u.startsWith("/pro")) t = "/pro*";
    else if (/\/page\/\d+$/.test(u)) t = "pagination";
    else if (u.split("/").length === 3 && /-\d{2,3}$|-[a-z]{3}$/.test(u.split("/")[2])) t = "/[metier]/[dept]";
    else if (u.split("/").length === 3) t = "/[metier]/[ville]";
    else if (u.split("/").length === 2) t = "/[metier] (racine)";
    else if (u.split("/").length === 4) t = "/[metier]/[spe]/[ville]";
    const e = parType.get(t) || { n: 0, minD: 99 };
    e.n++; e.minD = Math.min(e.minD, d);
    parType.set(t, e);
  }
  console.log("\n=== URL decouvertes par type (profondeur min en clics depuis la home) ===");
  for (const [t, e] of [...parType].sort((a, b) => b[1].n - a[1].n)) {
    console.log(`${String(e.n).padStart(6)}  profMin=${e.minD}  ${t}`);
  }
  for (const c of CIBLES) {
    console.log(`CIBLE ${c} -> ${vus.has(c) ? "atteinte a la profondeur " + vus.get(c) : "NON atteinte en " + MAX_DEPTH + " clics"}`);
  }
}
main();
