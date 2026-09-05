import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";

/**
 * Demande a Google, page par page, ce qu'il reproche a nos donnees
 * structurees. Le rapport agrege "Ensembles de donnees" n'a pas d'API ;
 * urlInspection expose en revanche richResultsResult, qui liste les types
 * detectes et les problemes exacts par element.
 *
 * Scope necessaire :
 *   gcloud auth application-default login \
 *     --scopes="https://www.googleapis.com/auth/webmasters.readonly"
 */
const SITE = "https://workwave.fr/";
const PAGES = [
  "https://workwave.fr/barometre-artisans",
  "https://workwave.fr/barometre-prix-artisans",
  "https://workwave.fr/barometre-metiers-artisans",
  "https://workwave.fr/barometre-artisans-belgique",
  "https://workwave.fr/barometre-penurie-artisans",
  "https://workwave.fr/ai/barometre-tjm",
];

(async () => {
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });

  for (const u of PAGES) {
    console.log("\n" + u);
    try {
      const { data } = await sc.urlInspection.index.inspect({
        requestBody: { inspectionUrl: u, siteUrl: SITE },
      });
      const res = data.inspectionResult || {};
      const idx: any = res.indexStatusResult || {};
      console.log(`   indexation      : ${idx.verdict} · ${idx.coverageState}`);
      console.log(`   dernier crawl   : ${idx.lastCrawlTime ? String(idx.lastCrawlTime).slice(0, 10) : "jamais"}`);

      const rr: any = (res as any).richResultsResult;
      if (!rr) {
        console.log("   resultats enrichis : AUCUN detecte par Google");
        continue;
      }
      console.log(`   resultats enrichis : ${rr.verdict}`);
      for (const t of rr.detectedItems || []) {
        console.log(`     type « ${t.richResultType} » : ${(t.items || []).length} element(s)`);
        for (const it of t.items || []) {
          const pbs = it.issues || [];
          if (!pbs.length) {
            console.log(`       - ${it.name} : aucun probleme`);
            continue;
          }
          for (const p of pbs) {
            console.log(`       - ${it.name} : [${p.severity}] ${p.issueMessage}`);
          }
        }
      }
    } catch (e) {
      console.log(`   echec : ${(e as Error).message.slice(0, 160)}`);
    }
  }
})();
