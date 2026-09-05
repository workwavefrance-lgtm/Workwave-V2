import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

(async () => {
  // 1) la vue materialisee du 03/09 existe-t-elle et est-elle lisible ?
  const t0 = Date.now();
  const { data, error } = await sb.from("stats_etats_cat_dept")
    .select("dept_code, ouverts, calcule_le").range(0, 999);
  console.log(`vue stats_etats_cat_dept : ${error ? "ERREUR " + error.code + " " + error.message : (data as any[]).length + " lignes (1re page)"} en ${Date.now()-t0} ms`);
  if (!error) {
    // pagination complete
    const tous: any[] = [];
    let offset = 0;
    while (true) {
      const { data: p, error: e } = await sb.from("stats_etats_cat_dept")
        .select("dept_code, ouverts, calcule_le").range(offset, offset + 999);
      if (e) { console.log("pagination ERREUR:", e.message); break; }
      const rows = p || [];
      if (rows.length === 0) break;
      tous.push(...rows);
      offset += rows.length;
    }
    const parDept = new Map<string, number>();
    for (const l of tous) if (l.dept_code) parDept.set(l.dept_code, (parDept.get(l.dept_code)||0) + (l.ouverts||0));
    console.log("lignes vue:", tous.length, "| depts:", parDept.size, "| calcule_le:", tous[0]?.calcule_le);
    for (const c of ["08","12","17","01","75","86"]) console.log(`  vue ${c} = ${parDept.get(c)}`);
  }
})();
