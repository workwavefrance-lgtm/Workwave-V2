/**
 * Pre-warm les sub-sitemaps pour les maintenir en hot cache Vercel.
 *
 * Probleme resolu : sub-sitemaps en cold cache prennent ~12s a se generer
 * (45k URLs chacun). Googlebot timeout vers 5-10s → "0 URL envoyees" en GSC
 * malgre que les sub-sitemaps marchent techniquement.
 *
 * Solution : ce script tourne dans le cron quotidien (10h05 chaque matin)
 * juste avant que Google fasse son crawl matinal. Il fetch les 22+ sub-sitemaps
 * pour les pre-warm. Apres ca, Google les fetch en 0,4s (hot cache HIT).
 *
 * Strategie :
 *  1. Fetch sitemap-index.xml pour decouvrir les sub-sitemaps
 *  2. Fetch chacun en parallele (groupes de 5 pour pas saturer Vercel)
 *  3. Log temps de fetch pour visibilite
 *
 * Si on detecte des sub-sitemaps lents persistants, c'est qu'il y a un bug
 * de perf BDD (ex: PostgREST cap 1000 rows, count exact, etc.) — cf. lecons
 * CLAUDE.md 29/04 et 30/04 sur les bugs sitemap historiques.
 */
import { config } from "dotenv";
import * as path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const BASE = "https://workwave.fr";
const USER_AGENT = "WorkwaveSitemapWarmer/1.0";
const PARALLEL = 5; // 5 fetch en parallele pour pas saturer Vercel

async function fetchWithTime(url: string): Promise<{ url: string; status: number; time: number; size: number }> {
  const start = Date.now();
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/xml,text/xml" },
    });
    const text = await r.text();
    return {
      url,
      status: r.status,
      time: Date.now() - start,
      size: text.length,
    };
  } catch (e) {
    return {
      url,
      status: 0,
      time: Date.now() - start,
      size: 0,
    };
  }
}

async function main() {
  console.log(`=== Pre-warm sitemap cache (${new Date().toISOString()}) ===`);

  // 1. Fetch index
  const indexUrl = `${BASE}/sitemap-index.xml`;
  console.log(`\n1. Fetch index: ${indexUrl}`);
  const indexResult = await fetchWithTime(indexUrl);
  console.log(`   ${indexResult.status} | ${indexResult.time}ms | ${Math.round(indexResult.size / 1024)}KB`);

  if (indexResult.status !== 200) {
    console.error("ERREUR : index sitemap non-OK. Abandon.");
    process.exit(1);
  }

  // 2. Re-fetch index pour avoir le contenu (le 1er fetch a pre-warm)
  const r = await fetch(indexUrl, { headers: { "User-Agent": USER_AGENT } });
  const xml = await r.text();
  const subUrls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
  console.log(`\n2. ${subUrls.length} sub-sitemaps a pre-warm`);

  // 3. Fetch sub-sitemaps en parallele (chunks de PARALLEL)
  const results: Array<{ url: string; status: number; time: number; size: number }> = [];
  for (let i = 0; i < subUrls.length; i += PARALLEL) {
    const chunk = subUrls.slice(i, i + PARALLEL);
    const chunkResults = await Promise.all(chunk.map((u) => fetchWithTime(u)));
    for (const res of chunkResults) {
      const path = res.url.replace(BASE, "");
      const sizeKb = Math.round(res.size / 1024);
      const flag = res.time > 5000 ? "SLOW" : res.time > 2000 ? "warm" : "hot";
      console.log(`   [${flag}] ${path} : ${res.status} | ${res.time}ms | ${sizeKb}KB`);
      results.push(res);
    }
  }

  // 4. Summary
  const total = results.length;
  const ok = results.filter((r) => r.status === 200).length;
  const slow = results.filter((r) => r.time > 5000).length;
  const avgTime = Math.round(results.reduce((s, r) => s + r.time, 0) / total);
  console.log(`\n=== Resume ===`);
  console.log(`Sub-sitemaps : ${ok}/${total} OK`);
  console.log(`Lents (>5s)  : ${slow}`);
  console.log(`Moyenne      : ${avgTime}ms`);

  if (slow > 0) {
    console.log(`\nATTENTION : ${slow} sub-sitemaps lents. Le cron tournera quand meme, mais Google peut timeout dessus.`);
    console.log(`Action : verifier app/sitemap.ts pour optimiser (cf. lecons CLAUDE.md 29/04 et 30/04).`);
  }
}

main().catch((e) => {
  console.error("Crash :", e instanceof Error ? e.message : e);
  process.exit(1);
});
