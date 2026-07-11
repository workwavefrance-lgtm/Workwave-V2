/**
 * Ping Google Indexing API sur les HUBS belges (province + grandes villes ×
 * métiers) après la belgicisation du contenu. Objectif : faire crawler vite
 * les pages BE (contenu BCE/TVAC/primes wallonnes) au lieu d'attendre des
 * semaines sur un .fr à faible autorité BE.
 *
 * ⚠️ On NE ping PAS les 120k fiches (quota 200/j + budget crawl). Uniquement
 * les hubs à forte valeur : 6 provinces × top métiers + top villes × métiers.
 *
 * Pré-requis : gcloud auth application-default login --scopes=...indexing,...cloud-platform
 * Usage : npx tsx scripts/ping-google-indexing-belgique.ts [--dry-run]
 */
import { config } from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const BASE = "https://workwave.fr";
const RATE_LIMIT_MS = 120;
const MAX_URLS = 195;
const DRY = process.argv.includes("--dry-run");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Provinces belges (slug canonique = generateDepartmentSlug)
const PROVINCES = [
  "hainaut-wht", "liege-wlg", "namur-wna",
  "brabant-wallon-wbr", "luxembourg-belge-wlx", "bruxelles-capitale-bru",
];
// Métiers prioritaires (les plus recherchés)
const METIERS = [
  "macon", "electricien", "plombier", "peintre", "couvreur", "menuisier",
  "chauffagiste", "plaquiste", "carreleur", "terrassier", "paysagiste", "architecte",
];
const METIERS_VILLE = METIERS.slice(0, 8);

async function main() {
  // Top villes belges par population (celles qui ont le plus de volume Google)
  const { data: cities } = await sb
    .from("cities")
    .select("slug, name, population")
    .eq("country", "BE")
    .not("population", "is", null)
    .order("population", { ascending: false })
    .limit(18);
  const topCities = (cities || []) as { slug: string; name: string }[];

  const urls: string[] = [];
  // 1. Provinces × métiers (toujours valides — la province agrège toutes les communes)
  for (const p of PROVINCES) for (const m of METIERS) urls.push(`${BASE}/${m}/${p}`);
  // 2. Top villes × métiers principaux
  for (const c of topCities) for (const m of METIERS_VILLE) urls.push(`${BASE}/${m}/${c.slug}`);

  const finalUrls = urls.slice(0, MAX_URLS);
  console.log(`Hubs belges : ${PROVINCES.length} provinces × ${METIERS.length} + ${topCities.length} villes × ${METIERS_VILLE.length} = ${urls.length} → ping ${finalUrls.length}\n`);

  if (DRY) {
    finalUrls.slice(0, 20).forEach((u, i) => console.log(`  ${i + 1}. ${u.replace(BASE, "")}`));
    console.log(`  … (+${finalUrls.length - 20})\nTop villes : ${topCities.map((c) => c.name).join(", ")}`);
    return;
  }

  console.log("Authentification ADC...");
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/indexing"] });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = (await auth.getClient()) as any;
  console.log("✅ Authentifié.\n");

  let ok = 0, fail = 0;
  const reasons = new Map<string, number>();
  for (let i = 0; i < finalUrls.length; i++) {
    const url = finalUrls[i];
    try {
      const res = await client.request({
        url: "https://indexing.googleapis.com/v3/urlNotifications:publish",
        method: "POST",
        data: { url, type: "URL_UPDATED" },
      });
      if (res.status === 200) { ok++; if (i % 20 === 0) console.log(`  [${i + 1}/${finalUrls.length}] ✓`); }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      fail++;
      const r = (e?.errors?.[0]?.message || e?.message || String(e)).slice(0, 80);
      reasons.set(r, (reasons.get(r) || 0) + 1);
      console.error(`  [${i + 1}] ✗ ${url.replace(BASE, "")} → ${r}`);
      if (r.includes("Quota") || r.includes("429") || r.includes("403")) { console.error("⚠️ arrêt (quota/auth)"); break; }
    }
    if (i < finalUrls.length - 1) await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
  }
  console.log(`\n=== ✓ ${ok} pingés · ✗ ${fail} échecs ===`);
  reasons.forEach((n, msg) => console.log(`  [${n}] ${msg}`));
  if (ok > 0) console.log(`\nGoogle va recrawler ${ok} hubs belges (contenu BCE/TVAC/primes) dans les prochaines heures.`);
}

main().catch((e) => { console.error("❌", e); process.exit(1); });
