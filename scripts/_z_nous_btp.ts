import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import fs from "fs";
const sb = getServiceClient();
const DEPTS = "76 67 38 35 95 78 77 94 92 83 06 34 31 44 59 33 69 13 75 93 91 45 62 57 68 74 30 64 23".split(" ");
(async () => {
  const { data: cats } = await sb.from("categories").select("id, slug, vertical").in("vertical", ["btp","domicile","personne"]);
  const ids: Record<string, number[]> = { btp: [], domicile: [], personne: [] };
  for (const c of cats || []) ids[(c as any).vertical].push((c as any).id);
  const { data: deps } = await sb.from("departments").select("id, code, name").in("code", DEPTS).eq("country","FR");
  const out: any = {};
  const taches: any[] = [];
  for (const d of deps || []) for (const v of ["btp","domicile","personne"]) taches.push({ d, v });
  let i = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (i < taches.length) {
      const { d, v } = taches[i++];
      const { count, error } = await sb.from("pros")
        .select("id, cities!inner(department_id)", { count: "exact", head: true })
        .in("category_id", ids[v]).eq("cities.department_id", (d as any).id)
        .eq("is_active", true).is("deleted_at", null).or("etat_admin.is.null,etat_admin.neq.F");
      if (error) console.log(`  erreur ${(d as any).code} ${v} : ${error.message}`);
      else { (out[(d as any).code] ||= { nom: (d as any).name })[v] = count || 0; }
    }
  }));
  fs.writeFileSync("/tmp/nous_par_dept.json", JSON.stringify(out, null, 1));
  console.log("dept  nom                    btp_ouverts  domicile  personne");
  for (const d of DEPTS) { const o = out[d]; if (o) console.log(`${d.padEnd(4)}  ${String(o.nom).slice(0,20).padEnd(22)} ${String(o.btp).padStart(9)} ${String(o.domicile).padStart(9)} ${String(o.personne).padStart(9)}`); }
})();
