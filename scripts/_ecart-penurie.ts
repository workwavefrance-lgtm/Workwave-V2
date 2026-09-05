import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data: cats } = await sb.from("categories").select("id,slug,vertical").in("vertical",["btp","domicile","personne"]);
  const catIds = (cats||[]).map((c:any)=>c.id);
  const catSlug = new Map((cats||[]).map((c:any)=>[c.id,c.slug]));

  for (const code of ["86","13","48"]) {
    const { data: dep } = await sb.from("departments").select("id,name").eq("code", code).single();
    if (!dep) { console.log(`dept ${code}: introuvable`); continue; }
    const cities: {id:number;slug:string}[] = []; let off=0;
    while (true) {
      const { data } = await sb.from("cities").select("id,slug").eq("department_id",(dep as any).id).range(off, off+999);
      const r=(data||[]) as any[]; if(!r.length) break; cities.push(...r); off+=r.length;
    }
    const cityIds = cities.map(c=>c.id);
    // charge les pros de ces villes
    const open = new Map<string,number>(), closed = new Map<string,number>();
    let o=0;
    while (true) {
      const { data, error } = await sb.from("pros").select("city_id,category_id,etat_admin")
        .eq("is_active",true).is("deleted_at",null).in("city_id", cityIds).in("category_id", catIds)
        .range(o, o+999);
      if (error) { console.log("ERR", error.message.slice(0,80)); break; }
      const rows=(data||[]) as any[]; if(!rows.length) break;
      for (const r of rows) { const k=`${r.category_id}-${r.city_id}`;
        if (r.etat_admin === "F") closed.set(k,(closed.get(k)||0)+1); else open.set(k,(open.get(k)||0)+1); }
      o+=rows.length;
    }
    const paires = new Set([...open.keys(), ...closed.keys()]);
    let zeroOpenAvecFerme = 0, totOpen=0, totClosed=0;
    for (const k of paires) { const op=open.get(k)||0, cl=closed.get(k)||0; totOpen+=op; totClosed+=cl; if (op===0 && cl>0) zeroOpenAvecFerme++; }
    console.log(`\ndept ${code} (${(dep as any).name}) : ${cities.length} communes, ${totOpen} pros ouverts, ${totClosed} fermes`);
    console.log(`  paires (metier x commune) existantes : ${paires.size}`);
    console.log(`  paires SANS aucun pro ouvert mais AVEC des fermes : ${zeroOpenAvecFerme}  (${(100*zeroOpenAvecFerme/Math.max(paires.size,1)).toFixed(1)}%)`);
    const ex = [...paires].filter(k=>(open.get(k)||0)===0 && (closed.get(k)||0)>=3).slice(0,3);
    for (const k of ex) { const [c,v]=k.split("-").map(Number);
      console.log(`   ex: ${catSlug.get(c)} / ${cities.find(x=>x.id===v)?.slug} -> 0 ouvert, ${closed.get(k)} fermes`); }
  }
})().catch(e=>{console.error(e.message);process.exit(1);});
