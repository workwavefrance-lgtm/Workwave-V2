const BASE = "https://workwave.fr";
async function art(u: string): Promise<string[]> {
  try { const r = await fetch(BASE + u, { redirect: "manual" }); if (r.status !== 200) return [];
    const h = await r.text(); const s = new Set<string>();
    for (const m of h.matchAll(/href="(\/artisan\/[^"]+)"/g)) { const x = m[1].split("?")[0]; if (!x.endsWith("/supprimer")) s.add(x); }
    return [...s]; } catch { return []; }
}
async function main() {
  for (const start of ["/plombier/paris", "/macon/lyon", "/menage/marseille"]) {
    const depart = await art(start);
    const vus = new Set(depart); let front = depart; let saut = 0;
    while (front.length && saut < 5) {
      saut++;
      const nouveau: string[] = [];
      for (let i = 0; i < front.length && i < 80; i += 8) {
        const res = await Promise.all(front.slice(i, i + 8).map(art));
        for (const ls of res) for (const l of ls) if (!vus.has(l)) { vus.add(l); nouveau.push(l); }
      }
      console.log(`${start} saut${saut}: +${nouveau.length} cumul ${vus.size}`);
      front = nouveau;
    }
    console.log(`${start} => ferme a ${vus.size} fiches distinctes en partant de ${depart.length}\n`);
  }
}
main();
