import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function main(){
  // climaticien = cat 13. Poitiers ?
  const { data: poit } = await sb.from("cities").select("id, name").ilike("name","Poitiers").maybeSingle();
  const { count: climPoit } = await sb.from("pros").select("id",{count:"exact",head:true})
    .eq("category_id",13).eq("is_active",true).is("deleted_at",null).eq("city_id", poit?.id||0);
  console.log(`Climaticiens à Poitiers : ${climPoit} (page générée si >= 3)`);

  // Combien de villes ont >= 3 climaticiens (= nb de pages installation × ville) ?
  const byCity = new Map<number, number>();
  let offset=0;
  while(true){
    const { data } = await sb.from("pros").select("city_id").eq("category_id",13).eq("is_active",true).is("deleted_at",null).range(offset, offset+999);
    const rows=data||[]; if(!rows.length) break;
    for(const r of rows){ if(r.city_id) byCity.set(r.city_id,(byCity.get(r.city_id)||0)+1); }
    offset+=rows.length;
  }
  const villes3 = [...byCity.values()].filter(n=>n>=3).length;
  console.log(`Villes avec >= 3 climaticiens (= pages clim × ville live) : ${villes3}`);
  console.log(`Total villes avec >= 1 climaticien : ${byCity.size}`);
}
main().catch(e=>{console.error(e.message);process.exit(1);});
