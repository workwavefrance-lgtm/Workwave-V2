import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: (await auth.getClient()) as never });
  const urls: [string,string][] = [
    ["PRO ","blog/obtenir-leads-artisan-gironde-33-guide-2026"],
    ["PRO ","blog/obtenir-leads-artisan-vienne-86-guide-2026"],
    ["PRO ","blog/obtenir-leads-artisan-nouvelle-aquitaine-guide-2026"],
    ["PRO ","blog/obtenir-leads-artisan-landes-40-guide-2026"],
    ["PRO ","blog/obtenir-leads-artisan-creuse-23-guide-2026"],
    // CONTROLE : articles blog grand public qui ONT des impressions
    ["CTRL","blog/prix-pose-carrelage-au-m2-en-2026-sol-mur-salle-de-bain-toutes-fourchettes"],
    ["CTRL","blog/comment-lire-un-devis-travaux-en-2026-les-12-points-a-verifier-absolument"],
    // CONTROLE : article blog grand public SANS impression
    ["CTRL","blog/comment-choisir-le-bon-climaticien-en-vienne-86-en-2026-guide-complet"],
    // CONTROLE : le hub pro que l audit veut utiliser comme source de liens
    ["HUB ","trouver-des-chantiers"],
  ];
  for (const [tag,u] of urls) {
    try {
      const { data } = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: `https://workwave.fr/${u}`, siteUrl: "https://workwave.fr/" } });
      const r: any = data.inspectionResult?.indexStatusResult || {};
      console.log(`${tag} ${(r.verdict==="PASS"?"INDEXEE   ":"NON-INDEX ")} | ${String(r.coverageState).slice(0,42).padEnd(42)} | crawl ${r.lastCrawlTime?r.lastCrawlTime.slice(0,10):"JAMAIS"} | ref:${r.referringUrls?r.referringUrls.length:0} | ${u.slice(0,55)}`);
    } catch(e:any) { console.log(`${tag} ERR ${e.message} | ${u}`); }
    await new Promise(r=>setTimeout(r,900));
  }
})();
