/**
 * Ping ciblé Google Indexing API : force le re-crawl des pages dont le SERP
 * affiche un cache PÉRIMÉ (29,90€ sur /ai/pour-les-freelances, "SAS" sur
 * /a-propos, positionnement "annuaire" sur la home). Le code est déjà corrigé ;
 * ce ping demande à Google de re-crawler pour mettre à jour son snapshot.
 *
 * Garde-fou : ne ping QUE les URLs qui répondent 200 (jamais une redirection).
 * Usage : npx tsx scripts/_ping-stale-serp.ts [--dry-run]
 */
import { config } from "dotenv";
import * as path from "path";
import { google } from "googleapis";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const BASE = "https://workwave.fr";
const URLS = [`${BASE}/pro`, `${BASE}/recherche`];
const DRY = process.argv.includes("--dry-run");

async function main() {
  // Pré-vol : ne garder que les 200 (pas de ping sur une 3xx/4xx)
  const pingable: string[] = [];
  for (const u of URLS) {
    const r = await fetch(u, { redirect: "manual" });
    const status = r.status;
    console.log(`${status}  ${u}`);
    if (status === 200) pingable.push(u);
    else console.warn(`  ↳ ignoré (pas 200)`);
  }

  if (DRY) {
    console.log(`\nDRY · ${pingable.length} URL(s) seraient pingées.`);
    return;
  }
  if (pingable.length === 0) {
    console.log("\nAucune URL 200 à pinger.");
    return;
  }

  console.log("\nAuth ADC (scope indexing)...");
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = (await auth.getClient()) as any;

  for (const url of pingable) {
    try {
      const res = await client.request({
        url: "https://indexing.googleapis.com/v3/urlNotifications:publish",
        method: "POST",
        data: { url, type: "URL_UPDATED" },
      });
      console.log(`PING ${res.status === 200 ? "OK" : res.status}  ${url}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error(
        `PING FAIL  ${url} : ${e?.errors?.[0]?.message || e?.message || e}`
      );
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  console.log("\nFait. Google va re-crawler ces pages (quelques heures à quelques jours).");
}

main().catch((e) => {
  console.error("Crash:", e instanceof Error ? e.message : e);
  process.exit(1);
});
