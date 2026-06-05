/**
 * Ping Google Indexing API pour les pages /[metier]/monaco (zone BTP
 * transfrontalière). Cible uniquement les métiers ayant >= 3 artisans dans la
 * zone frontalière (ceux qui renvoient 200, pas un 308).
 *
 * Auth : ADC (`gcloud auth application-default login` avec le scope indexing,
 * compte propriétaire de workwave.fr en GSC). Quota 200/jour, 600/min.
 * Si l'auth/quota échoue, ce n'est pas bloquant : la sitemap émet désormais ces
 * URLs, Google les découvrira sous 24-72h.
 *
 * Usage : npx tsx scripts/ping-google-indexing-monaco.ts [--dry-run]
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

const BASE = "https://workwave.fr";
const RATE_LIMIT_MS = 130;
const DRY = process.argv.includes("--dry-run");
const BORDER_SLUGS = ["beausoleil", "cap-d-ail", "roquebrune-cap-martin", "la-turbie"];

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function buildUrls(): Promise<string[]> {
  const { data: borders } = await sb.from("cities").select("id").in("slug", BORDER_SLUGS);
  const borderIds = (borders || []).map((c: { id: number }) => c.id);
  // compter les pros par catégorie dans la zone
  const counts = new Map<number, number>();
  let offset = 0;
  while (true) {
    const { data } = await sb
      .from("pros")
      .select("category_id")
      .eq("is_active", true)
      .is("deleted_at", null)
      .in("city_id", borderIds)
      .range(offset, offset + 999);
    const rows = (data || []) as { category_id: number }[];
    if (rows.length === 0) break;
    for (const r of rows) counts.set(r.category_id, (counts.get(r.category_id) || 0) + 1);
    offset += rows.length;
  }
  const eligibleIds = [...counts.entries()].filter(([, n]) => n >= 3).map(([id]) => id);
  const { data: cats } = await sb
    .from("categories")
    .select("slug,vertical")
    .in("id", eligibleIds)
    .in("vertical", ["btp", "domicile", "personne"]);
  return (cats || []).map((c: { slug: string }) => `${BASE}/${c.slug}/monaco`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function pingUrl(client: any, url: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await google.indexing("v3").urlNotifications.publish({
      auth: client,
      requestBody: { url, type: "URL_UPDATED" },
    });
    return { ok: res.status === 200 };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return { ok: false, error: e?.errors?.[0]?.message || e?.message || String(e) };
  }
}

async function main() {
  const urls = await buildUrls();
  console.log(`\n${urls.length} pages /[metier]/monaco éligibles (>= 3 artisans en zone).\n`);
  if (DRY) {
    urls.forEach((u, i) => console.log(`  ${(i + 1).toString().padStart(2)}. ${u.replace(BASE, "")}`));
    console.log(`\n[DRY] ${urls.length} URLs — relance sans --dry-run pour pinger.`);
    return;
  }
  console.log("Auth ADC (scope indexing)...");
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = (await auth.getClient()) as any;
  console.log("✅ Authentifié.\n");

  let ok = 0, fail = 0;
  for (let i = 0; i < urls.length; i++) {
    const r = await pingUrl(client, urls[i]);
    const p = urls[i].replace(BASE, "");
    if (r.ok) { ok++; console.log(`  [${i + 1}/${urls.length}] ✓ ${p}`); }
    else {
      fail++; console.error(`  [${i + 1}/${urls.length}] ✗ ${p} → ${r.error}`);
      if (r.error?.includes("Quota") || r.error?.includes("429") || r.error?.includes("403")) {
        console.error("\n⚠️ Quota/auth — arrêt (non bloquant, la sitemap prend le relais).");
        break;
      }
    }
    if (i < urls.length - 1) await new Promise((res) => setTimeout(res, RATE_LIMIT_MS));
  }
  console.log(`\n=== ${ok} pingées, ${fail} échecs ===`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
