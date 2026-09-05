import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

// Reproduit EXACTEMENT le comptage propose par le correctif :
// count(pros WHERE category_id = cat AND city_id IN <villes du dept>)
async function villes(code: string) {
  const { data: d } = await sb.from("departments").select("id").eq("code", code);
  const deptId = d![0].id;
  const out: number[] = [];
  let offset = 0;
  while (true) {
    const { data } = await sb.from("cities").select("id").eq("department_id", deptId).range(offset, offset + 999);
    const rows = data || [];
    if (rows.length === 0) break;
    out.push(...rows.map((r: any) => r.id));
    offset += rows.length;
  }
  return out;
}

async function main() {
  for (const dept of ["59", "75", "13"]) {
    const ids = await villes(dept);
    console.log(`\ndept ${dept} : ${ids.length} communes`);
    for (const [cat, nom] of [[3, "macon"], [37, "vitrier"]] as [number, string][]) {
      const t0 = Date.now();
      const { count, error } = await sb.from("pros").select("id", { count: "exact", head: true })
        .eq("category_id", cat).in("city_id", ids.slice(0, 1000));
      const ms = Date.now() - t0;
      if (error) console.log(`  cat ${nom.padEnd(8)} : ECHEC en ${ms} ms (err="${error.message}")`);
      else if (count === null) console.log(`  cat ${nom.padEnd(8)} : count NULL = ERREUR en ${ms} ms`);
      else console.log(`  cat ${nom.padEnd(8)} : ${count} en ${ms} ms`);
    }
  }
}
main();
