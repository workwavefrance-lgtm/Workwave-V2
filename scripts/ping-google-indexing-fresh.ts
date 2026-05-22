/**
 * Ping Google Indexing API en priorisant le contenu FRAIS.
 *
 * Ordre de priorite :
 *   1. Articles blog publies recemment (query Supabase blog_posts,
 *      les 20 derniers par published_at) + la page /blog
 *   2. Pages statiques + guides + racine metier (sitemap 0)
 *   3. Complement metier x dept (sitemap 1) jusqu'a atteindre le cap
 *
 * Cap : 195 URLs / run (quota Google 200/jour, 5 de marge).
 * Rate limit : 110 ms entre 2 pings (quota 600/min).
 *
 * Prerequis : `gcloud auth application-default login` lance avec le
 * compte PROPRIETAIRE de la propriete workwave.fr dans GSC, scope
 * indexing inclus (cf. lecon CLAUDE.md 29/04).
 *
 * Usage :
 *   npx tsx scripts/ping-google-indexing-fresh.ts            # ping reel
 *   npx tsx scripts/ping-google-indexing-fresh.ts --dry-run  # liste seulement
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
  override: true,
});

import { google } from "googleapis";
import { execSync } from "child_process";
import { createClient } from "@supabase/supabase-js";

const RATE_LIMIT_MS = 110;
const MAX_URLS_PER_RUN = 195;
const BASE = "https://workwave.fr";
const DRY_RUN = process.argv.includes("--dry-run");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function fetchSitemap(url: string): string[] {
  try {
    const xml = execSync(`curl -s "${url}"`, { encoding: "utf-8" });
    const matches = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
    return matches.map((m) => m.replace(/<\/?loc>/g, ""));
  } catch {
    return [];
  }
}

async function buildPriorityUrls(): Promise<string[]> {
  console.log("Construction de la liste prioritaire (contenu frais d'abord)...\n");

  // 1. Articles blog recents
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, published_at")
    .eq("status", "published")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(20);

  const blogUrls = [
    `${BASE}/blog`,
    ...((posts || []).map((p) => `${BASE}/blog/${p.slug}`)),
  ];
  console.log(`  Blog : ${blogUrls.length} URLs (page liste + ${posts?.length || 0} articles recents)`);

  // 2. Sitemap 0 : statiques + guides + racine metier
  const sitemap0 = fetchSitemap(`${BASE}/sitemap/0.xml`);
  console.log(`  /sitemap/0.xml : ${sitemap0.length} URLs (statiques + guides + racine metier)`);

  // 3. Sitemap 1 : metier x dept
  const sitemap1 = fetchSitemap(`${BASE}/sitemap/1.xml`);
  console.log(`  /sitemap/1.xml : ${sitemap1.length} URLs (metier x dept)`);

  // Fusion + dedup, cap a MAX_URLS_PER_RUN
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const url of [...blogUrls, ...sitemap0, ...sitemap1]) {
    if (seen.has(url)) continue;
    seen.add(url);
    merged.push(url);
    if (merged.length >= MAX_URLS_PER_RUN) break;
  }

  console.log(`\nTotal liste prioritaire : ${merged.length} URLs (cap ${MAX_URLS_PER_RUN}).\n`);
  return merged;
}

async function pingUrl(
  client: any,
  url: string
): Promise<{ ok: boolean; error?: string }> {
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
  const urls = await buildPriorityUrls();

  if (DRY_RUN) {
    console.log("=== DRY RUN — URLs qui seraient pingees ===\n");
    urls.forEach((u, i) => console.log(`  ${(i + 1).toString().padStart(3)}. ${u}`));
    console.log(`\nTotal : ${urls.length} URLs.\n`);
    return;
  }

  console.log("Authentification ADC...");
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });
  const client = (await auth.getClient()) as any;
  console.log("✓ Authentifie.\n");

  console.log(`Ping de ${urls.length} URLs (delay ${RATE_LIMIT_MS}ms)...\n`);

  let okCount = 0;
  let failCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const result = await pingUrl(client, url);
    const num = `[${i + 1}/${urls.length}]`;
    if (result.ok) {
      okCount++;
      console.log(`  \x1b[32m${num} ✓ ${url.replace(BASE, "")}\x1b[0m`);
    } else {
      failCount++;
      errors.push(result.error || "?");
      console.log(`  \x1b[31m${num} ✗ ${url.replace(BASE, "")} -> ${result.error}\x1b[0m`);
    }
    if (i < urls.length - 1) {
      await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
    }
  }

  console.log(`\n=== Resume ===`);
  console.log(`  Total tentes    : ${urls.length}`);
  console.log(`  \x1b[32m✓ OK            : ${okCount}\x1b[0m`);
  console.log(`  \x1b[31m✗ Echecs        : ${failCount}\x1b[0m`);
  if (failCount > 0) {
    const unique = [...new Set(errors)];
    console.log(`\n  Erreurs uniques :`);
    unique.forEach((e) => console.log(`   - ${e}`));
  } else {
    console.log(`\n✓ Google va re-crawler ces URLs dans les prochaines heures.`);
  }
}

main().catch((e) => {
  console.error("Erreur :", e);
  process.exit(1);
});
