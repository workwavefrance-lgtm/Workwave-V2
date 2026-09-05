import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

(async () => {
  const t0 = Date.now();
  const { data, error } = await sb.rpc("stats_etats_cat_dept_json");
  const ms = Date.now() - t0;
  if (error) { console.log("RPC stats_etats_cat_dept_json ERREUR:", error.code, error.message, `${ms}ms`); }
  else {
    const lignes = data as any[];
    console.log(`RPC stats_etats_cat_dept_json : ${lignes.length} lignes en ${ms} ms`);
    console.log("calcule_le:", lignes[0]?.calcule_le);
    const parDept = new Map<string, number>();
    for (const l of lignes) {
      if (!l.d) continue;
      parDept.set(l.d, (parDept.get(l.d) || 0) + (l.o || 0));
    }
    console.log("departements dans la vue:", parDept.size);
    console.log("total ouverts (toutes cat):", [...parDept.values()].reduce((a,b)=>a+b,0));
    for (const c of ["08","12","15","17","19","23","2B","32","40","46","48","52","53","55","90","972","973","976","01","75","86"]) {
      console.log(`  vue ${c} = ${parDept.get(c)}`);
    }
  }

  const t1 = Date.now();
  const r2 = await sb.rpc("barometre_dept_artisans");
  console.log(`RPC barometre_dept_artisans : ${r2.error ? "ERR " + r2.error.message : (r2.data as any[]).length + " lignes"} en ${Date.now()-t1} ms`);
})();
