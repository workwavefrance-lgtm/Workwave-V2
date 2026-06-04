/**
 * Ping Google Indexing API des pages PRO-ACQUISITION :
 *   /trouver-des-chantiers (+ /metier BTP + /departement)
 *   /trouver-des-clients   (+ /service domicile|personne)
 *
 * Ces pages sont dans le sitemap mais n'avaient jamais été pingées activement.
 * Le ping force Google à (re)crawler vite (24-72h) au lieu d'attendre le sitemap.
 *
 * Même logique d'URLs que app/sitemap.ts (chantiersUrls + clientsUrls).
 * Quota Google : 200/jour — on est à ~80, large.
 *
 * Pré-requis : `gcloud auth application-default login --scopes=https://www.googleapis.com/auth/indexing,https://www.googleapis.com/auth/cloud-platform`
 *
 * Usage :
 *   npx tsx scripts/ping-google-indexing-acquisition.ts --dry-run
 *   npx tsx scripts/ping-google-indexing-acquisition.ts
 */
import { config } from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";
import { generateDepartmentSlug } from "../lib/utils/slugs";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const RATE_LIMIT_MS = 110;
const BASE = "https://workwave.fr";
const DRY_RUN = process.argv.includes("--dry-run");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function buildUrls(): Promise<string[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cats } = await (supabase as any).from("categories").select("slug, vertical");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: depts } = await (supabase as any).from("departments").select("*");
  const categories = (cats as { slug: string; vertical: string }[]) || [];
  const departments = depts || [];

  const urls: string[] = [
    `${BASE}/trouver-des-chantiers`,
    `${BASE}/trouver-des-clients`,
  ];
  // chantiers × métier BTP
  for (const c of categories.filter((c) => c.vertical === "btp")) {
    urls.push(`${BASE}/trouver-des-chantiers/${c.slug}`);
  }
  // chantiers × département
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const d of departments as any[]) {
    urls.push(`${BASE}/trouver-des-chantiers/${generateDepartmentSlug(d)}`);
  }
  // clients × service domicile/personne
  for (const c of categories.filter((c) => c.vertical === "domicile" || c.vertical === "personne")) {
    urls.push(`${BASE}/trouver-des-clients/${c.slug}`);
  }
  return urls;
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const urls = await buildUrls();
  console.log(`\n=== PING ACQUISITION — ${urls.length} URLs ${DRY_RUN ? "(DRY-RUN)" : ""} ===\n`);

  if (DRY_RUN) {
    urls.forEach((u, i) => console.log(`  ${(i + 1).toString().padStart(3)}. ${u}`));
    console.log(`\nTotal: ${urls.length}\n`);
    return;
  }

  console.log("Authentification ADC...");
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/indexing"] });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = (await auth.getClient()) as any;
  console.log("✅ Authentifié.\n");

  let ok = 0, fail = 0;
  const reasons = new Map<string, number>();
  for (let i = 0; i < urls.length; i++) {
    const r = await pingUrl(client, urls[i]);
    if (r.ok) { ok++; process.stdout.write("."); }
    else { fail++; const m = r.error || "?"; reasons.set(m, (reasons.get(m) || 0) + 1); process.stdout.write("x"); }
    if (i < urls.length - 1) await sleep(RATE_LIMIT_MS);
  }
  console.log(`\n\n✅ ${ok} pingées / ❌ ${fail} échecs sur ${urls.length}`);
  if (fail) { console.log("\nRaisons d'échec :"); for (const [m, n] of reasons) console.log(`  ${n}× ${m}`); }
}

main().catch((e) => { console.error(e); process.exit(1); });
