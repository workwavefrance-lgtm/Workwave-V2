import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { google } from "googleapis";
const sb = getServiceClient();
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
    startDate: "2026-08-05", endDate: "2026-09-01", dimensions: ["page"], rowLimit: 5000,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/plombier/" }] }] } });
  const rows = (r.data.rows || []) as any[];
  // ne garder que les pages departement (slug ...-NN)
  const { data: depts } = await sb.from("departments").select("id,code");
  const byCode = new Map((depts || []).map((d: any) => [d.code, d.id]));
  const out: any[] = [];
  for (const x of rows) {
    const u = x.keys[0] as string;
    const m = u.match(/\/plombier\/([a-z0-9-]+)-(\d{2,3})$/);
    if (!m) continue;
    const code = m[2];
    if (!byCode.has(code)) continue;
    const { count } = await sb.from("pros").select("id", { count: "exact", head: true })
      .eq("category_id", 1).eq("is_active", true).is("deleted_at", null).eq("etat_admin", "A")
      .like("postal_code", code + "%");
    out.push({ code, pros: count || 0, imp: x.impressions, clics: x.clicks, pos: x.position });
  }
  out.sort((a, b) => b.pros - a.pros);
  console.log("Pages /plombier/<dept> avec impressions (28 j) :");
  console.log("dept | pros ouverts | impressions | clics | position");
  for (const o of out) console.log(`  ${o.code.padStart(3)} | ${String(o.pros).padStart(6)} | ${String(o.imp).padStart(6)} | ${String(o.clics).padStart(4)} | ${o.pos.toFixed(1)}`);
  const n = out.length;
  if (n > 2) {
    const mx = out.reduce((a, o) => a + o.pros, 0) / n, my = out.reduce((a, o) => a + o.imp, 0) / n;
    const num = out.reduce((a, o) => a + (o.pros - mx) * (o.imp - my), 0);
    const den = Math.sqrt(out.reduce((a, o) => a + (o.pros - mx) ** 2, 0) * out.reduce((a, o) => a + (o.imp - my) ** 2, 0));
    console.log(`\ncorrelation nb de pros ouverts <-> impressions : r = ${(num / den).toFixed(3)} (n=${n})`);
  }
})();
