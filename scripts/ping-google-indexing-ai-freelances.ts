/**
 * Ping Google Indexing API sur les top fiches /ai/freelance/[slug] (Workwave AI).
 *
 * Strategie de priorisation (200 URLs / quota daily) :
 *   Tier 1 : claimed_by_user_id NOT NULL (les vrais comptes freelance actifs)
 *   Tier 2 : description riche (length > 50) ou years_experience renseigne
 *   Tier 3 : Sirene basique mais founding_date recent (jeune entreprise active)
 *
 * Quota : 200 URLs / jour. Ce script remplit jusqu'a 200 en priorisant T1→T3.
 *
 * Pre-requis ADC :
 *   gcloud auth application-default login --scopes="https://www.googleapis.com/auth/indexing,https://www.googleapis.com/auth/cloud-platform"
 *
 * Usage :
 *   npx tsx scripts/ping-google-indexing-ai-freelances.ts --dry-run
 *   npx tsx scripts/ping-google-indexing-ai-freelances.ts
 */
import { config } from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const RATE_LIMIT_MS = 110;
const BASE = "https://workwave.fr";
const MAX_URLS = 200;
const DRY_RUN = process.argv.includes("--dry-run");
const TRACKING_FILE = path.resolve(process.cwd(), "tracking/google-indexing-ai-pinged.json");

type PingTracking = {
  startedAt: string;
  pingedUrls: string[]; // URLs deja pingees (pour idempotence sur cron)
};

function loadTracking(): PingTracking {
  if (!fs.existsSync(path.dirname(TRACKING_FILE))) {
    fs.mkdirSync(path.dirname(TRACKING_FILE), { recursive: true });
  }
  if (!fs.existsSync(TRACKING_FILE)) {
    return { startedAt: new Date().toISOString(), pingedUrls: [] };
  }
  return JSON.parse(fs.readFileSync(TRACKING_FILE, "utf-8"));
}

function saveTracking(t: PingTracking) {
  fs.writeFileSync(TRACKING_FILE, JSON.stringify(t, null, 2));
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Row = {
  slug: string;
  claimed_by_user_id: string | null;
  description: string | null;
  years_experience: number | null;
  founding_date: string | null;
};

async function buildPriorityUrls(alreadyPinged: Set<string>): Promise<string[]> {
  const urls: string[] = [];
  const add = (u: string) => {
    if (!alreadyPinged.has(u) && !urls.includes(u)) urls.push(u);
  };

  // Tier 1 : claimed (les vrais comptes actifs). Pas de limite, on prend tout.
  const { data: t1 } = await sb
    .from("pros")
    .select("slug")
    .in("category_id", AI_CATEGORY_IDS)
    .eq("is_active", true)
    .is("deleted_at", null)
    .not("claimed_by_user_id", "is", null);
  for (const r of (t1 || []) as Array<{ slug: string }>) {
    add(`${BASE}/ai/freelance/${r.slug}`);
  }
  console.log(`Tier 1 (claimed) ajoutes : ${urls.length}`);

  if (urls.length >= MAX_URLS) return urls.slice(0, MAX_URLS);

  // Tier 2 : description riche OU years_experience > 0 OU github/linkedin
  const need = MAX_URLS - urls.length;
  const { data: t2 } = await sb
    .from("pros")
    .select("slug, description, years_experience")
    .in("category_id", AI_CATEGORY_IDS)
    .eq("is_active", true)
    .is("deleted_at", null)
    .is("claimed_by_user_id", null)
    .or("description.not.is.null,years_experience.gt.0,github_username.not.is.null,linkedin.not.is.null")
    .order("years_experience", { ascending: false, nullsFirst: false })
    .limit(need * 2);
  const t2Filtered = ((t2 || []) as Row[])
    .filter((r) => (r.description && r.description.length > 50) || (r.years_experience ?? 0) > 0)
    .slice(0, need);
  for (const r of t2Filtered) {
    add(`${BASE}/ai/freelance/${r.slug}`);
  }
  console.log(`Tier 2 (enrichies) ajoutes : ${urls.length - (t1?.length || 0)}`);

  if (urls.length >= MAX_URLS) return urls.slice(0, MAX_URLS);

  // Tier 3 : Sirene avec founding_date recent (jeune entreprise)
  const need3 = MAX_URLS - urls.length;
  const twoYearsAgo = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString();
  const { data: t3 } = await sb
    .from("pros")
    .select("slug, founding_date")
    .in("category_id", AI_CATEGORY_IDS)
    .eq("is_active", true)
    .is("deleted_at", null)
    .is("claimed_by_user_id", null)
    .not("founding_date", "is", null)
    .gte("founding_date", twoYearsAgo)
    .order("founding_date", { ascending: false })
    .limit(need3);
  for (const r of (t3 || []) as Array<{ slug: string }>) {
    add(`${BASE}/ai/freelance/${r.slug}`);
  }
  console.log(`Tier 3 (jeunes Sirene) ajoutes : ${(t3 || []).length}`);

  return urls.slice(0, MAX_URLS);
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
  // Charge tracking pour skip les URLs deja pingees (idempotence cron quotidien)
  const tracking = loadTracking();
  const alreadyPinged = new Set(tracking.pingedUrls);
  console.log(`Tracking : ${alreadyPinged.size} URLs deja pingees (historique cron)`);

  const urls = await buildPriorityUrls(alreadyPinged);
  console.log(`\nTotal a pinger ce run : ${urls.length}\n`);

  if (urls.length === 0) {
    console.log("Aucune nouvelle URL a pinger. Tout est deja pousse a Google.");
    return;
  }

  if (DRY_RUN) {
    console.log("=== DRY RUN ===");
    urls.slice(0, 10).forEach((u, i) => console.log(`  ${i + 1}. ${u}`));
    if (urls.length > 10) console.log(`  ... + ${urls.length - 10} autres`);
    return;
  }

  console.log("Authentification ADC...");
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = (await auth.getClient()) as any;
  console.log("OK Authentifie.\n");

  let okCount = 0;
  let failCount = 0;
  const failureReasons = new Map<string, number>();

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const result = await pingUrl(client, url);
    if (result.ok) {
      okCount++;
      // Tracker l'URL comme pingee meme en cas de check restart (idempotence cron)
      tracking.pingedUrls.push(url);
      if ((i + 1) % 25 === 0 || i + 1 === urls.length) {
        console.log(`[${i + 1}/${urls.length}] OK=${okCount} FAIL=${failCount}`);
        saveTracking(tracking);
      }
    } else {
      failCount++;
      const reason = (result.error || "unknown").slice(0, 80);
      failureReasons.set(reason, (failureReasons.get(reason) || 0) + 1);
      console.error(`[${i + 1}/${urls.length}] FAIL ${url.replace(BASE, "")} : ${reason}`);
    }
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
  }
  saveTracking(tracking);

  console.log(`\n=== FIN ===`);
  console.log(`OK   : ${okCount}`);
  console.log(`FAIL : ${failCount}`);
  if (failureReasons.size > 0) {
    console.log(`\nRaisons d'echec :`);
    for (const [r, n] of failureReasons) {
      console.log(`  ${n}× ${r}`);
    }
  }
}

main().catch((e) => {
  console.error("Crash :", e instanceof Error ? e.message : e);
  process.exit(1);
});
