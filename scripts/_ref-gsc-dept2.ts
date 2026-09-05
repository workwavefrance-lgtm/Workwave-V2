import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { getServiceClient } from "../lib/supabase/service-client";
import fs from "fs";
(async () => {
  const sb = getServiceClient();
  const { data: deps } = await sb.from("departments").select("id,code,name,country");
  const { generateDepartmentSlug } = await import("../lib/utils/slugs");
  const slugs = new Set((deps ?? []).map((d: any) => generateDepartmentSlug(d)));
  console.log(`departements en base : ${deps?.length}, ex slug : ${[...slugs].slice(0,3).join(", ")}`);

  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  let all: any[] = [];
  for (let start = 0; start < 300000; start += 5000) {
    const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
      startDate: "2026-08-07", endDate: "2026-09-03", dimensions: ["page"], rowLimit: 5000, startRow: start } });
    const rows = r.data.rows || [];
    all = all.concat(rows);
    if (rows.length < 5000) break;
  }
  console.log(`pages avec impressions (28j) : ${all.length}`);
  const depts = all.filter(r => {
    const m = r.keys![0].match(/^https:\/\/workwave\.fr\/([^/]+)\/([^/?#]+)$/);
    return m && slugs.has(m[2]);
  });
  const sum = (a: any[], k: string) => a.reduce((s, r) => s + (r[k] || 0), 0);
  console.log(`pages /[metier]/[dept] avec impressions : ${depts.length}`);
  console.log(`  impressions ${sum(depts,"impressions")} / ${sum(all,"impressions")} site  (${(100*sum(depts,"impressions")/sum(all,"impressions")).toFixed(2)}%)`);
  console.log(`  clics ${sum(depts,"clicks")} / ${sum(all,"clicks")} site  (${(100*sum(depts,"clicks")/sum(all,"clicks")).toFixed(2)}%)`);
  console.log(`  pages dept a 0 clic : ${depts.filter(r=>(r.clicks||0)===0).length}`);
  // pages ville
  const villes = all.filter(r => {
    const m = r.keys![0].match(/^https:\/\/workwave\.fr\/([^/]+)\/([^/?#]+)$/);
    return m && !slugs.has(m[2]);
  });
  console.log(`pages 2 segments NON dept (villes + autres) : ${villes.length}, clics ${sum(villes,"clicks")}, imp ${sum(villes,"impressions")}`);
  fs.writeFileSync("/tmp/dept-pages.json", JSON.stringify(depts.map(r=>({p:r.keys![0],i:r.impressions,c:r.clicks,pos:r.position}))));
  fs.writeFileSync("/tmp/ville-pages.json", JSON.stringify(villes.map(r=>({p:r.keys![0],i:r.impressions,c:r.clicks,pos:r.position}))));
})();
