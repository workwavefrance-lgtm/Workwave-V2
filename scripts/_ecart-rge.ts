import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data: cats } = await sb.from("categories").select("id,slug,vertical").in("vertical",["btp","domicile","personne"]);
  const cs = new Map((cats||[]).map((c:any)=>[c.id,c.slug]));
  // tous les pros RGE (31 282) : on les charge, c est petit
  const rows: any[] = []; let off=0;
  while (true) {
    const { data, error } = await sb.from("pros").select("id,city_id,category_id,etat_admin")
      .eq("is_active",true).is("deleted_at",null).eq("rge_certified",true).range(off, off+999);
    if (error) { console.log("ERR", error.message.slice(0,90)); break; }
    const r=(data||[]) as any[]; if(!r.length) break; rows.push(...r); off+=r.length;
  }
  const ouverts = rows.filter(r=>r.etat_admin!=="F");
  console.log(`pros RGE (ADEME) : ${rows.length} dont ${ouverts.length} ouverts`);
  const parVille=new Map<string,number>(), villes=new Set<number>(), parCat=new Map<number,number>();
  for (const r of ouverts) { if(!cs.has(r.category_id)) continue;
    parVille.set(`${r.category_id}-${r.city_id}`,(parVille.get(`${r.category_id}-${r.city_id}`)||0)+1);
    villes.add(r.city_id); parCat.set(r.category_id,(parCat.get(r.category_id)||0)+1); }
  const c1=[...parVille.values()].filter(n=>n>=1).length, c3=[...parVille.values()].filter(n=>n>=3).length;
  console.log(`combos metier x ville avec >=1 RGE ouvert : ${c1}`);
  console.log(`combos metier x ville avec >=3 RGE ouverts : ${c3}`);
  console.log(`communes touchees : ${villes.size}`);
  console.log("top metiers RGE:", [...parCat].sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>`${cs.get(k)}=${v}`).join(" "));
})().catch(e=>{console.error(e.message);process.exit(1);});
