import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const { data: cats } = await sb.from("categories").select("slug, vertical").in("vertical", ["btp", "domicile", "personne"]);
  const metiers = new Set((cats || []).map((c: any) => c.slug));
  // slugs de communes reels
  const villes = new Set<string>(); let off = 0;
  while (true) {
    const { data } = await sb.from("cities").select("slug").range(off, off + 999);
    const rows = data || []; if (!rows.length) break;
    for (const r of rows as any[]) villes.add(r.slug);
    off += rows.length;
  }
  console.log(`Reference base : ${metiers.size} metiers, ${villes.size} communes`);

  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const vues = new Set<string>(); let cl = 0, im = 0, n = 0;
  for (let s = 0; s < 100000; s += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: { startDate: "2026-08-05", endDate: "2026-09-03", dimensions: ["page"], rowLimit: 25000, startRow: s } });
    const rows = r.data.rows || []; if (!rows.length) break;
    for (const row of rows) {
      const u = (row.keys![0] || "").replace("https://workwave.fr", "");
      const m = u.match(/^\/([a-z0-9-]+)\/([a-z0-9-]+)$/);
      if (m && metiers.has(m[1]) && villes.has(m[2])) { vues.add(m[2]); cl += row.clicks||0; im += row.impressions||0; n++; }
    }
    if (rows.length < 25000) break;
  }
  console.log(`\nPages metier x commune REELLES vues par Google (30j) : ${n}`);
  console.log(`Communes distinctes deja visibles : ${vues.size} / ${villes.size} (${((vues.size/villes.size)*100).toFixed(1)} %)`);
  console.log(`Clics : ${cl} (${(cl/30).toFixed(1)}/jour) · Impressions : ${im}`);
})();
