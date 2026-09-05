import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data: cats } = await sb.from("categories").select("id,slug,vertical").in("vertical",["btp","domicile","personne"]);
  const cs = new Map((cats||[]).map((c:any)=>[c.id,c.slug]));
  const c2d = new Map<number,number>(); let o=0;
  while (true) { const { data } = await sb.from("cities").select("id,department_id").range(o,o+999);
    const r=(data||[]) as any[]; if(!r.length) break; for(const x of r) c2d.set(x.id,x.department_id); o+=r.length; }
  const rows: any[] = []; let off=0;
  while (true) { const { data } = await sb.from("pros").select("city_id,category_id,etat_admin")
      .eq("is_active",true).is("deleted_at",null).eq("rge_certified",true).range(off, off+999);
    const r=(data||[]) as any[]; if(!r.length) break; rows.push(...r); off+=r.length; }
  const m=new Map<string,number>();
  for (const r of rows) { if(r.etat_admin==="F"||!cs.has(r.category_id)) continue;
    const d=c2d.get(r.city_id); if(!d) continue; const k=`${r.category_id}-${d}`; m.set(k,(m.get(k)||0)+1); }
  const vals=[...m.values()];
  console.log(`combos metier x DEPARTEMENT avec >=1 RGE ouvert : ${vals.filter(n=>n>=1).length}`);
  console.log(`  dont >=3 RGE : ${vals.filter(n=>n>=3).length}`);
  console.log(`  dont >=10 RGE : ${vals.filter(n=>n>=10).length}`);
})().catch(e=>{console.error(e.message);process.exit(1);});
