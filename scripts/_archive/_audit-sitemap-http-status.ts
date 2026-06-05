/**
 * Audit HTTP des URLs de la sitemap : echantillonne aleatoirement N URLs
 * de chaque sub-sitemap et verifie leur status code en prod.
 *
 * Objectif : identifier si des URLs PRESENTES dans la sitemap retournent
 * 404 / 5xx (= bug code) ou 308 (= redirect attendu Phase D).
 *
 * Pourquoi : GSC affiche 979 "Introuvable (404)" et 12 593 "Page avec
 * redirection". On veut isoler la cause :
 *   - 404 dans sitemap = bug, a fixer
 *   - 404 hors sitemap = vieilles URLs scrappees avant fix pagination 30/04,
 *     elles disparaitront naturellement
 *   - 308 dans sitemap = bug (la sitemap ne devrait pas inclure les URLs
 *     qui redirigent), a corriger
 *   - 308 hors sitemap = normal (Phase D ville sans pros)
 *
 * Usage :
 *   npx tsx scripts/_audit-sitemap-http-status.ts          # 200 URLs par sub-sitemap, parallele
 *   npx tsx scripts/_audit-sitemap-http-status.ts --quick  # 30 URLs par sub-sitemap (test rapide)
 */
import { execSync } from "child_process";

const BASE = "https://workwave.fr";
const QUICK = process.argv.includes("--quick");
const SAMPLE_PER_SITEMAP = QUICK ? 30 : 100;
const PARALLELISM = 20;

async function fetchSitemap(url: string): Promise<string[]> {
  const xml = execSync(`curl -s "${url}"`, { encoding: "utf-8" });
  const matches = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
  return matches.map((m) => m.replace(/<\/?loc>/g, ""));
}

async function getStatus(url: string): Promise<number> {
  try {
    const code = execSync(
      `curl -o /dev/null -s -w "%{http_code}" --max-time 8 "${url}"`,
      { encoding: "utf-8" }
    );
    return parseInt(code) || 0;
  } catch {
    return 0;
  }
}

async function processInParallel<T, R>(
  items: T[],
  workerFn: (item: T) => Promise<R>,
  parallelism: number
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += parallelism) {
    const chunk = items.slice(i, i + parallelism);
    const chunkResults = await Promise.all(chunk.map(workerFn));
    results.push(...chunkResults);
  }
  return results;
}

function sample<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return arr;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

async function auditSitemap(sitemapUrl: string): Promise<{
  total: number;
  sampled: number;
  byStatus: Record<number, number>;
  redirects: { url: string; final: string }[];
  errors: { url: string; status: number }[];
}> {
  const urls = await fetchSitemap(sitemapUrl);
  const sampled = sample(urls, SAMPLE_PER_SITEMAP);

  const results = await processInParallel(
    sampled,
    async (url) => {
      const status = await getStatus(url);
      let finalUrl: string | null = null;
      if (status === 301 || status === 308 || status === 302 || status === 307) {
        try {
          finalUrl = execSync(
            `curl -o /dev/null -s -w "%{redirect_url}" --max-time 8 "${url}"`,
            { encoding: "utf-8" }
          ).trim();
        } catch {}
      }
      return { url, status, finalUrl };
    },
    PARALLELISM
  );

  const byStatus: Record<number, number> = {};
  const redirects: { url: string; final: string }[] = [];
  const errors: { url: string; status: number }[] = [];

  for (const r of results) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    if (r.status >= 300 && r.status < 400 && r.finalUrl) {
      redirects.push({ url: r.url, final: r.finalUrl });
    }
    if (r.status >= 400 || r.status === 0) {
      errors.push({ url: r.url, status: r.status });
    }
  }

  return { total: urls.length, sampled: sampled.length, byStatus, redirects, errors };
}

async function main() {
  console.log(`=== Audit HTTP status des URLs sitemap (${SAMPLE_PER_SITEMAP}/sub-sitemap) ===\n`);

  // Fetch sitemap index
  const indexXml = execSync(`curl -s "${BASE}/sitemap-index.xml"`, {
    encoding: "utf-8",
  });
  const subSitemaps = (indexXml.match(/<loc>([^<]+)<\/loc>/g) || []).map((m) =>
    m.replace(/<\/?loc>/g, "")
  );

  console.log(`Sitemap index : ${subSitemaps.length} sub-sitemaps detectes\n`);

  const allByStatus: Record<number, number> = {};
  const allRedirects: { url: string; final: string }[] = [];
  const allErrors: { url: string; status: number }[] = [];
  let totalUrls = 0;
  let totalSampled = 0;

  // Echantillon : 3 premiers + 3 milieu + 3 derniers sub-sitemaps pour avoir
  // une couverture representative sans tout pinger
  const toAudit = QUICK
    ? subSitemaps.slice(0, 3)
    : [
        ...subSitemaps.slice(0, 5),
        ...subSitemaps.slice(Math.floor(subSitemaps.length / 2) - 2, Math.floor(subSitemaps.length / 2) + 3),
        ...subSitemaps.slice(-5),
      ];

  console.log(`Audit de ${toAudit.length} sub-sitemaps...\n`);

  for (const sm of toAudit) {
    process.stdout.write(`  ${sm.padEnd(60)} ... `);
    const audit = await auditSitemap(sm);
    totalUrls += audit.total;
    totalSampled += audit.sampled;

    for (const [k, v] of Object.entries(audit.byStatus)) {
      allByStatus[parseInt(k)] = (allByStatus[parseInt(k)] || 0) + v;
    }
    allRedirects.push(...audit.redirects);
    allErrors.push(...audit.errors);

    const statusSummary = Object.entries(audit.byStatus)
      .map(([k, v]) => `${k}:${v}`)
      .join(" ");
    console.log(`${audit.total}u (${audit.sampled} sampled) -> ${statusSummary}`);
  }

  console.log(`\n=== RECAP GLOBAL ===`);
  console.log(`Total URLs dans sub-sitemaps audites : ${totalUrls.toLocaleString("fr-FR")}`);
  console.log(`Total URLs samplees                  : ${totalSampled.toLocaleString("fr-FR")}\n`);

  console.log("Distribution par status code :");
  Object.entries(allByStatus)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .forEach(([status, count]) => {
      const pct = ((count / totalSampled) * 100).toFixed(1);
      const emoji =
        status === "200" ? "✓" :
        status.startsWith("3") ? "↪" :
        status.startsWith("4") ? "✗" :
        status.startsWith("5") ? "💥" : "?";
      console.log(`  ${emoji} ${status} : ${count.toString().padStart(4)} URLs (${pct}%)`);
    });

  if (allErrors.length > 0) {
    console.log(`\n⚠️  ERREURS DETECTEES (URLs sitemap retournant 4xx/5xx) :`);
    allErrors.slice(0, 20).forEach((e) =>
      console.log(`  [${e.status}] ${e.url}`)
    );
    if (allErrors.length > 20) {
      console.log(`  ... et ${allErrors.length - 20} autres`);
    }
    console.log(
      `\n>> Si erreurs > 0 : URLs presentes dans la sitemap retournent un code d'erreur.`
    );
    console.log(`   C'est un bug a fixer (la sitemap ne doit JAMAIS contenir d'URLs 4xx/5xx).`);
  } else {
    console.log("\n✓ Aucune erreur 4xx/5xx detectee dans la sitemap. Bien.");
  }

  if (allRedirects.length > 0) {
    console.log(`\n↪️  REDIRECTS DETECTES (URLs sitemap qui redirigent) :`);
    allRedirects.slice(0, 10).forEach((r) =>
      console.log(`  ${r.url}\n     -> ${r.final}`)
    );
    if (allRedirects.length > 10) {
      console.log(`  ... et ${allRedirects.length - 10} autres`);
    }
    console.log(
      `\n>> Une sitemap ne devrait pas contenir d'URLs qui redirigent.`
    );
    console.log(
      `   Si pourcentage > 5% : a corriger (filtrer les URLs sources de redirect Phase D).`
    );
  } else {
    console.log("\n✓ Aucun redirect detecte dans la sitemap. Bien.");
  }

  console.log("\n=== Verdict ===");
  if (allErrors.length === 0 && allRedirects.length === 0) {
    console.log(
      "✅ Sitemap saine : 100% des URLs samplees retournent 200 OK."
    );
    console.log(
      "   Les 979 'Introuvable (404)' et 12 593 'Page avec redirection' GSC"
    );
    console.log(
      "   sont des vieilles URLs hors sitemap (scrappees avant le fix pagination"
    );
    console.log("   du 30/04). Elles vont disparaitre naturellement avec le temps.");
  } else {
    console.log(`⚠️  ${allErrors.length} erreurs + ${allRedirects.length} redirects detectes.`);
    console.log("    Action requise : voir details ci-dessus.");
  }
}

main().catch(console.error);
