// Construit un corpus de liens sortants a partir d un echantillon representatif
// de pages, puis teste quelles familles du sitemap n ont AUCUN lien entrant.
const BASE = "https://workwave.fr";

async function hrefs(u: string): Promise<string[]> {
  try {
    const r = await fetch(BASE + u, { redirect: "manual" });
    if (r.status !== 200) return [];
    const h = await r.text();
    const s = new Set<string>();
    for (const m of h.matchAll(/href="([^"]+)"/g)) {
      let x = m[1];
      if (x.startsWith(BASE)) x = x.slice(BASE.length);
      if (!x.startsWith("/") || x.startsWith("/_next")) continue;
      s.add(x.split("?")[0].split("#")[0]);
    }
    return [...s];
  } catch { return []; }
}

async function sitemapUrls(n: string): Promise<string[]> {
  const r = await fetch(`${BASE}/sitemap/${n}.xml`);
  const t = await r.text();
  return [...t.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace(BASE, ""));
}

function famille(u: string): string {
  const p = u.split("/").filter(Boolean);
  if (u.startsWith("/artisan/")) return "/artisan/[slug]";
  if (u.startsWith("/guide-des-prix/")) return "/guide-des-prix/[slug]";
  if (u.startsWith("/trouver-des-chantiers/")) return /-\d{2,3}$|-[a-z]{3}$/.test(p[1]) ? "/trouver-des-chantiers/[dept]" : "/trouver-des-chantiers/[metier]";
  if (u.startsWith("/trouver-des-clients/")) return "/trouver-des-clients/[slug]";
  if (u.startsWith("/blog/")) return "/blog/[slug]";
  if (u.startsWith("/ai") || u.startsWith("/en/")) return "(ai)";
  if (u.startsWith("/pro")) return "/pro*";
  if (p.length === 1) return "/[metier] ou page fixe";
  if (p.length === 2) {
    if (["guide","prix","urgence","installation","obligation","location-saisonniere"].includes(p[1])) return `/[metier]/${p[1]} (pilier)`;
    return /-\d{2,3}$|-[a-z]{3}$/.test(p[1]) ? "/[metier]/[dept]" : "/[metier]/[ville]";
  }
  if (p.length === 3) {
    if (["urgence","installation","obligation","location-saisonniere"].includes(p[1])) return `/[metier]/${p[1]}/[ville]`;
    return "/[metier]/[specialite]/[ville]";
  }
  return "autre";
}

async function main() {
  // Corpus : home + tous les liens de la home + hubs + 40 listings + 20 fiches + piliers
  const corpus = new Set<string>(["/"]);
  for (const u of await hrefs("/")) corpus.add(u);
  for (const u of ["/departements","/guide-des-prix","/blog","/trouver-des-chantiers","/trouver-des-clients","/recherche","/pro","/verifier-artisan","/barometre-artisans","/plombier","/menage","/serrurier","/ramoneur","/climaticien"]) corpus.add(u);
  const sm2 = await sitemapUrls("2");
  for (let i = 0; i < 40; i++) corpus.add(sm2[Math.floor(Math.random() * sm2.length)]);
  const sm3 = await sitemapUrls("3");
  for (let i = 0; i < 10; i++) corpus.add(sm3[Math.floor(Math.random() * sm3.length)]);
  const sm1 = await sitemapUrls("1");
  for (let i = 0; i < 20; i++) corpus.add(sm1[Math.floor(Math.random() * sm1.length)]);
  const sm0 = await sitemapUrls("0");
  for (const u of sm0.filter(x => x.split("/").length === 3 && ["guide","prix","urgence","installation","obligation","location-saisonniere"].includes(x.split("/")[2]))) corpus.add(u);
  for (const u of sm0.filter(x => x.startsWith("/guide-des-prix/")).slice(0, 5)) corpus.add(u);
  for (const u of sm0.filter(x => x.startsWith("/trouver-des-chantiers/")).slice(0, 5)) corpus.add(u);
  const smFiches = await sitemapUrls("100");
  for (let i = 0; i < 20; i++) corpus.add(smFiches[Math.floor(Math.random() * smFiches.length)]);

  const liste = [...corpus].filter(u => !u.includes(".") && !u.startsWith("/en/"));
  console.log("pages du corpus telechargees :", liste.length);

  const sortants = new Set<string>();
  for (let i = 0; i < liste.length; i += 12) {
    const res = await Promise.all(liste.slice(i, i + 12).map(hrefs));
    for (const ls of res) for (const l of ls) sortants.add(l);
  }
  console.log("liens sortants distincts collectes :", sortants.size);

  // Familles presentes dans le sitemap et couverture par les liens collectes
  const parFam = new Map<string, { total: number; lies: number; exemplesNonLies: string[] }>();
  const tous = [...sm0, ...sm1, ...sm2, ...sm3];
  for (const u of tous) {
    const f = famille(u);
    const e = parFam.get(f) || { total: 0, lies: 0, exemplesNonLies: [] };
    e.total++;
    if (sortants.has(u)) e.lies++;
    else if (e.exemplesNonLies.length < 2) e.exemplesNonLies.push(u);
    parFam.set(f, e);
  }
  console.log("\n=== couverture par famille (sitemaps 0..3) ===");
  console.log("famille | urls_sitemap | liees_par_le_corpus | exemples_non_lies");
  for (const [f, e] of [...parFam].sort((a, b) => b[1].total - a[1].total)) {
    console.log(`${f} | ${e.total} | ${e.lies} | ${e.exemplesNonLies.join(" ")}`);
  }
}
main();
