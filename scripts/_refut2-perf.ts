import * as dotenv from "dotenv"; import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { getServiceClient } from "../lib/supabase/service-client";

(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: await auth.getClient() as any });
  let rows: any[] = [];
  for (let s = 0; s < 50000; s += 5000) {
    const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
      startDate: "2026-08-04", endDate: "2026-09-02", dimensions: ["page"], rowLimit: 5000, startRow: s,
      dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/artisan/" }] }],
    }});
    const d = r.data.rows || []; rows = rows.concat(d); if (d.length < 5000) break;
  }
  console.log(`fiches /artisan/ avec impressions sur 30 j : ${rows.length}`);
  const slugs = rows.map(r => decodeURIComponent(r.keys[0].replace("https://workwave.fr/artisan/", "").replace(/\/$/, "")));
  const map = new Map(rows.map((r, i) => [slugs[i], r]));

  const sb = getServiceClient();
  const avec: any[] = []; const sans: any[] = [];
  for (let i = 0; i < slugs.length; i += 400) {
    const lot = slugs.slice(i, i + 400);
    const { data, error } = await sb.from("pros").select("slug,google_rating,google_reviews_count").in("slug", lot);
    if (error) { console.log("err", error.message); break; }
    for (const p of (data || []) as any[]) {
      const g = map.get(p.slug); if (!g) continue;
      ((p.google_reviews_count ?? 0) > 0 && (p.google_rating ?? 0) > 0 ? avec : sans).push(g);
    }
  }
  const agg = (a: any[]) => {
    const imp = a.reduce((n, r) => n + r.impressions, 0);
    const clk = a.reduce((n, r) => n + r.clicks, 0);
    const pos = a.reduce((n, r) => n + r.position * r.impressions, 0) / Math.max(imp, 1);
    return { n: a.length, imp, clk, impParFiche: (imp / Math.max(a.length,1)).toFixed(1), ctr: ((clk/Math.max(imp,1))*100).toFixed(2)+"%", pos: pos.toFixed(1) };
  };
  console.log("fiches AVEC note+avis Google :", agg(avec));
  console.log("fiches SANS aucun avis      :", agg(sans));
})();
