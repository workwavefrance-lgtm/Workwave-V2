/**
 * Liste des 2 000 fiches du lot pilote d'enrichissement : celles que Google
 * MONTRAIT en juillet (impressions du 25/07 au 14/08), clics d'abord, et
 * OUVERTES (etat_admin different de F). A lancer APRES le classement.
 * Sortie : scripts/pilote-enrichissement.txt (un slug par ligne).
 */
import { config } from "dotenv"; import path from "path"; import fs from "fs";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { getServiceClient } from "../lib/supabase/service-client";
const SITE = "https://workwave.fr/";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const rows: { slug: string; clics: number; imp: number }[] = [];
  for (let startRow = 0; ; startRow += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: "2026-07-25", endDate: "2026-08-14", dimensions: ["page"], rowLimit: 25000, startRow } });
    const d = r.data.rows || [];
    for (const x of d) { const u = x.keys![0]; if (u.includes("/artisan/")) rows.push({ slug: u.split("/artisan/")[1].split("?")[0].replace(/\/$/, ""), clics: x.clicks || 0, imp: x.impressions || 0 }); }
    if (d.length < 25000) break;
  }
  rows.sort((a, b) => b.clics - a.clics || b.imp - a.imp);
  console.log(`${rows.length} fiches vues par Google en juillet`);
  const sb = getServiceClient();
  const ouvertes: string[] = [];
  let fermees = 0, absentes = 0;
  for (let i = 0; i < rows.length && ouvertes.length < 2000; i += 500) {
    const lot = rows.slice(i, i + 500).map((r) => r.slug);
    const { data, error } = await sb.from("pros").select("slug, etat_admin, etat_verifie_at, sirene_enrichi_at").in("slug", lot).eq("is_active", true).is("deleted_at", null);
    if (error) { console.error(error.message); process.exit(1); }
    const parSlug = new Map((data || []).map((p) => [p.slug, p]));
    for (const s of lot) {
      const p = parSlug.get(s);
      if (!p) { absentes++; continue; }
      if (p.etat_admin === "F") { fermees++; continue; }
      if (p.sirene_enrichi_at) continue;
      if (ouvertes.length < 2000) ouvertes.push(s);
    }
  }
  fs.writeFileSync("scripts/pilote-enrichissement.txt", ouvertes.join("\n") + "\n");
  console.log(`retenues ${ouvertes.length} ouvertes · ecartees ${fermees} fermees, ${absentes} absentes/supprimees -> scripts/pilote-enrichissement.txt`);
})();
