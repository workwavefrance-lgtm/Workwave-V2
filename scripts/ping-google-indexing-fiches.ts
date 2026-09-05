/**
 * Ping Google Indexing API ciblé sur les fiches /artisan/* prioritaires.
 *
 * Différence vs `ping-google-indexing.ts` (qui pinge depuis sitemap/0+1) :
 * ici on requête Supabase pour sélectionner les ~200 fiches "les plus
 * indexables" : celles qui ont le plus de chances d'être indexées par Google
 * après re-crawl :
 *   1. Réclamées (claimed_by_user_id NOT NULL)
 *   2. Avec description enrichie
 *   3. Avec logo ou photos
 *   4. Avec phone OU email
 *   5. Fallback : fiches du dept Vienne (86) avec le plus de signaux
 *
 * Pré-requis identique : `gcloud auth application-default login --scopes=
 * https://www.googleapis.com/auth/indexing,https://www.googleapis.com/auth/cloud-platform`
 *
 * Quota : 200/jour (on prend 195 pour garder 5 de marge).
 *
 * Usage :
 *   npx tsx scripts/ping-google-indexing-fiches.ts             # ping
 *   npx tsx scripts/ping-google-indexing-fiches.ts --dry-run   # liste sans pinger
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

type Pro = {
  slug: string;
  name: string;
  claimed_by_user_id: string | null;
  description: string | null;
  logo_url: string | null;
  photos: any;
  phone: string | null;
  email: string | null;
};

async function fetchPriorityFiches(): Promise<Pro[]> {
  console.log("Fetch fiches prioritaires depuis Supabase...\n");

  // Tier 1 : claimed (les plus prioritaires, on les pingue toutes)
  const { data: claimed } = await supabase
    .from("pros")
    .select("slug, name, claimed_by_user_id, description, logo_url, photos, phone, email")
    .eq("is_active", true)
    .is("deleted_at", null)
    .not("claimed_by_user_id", "is", null);

  console.log(`  Tier 1 (réclamées)         : ${claimed?.length || 0}`);

  // Tier 2 : avec description ENRICHIE (pas auto-générée Sirene)
  // On considère "enrichie" = > 100 chars (description Sirene fait < 50)
  const { data: enriched } = await supabase
    .from("pros")
    .select("slug, name, claimed_by_user_id, description, logo_url, photos, phone, email")
    .eq("is_active", true)
    .is("deleted_at", null)
    .is("claimed_by_user_id", null) // pas double-comptage avec tier 1
    .not("description", "is", null)
    .order("updated_at", { ascending: false })
    .limit(60);

  const tier2 = (enriched || []).filter((p) => (p.description?.length || 0) > 100);
  console.log(`  Tier 2 (description > 100c) : ${tier2.length}`);

  // Tier 3 : avec photos OU logo (signaux de complétion)
  const { data: withMedia } = await supabase
    .from("pros")
    .select("slug, name, claimed_by_user_id, description, logo_url, photos, phone, email")
    .eq("is_active", true)
    .is("deleted_at", null)
    .is("claimed_by_user_id", null)
    .or("logo_url.not.is.null,photos.not.is.null")
    .order("updated_at", { ascending: false })
    .limit(60);

  console.log(`  Tier 3 (logo ou photos)     : ${withMedia?.length || 0}`);

  // Tier 4 : avec phone (vrai contact, pas que Sirene)
  const { data: withPhone } = await supabase
    .from("pros")
    .select("slug, name, claimed_by_user_id, description, logo_url, photos, phone, email")
    .eq("is_active", true)
    .is("deleted_at", null)
    .is("claimed_by_user_id", null)
    .is("description", null)
    .not("phone", "is", null)
    .order("updated_at", { ascending: false })
    .limit(80);

  console.log(`  Tier 4 (phone seulement)    : ${withPhone?.length || 0}`);

  // Concat + dédup par slug
  const all: Pro[] = [
    ...(claimed || []),
    ...tier2,
    ...(withMedia || []),
    ...(withPhone || []),
  ];
  const seen = new Set<string>();
  const unique = all.filter((p) => {
    if (seen.has(p.slug)) return false;
    seen.add(p.slug);
    return true;
  });

  console.log(`\n  Total uniques après dédup   : ${unique.length}`);
  console.log(`  On garde les ${MAX_URLS} premières (quota API).\n`);

  return unique.slice(0, MAX_URLS);
}

async function pingUrl(client: any, url: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await google.indexing("v3").urlNotifications.publish({
      auth: client,
      requestBody: { url, type: "URL_UPDATED" },
    });
    return { ok: res.status === 200 };
  } catch (e: any) {
    const msg = e?.errors?.[0]?.message || e?.message || String(e);
    return { ok: false, error: msg };
  }
}

async function main() {
  const fiches = await fetchPriorityFiches();
  const urls = fiches.map((p) => `${BASE}/artisan/${p.slug}`);

  if (DRY_RUN) {
    console.log("=== DRY RUN : fiches qui seraient pingées ===\n");
    fiches.forEach((p, i) => {
      const tags: string[] = [];
      if (p.claimed_by_user_id) tags.push("RECLAMÉE");
      if ((p.description?.length || 0) > 100) tags.push("description+");
      if (p.logo_url) tags.push("logo");
      if (p.photos && Array.isArray(p.photos) && p.photos.length > 0) tags.push(`${p.photos.length} photos`);
      if (p.phone) tags.push("phone");
      console.log(`  ${(i + 1).toString().padStart(3)}. /artisan/${p.slug.padEnd(35)} [${tags.join(", ") || "-"}]`);
    });
    console.log(`\nTotal: ${urls.length}\n`);
    return;
  }

  console.log("Authentification ADC...");
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });
  const client = (await auth.getClient()) as any;
  console.log("✅ Authentifié.\n");

  console.log(`Ping de ${urls.length} fiches /artisan/* (delay ${RATE_LIMIT_MS}ms)...\n`);

  let okCount = 0;
  let failCount = 0;
  const failureReasons = new Map<string, number>();

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const result = await pingUrl(client, url);

    if (result.ok) {
      okCount++;
      const path = url.replace(BASE, "");
      console.log(`\x1b[32m  [${(i + 1).toString().padStart(3)}/${urls.length}] ✓ ${path}\x1b[0m`);
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
    console.log(`\n\x1b[32m✓ Google va re-crawler ces ${okCount} fiches dans les prochaines heures.\x1b[0m`);
  }
}

main().catch((e) => {
  console.error("\n\x1b[31m❌ Erreur fatale:\x1b[0m", e);
  process.exit(1);
});
