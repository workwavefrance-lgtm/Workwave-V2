/**
 * #94 · Ping Google Indexing API sur les hubs DÉPARTEMENT des 4 nouvelles régions
 * (Bretagne, Pays de la Loire, Occitanie, PACA), pour accélérer la découverte
 * Google des pages cat × dépt fraîchement remplies (pros scrapés + section marché
 * sourcée + prix sourcés + OfferCatalog).
 *
 * Cible : 28 dépts × top métiers BTP, capé à 200 (quota Indexing/jour partagé).
 *
 * Pré-requis ADC (cf. leçon CLAUDE.md 29/04) :
 *   gcloud auth application-default login --scopes=https://www.googleapis.com/auth/indexing,https://www.googleapis.com/auth/cloud-platform
 *
 * Usage :
 *   npx tsx scripts/ping-indexing-new-regions.ts --dry-run
 *   npx tsx scripts/ping-indexing-new-regions.ts
 */
import { config } from "dotenv";
import path from "path";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const BASE = "https://workwave.fr";
const RATE_LIMIT_MS = 110;
const DRY = process.argv.includes("--dry-run");

const NEW_DEPT_CODES = [
  "22", "29", "35", "56",
  "44", "49", "53", "72", "85",
  "09", "11", "12", "30", "31", "32", "34", "46", "48", "65", "66", "81", "82",
  "04", "05", "06", "13", "83", "84",
];

// Top métiers BTP (les plus recherchés) : 7 × 28 dépts = 196 URLs (< 200/jour).
const TOP_METIERS = [
  "plombier",
  "electricien",
  "macon",
  "peintre",
  "menuisier",
  "couvreur",
  "chauffagiste",
];

function deptSlug(name: string, code: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base}-${code}`;
}

async function buildUrls(): Promise<string[]> {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await sb
    .from("departments")
    .select("code, name")
    .in("code", NEW_DEPT_CODES);
  const depts = (data || []) as Array<{ code: string; name: string }>;
  const urls: string[] = [];
  for (const d of depts) {
    for (const m of TOP_METIERS) {
      urls.push(`${BASE}/${m}/${deptSlug(d.name, d.code)}`);
    }
  }
  return urls.slice(0, 200);
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
    console.log(`=== DRY RUN · ${urls.length} URLs ===\n`);
    urls.slice(0, 12).forEach((u, i) => console.log(`  ${i + 1}. ${u.replace(BASE, "")}`));
    console.log(`  ... (${urls.length} au total)`);
    return;
  }

  console.log("Authentification ADC (scope indexing)...");
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = (await auth.getClient()) as any;
  console.log(`✅ Authentifié.\n\nPing de ${urls.length} hubs dépt (delay ${RATE_LIMIT_MS}ms)...\n`);

  let ok = 0;
  let fail = 0;
  const reasons = new Map<string, number>();
  for (let i = 0; i < urls.length; i++) {
    const r = await pingUrl(client, urls[i]);
    if (r.ok) {
      ok++;
      if ((i + 1) % 20 === 0) console.log(`  [${i + 1}/${urls.length}] ok=${ok}`);
    } else {
      fail++;
      const reason = (r.error || "unknown").slice(0, 90);
      reasons.set(reason, (reasons.get(reason) || 0) + 1);
      if (reason.includes("Quota") || reason.includes("429") || reason.includes("403") || reason.includes("scope")) {
        console.error(`\n⚠️ Arrêt (quota/auth) : ${reason}`);
        break;
      }
    }
    if (i < urls.length - 1) await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
  }

  console.log(`\n=== Résumé ===\n  ✓ ${ok}  ✗ ${fail}`);
  if (fail > 0) for (const [m, n] of reasons) console.log(`  [${n}] ${m}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
