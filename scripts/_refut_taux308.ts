import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";

(async () => {
  const sb = getServiceClient();

  // 1) 57 categories BTP/domicile/personne
  const { data: cats } = await sb.from("categories").select("id, slug")
    .in("vertical", ["btp", "domicile", "personne"]).order("id");
  const catIds = cats!.map((c) => c.id);

  // 2) departements + top 15 villes par population (comme getCitiesByDepartment(dept.id,15))
  const { data: depts } = await sb.from("departments").select("id, code, name").order("id");
  const villesLiees: { id: number; slug: string; dept: number }[] = [];
  for (const d of depts!) {
    const { data: cities } = await sb.from("cities").select("id, slug, population")
      .eq("department_id", d.id)
      .order("population", { ascending: false, nullsFirst: false })
      .limit(15);
    // la page affiche cities.slice(0,10)
    (cities || []).slice(0, 10).forEach((c: any) => villesLiees.push({ id: c.id, slug: c.slug, dept: d.id }));
  }
  console.log("departements :", depts!.length, "| villes liees par page racine :", villesLiees.length);

  // 3) toutes les paires (cat, ville) avec >= 1 pro OUVERT
  const paires = new Set<string>();
  const LIMIT = 50000;
  let offset = 0;
  while (true) {
    const { data, error } = await sb.rpc("sitemap_city_cat_page", { p_offset: offset, p_limit: LIMIT, p_min: 1 });
    if (error) { console.error("RPC:", error.message); process.exit(1); }
    const rows = (data as any[]) || [];
    if (rows.length === 0) break;
    for (const r of rows) paires.add(`${r.c}:${r.v}`);
    offset += rows.length;
    process.stderr.write(`.`);
  }
  console.log("\npaires (cat,ville) >=1 pro ouvert :", paires.size);

  // 4) taux de 308 sur les liens emis par les 57 racines metier
  let total = 0, ok = 0;
  const parMetier: Record<string, { ok: number; tot: number }> = {};
  for (const c of cats!) {
    parMetier[c.slug] = { ok: 0, tot: 0 };
    for (const v of villesLiees) {
      total++;
      parMetier[c.slug].tot++;
      if (paires.has(`${c.id}:${v.id}`)) { ok++; parMetier[c.slug].ok++; }
    }
  }
  const redirs = total - ok;
  console.log(`\nliens ville emis par les 57 racines : ${total}`);
  console.log(`  -> 200 (>=1 pro ouvert) : ${ok} (${((ok / total) * 100).toFixed(1)} %)`);
  console.log(`  -> 308 (0 pro ouvert)   : ${redirs} (${((redirs / total) * 100).toFixed(1)} %)`);

  const tri = Object.entries(parMetier).sort((a, b) => a[1].ok / a[1].tot - b[1].ok / b[1].tot);
  console.log("\nPIRES metiers (part de 200) :");
  tri.slice(0, 6).forEach(([s, v]) => console.log(`  ${s}: ${v.ok}/${v.tot} = ${((v.ok / v.tot) * 100).toFixed(1)} % en 200`));
  console.log("MEILLEURS :");
  tri.slice(-6).forEach(([s, v]) => console.log(`  ${s}: ${v.ok}/${v.tot} = ${((v.ok / v.tot) * 100).toFixed(1)} % en 200`));
})();
