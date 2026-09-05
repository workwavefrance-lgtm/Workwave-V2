import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main() {
  // 400 communes tirees en balayant la plage d'id
  const { data: mm } = await sb.from("cities").select("id").order("id",{ascending:false}).limit(1);
  const maxId = mm![0].id as number;
  const villes: number[] = [];
  for (let k=0;k<400;k++){
    const { data } = await sb.from("cities").select("id").gte("id", Math.floor(maxId/400*k)).order("id").limit(1);
    if (data?.[0]) villes.push(data[0].id);
  }
  const uniq = [...new Set(villes)];
  const pairs: Record<string, number> = {};
  const PAGE = 1000; let offset = 0;
  while (true) {
    const { data, error } = await sb.from("pros").select("category_id,city_id").in("city_id", uniq).is("deleted_at",null).eq("is_active",true).or("etat_admin.is.null,etat_admin.neq.F").range(offset, offset+PAGE-1);
    if (error) { console.log("err", error.message); break; }
    const rows = data ?? []; if (!rows.length) break;
    for (const r of rows as any[]) { const k = r.category_id+"|"+r.city_id; pairs[k]=(pairs[k]??0)+1; }
    offset += rows.length;
    if (offset > 200000) break;
  }
  const v = Object.values(pairs);
  const bucket = (f:(n:number)=>boolean)=>{const c=v.filter(f).length;return `${c} (${(100*c/v.length).toFixed(1)}%)`;};
  console.log(`echantillon : ${uniq.length} communes, ${v.length} couples (metier x commune) avec >=1 pro ouvert, ${offset} fiches lues`);
  console.log("  exactement 1 pro  :", bucket(n=>n===1));
  console.log("  exactement 2 pros :", bucket(n=>n===2));
  console.log("  1 ou 2 pros       :", bucket(n=>n<=2));
  console.log("  3 a 9 pros        :", bucket(n=>n>=3&&n<=9));
  console.log("  >=10 pros (top 10 vraiment selectif) :", bucket(n=>n>=10));
}
main().catch(e=>console.error(e.message));
