import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data: cats } = await sb.from("categories").select("id").in("vertical",["btp","domicile","personne"]);
  const catIds=(cats||[]).map((c:any)=>c.id);
  const { data: dep } = await sb.from("departments").select("id,name").eq("code","13").single();
  const cities:any[]=[]; let off=0;
  while(true){const{data}=await sb.from("cities").select("id,slug").eq("department_id",(dep as any).id).order("id").range(off,off+999);
    const r=data||[];if(!r.length)break;cities.push(...r);off+=r.length;}
  const open=new Map<string,number>(),closed=new Map<string,number>();
  const seen=new Set<number>();
  for(const city of cities){
    let last=0;
    while(true){
      const {data,error}=await sb.from("pros").select("id,city_id,category_id,etat_admin")
        .eq("is_active",true).is("deleted_at",null).eq("city_id",city.id).in("category_id",catIds)
        .gt("id",last).order("id").limit(1000);
      if(error){console.log("ERR",city.slug,error.message.slice(0,60));break;}
      const rows=(data||[]) as any[]; if(!rows.length)break;
      for(const r of rows){seen.add(r.id);const k=`${r.category_id}-${r.city_id}`;
        if(r.etat_admin==="F")closed.set(k,(closed.get(k)||0)+1);else open.set(k,(open.get(k)||0)+1);}
      last=rows[rows.length-1].id;
    }
  }
  const all=new Set([...open.keys(),...closed.keys()]);
  let zero=0,totO=0,totC=0;
  for(const k of all){const a=open.get(k)||0,b=closed.get(k)||0;totO+=a;totC+=b;if(a===0&&b>0)zero++;}
  console.log(`dept 13 par ville : ${cities.length} communes, ${totO} ouverts / ${totC} fermes, lignes distinctes ${seen.size}`);
  console.log(`  couples ${all.size} | 0-ouvert+ferme ${zero} (${(100*zero/all.size).toFixed(1)}%)`);
  console.log(`  AUDIT (pagination instable) : 11402 ouverts / 18951 fermes | couples 2661 | 740 (27.8%)`);
})().catch(e=>{console.error(e.message);process.exit(1);});
