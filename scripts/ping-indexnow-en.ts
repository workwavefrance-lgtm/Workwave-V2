/**
 * Ping IndexNow (Bing + Yandex + Seznam + autres) sur les URLs workwaveai.co.
 *
 * Pourquoi IndexNow plutôt que Google Indexing API :
 *   - Google Indexing API = 200 URLs/jour (quota strict)
 *   - IndexNow = ILLIMITÉ, gratuit, et Bing rooting partage des signaux qui
 *     aident Google indirectement (Bing trouve un site puis tweet/article →
 *     signal Google).
 *
 * Pré-requis : le fichier `public/<KEY>.txt` doit contenir la clé (= preuve
 * de propriété). Déjà créé : public/1e4335a37349c03f37afb1b3cf6a91d8.txt
 *
 * Usage : npx tsx scripts/ping-indexnow-en.ts [--dry-run]
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { INTL_SKILLS } from "@/lib/data/intl-skills";
import { INTL_CITIES } from "@/lib/data/intl-cities";
import { WORLD_COUNTRIES, CONTINENTS } from "@/lib/data/intl-countries";

const KEY = "1e4335a37349c03f37afb1b3cf6a91d8";
const HOST = "www.workwaveai.co";
const BASE = "https://www.workwaveai.co";
const KEY_LOCATION = `${BASE}/${KEY}.txt`;
const DRY_RUN = process.argv.includes("--dry-run");

function buildUrls(): string[] {
  const urls: string[] = [`${BASE}/en/ai`];
  // Hubs skills
  for (const skill of INTL_SKILLS) {
    urls.push(`${BASE}/en/ai/${skill.slug}`);
  }
  // Hubs continent + pays
  for (const c of CONTINENTS) urls.push(`${BASE}/en/ai/continent/${c.slug}`);
  for (const c of WORLD_COUNTRIES) urls.push(`${BASE}/en/ai/country/${c.slug}`);
  // Skill × pays (top skills tech)
  for (const skill of ["web-development", "ai-engineering", "mobile-development", "ui-ux-design"]) {
    for (const c of WORLD_COUNTRIES) {
      urls.push(`${BASE}/en/ai/${skill}/country/${c.slug}`);
    }
  }
  // Skill × ville (les top villes intl)
  for (const skill of INTL_SKILLS) {
    for (const city of INTL_CITIES) {
      urls.push(`${BASE}/en/ai/${skill.slug}/${city.slug}`);
    }
  }
  // Dédup
  return [...new Set(urls)];
}

async function pingIndexNow(urls: string[]): Promise<{ ok: boolean; status: number; body: string }> {
  // IndexNow accepte max 10 000 URLs par requête, on batche par 10000
  const BATCH = 10000;
  for (let i = 0; i < urls.length; i += BATCH) {
    const batch = urls.slice(i, i + BATCH);
    const body = JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: KEY_LOCATION,
      urlList: batch,
    });
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body,
    });
    const txt = await res.text();
    console.log(`  Batch ${Math.floor(i / BATCH) + 1} : ${batch.length} URLs → HTTP ${res.status} ${txt.slice(0, 100)}`);
    if (!res.ok && res.status !== 202) {
      return { ok: false, status: res.status, body: txt };
    }
  }
  return { ok: true, status: 200, body: "" };
}

async function main() {
  const urls = buildUrls();
  console.log(`\nIndexNow ping pour ${HOST} — ${urls.length} URLs uniques`);
  console.log(`Key location : ${KEY_LOCATION}\n`);

  if (DRY_RUN) {
    console.log("=== DRY RUN — échantillon (10 premières) ===");
    urls.slice(0, 10).forEach((u, i) => console.log(`  ${i + 1}. ${u}`));
    console.log(`\n... et ${urls.length - 10} autres.`);
    return;
  }

  // Vérif preuve de propriété accessible
  const keyTest = await fetch(KEY_LOCATION);
  if (!keyTest.ok) {
    console.error(`❌ Preuve de propriété ${KEY_LOCATION} = HTTP ${keyTest.status} (attendu 200).`);
    console.error(`   Le fichier public/${KEY}.txt doit être déployé en prod avant de pinger.`);
    process.exit(1);
  }
  console.log(`✅ Preuve de propriété accessible (${KEY_LOCATION})\n`);

  const r = await pingIndexNow(urls);
  console.log(`\n=== Résumé ===`);
  console.log(`  ${r.ok ? "✅" : "❌"} HTTP ${r.status}`);
  console.log(`  ${urls.length} URLs envoyées à IndexNow (Bing + Yandex + Seznam)\n`);
}

main().catch((e) => { console.error("ERREUR:", e.message); process.exit(1); });
