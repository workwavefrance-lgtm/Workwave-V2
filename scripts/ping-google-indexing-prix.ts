/**
 * Ping Google Indexing API sur les guides des prix PUBLIÉS (price_guides).
 * URLs : /[metier]/prix (scope metier) + /guide-des-prix/[slug] (prestation) + le hub.
 *
 * Pré-requis ADC : `gcloud auth application-default login --scopes=https://www.googleapis.com/auth/indexing,https://www.googleapis.com/auth/cloud-platform`
 *
 * Usage : npx tsx scripts/ping-google-indexing-prix.ts [--dry-run]
 */
import { config } from "dotenv";
import * as path from "path";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const RATE_LIMIT_MS = 110;
const BASE = "https://workwave.fr";
const DRY = process.argv.includes("--dry-run");
const QUOTA = 200;

async function buildUrls(): Promise<string[]> {
  const urls = [`${BASE}/guide-des-prix`];
  let offset = 0;
  while (true) {
    const { data } = await sb
      .from("price_guides")
      .select("slug, scope, metier_slug")
      .eq("status", "published")
      .order("volume_est", { ascending: false, nullsFirst: false })
      .range(offset, offset + 999);
    const rows = (data || []) as { slug: string; scope: string; metier_slug: string | null }[];
    if (rows.length === 0) break;
    for (const g of rows) {
      urls.push(g.scope === "metier" && g.metier_slug ? `${BASE}/${g.metier_slug}/prix` : `${BASE}/guide-des-prix/${g.slug}`);
    }
    offset += rows.length;
  }
  return [...new Set(urls)].slice(0, QUOTA);
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
    return { ok: false, error: e?.errors?.[0]?.message || e?.message || String(e) };
  }
}

async function main() {
  const urls = await buildUrls();
  if (DRY) {
    console.log("=== DRY RUN — guides des prix à pinger ===\n");
    urls.forEach((u, i) => console.log(`  ${(i + 1).toString().padStart(3)}. ${u.replace(BASE, "")}`));
    console.log(`\nTotal : ${urls.length}`);
    return;
  }
  console.log("Authentification ADC...");
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/indexing"] });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = (await auth.getClient()) as any;
  console.log(`✅ Authentifié. Ping de ${urls.length} URLs...\n`);
  let ok = 0, fail = 0;
  for (let i = 0; i < urls.length; i++) {
    const r = await pingUrl(client, urls[i]);
    if (r.ok) { ok++; console.log(`\x1b[32m  [${i + 1}/${urls.length}] ✓ ${urls[i].replace(BASE, "")}\x1b[0m`); }
    else { fail++; console.error(`\x1b[31m  [${i + 1}/${urls.length}] ✗ ${urls[i].replace(BASE, "")} -> ${(r.error || "").slice(0, 70)}\x1b[0m`); if ((r.error || "").match(/Quota|429|403/)) { console.error("⚠️ arrêt (quota/auth)"); break; } }
    if (i < urls.length - 1) await new Promise((res) => setTimeout(res, RATE_LIMIT_MS));
  }
  console.log(`\n✓ ${ok} · ✗ ${fail}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
