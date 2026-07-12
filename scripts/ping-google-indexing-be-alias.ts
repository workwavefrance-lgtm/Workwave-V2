/**
 * Ping Google Indexing API sur les nouvelles pages ALIAS belges
 * (plafonneur = plaquiste, entreprise-de-chassis = menuisier) × provinces + top villes BE.
 * Créées le 12/07 (commit fd33674), donc absentes du ping hubs BE initial.
 *
 * ⚠️ PRÉ-CHECK 200 obligatoire avant chaque ping (leçon 06/06 : pinger une URL
 * en 308/404 = signal « page avec redirection », pas d'indexation de la cible).
 *
 * Pré-requis : gcloud auth application-default login --scopes=...indexing,...cloud-platform
 * Usage : npx tsx scripts/ping-google-indexing-be-alias.ts [--dry-run]
 */
import { config } from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const BASE = "https://workwave.fr";
const DRY = process.argv.includes("--dry-run");
const ALIASES = ["plafonneur", "entreprise-de-chassis"];
const PROVINCES = [
  "hainaut-wht", "liege-wlg", "namur-wna",
  "brabant-wallon-wbr", "luxembourg-belge-wlx", "bruxelles-capitale-bru",
];

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data: cities } = await sb
    .from("cities")
    .select("slug, name, population")
    .eq("country", "BE")
    .not("population", "is", null)
    .order("population", { ascending: false })
    .limit(12);
  const topCities = (cities || []) as { slug: string; name: string }[];

  const candidates: string[] = [];
  for (const a of ALIASES) for (const p of PROVINCES) candidates.push(`${BASE}/${a}/${p}`);
  for (const a of ALIASES) for (const c of topCities) candidates.push(`${BASE}/${a}/${c.slug}`);

  // Pré-check 200 : on ne garde QUE les URLs qui ne redirigent pas.
  console.log(`Pré-check 200 sur ${candidates.length} URLs candidates...`);
  const urls: string[] = [];
  for (const u of candidates) {
    try {
      const r = await fetch(u, { method: "HEAD", redirect: "manual", headers: { "User-Agent": "Mozilla/5.0" } });
      if (r.status === 200) urls.push(u);
      else console.log(`  skip ${u.replace(BASE, "")} → ${r.status}`);
    } catch { /* skip */ }
    await new Promise((r) => setTimeout(r, 50));
  }
  console.log(`\n${urls.length}/${candidates.length} URLs alias en 200 → à pinger\n`);

  if (DRY) { urls.forEach((u) => console.log("  " + u.replace(BASE, ""))); return; }

  console.log("Authentification ADC...");
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/indexing"] });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = (await auth.getClient()) as any;
  console.log("✅ Authentifié.\n");

  let ok = 0, fail = 0;
  for (let i = 0; i < urls.length; i++) {
    try {
      const res = await client.request({
        url: "https://indexing.googleapis.com/v3/urlNotifications:publish",
        method: "POST",
        data: { url: urls[i], type: "URL_UPDATED" },
      });
      if (res.status === 200) { ok++; console.log(`  ✓ ${urls[i].replace(BASE, "")}`); }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      fail++;
      const r = (e?.errors?.[0]?.message || e?.message || String(e)).slice(0, 80);
      console.error(`  ✗ ${urls[i].replace(BASE, "")} → ${r}`);
      if (r.includes("Quota") || r.includes("429") || r.includes("403")) { console.error("⚠️ arrêt (quota/auth)"); break; }
    }
    await new Promise((r) => setTimeout(r, 120));
  }
  console.log(`\n=== ✓ ${ok} pingés · ✗ ${fail} échecs ===`);
  if (ok > 0) console.log(`\nGoogle va recrawler ${ok} pages alias belges dans les prochaines heures.`);
}

main().catch((e) => { console.error("❌", e); process.exit(1); });
