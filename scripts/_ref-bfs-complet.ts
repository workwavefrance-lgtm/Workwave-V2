const BASE = "https://workwave.fr";
const EXCLU = /^\/(api|admin|auth|_next)|\/supprimer$|\.(png|ico|css|js|woff2|webmanifest|xml|txt)$/;
async function liens(u: string): Promise<string[]> {
  try {
    const r = await fetch(BASE + u, { redirect: "manual" });
    if (r.status !== 200) return [];
    const h = await r.text();
    const s = new Set<string>();
    for (const m of h.matchAll(/href="(\/[^"#]*)"/g)) {
      const x = m[1].split("?")[0];
      if (!x || EXCLU.test(x)) continue;
      s.add(x);
    }
    return [...s];
  } catch { return []; }
}
(async () => {
  // BFS en suivant TOUS les liens internes (pas seulement /artisan/)
  const vus = new Set<string>(["/plombier/paris"]);
  let front = ["/plombier/paris"];
  for (let saut = 1; saut <= 3; saut++) {
    const nouveau: string[] = [];
    const lot = front.slice(0, 60); // plafond de politesse
    for (let i = 0; i < lot.length; i += 10) {
      const res = await Promise.all(lot.slice(i, i + 10).map(liens));
      for (const ls of res) for (const l of ls) if (!vus.has(l)) { vus.add(l); nouveau.push(l); }
    }
    const fiches = [...vus].filter(x => x.startsWith("/artisan/")).length;
    console.log(`saut ${saut} (${lot.length} pages lues) : +${nouveau.length} URL, cumul ${vus.size} URL dont ${fiches} fiches /artisan`);
    front = nouveau;
    if (!front.length) break;
  }
  const listings = [...vus].filter(x => !x.startsWith("/artisan/"));
  console.log(`\nURL non-fiches atteintes (listings, guides, communes...) : ${listings.length}`);
  console.log("exemples :", listings.slice(0, 12).join(" "));
})();
