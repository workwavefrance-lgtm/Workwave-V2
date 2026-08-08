/**
 * VITESSE REELLE DU SITE ENTIER — echantillon aleatoire tire de la base.
 *
 * `bench-site.sh` mesure 6 pages ecrites en dur : ca ne dit rien de 2,5 M de
 * pages. Ici on TIRE AU HASARD de vraies URL dans Supabase, sur chaque type de
 * page, et on mesure la distribution. C'est la seule facon de repondre a
 * "le site va a quelle vitesse" sans mentir.
 *
 * On lit le TTFB (time to first byte) = le temps que met TON SERVEUR a
 * repondre. C'est ce que Google mesure, et ca exclut le reseau du visiteur.
 *
 * On garde la MEDIANE et le 90e centile, jamais la moyenne : un seul appel
 * lent fausse une moyenne, pas une mediane.
 *
 *   npx tsx scripts/vitesse-site.ts           # ~150 pages
 *   npx tsx scripts/vitesse-site.ts 400       # echantillon plus large
 */
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const URL_SB = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BASE = (process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr").replace(/\s+/g, "");
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

const TOTAL = parseInt(process.argv[2] || "150", 10);

async function q<T>(p: string): Promise<T[]> {
  const r = await fetch(`${URL_SB}/rest/v1/${p}`, { headers: H });
  return r.ok ? r.json() : [];
}

/** Tire N elements au hasard dans un tableau. */
function tirer<T>(arr: T[], n: number): T[] {
  const c = [...arr];
  const out: T[] = [];
  while (out.length < n && c.length) out.push(...c.splice(Math.floor(c.length / 2), 1));
  return out;
}

type Mesure = { type: string; url: string; ttfb: number; code: number };

async function mesurer(type: string, url: string): Promise<Mesure> {
  const t0 = performance.now();
  try {
    const r = await fetch(`${BASE}${url}`, {
      headers: { "User-Agent": UA },
      redirect: "manual",
    });
    // On lit le corps : sans ca on mesure l'en-tete, pas la page.
    await r.arrayBuffer();
    return { type, url, ttfb: (performance.now() - t0) / 1000, code: r.status };
  } catch {
    return { type, url, ttfb: -1, code: 0 };
  }
}

function stats(v: number[]) {
  const s = [...v].sort((a, b) => a - b);
  const p = (x: number) => s[Math.min(s.length - 1, Math.floor(s.length * x))];
  return { n: s.length, med: p(0.5), p90: p(0.9), max: s[s.length - 1] };
}

async function main() {
  console.log(`\nVITESSE DU SITE — ${BASE}`);
  console.log("Echantillon aleatoire tire de la base, tous types de pages.\n");

  const par = Math.max(4, Math.floor(TOTAL / 8));
  const urls: { type: string; url: string }[] = [];

  // 1. Fiches pros — le gros du site (~2,4 M pages)
  const pros = await q<{ slug: string }>(
    "pros?is_active=eq.true&deleted_at=is.null&select=slug&limit=1000"
  );
  tirer(pros, par * 2).forEach((p) => urls.push({ type: "fiche pro", url: `/artisan/${p.slug}` }));

  // 2. Listings metier x departement
  const cats = await q<{ slug: string }>("categories?select=slug&limit=200");
  const depts = await q<{ slug: string; code: string; name: string }>(
    "departments?select=code,name&limit=120"
  );
  const deptSlug = (d: { code: string; name: string }) =>
    `${d.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${d.code}`;
  const c1 = tirer(cats, par), d1 = tirer(depts, par);
  for (let i = 0; i < Math.min(c1.length, d1.length); i++)
    urls.push({ type: "metier x dept", url: `/${c1[i].slug}/${deptSlug(d1[i])}` });

  // 3. Listings metier x ville
  const villes = await q<{ slug: string }>("cities?select=slug&order=population.desc&limit=300");
  const c2 = tirer(cats, par), v1 = tirer(villes, par);
  for (let i = 0; i < Math.min(c2.length, v1.length); i++)
    urls.push({ type: "metier x ville", url: `/${c2[i].slug}/${v1[i].slug}` });

  // 4. Guides de prix
  const guides = await q<{ slug: string }>("price_guides?select=slug&limit=300");
  tirer(guides, par).forEach((g) => urls.push({ type: "guide prix", url: `/guide-des-prix/${g.slug}` }));

  // 5. Articles de blog
  const posts = await q<{ slug: string }>("blog_posts?status=eq.published&select=slug&limit=200");
  tirer(posts, Math.floor(par / 2)).forEach((b) => urls.push({ type: "blog", url: `/blog/${b.slug}` }));

  // 6. Pages fixes — celles qui convertissent
  ["/", "/deposer-projet", "/pro", "/recherche?q=plombier", "/departements", "/guide-des-prix", "/blog", "/trouver-des-chantiers"]
    .forEach((u) => urls.push({ type: "page fixe", url: u }));

  console.log(`${urls.length} pages a mesurer (5 en parallele)...\n`);

  // 5 en parallele : assez pour aller vite, pas assez pour fausser la mesure
  // en surchargeant le serveur qu'on est en train de mesurer.
  const res: Mesure[] = [];
  for (let i = 0; i < urls.length; i += 5) {
    res.push(...(await Promise.all(urls.slice(i, i + 5).map((u) => mesurer(u.type, u.url)))));
    process.stdout.write(`\r  ${Math.min(i + 5, urls.length)}/${urls.length}`);
  }
  console.log("\n");

  const ok = res.filter((r) => r.code === 200 && r.ttfb > 0);
  const types = [...new Set(ok.map((r) => r.type))];

  console.log("  TYPE DE PAGE          NB   MEDIANE      90e      PIRE");
  console.log("  " + "-".repeat(54));
  for (const t of types) {
    const s = stats(ok.filter((r) => r.type === t).map((r) => r.ttfb));
    console.log(
      `  ${t.padEnd(20)} ${String(s.n).padStart(3)}   ${s.med.toFixed(3)}s   ${s.p90.toFixed(3)}s   ${s.max.toFixed(3)}s`
    );
  }
  const g = stats(ok.map((r) => r.ttfb));
  console.log("  " + "-".repeat(54));
  console.log(
    `  ${"TOUT LE SITE".padEnd(20)} ${String(g.n).padStart(3)}   ${g.med.toFixed(3)}s   ${g.p90.toFixed(3)}s   ${g.max.toFixed(3)}s`
  );

  const lents = ok.filter((r) => r.ttfb > 1).sort((a, b) => b.ttfb - a.ttfb).slice(0, 8);
  if (lents.length) {
    console.log(`\n  ${lents.length} page(s) au-dessus d'1 seconde :`);
    lents.forEach((r) => console.log(`    ${r.ttfb.toFixed(2)}s  ${r.url}`));
  }

  const pasOk = res.filter((r) => r.code !== 200);
  if (pasOk.length) {
    console.log(`\n  ${pasOk.length} page(s) qui ne repondent pas 200 :`);
    pasOk.slice(0, 10).forEach((r) => console.log(`    ${r.code || "erreur"}  ${r.url}`));
  }

  console.log(
    `\n  Reperes Google : sous 0,8 s = bon · 0,8 a 1,8 s = a ameliorer · au-dela = mauvais\n`
  );
}

main();
