import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { getServiceClient } from "../lib/supabase/service-client";
const SITE = "https://workwave.fr/";
const R = { s: "2026-08-05", e: "2026-09-01" };
async function main() {
  const sb = getServiceClient();
  const { count } = await sb.from("price_guides").select("id", { count: "exact", head: true });
  console.log(`price_guides en base : ${count}`);

  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const all = async (body: any) => { const rows: any[] = []; let start = 0;
    while (true) { const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { ...body, rowLimit: 25000, startRow: start } });
      const got = r.data.rows || []; rows.push(...got); if (!got.length) break; start += got.length; if (start >= 100000) break; } return rows; };

  // Les 9 clics des pages /guide-des-prix/ : quelles requetes exactement ?
  const q = await all({ startDate: R.s, endDate: R.e, dimensions: ["query","page"],
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/guide-des-prix/" }] }] });
  const cl = q.filter(r => r.clicks > 0).sort((a,b)=>b.clicks-a.clicks);
  console.log(`\nRequetes CLIQUEES sur /guide-des-prix/ (28j) : ${cl.reduce((a,r)=>a+r.clicks,0)} clics nommes`);
  const RX = /\bprix\b|\btarif|combien (ca|ça) co|coût|au m2|au m²/i;
  for (const r of cl) console.log(`   ${r.clicks}c ${String(r.impressions).padStart(4)}i pos ${r.position.toFixed(1).padStart(5)} | ${RX.test(r.keys[0])?"[PRIX]":"[hors prix]"} "${r.keys[0]}" -> ${r.keys[1].replace("https://workwave.fr","")}`);

  // Concentration des impressions sur les pages guides
  const p = await all({ startDate: R.s, endDate: R.e, dimensions: ["page"],
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/guide-des-prix/" }] }] });
  const tot = p.reduce((a,r)=>a+r.impressions,0);
  const top2 = p.sort((a,b)=>b.impressions-a.impressions).slice(0,2).reduce((a,r)=>a+r.impressions,0);
  console.log(`\nConcentration : top 2 pages = ${top2}/${tot} imp = ${(100*top2/tot).toFixed(0)}% des impressions guides`);
  const sousPos10 = p.filter(r=>r.position<=10);
  console.log(`Pages guides en position <=10 : ${sousPos10.length} pages | ${sousPos10.reduce((a,r)=>a+r.impressions,0)} imp | ${sousPos10.reduce((a,r)=>a+r.clicks,0)} clics`);
}
main().catch(e=>{console.error("ERREUR", e?.response?.data?.error?.message||e.message);process.exit(1);});
