import dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const sb = getServiceClient();
  const sm2 = new Set(fs.readFileSync("/tmp/sm2.txt","utf8").trim().split("\n").map(u=>u.replace("https://workwave.fr","")));
  const vue: { u: string; n: number }[] = [];
  let off = 0;
  while (true) {
    const { data } = await sb.from("listing_cat_ville").select("metier,ville,n").order("n",{ascending:false}).order("metier").order("ville").range(off, off+999);
    const rows = (data||[]) as any[]; if (!rows.length) break;
    for (const r of rows) vue.push({ u: `/${r.metier}/${r.ville}`, n: r.n });
    off += rows.length;
  }
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const gsc = new Map<string, number>();
  for (let start = 0; start < 100000; start += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: "2026-08-01", endDate: "2026-08-28", dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const rs = r.data.rows || [];
    for (const row of rs) gsc.set(row.keys[0].split("?")[0].replace("https://workwave.fr",""), row.clicks);
    if (rs.length < 25000) break;
  }
  const hors = vue.filter(v => !sm2.has(v.u));
  const dejaVues = hors.filter(v => gsc.has(v.u));
  const jamaisVues = hors.length - dejaVues.length;
  const clicsDeja = dejaVues.reduce((s,v)=>s+(gsc.get(v.u)||0),0);
  console.log(`pages du chantier (couples >=3 pas encore au sitemap) : ${hors.length}`);
  console.log(`  dont DEJA vues par Google (>=1 impression en aout)  : ${dejaVues.length} (${(100*dejaVues.length/hors.length).toFixed(1)} %), qui pesent deja ${clicsDeja} clics/28j`);
  console.log(`  dont AUCUNE impression a ce jour                    : ${jamaisVues}`);
  console.log(`plafond honnete du gain = ${jamaisVues} pages x 0,0042 clic/jour (taux des pages QUI ONT des impressions) = ${(jamaisVues*0.0042).toFixed(0)} clics/jour`);
  console.log(`  ... mais seules 13,7 % des pages annoncees au sitemap recoltent une impression -> ${(jamaisVues*0.137*0.0042).toFixed(1)} clics/jour au taux observe`);
}
main();
