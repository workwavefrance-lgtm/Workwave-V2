/**
 * Ping Google Indexing API sur les 52 pages RACINE métier (/[metier]) après
 * leur refonte "vraies pages uniques" (data réelle + éditorial sourcé).
 *
 * ADC requis : `gcloud auth application-default login` avec le compte
 * PROPRIÉTAIRE de workwave.fr dans Search Console + scope indexing.
 *
 * ⚠️ Leçon 06/06 : on NE pinge JAMAIS une URL en 3xx (Google la classe
 * "page avec redirection", pas d'indexation de la cible). → préflight HTTP :
 * on ne pinge que les URLs qui répondent 200.
 *
 * Quota : 200 URLs/jour, 600/min. 52 URLs → OK large. Rate limit 110 ms.
 *
 * Usage :
 *   npx tsx scripts/ping-metier-roots.ts --dry-run   # liste + préflight, sans ping
 *   npx tsx scripts/ping-metier-roots.ts             # ping réel
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { google } from "googleapis";
import { execSync } from "child_process";
import { createClient } from "@supabase/supabase-js";

const BASE = "https://workwave.fr";
const RATE_LIMIT_MS = 150;
const DRY_RUN = process.argv.includes("--dry-run");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function httpCode(url: string): string {
  try {
    return execSync(
      `curl -s -o /dev/null -w "%{http_code}" -A "Googlebot" --max-time 15 "${url}"`,
      { encoding: "utf-8" }
    ).trim();
  } catch {
    return "ERR";
  }
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
  const { data: cats, error } = await sb
    .from("categories")
    .select("slug")
    .in("vertical", ["btp", "domicile", "personne"])
    .order("slug");
  if (error || !cats) throw error;

  console.log(`Préflight HTTP des ${cats.length} URLs racine (on ne pinge que les 200)...\n`);
  const ok200: string[] = [];
  const skipped: { url: string; code: string }[] = [];
  for (const c of cats) {
    const url = `${BASE}/${c.slug}`;
    const code = httpCode(url);
    if (code === "200") {
      ok200.push(url);
      console.log(`  \x1b[32m200\x1b[0m  ${url}`);
    } else {
      skipped.push({ url, code });
      console.log(`  \x1b[31m${code}\x1b[0m  ${url}  (ignoré, pas 200)`);
    }
  }

  console.log(`\n${ok200.length} URLs en 200, ${skipped.length} ignorées.\n`);

  if (DRY_RUN) {
    console.log("=== DRY RUN : aucune URL pingée ===");
    return;
  }
  if (ok200.length === 0) {
    console.log("Aucune URL 200 à pinger. (Le déploiement est-il bien live ?)");
    return;
  }

  console.log("Authentification ADC (scope indexing)...");
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });
  const client = await auth.getClient();
  console.log("✅ Authentifié.\n");

  let okCount = 0;
  let failCount = 0;
  for (let i = 0; i < ok200.length; i++) {
    const url = ok200[i];
    const r = await pingUrl(client, url);
    if (r.ok) {
      okCount++;
      console.log(`\x1b[32m  [${i + 1}/${ok200.length}] ✓ ${url.replace(BASE, "")}\x1b[0m`);
    } else {
      failCount++;
      console.error(`\x1b[31m  [${i + 1}/${ok200.length}] ✗ ${url.replace(BASE, "")} -> ${r.error}\x1b[0m`);
      if (r.error?.includes("403") || r.error?.includes("Quota") || r.error?.includes("429")) {
        console.error("\n⚠️  Erreur fatale (auth/quota), arrêt.");
        break;
      }
    }
    if (i < ok200.length - 1) await new Promise((res) => setTimeout(res, RATE_LIMIT_MS));
  }

  console.log(`\n=== Résumé === ✓ ${okCount} · ✗ ${failCount} · ignorées ${skipped.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
