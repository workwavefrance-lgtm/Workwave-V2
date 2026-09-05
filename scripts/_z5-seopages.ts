import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data } = await sb.from("seo_pages").select("id,slug,type,category_id,city_id,department_id").order("id").range(0,1999);
  const rows = (data||[]) as any[];
  console.log("seo_pages charges:", rows.length);
  const depts = await sb.from("departments").select("id,code,name").order("id").range(0,199);
  const dmap = new Map<number,string>(((depts.data||[]) as any[]).map(d=>[d.id, `${d.name} ${d.code}`]));
  const parDept = new Map<string,number>();
  for (const r of rows.filter(r=>r.type==="metier_dept")) parDept.set(dmap.get(r.department_id)||`id${r.department_id}`,(parDept.get(dmap.get(r.department_id)||`id${r.department_id}`)||0)+1);
  console.log("\nmetier_dept par departement (", parDept.size, "departements couverts sur", dmap.size, ") :");
  for (const [k,v] of [...parDept].sort((a,b)=>b[1]-a[1])) console.log("  ", k, v);
  // metier_ville : quels departements ?
  const cityIds = [...new Set(rows.filter(r=>r.type==="metier_ville").map(r=>r.city_id))];
  console.log("\nmetier_ville:", rows.filter(r=>r.type==="metier_ville").length, "sur", cityIds.length, "communes distinctes");
  const cd = await sb.from("cities").select("id,name,department_id").in("id", cityIds as number[]);
  const parDeptVille = new Map<string,number>();
  for (const c of ((cd.data||[]) as any[])) parDeptVille.set(dmap.get(c.department_id)||"?",(parDeptVille.get(dmap.get(c.department_id)||"?")||0)+1);
  console.log("communes couvertes par departement:", [...parDeptVille].map(([k,v])=>`${k}=${v}`).join(" | "));
  const catIds = [...new Set(rows.map(r=>r.category_id))];
  console.log("\ncategories couvertes par seo_pages:", catIds.length);
})();
