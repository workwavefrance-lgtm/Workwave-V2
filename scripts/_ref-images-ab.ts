import * as dotenv from "dotenv"; import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { google } from "googleapis";
const SITE = "https://workwave.fr/";

async function main() {
  const sb = getServiceClient();
  const a = await sb.from("pros").select("slug, photos, logo_url, city_id, category_id")
    .eq("is_active", true).is("deleted_at", null).neq("photos", "[]").limit(1000);
  const avecPhoto = new Set((a.data ?? []).map((r) => `/artisan/${r.slug}`));
  console.log("fiches AVEC photo :", avecPhoto.size);

  // groupe temoin : meme (categorie, ville) que les fiches avec photo, mais SANS photo
  const cles = [...new Set((a.data ?? []).map((r) => `${r.category_id}|${r.city_id}`))];
  const temoin = new Set<string>();
  for (const k of cles.slice(0, 200)) {
    const [cat, city] = k.split("|").map(Number);
    const t = await sb.from("pros").select("slug").eq("is_active", true).is("deleted_at", null)
      .eq("category_id", cat).eq("city_id", city).eq("photos", "[]").limit(15);
    for (const r of t.data ?? []) temoin.add(`/artisan/${r.slug}`);
  }
  console.log("fiches TEMOIN (memes metier x ville, sans photo) :", temoin.size);

  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
    startDate: "2026-08-05", endDate: "2026-09-01", dimensions: ["page"], rowLimit: 25000 } });
  const perf = new Map<string, { c: number; i: number; p: number }>();
  for (const row of r.data.rows || []) {
    const u = new URL((row.keys || [])[0] as string).pathname;
    perf.set(u, { c: row.clicks || 0, i: row.impressions || 0, p: row.position || 0 });
  }
  const agg = (set: Set<string>, label: string) => {
    let c = 0, i = 0, vus = 0, pos = 0;
    for (const u of set) { const p = perf.get(u); if (p) { c += p.c; i += p.i; pos += p.p * p.i; vus++; } }
    console.log(`${label} : ${set.size} fiches, ${vus} vues par GSC (${(100*vus/set.size).toFixed(1)}%), ${c} clics, ${i} impressions, ${i ? (c/i*100).toFixed(2) : "0"}% CTR, pos moy ponderee ${i ? (pos/i).toFixed(1) : "-"}`);
    return { c, i, vus, n: set.size };
  };
  const A = agg(avecPhoto, "AVEC photo ");
  const B = agg(temoin,    "SANS photo ");
  console.log(`\nclics par fiche : avec=${(A.c/A.n).toFixed(3)}  sans=${(B.c/B.n).toFixed(3)}`);
  console.log(`impressions par fiche : avec=${(A.i/A.n).toFixed(2)}  sans=${(B.i/B.n).toFixed(2)}`);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
