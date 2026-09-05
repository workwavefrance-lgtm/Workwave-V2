import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const FILTRE_OUVERTS = "etat_admin.is.null,etat_admin.neq.F";

async function compte(deptId: number): Promise<number | null> {
  const { count, error } = await sb.from("pros")
    .select("id, city:cities!inner(department_id)", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null)
    .or(FILTRE_OUVERTS)
    .eq("cities.department_id", deptId);
  if (error || count === null) return null;
  return count;
}

async function pool<T, R>(items: T[], n: number, f: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (true) { const k = i++; if (k >= items.length) return; out[k] = await f(items[k]); }
  }));
  return out;
}

(async () => {
  const { data } = await sb.from("departments").select("id, code, name");
  const liste = (data || []) as any[];
  const t0 = Date.now();
  const res = await pool(liste, 3, (d) => compte(d.id));
  const apresPasse1 = res.filter(r => r === null).length;
  const t1 = Date.now();
  // rattrapage sequentiel des echecs
  let rattrapes = 0;
  for (const [i, r] of res.entries()) {
    if (r !== null) continue;
    const v = await compte(liste[i].id);
    if (v !== null) { res[i] = v; rattrapes++; }
  }
  const restants = res.filter(r => r === null);
  console.log(`passe 1 (concurrence 3) : ${t1 - t0} ms, echecs ${apresPasse1}`);
  console.log(`passe 2 (sequentielle sur les echecs) : ${Date.now() - t1} ms, rattrapes ${rattrapes}`);
  console.log(`duree totale ${Date.now() - t0} ms | echecs residuels ${restants.length}`);
  for (const [i, r] of res.entries()) if (r === null) console.log("  RESTE NULL:", liste[i].code, liste[i].name);
  console.log("total pros ouverts :", res.reduce((a: number, r) => a + (r || 0), 0));
})();
