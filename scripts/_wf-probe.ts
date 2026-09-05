import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

const OUVERTS = "etat_admin.is.null,etat_admin.neq.F";

async function cityIds(deptCode: string) {
  const { data: d, error: e1 } = await sb.from("departments").select("id, code, name").eq("code", deptCode).single();
  if (e1) throw e1;
  const ids: number[] = [];
  let off = 0;
  while (true) {
    const { data, error } = await sb.from("cities").select("id").eq("department_id", d.id).range(off, off + 999);
    if (error) throw error;
    if (!data || data.length === 0) break;
    ids.push(...data.map((r: any) => r.id));
    off += data.length;
  }
  return { dept: d, ids };
}

(async () => {
  const t0 = Date.now();
  const { dept, ids } = await cityIds("34");
  console.log(`dept ${dept.code} ${dept.name} : ${ids.length} communes (${Date.now()-t0} ms)`);

  // count open pros cat 19 (menage) in dept 34
  const t1 = Date.now();
  const { count, error } = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("category_id", 19).in("city_id", ids).eq("is_active", true).is("deleted_at", null).or(OUVERTS);
  console.log("menage 34 ouverts :", count, error ? "ERR "+error.message : "", `${Date.now()-t1} ms`);

  // naf_code coverage on that slice
  const t2 = Date.now();
  const { count: c2, error: e2 } = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("category_id", 19).in("city_id", ids).is("naf_code", null);
  console.log("menage 34 naf_code null :", c2, e2 ? "ERR "+e2.message : "", `${Date.now()-t2} ms`);

  const t3 = Date.now();
  const { count: c3, error: e3 } = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("category_id", 19).in("city_id", ids);
  console.log("menage 34 total (tous etats) :", c3, e3 ? "ERR "+e3.message : "", `${Date.now()-t3} ms`);
})();
