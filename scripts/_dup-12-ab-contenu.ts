/** MESURE 10 : A/B interne au departement 86 (meme anciennete, meme autorite).
 *  Listings metier x commune AVEC seo_pages.content vs SANS. On compare la part
 *  de pages qui obtiennent au moins une impression Google sur 28 jours, et la
 *  position moyenne. */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
const SITE = "https://workwave.fr/";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: (await auth.getClient()) as never });
  const fin = new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10);
  const debut = new Date(Date.now() - 31 * 864e5).toISOString().slice(0, 10);
  const perf = new Map<string, { imp: number; clics: number; pos: number }>();
  let start = 0;
  while (true) {
    const { data } = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
      startDate: debut, endDate: fin, dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const rows = data.rows || []; if (!rows.length) break;
    for (const r of rows) perf.set(r.keys![0].replace("https://workwave.fr", ""),
      { imp: r.impressions || 0, clics: r.clicks || 0, pos: r.position || 0 });
    start += rows.length; if (rows.length < 25000) break;
  }
  console.log(`pages avec au moins 1 impression (${debut} -> ${fin}) : ${perf.size}\n`);

  // Couples (cat, ville) du 86 avec >=1 pro ouvert
  const acc: [string, number][] = JSON.parse(fs.readFileSync("/tmp/catville.json", "utf8"));
  const { data: d86 } = await sb.from("departments").select("id").eq("code", "86").limit(1);
  const dept86 = d86![0].id;
  const villes = new Map<number, string>(); let off = 0;
  while (true) { const { data } = await sb.from("cities").select("id,slug").eq("department_id", dept86).range(off, off + 999);
    const r = (data || []) as any[]; if (!r.length) break; for (const c of r) villes.set(c.id, c.slug); off += r.length; }
  const { data: cats } = await sb.from("categories").select("id,slug").in("vertical", ["btp","domicile","personne"]);
  const catSlug = new Map((cats || []).map((c: any) => [c.id, c.slug]));

  // Quels couples ont du contenu redactionnel ?
  const avecContenu = new Set<string>(); off = 0;
  while (true) { const { data } = await sb.from("seo_pages").select("category_id,city_id")
      .eq("type", "metier_ville").not("content", "is", null).not("city_id", "is", null).range(off, off + 999);
    const r = (data || []) as any[]; if (!r.length) break;
    for (const s of r) avecContenu.add(`${s.category_id}|${s.city_id}`); off += r.length; }
  console.log(`couples metier x commune avec contenu redactionnel : ${avecContenu.size}`);

  const groupes: Record<string, { total: number; vues: number; imp: number; clics: number; posSom: number }> = {
    "86 AVEC contenu": { total: 0, vues: 0, imp: 0, clics: 0, posSom: 0 },
    "86 SANS contenu": { total: 0, vues: 0, imp: 0, clics: 0, posSom: 0 },
  };
  const nbPros = new Map<string, number>(acc);
  for (const [k, n] of acc) {
    const [c, v] = k.split("|").map(Number);
    if (!villes.has(v)) continue;
    const cs = catSlug.get(c), vs = villes.get(v);
    if (!cs || !vs) continue;
    const g = avecContenu.has(k) ? "86 AVEC contenu" : "86 SANS contenu";
    const p = perf.get(`/${cs}/${vs}`);
    groupes[g].total++;
    if (p) { groupes[g].vues++; groupes[g].imp += p.imp; groupes[g].clics += p.clics; groupes[g].posSom += p.pos * p.imp; }
  }
  console.log("\ngroupe             pages servies  pages vues par Google   part      impressions  clics  position moy.");
  for (const [g, a] of Object.entries(groupes))
    console.log(`${g.padEnd(20)} ${String(a.total).padStart(9)} ${String(a.vues).padStart(20)}   ${((a.vues / Math.max(a.total,1)) * 100).toFixed(1).padStart(5)} % ${String(a.imp).padStart(12)} ${String(a.clics).padStart(6)}   ${(a.posSom / Math.max(a.imp,1)).toFixed(1).padStart(6)}`);

  // Controle du biais de taille : meme comparaison a nombre de pros comparable
  console.log("\ncontrole du biais de taille (les pages avec contenu sont-elles simplement les plus grosses ?)");
  for (const [lab, min, max] of [["1-2 pros", 1, 2], ["3-9 pros", 3, 9], ["10+ pros", 10, 1e9]] as const) {
    const r: Record<string, { t: number; v: number; posSom: number; imp: number }> = {
      "AVEC": { t: 0, v: 0, posSom: 0, imp: 0 }, "SANS": { t: 0, v: 0, posSom: 0, imp: 0 } };
    for (const [k, n] of acc) {
      const [c, v] = k.split("|").map(Number);
      if (!villes.has(v) || n < min || n > max) continue;
      const cs = catSlug.get(c), vs = villes.get(v); if (!cs || !vs) continue;
      const g = avecContenu.has(k) ? "AVEC" : "SANS";
      r[g].t++; const p = perf.get(`/${cs}/${vs}`);
      if (p) { r[g].v++; r[g].posSom += p.pos * p.imp; r[g].imp += p.imp; }
    }
    console.log(`  ${lab.padEnd(9)} AVEC contenu : ${String(r.AVEC.v).padStart(4)}/${String(r.AVEC.t).padEnd(5)} vues (${((r.AVEC.v/Math.max(r.AVEC.t,1))*100).toFixed(1)} %, pos ${(r.AVEC.posSom/Math.max(r.AVEC.imp,1)).toFixed(1)})   SANS : ${String(r.SANS.v).padStart(4)}/${String(r.SANS.t).padEnd(5)} vues (${((r.SANS.v/Math.max(r.SANS.t,1))*100).toFixed(1)} %, pos ${(r.SANS.posSom/Math.max(r.SANS.imp,1)).toFixed(1)})`);
  }
})();
