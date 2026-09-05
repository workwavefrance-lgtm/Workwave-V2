import * as dotenv from "dotenv"; import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { getServiceClient } from "../lib/supabase/service-client";

(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: await auth.getClient() as any });
  let rows: any[] = [];
  for (let s = 0; s < 80000; s += 5000) {
    const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
      startDate: "2026-08-04", endDate: "2026-09-02", dimensions: ["page"], rowLimit: 5000, startRow: s,
      dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/artisan/" }] }],
    }});
    const d = r.data.rows || []; rows = rows.concat(d); if (d.length < 5000) break;
  }
  const impTot = rows.reduce((n,r)=>n+r.impressions,0), clkTot = rows.reduce((n,r)=>n+r.clicks,0);
  console.log(`fiches /artisan/ avec impressions 30 j : ${rows.length} | ${impTot} imp | ${clkTot} clics`);

  const slugs = rows.map(r => decodeURIComponent(r.keys[0].replace("https://workwave.fr/artisan/", "").replace(/\/$/, "")));
  const map = new Map(rows.map((r, i) => [slugs[i], r]));

  const sb = getServiceClient();
  const avec: any[] = []; const sans: any[] = []; let vus = 0;
  for (let i = 0; i < slugs.length; i += 300) {
    const lot = slugs.slice(i, i + 300);
    let data: any = null;
    for (let t = 0; t < 4; t++) {
      const r = await sb.from("pros").select("slug,google_rating,google_reviews_count").in("slug", lot);
      if (!r.error) { data = r.data; break; }
      await new Promise(res => setTimeout(res, 1500));
    }
    if (!data) { console.log("lot echoue a l'offset", i); continue; }
    for (const p of data as any[]) {
      const g = map.get(p.slug); if (!g) continue; vus++;
      ((p.google_reviews_count ?? 0) > 0 && (p.google_rating ?? 0) > 0 ? avec : sans).push(g);
    }
  }
  const agg = (a: any[]) => {
    const imp = a.reduce((n, r) => n + r.impressions, 0), clk = a.reduce((n, r) => n + r.clicks, 0);
    const pos = a.reduce((n, r) => n + r.position * r.impressions, 0) / Math.max(imp, 1);
    return { fiches: a.length, imp, clics: clk, impParFiche: +(imp/Math.max(a.length,1)).toFixed(2),
             clicsParFiche: +(clk/Math.max(a.length,1)).toFixed(3), ctr: +((clk/Math.max(imp,1))*100).toFixed(2), pos: +pos.toFixed(1) };
  };
  console.log(`fiches appariees en base : ${vus}`);
  console.log("AVEC note+avis Google :", agg(avec));
  console.log("SANS aucun avis       :", agg(sans));
})();
