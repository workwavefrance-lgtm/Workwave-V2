import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const FILTRE_OUVERTS = "etat_admin.is.null,etat_admin.neq.F";

(async () => {
  // Toutes les communes en une passe paginee (index department_id)
  const t0 = Date.now();
  const villes: { id: number; department_id: number }[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await sb.from("cities").select("id, department_id").range(offset, offset + 999);
    if (error) { console.log("cities ERREUR:", error.message); return; }
    const rows = (data || []) as any[];
    if (rows.length === 0) break;
    villes.push(...rows);
    offset += rows.length;
  }
  console.log(`communes lues : ${villes.length} en ${Date.now()-t0} ms`);

  const parDept = new Map<number, number[]>();
  for (const v of villes) {
    if (v.department_id == null) continue;
    if (!parDept.has(v.department_id)) parDept.set(v.department_id, []);
    parDept.get(v.department_id)!.push(v.id);
  }

  const { data: depts } = await sb.from("departments").select("id, code, name");
  const liste = (depts || []) as any[];

  const t1 = Date.now();
  let nuls = 0, lots = 0;
  const res: any[] = [];
  for (const d of liste) {
    const ids = parDept.get(d.id) || [];
    let total = 0, echec = false;
    const tD = Date.now();
    for (let i = 0; i < ids.length; i += 200) {
      const lot = ids.slice(i, i + 200);
      lots++;
      const { count, error } = await sb.from("pros")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true).is("deleted_at", null)
        .or(FILTRE_OUVERTS)
        .in("city_id", lot);
      if (error || count === null) { echec = true; break; }
      total += count;
    }
    if (echec) nuls++;
    res.push({ code: d.code, nom: d.name, total: echec ? null : total, ms: Date.now() - tD });
  }
  const dur = Date.now() - t1;
  console.log(`comptage par lots de city_id : ${liste.length} depts, ${lots} requetes, ${dur} ms au total, echecs : ${nuls}`);
  const ms = res.map(r=>r.ms).sort((a,b)=>a-b);
  console.log(`latence par dept : med ${ms[Math.floor(ms.length/2)]} ms, max ${ms[ms.length-1]} ms`);
  console.log("total pros ouverts (somme) :", res.reduce((a,r)=>a+(r.total||0),0));
  for (const c of ["08","12","15","17","19","23","2B","32","40","46","48","52","53","55","90","972","973","976"]) {
    const r = res.find(x=>x.code===c); console.log(`  ${c} ${r?.nom} = ${r?.total} (${r?.ms} ms)`);
  }
})();
