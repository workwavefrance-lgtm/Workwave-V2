/**
 * Audit performances sitemap.
 *
 * Lance un curl sur /sitemap-index.xml puis sur chaque sub-sitemap qu'il
 * declare, et mesure le temps de reponse. ALERTE si l'un depasse 5s
 * (zone dangereuse) ou 10s (rouge, Googlebot risque de timeout).
 *
 * Usage:
 *   npx tsx scripts/audit-sitemap-perf.ts                 # contre prod
 *   BASE=http://localhost:3000 npx tsx scripts/audit-sitemap-perf.ts  # local
 *
 * A lancer AVANT chaque deploiement qui touche app/sitemap.ts ou
 * app/sitemap-index.xml/. Si l'un des sub-sitemaps depasse 5s, NE PAS push.
 *
 * Cf. lecon apprise CLAUDE.md du 2026-04-29 sur les sitemaps lentes.
 */
import { execSync } from "child_process";

const BASE = process.env.BASE ?? "https://workwave.fr";
const WARN_S = 5;
const FAIL_S = 10;

type SubSitemap = { url: string; httpCode: number; timeS: number; sizeBytes: number; nbUrls: number };

function curl(url: string): { httpCode: number; timeS: number; sizeBytes: number; body: string } {
  const tmp = `/tmp/audit-sitemap-${Date.now()}-${Math.random().toString(36).slice(2)}.xml`;
  try {
    const stdout = execSync(
      `curl -s -o ${tmp} -w "%{http_code}|%{time_total}|%{size_download}" "${url}"`,
      { encoding: "utf-8" }
    );
    const [code, time, size] = stdout.trim().split("|");
    const body = execSync(`cat ${tmp}`, { encoding: "utf-8" });
    return {
      httpCode: parseInt(code, 10),
      timeS: parseFloat(time),
      sizeBytes: parseInt(size, 10),
      body,
    };
  } finally {
    try {
      execSync(`rm -f ${tmp}`);
    } catch {}
  }
}

function extractSubsitemapUrls(indexXml: string): string[] {
  const matches = indexXml.match(/<loc>[^<]+<\/loc>/g) || [];
  return matches.map((m) => m.replace(/<\/?loc>/g, ""));
}

function countUrls(subsitemapXml: string): number {
  const matches = subsitemapXml.match(/<url>/g) || [];
  return matches.length;
}

function color(s: string, c: "red" | "yellow" | "green" | "gray"): string {
  const codes = { red: 31, yellow: 33, green: 32, gray: 90 };
  return `\x1b[${codes[c]}m${s}\x1b[0m`;
}

function classify(timeS: number): "OK" | "WARN" | "FAIL" {
  if (timeS >= FAIL_S) return "FAIL";
  if (timeS >= WARN_S) return "WARN";
  return "OK";
}

async function main() {
  console.log(`\nAudit sitemap perf — base: ${BASE}\n`);

  // 1. Index
  const indexUrl = `${BASE}/sitemap-index.xml`;
  console.log("[1/2] Index sitemap...");
  const idx = curl(indexUrl);
  if (idx.httpCode !== 200) {
    console.error(color(`  ❌ ${indexUrl} -> HTTP ${idx.httpCode}`, "red"));
    process.exit(1);
  }
  const status = classify(idx.timeS);
  const colorFn = status === "OK" ? "green" : status === "WARN" ? "yellow" : "red";
  console.log(
    color(
      `  ${indexUrl} -> ${idx.timeS.toFixed(2)}s | ${idx.sizeBytes} bytes`,
      colorFn
    )
  );
  const subUrls = extractSubsitemapUrls(idx.body);
  console.log(`  ${subUrls.length} sub-sitemaps listes\n`);

  // 2. Chaque sub-sitemap
  console.log("[2/2] Sub-sitemaps...");
  const results: SubSitemap[] = [];
  for (const url of subUrls) {
    const r = curl(url);
    const nbUrls = countUrls(r.body);
    results.push({
      url,
      httpCode: r.httpCode,
      timeS: r.timeS,
      sizeBytes: r.sizeBytes,
      nbUrls,
    });

    const st = classify(r.timeS);
    const cf = r.httpCode !== 200 ? "red" : st === "OK" ? "green" : st === "WARN" ? "yellow" : "red";
    const path = url.replace(BASE, "");
    console.log(
      color(
        `  ${path.padEnd(28)} | ${r.timeS.toFixed(2).padStart(6)}s | HTTP ${r.httpCode} | ${nbUrls.toString().padStart(6)} URLs | ${(r.sizeBytes / 1024).toFixed(0)} KB`,
        cf
      )
    );
  }

  // Resume
  const slowOnes = results.filter((r) => r.timeS >= WARN_S);
  const failOnes = results.filter((r) => r.timeS >= FAIL_S || r.httpCode !== 200);
  const totalUrls = results.reduce((s, r) => s + r.nbUrls, 0);
  const maxTime = Math.max(...results.map((r) => r.timeS));

  console.log(`\n=== Resume ===`);
  console.log(`  Total URLs declarees   : ${totalUrls}`);
  console.log(`  Sub-sitemaps testes    : ${results.length}`);
  console.log(`  Temps max sub-sitemap  : ${maxTime.toFixed(2)}s`);
  console.log(`  Au-dessus de ${WARN_S}s (jaune)  : ${slowOnes.length}`);
  console.log(`  Au-dessus de ${FAIL_S}s (rouge)  : ${failOnes.length}`);

  if (failOnes.length > 0) {
    console.log(color(`\n❌ FAIL : ${failOnes.length} sub-sitemap(s) lent(s) ou casse(s) !`, "red"));
    console.log("Ces sitemaps risquent de timeout cote Googlebot et de provoquer des erreurs GSC.");
    console.log("Ne PAS deployer en l'etat. Voir CLAUDE.md lecon 2026-04-29 sur les optims sitemap.");
    process.exit(1);
  } else if (slowOnes.length > 0) {
    console.log(color(`\n⚠️  WARN : ${slowOnes.length} sub-sitemap(s) au-dessus de ${WARN_S}s`, "yellow"));
    console.log("A surveiller. Si ca s'aggrave, optimiser avant que Googlebot timeout.");
  } else {
    console.log(color(`\n✓ OK : tous les sub-sitemaps repondent en moins de ${WARN_S}s`, "green"));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
