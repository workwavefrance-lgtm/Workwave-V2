import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const FILTRE_OUVERTS = "etat_admin.is.null,etat_admin.neq.F";

async function compte(deptId: number) {
  const t = Date.now();
  const { count, error } = await sb.from("pros")
    .select("id, city:cities!inner(department_id)", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null)
    .or(FILTRE_OUVERTS)
    .eq("cities.department_id", deptId);
  return { count, error, ms: Date.now() - t };
}

async function pool<T, R>(items: T[], n: number, f: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (true) {
      const k = i++;
      if (k >= items.length) return;
      out[k] = await f(items[k]);
    }
  }));
  return out;
}

(async () => {
  const { data } = await sb.from("departments").select("id, code, name");
  const liste = (data || []) as any[];
  const n = Number(process.argv[2] || 4);
  const t0 = Date.now();
  const res = await pool(liste, n, (d) => compte(d.id));
  const dur = Date.now() - t0;
  const nuls = res.filter(r => r.count === null);
  const ms = res.map(r => r.ms).sort((a,b)=>a-b);
  console.log(`concurrence ${n} | ${liste.length} depts | duree totale ${dur} ms | count null : ${nuls.length} | latence med ${ms[Math.floor(ms.length/2)]} max ${ms[ms.length-1]}`);
  for (const [i, r] of res.entries()) if (r.count === null) console.log("  NULL:", liste[i].code, liste[i].name, r.ms + "ms");
})();
