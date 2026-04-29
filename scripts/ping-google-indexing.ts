/**
 * Ping Google Indexing API pour forcer un re-crawl des URLs prioritaires.
 *
 * Utilise Application Default Credentials (ADC) — la commande
 * `gcloud auth application-default login` doit avoir été lancée AU PRÉALABLE
 * avec le compte Google qui est PROPRIÉTAIRE de la propriété workwave.fr
 * dans Google Search Console (sinon l'API renvoie 403).
 *
 * Quota Google : 200 URLs / jour, 600 / min. Le script respecte la limite
 * minute via un delay de 110 ms entre 2 pings.
 *
 * Stratégie : on cible /sitemap/0.xml (home + guides + racine métier, valeur
 * SEO max) puis le début de /sitemap/1.xml (cross-dept, stratégique). Total
 * ~188 URLs/run, tient dans le quota jour.
 *
 * Cf. lecon GSC apprise CLAUDE.md du 2026-04-29 sur sitemap stale + noindex
 * caché. Le but ici n'est PAS d'indexer les 226k fiches (Google le fera tout
 * seul via la sitemap rapide), mais de forcer un re-crawl des pages clés
 * dont la version GSC est obsolète (état du 13 avril où certaines avaient
 * encore noindex avant le fix du 27/04).
 *
 * Usage :
 *   npx tsx scripts/ping-google-indexing.ts             # mode "high priority" (~188 URLs)
 *   npx tsx scripts/ping-google-indexing.ts --dry-run   # liste sans pinger
 */
import { google } from "googleapis";
import { execSync } from "child_process";

const RATE_LIMIT_MS = 110; // 600/min => 1 toutes les 100 ms (110 = marge de sécu)
const MAX_URLS_PER_RUN = 195; // garde 5 URLs de marge sur le 200/jour
const BASE = "https://workwave.fr";

const DRY_RUN = process.argv.includes("--dry-run");

function fetchSitemap(url: string): string[] {
  const xml = execSync(`curl -s "${url}"`, { encoding: "utf-8" });
  const matches = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
  return matches.map((m) => m.replace(/<\/?loc>/g, ""));
}

function buildPriorityUrls(): string[] {
  console.log("Construction de la liste prioritaire...\n");

  const sitemap0 = fetchSitemap(`${BASE}/sitemap/0.xml`);
  console.log(`  /sitemap/0.xml -> ${sitemap0.length} URLs (statiques + guides + racine metier)`);

  const sitemap1 = fetchSitemap(`${BASE}/sitemap/1.xml`);
  console.log(`  /sitemap/1.xml -> ${sitemap1.length} URLs (metier x dept), je prends les ${MAX_URLS_PER_RUN - sitemap0.length} premières`);

  const urls = [
    ...sitemap0,
    ...sitemap1.slice(0, MAX_URLS_PER_RUN - sitemap0.length),
  ];

  console.log(`\nTotal: ${urls.length} URLs prioritaires.\n`);
  return urls;
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
  const urls = buildPriorityUrls();

  if (DRY_RUN) {
    console.log("=== DRY RUN — URLs qui seraient pingées ===\n");
    urls.forEach((u, i) => console.log(`  ${(i + 1).toString().padStart(3)}. ${u}`));
    console.log(`\nTotal: ${urls.length} URLs (limite jour: 200).\n`);
    return;
  }

  console.log("Authentification ADC...");
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });
  const client = (await auth.getClient()) as any;
  console.log("✅ Authentifié.\n");

  console.log(`Ping de ${urls.length} URLs (delay ${RATE_LIMIT_MS}ms entre chaque)...\n`);

  const results: { url: string; ok: boolean; error?: string }[] = [];
  let okCount = 0;
  let failCount = 0;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const result = await pingUrl(client, url);
    results.push({ url, ...result });

    if (result.ok) {
      okCount++;
      const path = url.replace(BASE, "");
      console.log(
        `\x1b[32m  [${(i + 1).toString().padStart(3)}/${urls.length}] ✓ ${path}\x1b[0m`
      );
    } else {
      failCount++;
      const path = url.replace(BASE, "");
      console.error(
        `\x1b[31m  [${(i + 1).toString().padStart(3)}/${urls.length}] ✗ ${path} -> ${result.error}\x1b[0m`
      );
      // Si on commence à se prendre des 429 (quota) ou 403 (auth), on stoppe
      // pour pas brûler du temps inutile
      if (
        result.error?.includes("Quota exceeded") ||
        result.error?.includes("429") ||
        result.error?.includes("403")
      ) {
        console.error(
          "\n\x1b[31m⚠️  Erreur fatale (quota ou auth), arrêt du run.\x1b[0m"
        );
        break;
      }
    }

    // rate limit : delay sauf sur la dernière
    if (i < urls.length - 1) {
      await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
    }
  }

  console.log("\n=== Resume ===");
  console.log(`  Total tentés       : ${results.length}`);
  console.log(`  ✓ OK (HTTP 200)    : \x1b[32m${okCount}\x1b[0m`);
  console.log(`  ✗ Echecs           : \x1b[31m${failCount}\x1b[0m`);

  if (failCount > 0) {
    console.log("\n=== Détail des échecs ===");
    const errorTypes = new Map<string, number>();
    results
      .filter((r) => !r.ok)
      .forEach((r) => {
        const key = (r.error || "unknown").slice(0, 80);
        errorTypes.set(key, (errorTypes.get(key) || 0) + 1);
      });
    Array.from(errorTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([msg, n]) => console.log(`  [${n}] ${msg}`));
  }

  if (okCount > 0) {
    console.log(
      `\n\x1b[32m✓ Google va re-crawler ces ${okCount} URLs dans les prochaines heures.\x1b[0m`
    );
    console.log(
      "  Vérifie GSC dans 24-48h : 'Pages indexées' devrait commencer à monter."
    );
  }
}

main().catch((e) => {
  console.error("\n\x1b[31m❌ Erreur fatale:\x1b[0m", e);
  process.exit(1);
});
