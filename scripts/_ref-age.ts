import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { google } from "googleapis";
const sb = getServiceClient();
const SITE = "https://workwave.fr/";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
    startDate: "2026-08-05", endDate: "2026-09-01", dimensions: ["page"], rowLimit: 25000,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/artisan/" }] }] } });
  const slugs = (r.data.rows || []).map((x: any) => (x.keys[0] as string).split("/artisan/")[1]).filter(Boolean);
  console.log(`${slugs.length} fiches avec impressions`);
  // age des fiches qui ont du trafic
  const buckets: Record<string, number> = {};
  let etat: Record<string, number> = {};
  for (let i = 0; i < slugs.length; i += 300) {
    const chunk = slugs.slice(i, i + 300);
    const { data, error } = await sb.from("pros").select("created_at,etat_admin").in("slug", chunk);
    if (error) { console.log("ERR", error.message); break; }
    for (const p of data || []) {
      const m = (p.created_at || "").slice(0, 7); buckets[m] = (buckets[m] || 0) + 1;
      etat[p.etat_admin || "null"] = (etat[p.etat_admin || "null"] || 0) + 1;
    }
  }
  console.log("\nMois de creation des fiches QUI RECOIVENT DU TRAFIC :");
  for (const [k, v] of Object.entries(buckets).sort()) console.log(`  ${k} : ${v}`);
  console.log("\netat_admin de ces fiches :", etat);

  // reference : mois de creation de TOUTE la base
  const tot: Record<string, number> = {};
  for (const m of Object.keys(buckets)) {
    const next = new Date(m + "-01T00:00:00Z"); next.setUTCMonth(next.getUTCMonth() + 1);
    const { count } = await sb.from("pros").select("id", { count: "exact", head: true })
      .eq("is_active", true).is("deleted_at", null)
      .gte("created_at", m + "-01").lt("created_at", next.toISOString().slice(0, 10));
    tot[m] = count || 0;
  }
  console.log("\nComparaison (fiches avec trafic / fiches en base, par mois de creation) :");
  for (const m of Object.keys(buckets).sort()) console.log(`  ${m} : ${buckets[m]} / ${tot[m]} = ${((buckets[m] / (tot[m] || 1)) * 100).toFixed(2)}%`);
})();
