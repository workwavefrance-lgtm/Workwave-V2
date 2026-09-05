import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

const FILTRE_OUVERTS = "etat_admin.is.null,etat_admin.neq.F";

const CODES = ["08","12","15","17","19","23","2B","32","40","46","48","52","53","55","90","972","973","976","01","75","86"];

async function villes(deptId: number): Promise<number[]> {
  const ids: number[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await sb.from("cities").select("id").eq("department_id", deptId)
      .range(offset, offset + 999);
    if (error) throw new Error("cities: " + error.message);
    const rows = data || [];
    if (rows.length === 0) break;
    ids.push(...rows.map((r: any) => r.id));
    offset += rows.length;
  }
  return ids;
}

// comptage independant : par lots de city_id
async function compteParVilles(cityIds: number[]): Promise<number> {
  let total = 0;
  const LOT = 150;
  for (let i = 0; i < cityIds.length; i += LOT) {
    const lot = cityIds.slice(i, i + LOT);
    const { count, error } = await sb.from("pros").select("id", { count: "exact", head: true })
      .eq("is_active", true).is("deleted_at", null).or(FILTRE_OUVERTS).in("city_id", lot);
    if (error) throw new Error("pros lot: " + error.message);
    if (count === null) throw new Error("count null sur un lot (ERREUR, pas zero)");
    total += count;
  }
  return total;
}

// requete EXACTE de la page
async function requetePage(deptId: number) {
  const t0 = Date.now();
  const { count, error } = await sb
    .from("pros")
    .select("id, city:cities!inner(department_id)", { count: "exact", head: true })
    .eq("is_active", true)
    .is("deleted_at", null)
    .or(FILTRE_OUVERTS)
    .eq("cities.department_id", deptId);
  return { count, error: error ? `${error.code ?? ""} ${error.message}` : null, ms: Date.now() - t0 };
}

(async () => {
  const { data: depts, error } = await sb.from("departments").select("id, code, name").in("code", CODES);
  if (error) throw error;
  console.log("depts trouves:", depts?.length);
  for (const d of (depts as any[]).sort((a,b)=>a.code.localeCompare(b.code))) {
    const cv = await villes(d.id);
    const ref = await compteParVilles(cv);
    const page = await requetePage(d.id);
    console.log(
      `${d.code.padStart(4)} ${d.name.padEnd(24)} villes=${String(cv.length).padStart(4)} ` +
      `reference=${String(ref).padStart(7)} | requete_page=${page.count === null ? "NULL" : page.count} ` +
      `err=${page.error ?? "-"} (${page.ms}ms)`
    );
  }
})();
