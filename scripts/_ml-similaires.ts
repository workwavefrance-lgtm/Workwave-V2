// Mesure l expansion du graphe "pros similaires" a partir de fiches deja atteignables.
const BASE = "https://workwave.fr";
async function liensArtisan(u: string): Promise<string[]> {
  try {
    const r = await fetch(BASE + u, { redirect: "manual" });
    if (r.status !== 200) return [];
    const html = await r.text();
    const s = new Set<string>();
    for (const m of html.matchAll(/href="(\/artisan\/[^"]+)"/g)) {
      const h = m[1].split("?")[0].split("#")[0];
      if (!h.endsWith("/supprimer")) s.add(h);
    }
    return [...s];
  } catch { return []; }
}
async function main() {
  // depart : les fiches liees depuis la home
  const r = await fetch(BASE + "/");
  const html = await r.text();
  const depart = [...new Set([...html.matchAll(/href="(\/artisan\/[^"]+)"/g)].map(m => m[1]))].slice(0, 12);
  console.log("fiches de depart (liees depuis la home) :", depart.length);
  const vus = new Set(depart);
  let front = depart;
  for (let d = 1; d <= 4; d++) {
    const nouveau: string[] = [];
    for (let i = 0; i < front.length && i < 60; i += 8) {
      const lot = front.slice(i, i + 8);
      const res = await Promise.all(lot.map(liensArtisan));
      for (const ls of res) for (const l of ls) if (!vus.has(l)) { vus.add(l); nouveau.push(l); }
    }
    console.log(`saut ${d} : +${nouveau.length} fiches nouvelles, cumul ${vus.size} (front traite: ${Math.min(front.length,60)})`);
    front = nouveau;
    if (!nouveau.length) break;
  }
}
main();
