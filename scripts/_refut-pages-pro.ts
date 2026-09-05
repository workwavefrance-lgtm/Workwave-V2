import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const S = "2026-06-04", E = "2026-09-02";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  let all: any[] = [];
  for (let start = 0; start < 100000; start += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const rows = r.data.rows || []; all.push(...rows); if (rows.length < 25000) break;
  }
  console.log(`Pages avec au moins 1 impression (${S} -> ${E}) : ${all.length}`);
  const pro = all.filter(r => /workwave\.fr\/pro(\/|$)/.test(r.keys[0]));
  console.log(`\n=== Pages /pro* ayant des impressions : ${pro.length} ===`);
  for (const r of pro.sort((a,b)=>(b.impressions||0)-(a.impressions||0)))
    console.log(`  pos ${(r.position||0).toFixed(1).padStart(5)} | ${String(r.impressions).padStart(5)} imp | ${String(r.clicks).padStart(3)} clics | ${r.keys[0].replace("https://workwave.fr","")}`);
  const cibles = ["/pro/sans-abonnement","/pro/alternatives/habitatpresto","/pro/alternatives/travaux-com","/pro/alternatives/starofservice"];
  console.log(`\n=== Les 4 pages de l'audit ===`);
  for (const c of cibles) {
    const h = all.find(r => r.keys[0] === "https://workwave.fr"+c);
    console.log(`  ${h ? `${h.impressions} imp | ${h.clicks} clics | pos ${(h.position||0).toFixed(1)}` : "0 impression sur 3 mois"} | ${c}`);
  }
  // hubs pro pour comparaison
  console.log(`\n=== Hubs acquisition PRO pour comparaison ===`);
  for (const c of ["/trouver-des-chantiers","/trouver-des-clients","/pro"]) {
    const h = all.find(r => r.keys[0] === "https://workwave.fr"+c);
    console.log(`  ${h ? `${String(h.impressions).padStart(5)} imp | ${h.clicks} clics | pos ${(h.position||0).toFixed(1)}` : "0 impression"} | ${c}`);
  }
})();
