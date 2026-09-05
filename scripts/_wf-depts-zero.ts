import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

const FILTRE_OUVERTS = "etat_admin.is.null,etat_admin.neq.F";

// Departements affiches a 0 en production le 05/09/2026
const CODES = ["08","12","15","17","19","23","2B","32","40","46","48","52","53","55","90","972","973","976"];
// Trois temoins non-zero pour comparer
const TEMOINS = ["01","75","86"];

async function pagesCites(deptId: number): Promise<number[]> {
  const ids: number[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await sb.from("cities").select("id")
      .eq("department_id", deptId).range(offset, offset + 999);
    if (error) throw new Error("cities: " + error.message);
    const rows = data || [];
    if (rows.length === 0) break;
    ids.push(...rows.map((r: any) => r.id));
    offset += rows.length;
  }
  return ids;
}

// Comptage de reference : par paquets de city_id, count exact sur index city_id
async function vraiCompte(cityIds: number[]): Promise<number> {
  let total = 0;
  for (let i = 0; i < cityIds.length; i += 150) {
    const lot = cityIds.slice(i, i + 150);
    const { count, error } = await sb.from("pros")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true).is("deleted_at", null)
      .or(FILTRE_OUVERTS)
      .in("city_id", lot);
    if (error) throw new Error("pros in(): " + error.message);
    if (count === null) throw new Error("count null sur un lot de city_id");
    total += count;
  }
  return total;
}

// Reproduction EXACTE de la requete de la page
async function requetePage(deptId: number) {
  const t0 = Date.now();
  const { count, error } = await sb.from("pros")
    .select("id, city:cities!inner(department_id)", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null)
    .or(FILTRE_OUVERTS)
    .eq("cities.department_id", deptId);
  return { count, error: error ? `${error.code || ""} ${error.message}` : null, ms: Date.now() - t0 };
}

(async () => {
  const { data: depts, error } = await sb.from("departments").select("id, code, name").in("code", [...CODES, ...TEMOINS]);
  if (error) throw error;
  console.log("code | nom | requete_page(count/err/ms) | vrai_compte | nb_communes");
  for (const code of [...CODES, ...TEMOINS]) {
    const d = (depts || []).find((x: any) => x.code === code);
    if (!d) { console.log(`${code} | INTROUVABLE en base`); continue; }
    const rp = await requetePage(d.id);
    const cities = await pagesCites(d.id);
    let vrai: string;
    try { vrai = String(await vraiCompte(cities)); } catch (e: any) { vrai = "ECHEC: " + e.message; }
    console.log(`${code} | ${d.name} | count=${rp.count} err=${rp.error} ${rp.ms}ms | vrai=${vrai} | communes=${cities.length}`);
  }
})();
