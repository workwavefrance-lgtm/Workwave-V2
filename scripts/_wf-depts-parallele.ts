import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const FILTRE_OUVERTS = "etat_admin.is.null,etat_admin.neq.F";

(async () => {
  const { data: depts, error } = await sb.from("departments").select("id, code, name");
  if (error) throw error;
  const liste = (depts || []) as any[];
  console.log("departements lus:", liste.length);

  const t0 = Date.now();
  const res = await Promise.all(liste.map(async (dept) => {
    const t = Date.now();
    const { count, error } = await sb.from("pros")
      .select("id, city:cities!inner(department_id)", { count: "exact", head: true })
      .eq("is_active", true).is("deleted_at", null)
      .or(FILTRE_OUVERTS)
      .eq("cities.department_id", dept.id);
    return { code: dept.code, nom: dept.name, count, err: error ? `${error.code}|${error.message}` : null, ms: Date.now() - t };
  }));
  const total = Date.now() - t0;

  const nuls = res.filter(r => r.count === null);
  const zeros = res.filter(r => r.count === 0);
  console.log(`duree totale du Promise.all : ${total} ms`);
  console.log(`count === null : ${nuls.length} | count === 0 (vrai zero) : ${zeros.length}`);
  for (const n of nuls) console.log(`  NULL -> ${n.code} ${n.nom} | err=${n.err} | ${n.ms}ms`);
  const ms = res.map(r => r.ms).sort((a,b)=>a-b);
  console.log(`latences: min=${ms[0]} med=${ms[Math.floor(ms.length/2)]} max=${ms[ms.length-1]}`);
})();
