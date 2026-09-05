import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  // Combien de couples (metier BTP, departement metropole) sont dans la zone de troncature ?
  const { data: cats } = await sb.from("categories").select("id,slug").in("vertical",["btp","domicile","personne"]);
  const codes = ["33","69","31","34","44","13","59","67","06","35","63","76","38","54"];
  const { data: deps } = await sb.from("departments").select("id,code,name").in("code", codes);
  let tronq=0, total=0, sousPlafond=0;
  const detail: string[] = [];
  for (const d of deps!) {
    let ids: number[] = []; let off=0;
    while(true){ const {data}=await sb.from("cities").select("id").eq("department_id",d.id).range(off,off+999);
      const r=data||[]; if(!r.length)break; ids.push(...r.map(x=>x.id)); off+=r.length; }
    let tr=0;
    for (const c of cats!.slice(0,23)) {
      const { count } = await sb.from("pros").select("id",{count:"exact",head:true})
        .in("city_id", ids).eq("category_id", c.id).eq("is_active",true).is("deleted_at",null);
      total++;
      const n = count||0;
      if (n>=900 && n<=1010) { tronq++; tr++; }
      else if (n < 900) sousPlafond++;
    }
    detail.push(`${d.code} ${d.name}: ${tr}/23 metiers en zone de troncature`);
  }
  console.log(detail.join("\n"));
  console.log(`\nSur ${total} couples (metier x dept metropole) : ${tronq} en zone 900-1010 (signature troncature), ${sousPlafond} sous 900 (complets)`);
  console.log(`Manque estime si le vrai total Sirene est 3x le plafond : ~${(tronq*2000).toLocaleString("fr-FR")} fiches a ajouter (ordre de grandeur, NON mesure cote Sirene)`);
})().catch(e=>{console.error(e.message);process.exit(1);});
