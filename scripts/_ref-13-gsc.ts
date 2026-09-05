import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth:{persistSession:false,autoRefreshToken:false}});
const SITE = "https://workwave.fr/";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const S = "2026-08-05", E = "2026-09-01";
  // Toutes les pages /artisan/ avec impressions sur 28 jours
  const rows: any[] = [];
  for (let start = 0; start < 25000; start += 5000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
      startDate: S, endDate: E, dimensions: ["page"], rowLimit: 5000, startRow: start,
      dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/artisan/" }] }] } });
    const got = r.data.rows || []; rows.push(...got); if (got.length < 5000) break;
  }
  console.log(`pages /artisan/ avec impressions (${S} -> ${E}) : ${rows.length}`);
  const slugs = rows.map(r => decodeURIComponent(String(r.keys[0]).replace(/^https:\/\/workwave\.fr\/artisan\//, "").replace(/\/$/, "")));
  // Joindre l'etat en base par paquets de 200
  const etat = new Map<string, string>();
  for (let i = 0; i < slugs.length; i += 200) {
    const { data, error } = await sb.from("pros").select("slug,etat_admin").in("slug", slugs.slice(i, i + 200));
    if (error) { console.log("ERR", error.message); break; }
    for (const p of (data || []) as any[]) etat.set(p.slug, p.etat_admin);
  }
  let cF = 0, cA = 0, cX = 0, iF = 0, iA = 0, iX = 0, nF = 0, nA = 0, nX = 0;
  rows.forEach((r, i) => {
    const e = etat.get(slugs[i]);
    if (e === "F") { cF += r.clicks; iF += r.impressions; nF++; }
    else if (e === "A") { cA += r.clicks; iA += r.impressions; nA++; }
    else { cX += r.clicks; iX += r.impressions; nX++; }
  });
  const j = 28;
  console.log(`\n28 jours, familles /artisan/ (jointure GSC x base sur le slug) :`);
  console.log(`  FERMEES  : ${nF} pages · ${iF} impressions · ${cF} clics  -> ${(cF/j).toFixed(2)} clics/jour`);
  console.log(`  OUVERTES : ${nA} pages · ${iA} impressions · ${cA} clics  -> ${(cA/j).toFixed(2)} clics/jour`);
  console.log(`  introuvables en base : ${nX} pages · ${iX} imp · ${cX} clics`);
  console.log(`\n  part des fermees dans les impressions /artisan/ : ${(100*iF/(iF+iA+iX)).toFixed(1)} %`);
  console.log(`  part des fermees dans les clics /artisan/       : ${(100*cF/Math.max(1,cF+cA+cX)).toFixed(1)} %`);
  console.log(`  CTR fermees : ${(100*cF/Math.max(1,iF)).toFixed(2)} % · CTR ouvertes : ${(100*cA/Math.max(1,iA)).toFixed(2)} %`);
})();
