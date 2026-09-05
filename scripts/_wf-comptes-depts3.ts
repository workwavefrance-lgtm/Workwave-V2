/**
 * Reprise 2 : au lieu d'un count exact (qui depasse le delai sous charge),
 * on lit les identifiants page par page et on les compte. Chaque page est un
 * LIMIT sur index, pas une agregation.
 */
import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import fs from "fs";
const sb = getServiceClient();
const METIERS = ["plombier", "electricien", "macon"];
const F = "/tmp/nous_depts.json";

async function villesDuDept(deptId: number): Promise<number[]> {
  const ids: number[] = [];
  let off = 0;
  for (;;) {
    const { data, error } = await sb.from("cities").select("id").eq("department_id", deptId).range(off, off + 999);
    if (error) throw new Error(error.message);
    const r = data || [];
    if (r.length === 0) break;
    ids.push(...r.map((x: any) => x.id));
    off += r.length;
  }
  return ids;
}

async function compter(catId: number, cityIds: number[]): Promise<number | null> {
  let n = 0;
  for (let i = 0; i < cityIds.length; i += 400) {
    const lot = cityIds.slice(i, i + 400);
    let off = 0;
    for (;;) {
      let ok = false; let rows: any[] = [];
      for (let essai = 1; essai <= 5 && !ok; essai++) {
        const { data, error } = await sb.from("pros").select("id")
          .eq("category_id", catId).in("city_id", lot)
          .eq("is_active", true).is("deleted_at", null)
          .or("etat_admin.is.null,etat_admin.neq.F")
          .order("id").range(off, off + 999);
        if (!error && data) { rows = data; ok = true; }
        else await new Promise((r) => setTimeout(r, 2000 * essai));
      }
      if (!ok) return null;
      if (rows.length === 0) break;
      n += rows.length;
      off += rows.length;
    }
  }
  return n;
}

(async () => {
  const deja: any[] = JSON.parse(fs.readFileSync(F, "utf8"));
  const vus = new Set(deja.map((x) => `${x.metier}|${x.dept}`));
  const { data: cats } = await sb.from("categories").select("id, slug").in("slug", METIERS);
  const { data: depts } = await sb.from("departments").select("id, code, name").order("code");
  const idCat = new Map((cats || []).map((c: any) => [c.slug, c.id]));
  const fr = (depts || []).filter((d: any) => /^(\d{2,3}|2A|2B)$/.test(d.code));
  const aFaire: any[] = [];
  for (const m of METIERS) for (const d of fr) if (!vus.has(`${m}|${d.code}`)) aFaire.push({ m, d });
  console.log(`${deja.length} deja, ${aFaire.length} a faire`);
  const echecs: string[] = [];
  for (const { m, d } of aFaire) {
    const villes = await villesDuDept(d.id);
    const n = await compter(idCat.get(m)!, villes);
    if (n === null) { echecs.push(`${m}|${d.code}`); console.log(`ECHEC ${m}|${d.code}`); continue; }
    deja.push({ metier: m, dept: d.code, nom: d.name, nous: n });
    fs.writeFileSync(F, JSON.stringify(deja, null, 1));
    console.log(`${m}|${d.code} -> ${n} (${villes.length} villes)`);
  }
  console.log(`\ntotal ${deja.length}, echecs ${echecs.length} : ${echecs.join(", ")}`);
})();
