/**
 * Ping Google Indexing API ciblé sur les pages listing /[metier]/[ville]
 * apres la refonte SEO style Travaux.com (title clickbait + H1 sobre +
 * sections programmatiques + schema Service AggregateRating).
 *
 * Objectif : faire savoir a Google que les pages ont change et qu'il doit
 * recrawler pour rafraichir le cache des titles dans la SERP.
 *
 * Strategie : on prend les combinaisons (cat × ville) avec le plus de
 * pros eligibles, en priorisant :
 *   1. Vienne (86) - notre dept principal
 *   2. Top 12 villes Nouvelle-Aquitaine (prefectures + grandes villes)
 *   3. Departement pages
 *
 * Quota Google : 200/jour. On prend 195.
 *
 * Pre-requis : `gcloud auth application-default login --scopes=https://www.googleapis.com/auth/indexing,https://www.googleapis.com/auth/cloud-platform`
 *
 * Usage :
 *   npx tsx scripts/ping-google-indexing-listings.ts --dry-run
 *   npx tsx scripts/ping-google-indexing-listings.ts
 */
import { config } from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const RATE_LIMIT_MS = 110;
const MAX_URLS = 195;
const BASE = "https://workwave.fr";
const DRY_RUN = process.argv.includes("--dry-run");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Top 30 communes par dept NA (preference forte sur Vienne 86 = notre core)
const PRIORITY_CITIES_VIENNE = [
  "poitiers", "chatellerault", "buxerolles", "loudun", "montmorillon",
  "civray", "lusignan", "neuville-de-poitou", "vouille", "saint-benoit",
  "mignaloux-beauvoir", "migne-auxances", "biard", "ligugé", "fontaine-le-comte",
];
const PRIORITY_CITIES_OTHER_NA = [
  "bordeaux", "limoges", "niort", "angouleme", "la-rochelle",
  "perigueux", "pau", "agen", "mont-de-marsan", "tulle",
  "gueret", "rochefort", "saintes",
];

type ProsByCity = {
  category_slug: string;
  category_name: string;
  city_slug: string;
  city_name: string;
  count: number;
};

async function fetchTopCategoryCityCombos(): Promise<ProsByCity[]> {
  console.log("Fetch top categorie × ville combos...\n");

  // Recupere toutes les categories + tous les pros groupes par (cat, ville)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cats } = await (supabase as any)
    .from("categories")
    .select("id, slug, name");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categories = (cats as any[]) ?? [];

  // Recupere les villes prioritaires de Vienne d'abord, puis NA top
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: viennecities } = await (supabase as any)
    .from("cities")
    .select("id, slug, name, department_id, departments!inner(code)")
    .eq("departments.code", "86")
    .limit(50);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vienneCitiesArr = (viennecities as any[]) ?? [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: othercities } = await (supabase as any)
    .from("cities")
    .select("id, slug, name, department_id, departments!inner(code, name)")
    .in("departments.code", ["33", "87", "79", "16", "17", "24", "40", "47", "64", "19", "23"])
    .in("slug", PRIORITY_CITIES_OTHER_NA);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const otherCitiesArr = (othercities as any[]) ?? [];

  // Concat : Vienne en premier (priorite), puis les autres NA
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cities: any[] = [...vienneCitiesArr, ...otherCitiesArr];
  console.log(`  ${cities.length} villes ciblees (${vienneCitiesArr.length} Vienne + ${otherCitiesArr.length} autres NA)`);

  // Pour chaque ville × catégorie, compte les pros via une requête optimisée
  const combos: ProsByCity[] = [];
  for (const city of cities) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: prosCountByCat } = await (supabase as any).rpc("count_pros_by_cat_city", { p_city_id: city.id });
    // Si la RPC n'existe pas, fallback en query directe
    if (!prosCountByCat) {
      for (const cat of categories) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count } = await (supabase as any)
          .from("pros")
          .select("*", { count: "estimated", head: true })
          .eq("category_id", cat.id)
          .eq("city_id", city.id)
          .eq("is_active", true)
          .is("deleted_at", null);
        if (count && count > 0) {
          combos.push({
            category_slug: cat.slug,
            category_name: cat.name,
            city_slug: city.slug,
            city_name: city.name,
            count,
          });
        }
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const r of prosCountByCat as any[]) {
        if (r.count > 0) {
          const cat = categories.find((c) => c.id === r.category_id);
          if (cat) {
            combos.push({
              category_slug: cat.slug,
              category_name: cat.name,
              city_slug: city.slug,
              city_name: city.name,
              count: r.count,
            });
          }
        }
      }
    }
  }

  // Trie : priorite Vienne en tete, puis par count desc
  combos.sort((a, b) => {
    const aVienne = vienneCitiesArr.some((c) => c.slug === a.city_slug);
    const bVienne = vienneCitiesArr.some((c) => c.slug === b.city_slug);
    if (aVienne && !bVienne) return -1;
    if (!aVienne && bVienne) return 1;
    return b.count - a.count;
  });

  console.log(`  Total combos avec pros : ${combos.length}\n`);
  return combos.slice(0, MAX_URLS);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function pingUrl(client: any, url: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await client.request({
      url: "https://indexing.googleapis.com/v3/urlNotifications:publish",
      method: "POST",
      data: { url, type: "URL_UPDATED" },
    });
    return { ok: res.status === 200 };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    const msg = e?.errors?.[0]?.message || e?.message || String(e);
    return { ok: false, error: msg };
  }
}

async function main() {
  const combos = await fetchTopCategoryCityCombos();
  const urls = combos.map((c) => `${BASE}/${c.category_slug}/${c.city_slug}`);

  if (DRY_RUN) {
    console.log("=== DRY RUN — URLs qui seraient pingées ===\n");
    combos.forEach((c, i) => {
      console.log(
        `  ${(i + 1).toString().padStart(3)}. /${c.category_slug}/${c.city_slug.padEnd(25)} [${c.count} pros] (${c.city_name})`
      );
    });
    console.log(`\nTotal: ${urls.length}\n`);
    return;
  }

  console.log("Authentification ADC...");
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = (await auth.getClient()) as any;
  console.log("✅ Authentifié.\n");

  console.log(`Ping de ${urls.length} listings /[metier]/[ville] (delay ${RATE_LIMIT_MS}ms)...\n`);

  let okCount = 0;
  let failCount = 0;
  const failureReasons = new Map<string, number>();

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const result = await pingUrl(client, url);

    if (result.ok) {
      okCount++;
      const p = url.replace(BASE, "");
      console.log(`\x1b[32m  [${(i + 1).toString().padStart(3)}/${urls.length}] ✓ ${p}\x1b[0m`);
    } else {
      failCount++;
      const reason = (result.error || "unknown").slice(0, 80);
      failureReasons.set(reason, (failureReasons.get(reason) || 0) + 1);
      console.error(
        `\x1b[31m  [${(i + 1).toString().padStart(3)}/${urls.length}] ✗ ${url.replace(BASE, "")} -> ${reason}\x1b[0m`
      );
      if (reason.includes("Quota exceeded") || reason.includes("429") || reason.includes("403")) {
        console.error("\n\x1b[31m⚠️  Erreur fatale (quota ou auth), arrêt.\x1b[0m");
        break;
      }
    }

    if (i < urls.length - 1) await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
  }

  console.log("\n=== Resume ===");
  console.log(`  Total tentés : ${okCount + failCount}`);
  console.log(`  ✓ OK         : \x1b[32m${okCount}\x1b[0m`);
  console.log(`  ✗ Echecs     : \x1b[31m${failCount}\x1b[0m`);

  if (failCount > 0) {
    console.log("\n=== Détail échecs ===");
    Array.from(failureReasons.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([msg, n]) => console.log(`  [${n}] ${msg}`));
  }

  if (okCount > 0) {
    console.log(
      `\n\x1b[32m✓ Google va re-crawler ces ${okCount} listings dans les prochaines heures.\nLe nouveau title clickbait + H1 sobre + sections SEO seront servis.\x1b[0m`
    );
  }
}

main().catch((e) => {
  console.error("\n\x1b[31m❌ Erreur fatale:\x1b[0m", e);
  process.exit(1);
});
