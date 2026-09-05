import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { google } from "googleapis";
const sb = getServiceClient();
const SITE = "https://workwave.fr/";

async function main() {
  // 1) URLs listing qui contiennent AU MOINS un pro note (donc etoiles emises)
  const urls = new Set<string>();
  let offset = 0;
  while (true) {
    const { data, error } = await sb.from("pros")
      .select("category:categories(slug),city:cities(slug)")
      .is("deleted_at", null).eq("is_active", true)
      .not("google_rating", "is", null).gt("google_reviews_count", 0)
      .or("etat_admin.is.null,etat_admin.neq.F")
      .order("id").range(offset, offset + 999);
    if (error) { console.error(error.message); break; }
    const r = (data ?? []) as any[];
    if (r.length === 0) break;
    for (const p of r) if (p.category?.slug && p.city?.slug) urls.add(`/${p.category.slug}/${p.city.slug}`);
    offset += r.length;
  }
  console.log("URLs listing AVEC etoiles :", urls.size);

  // 2) GSC 28 jours par page
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const all: any[] = [];
  for (let start = 0; start < 100000; start += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
      startDate: "2026-08-05", endDate: "2026-09-01", dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const rows = r.data.rows || []; all.push(...rows); if (rows.length < 25000) break;
  }

  const bucket = { avec: {i:0,c:0,n:0,pw:0}, sans: {i:0,c:0,n:0,pw:0} } as any;
  for (const r of all) {
    const p = (r.keys![0] as string).replace("https://workwave.fr", "");
    const seg = p.split("/").filter(Boolean);
    if (seg.length !== 2 || /-\d{2,3}$/.test(seg[1])) continue;
    if (["artisan","guide-des-prix","blog","trouver-des-chantiers","trouver-des-clients","ai","en"].includes(seg[0])) continue;
    const b = urls.has(p) ? bucket.avec : bucket.sans;
    b.i += r.impressions||0; b.c += r.clicks||0; b.n++; b.pw += (r.position||0)*(r.impressions||0);
  }
  // Comparaison a POSITION COMPARABLE (le groupe "avec" est en pos 34, biais evident)
  const bandes: Record<string, any> = {};
  for (const r of all) {
    const p = (r.keys![0] as string).replace("https://workwave.fr", "");
    const seg = p.split("/").filter(Boolean);
    if (seg.length !== 2 || /-\d{2,3}$/.test(seg[1])) continue;
    if (["artisan","guide-des-prix","blog","trouver-des-chantiers","trouver-des-clients","ai","en"].includes(seg[0])) continue;
    const pos = r.position || 0;
    const bande = pos < 10 ? "01-10" : pos < 20 ? "10-20" : pos < 30 ? "20-30" : pos < 40 ? "30-40" : "40+";
    const k = bande + (urls.has(p) ? " AVEC" : " SANS");
    bandes[k] ??= {i:0,c:0,n:0};
    bandes[k].i += r.impressions||0; bandes[k].c += r.clicks||0; bandes[k].n++;
  }
  console.log("\nCTR a position comparable");
  console.log("bande".padEnd(12), "pages".padStart(6), "impr".padStart(7), "clics".padStart(6), "CTR".padStart(8));
  for (const k of Object.keys(bandes).sort()) {
    const v = bandes[k];
    console.log(k.padEnd(12), String(v.n).padStart(6), String(v.i).padStart(7), String(v.c).padStart(6),
      (100*v.c/Math.max(v.i,1)).toFixed(2).padStart(7)+"%");
  }

  console.log("\ngroupe".padEnd(10), "pages".padStart(7), "impr".padStart(8), "clics".padStart(6), "CTR".padStart(8), "pos.moy".padStart(9));
  for (const k of ["avec","sans"]) {
    const v = bucket[k];
    console.log(k.padEnd(10), String(v.n).padStart(7), String(v.i).padStart(8), String(v.c).padStart(6),
      (100*v.c/Math.max(v.i,1)).toFixed(2).padStart(7)+"%", (v.pw/Math.max(v.i,1)).toFixed(1).padStart(9));
  }
}
main().catch(e=>console.error(e.message));
