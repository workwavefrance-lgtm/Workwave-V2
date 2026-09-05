import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const { data: cats } = await sb.from("categories").select("id,slug").in("vertical", ["btp","domicile","personne"]);
  console.log(`categories BTP/domicile/personne en base : ${(cats||[]).length}`);
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const rows: any[] = []; let start = 0;
  while (true) {
    const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: { startDate: "2026-08-01", endDate: "2026-08-31", dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const rr = r.data.rows || []; if (!rr.length) break; rows.push(...rr); start += rr.length; if (rr.length < 25000) break;
  }
  for (const suf of ["prix", "guide", "urgence", "installation", "obligation", "location-saisonniere"]) {
    const f = rows.filter(r => { const s = r.keys[0].replace("https://workwave.fr","").split("/").filter(Boolean); return s.length === 2 && s[1] === suf; });
    const i = f.reduce((s,r)=>s+r.impressions,0), c = f.reduce((s,r)=>s+r.clicks,0);
    console.log(`/[metier]/${suf.padEnd(20)} : ${String(f.length).padStart(3)} pages vues | ${String(i).padStart(5)} imp | ${c} clics | pos ${f.length? (f.reduce((s,r)=>s+r.position*r.impressions,0)/Math.max(i,1)).toFixed(1):"-"}`);
  }
})();
