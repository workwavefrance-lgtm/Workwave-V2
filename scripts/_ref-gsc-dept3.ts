import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { getServiceClient } from "../lib/supabase/service-client";
import { generateDepartmentSlug } from "../lib/utils/slugs";
(async () => {
  const sb = getServiceClient();
  const { data: deps } = await sb.from("departments").select("id,code,name,country");
  const slugs = new Set((deps ?? []).map((d: any) => generateDepartmentSlug(d)));
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  for (const [label, startDate] of [["90 jours", "2026-06-06"], ["16 mois", "2025-05-01"]] as const) {
    let all: any[] = [];
    for (let start = 0; start < 400000; start += 5000) {
      const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
        startDate, endDate: "2026-09-03", dimensions: ["page"], rowLimit: 5000, startRow: start } });
      const rows = r.data.rows || [];
      all = all.concat(rows);
      if (rows.length < 5000) break;
    }
    const depts = all.filter(r => {
      const m = r.keys![0].match(/^https:\/\/workwave\.fr\/([^/]+)\/([^/?#]+)$/);
      return m && slugs.has(m[2]);
    });
    const sum = (a: any[], k: string) => a.reduce((s, r) => s + (r[k] || 0), 0);
    console.log(`${label} (${startDate} -> 2026-09-03) : ${all.length} pages ; dept = ${depts.length} pages, ${sum(depts,"clicks")} clics, ${sum(depts,"impressions")} imp ; site = ${sum(all,"clicks")} clics, ${sum(all,"impressions")} imp`);
  }
})();
