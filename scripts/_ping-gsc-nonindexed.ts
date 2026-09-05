/**
 * Ping Google Indexing API : ciblé "Explorée, actuellement non indexée" (GSC 06/07/2026).
 *
 * Sources d'URLs (dans l'ordre de priorité) :
 *   1. Le nouvel article blog du jour (contenu frais)
 *   2. Les URLs EXACTES vues dans les exemples du rapport GSC (confirmées non indexées)
 *   3. Remplissage du quota avec les listings cat×ville du sitemap/2.xml (pages
 *      programmatiques riches : prix sourcés + marché + pros, meilleures chances d'indexation)
 *
 * RÈGLE (leçon 06/06) : chaque URL est vérifiée HTTP 200 AVANT ping. Redirect/404 = skip.
 *
 * Pré-requis : ADC avec scope indexing (déjà configuré).
 * Quota : 200/jour → on prend 195.
 *
 * Usage : npx tsx scripts/_ping-gsc-nonindexed.ts [--dry-run]
 */
import { config } from "dotenv";
import * as path from "path";
import { google } from "googleapis";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const RATE_LIMIT_MS = 110;
const MAX_URLS = 195;
const BASE = "https://workwave.fr";
const DRY_RUN = process.argv.includes("--dry-run");

// 1 + 2 : article du jour + exemples exacts du rapport GSC (screenshots 06/07)
const PRIORITY_PATHS = [
  "/blog/aides-anah-en-dordogne-maprimerenov-et-subventions-2026-pour-votre-chauffage",
  "/artisan/sarl-francis-noirt-00014",
  "/architecte/saint-vivien",
  "/accompagnement-handicap/saint-vincent-de-tyrosse",
  "/artisan/sarl-gobin-constructions-00022",
  "/accompagnement-handicap/sainte-livrade-sur-lot",
  "/artisan/laurent-de-guglielmi-00012",
  "/artisan/eryma-telesurveillance-00072",
  "/videosurveillance-installateur/lesigny",
  "/artisan/vauzelle-elagage-00020",
  "/facadier/migne-auxances",
  "/couvreur/domme",
  "/garde-animaux/nanteuil",
  "/elagueur/razac-sur-l-isle",
  "/artisan/arnaud-laguerre-00014",
  "/peintre/garat",
  "/artisan/sidsel-hak-00011",
  "/carreleur/tonnay-charente",
  "/artisan/sarl-eric-beauvilain-00016",
  "/artisan/alexandre-de-almeida-00013",
  "/charpentier/viellesegure",
  "/artisan/centre-communal-d-action-sociale-00021bb",
  "/videosurveillance-installateur/capbreton",
  "/artisan/sas-3a-services-plus-00010",
  "/artisan/marasli-facade-00016",
  "/artisan/herve-brugeron-00016",
  "/artisan/aurelie-bayrand-00011",
  "/artisan/sarl-mazurier-j-et-b-00013",
  "/artisan/coordination-regionale-des-actions-de-proximite-de-lutte-contre-l-illetrisme-et-d-acces-aux-savoirs-00015",
  "/macon/aubigny-les-clouzeaux",
  "/charpentier/saint-laurent-bretagne",
  "/menuisier/couzeix",
  "/artisan/michel-noel-00014",
  "/artisan/jean-francois-girard-00087",
  "/artisan/lacampagne-00016",
  "/artisan/atmosph-air-confort-00014",
  "/artisan/accueil-periscolaire-centre-de-loisirs-cersay-st-pierre-a-champ-00022",
  "/chauffagiste/la-creche",
];

const UA = "Mozilla/5.0 (compatible; WorkwavePingCheck/1.0)";

async function checkStatus(url: string): Promise<number> {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "manual", headers: { "user-agent": UA } });
    return res.status;
  } catch {
    return 0;
  }
}

/** Vérifie une liste d'URLs en parallèle (concurrence 10), renvoie celles en 200. */
async function filterOk(urls: string[]): Promise<{ ok: string[]; skipped: { url: string; status: number }[] }> {
  const ok: string[] = [];
  const skipped: { url: string; status: number }[] = [];
  const queue = [...urls];
  async function worker() {
    while (queue.length) {
      const url = queue.shift()!;
      const status = await checkStatus(url);
      if (status === 200) ok.push(url);
      else skipped.push({ url, status });
    }
  }
  await Promise.all(Array.from({ length: 10 }, worker));
  // Préserver l'ordre d'origine
  const okSet = new Set(ok);
  return { ok: urls.filter((u) => okSet.has(u)), skipped };
}

async function fetchSitemapListings(exclude: Set<string>, needed: number): Promise<string[]> {
  console.log(`Remplissage quota : fetch sitemap/2.xml (listings cat×ville)...`);
  const res = await fetch(`${BASE}/sitemap/2.xml`, { headers: { "user-agent": UA } });
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => !exclude.has(u));
  console.log(`  ${urls.length} URLs dans le sitemap, on en prend ~${needed} (vérif 200 incluse).`);
  // On en checke un peu plus que nécessaire pour compenser les skips
  return urls.slice(0, Math.ceil(needed * 1.2));
}

async function main() {
  // 1. URLs prioritaires (GSC), vérif 200
  const priorityUrls = PRIORITY_PATHS.map((p) => `${BASE}${p}`);
  console.log(`Vérification HTTP des ${priorityUrls.length} URLs prioritaires (GSC)...`);
  const pri = await filterOk(priorityUrls);
  pri.skipped.forEach((s) => console.log(`  ⏭  SKIP [${s.status}] ${s.url.replace(BASE, "")}`));
  console.log(`  ✓ ${pri.ok.length}/${priorityUrls.length} en 200.\n`);

  // 2. Remplissage avec le sitemap listings
  const needed = MAX_URLS - pri.ok.length;
  const fillCandidates = await fetchSitemapListings(new Set(pri.ok), needed);
  const fill = await filterOk(fillCandidates);
  const fillOk = fill.ok.slice(0, needed);
  if (fill.skipped.length) console.log(`  ⏭  ${fill.skipped.length} skips (non-200) dans le remplissage.`);
  console.log(`  ✓ ${fillOk.length} listings ajoutés.\n`);

  const urls = [...pri.ok, ...fillOk];
  console.log(`TOTAL à pinger : ${urls.length}\n`);

  if (DRY_RUN) {
    urls.forEach((u, i) => console.log(`  ${(i + 1).toString().padStart(3)}. ${u.replace(BASE, "")}`));
    return;
  }

  console.log("Authentification ADC...");
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/indexing"] });
  const client = (await auth.getClient()) as Parameters<typeof google.indexing>[0] extends never ? never : object;
  console.log("✅ Authentifié.\n");

  let okCount = 0;
  let failCount = 0;
  const failureReasons = new Map<string, number>();

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      const res = await google.indexing("v3").urlNotifications.publish({
        auth: client as never,
        requestBody: { url, type: "URL_UPDATED" },
      });
      if (res.status === 200) {
        okCount++;
        console.log(`\x1b[32m  [${(i + 1).toString().padStart(3)}/${urls.length}] ✓ ${url.replace(BASE, "")}\x1b[0m`);
      } else {
        failCount++;
      }
    } catch (e) {
      failCount++;
      const err = e as { errors?: { message?: string }[]; message?: string };
      const reason = (err?.errors?.[0]?.message || err?.message || String(e)).slice(0, 80);
      failureReasons.set(reason, (failureReasons.get(reason) || 0) + 1);
      console.error(`\x1b[31m  [${(i + 1).toString().padStart(3)}/${urls.length}] ✗ ${url.replace(BASE, "")} -> ${reason}\x1b[0m`);
      if (reason.includes("Quota exceeded") || reason.includes("429")) {
        console.error("\n⚠️ Quota atteint, arrêt.");
        break;
      }
    }
    if (i < urls.length - 1) await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
  }

  console.log("\n=== Résumé ===");
  console.log(`  ✓ OK     : ${okCount}`);
  console.log(`  ✗ Échecs : ${failCount}`);
  if (failureReasons.size) {
    Array.from(failureReasons.entries()).forEach(([m, n]) => console.log(`  [${n}] ${m}`));
  }
}

main().catch((e) => {
  console.error("❌ Erreur fatale:", e);
  process.exit(1);
});
