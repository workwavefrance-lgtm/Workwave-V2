import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const FILTRE_OUVERTS = "etat_admin.is.null,etat_admin.neq.F";

(async () => {
  const { data: depts, error } = await sb.from("departments").select("id, code, name").order("code");
  if (error) throw error;
  const liste = (depts || []) as any[];
  console.log("departements lus:", liste.length);

  const t0 = Date.now();
  const res = await Promise.all(liste.map(async (d: any) => {
    const t = Date.now();
    const { count, error } = await sb.from("pros")
      .select("id, city:cities!inner(department_id)", { count: "exact", head: true })
      .eq("is_active", true).is("deleted_at", null)
      .or(FILTRE_OUVERTS)
      .eq("cities.department_id", d.id);
    return { code: d.code, nom: d.name, count, err: error ? `${(error as any).code}|${error.message}` : null, ms: Date.now() - t };
  }));
  const total = Date.now() - t0;
  const nuls = res.filter(r => r.count === null);
  const zeros = res.filter(r => r.count === 0);
  console.log(`DUREE TOTALE Promise.all(${liste.length}) = ${total} ms`);
  console.log(`count===null : ${nuls.length} | count===0 : ${zeros.length}`);
  for (const n of nuls.slice(0, 20)) console.log(`  NULL ${n.code} ${n.nom} err=${n.err} ${n.ms}ms`);
  const ms = res.map(r => r.ms).sort((a,b)=>a-b);
  console.log(`latences min=${ms[0]} med=${ms[Math.floor(ms.length/2)]} max=${ms[ms.length-1]}`);
  const somme = res.reduce((s,r)=> s + (r.count || 0), 0);
  console.log(`somme des comptes obtenus (nuls comptes 0) = ${somme}`);
})();
