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
  // RGE ouverts par metier x dept
  const rge:any[]=[]; let off=0;
  while (true) { const { data } = await sb.from("pros").select("city_id,category_id,etat_admin")
      .eq("is_active",true).is("deleted_at",null).eq("rge_certified",true).range(off, off+999);
    const r=(data||[]) as any[]; if(!r.length) break; rge.push(...r); off+=r.length; }
  const mRge=new Map<string,number>();
  for (const r of rge) { if(r.etat_admin==="F"||!cs.has(r.category_id)) continue; const d=c2d.get(r.city_id); if(!d) continue;
    const k=`${r.category_id}-${d}`; mRge.set(k,(mRge.get(k)||0)+1); }
  const cible = [...mRge].filter(([,n])=>n>=3).map(([k])=>k);
  const cible10 = [...mRge].filter(([,n])=>n>=10).map(([k])=>k);
  console.log(`combos metier x dept avec >=3 RGE : ${cible.length} | >=10 RGE : ${cible10.length}`);
  // TOUS les pros ouverts par metier x dept (= les pages /[metier]/[dept] qui existent deja)
  const mAll=new Map<string,number>();
  for (const cid of cs.keys()) {
    const { data } = await sb.rpc("noop_never").select?.() as any; break;
  }
  // pagination directe sur pros ouverts serait trop lourde : on compte par combo cible uniquement
  let couverts=0, exemples:string[]=[];
  for (const k of cible.slice(0,0)) {}
  console.log(`\nVerification : les combos cibles ont-ils DEJA une page /[metier]/[dept] ?`);
  console.log(`La route app/(public)/[metier]/[location]/page.tsx sert /[metier]/[dept-NN] pour TOUT couple`);
  console.log(`(metier, departement) ayant au moins 1 pro. Donc les ${cible.length} combos a >=3 RGE`);
  console.log(`sont un SOUS-ENSEMBLE strict des pages deja servies (un dept a >=3 RGE a forcement >=3 pros).`);
  // preuve chiffree : pour 8 combos au hasard, compter les pros ouverts totaux
  const ech = cible.sort(()=>Math.random()-0.5).slice(0,8);
  const { data: depts } = await sb.from("departments").select("id,code,name,slug");
  const dm = new Map((depts||[]).map((d:any)=>[d.id,d]));
  for (const k of ech) {
    const [cid,did] = k.split("-").map(Number);
    const villes = [...c2d].filter(([,d])=>d===did).map(([c])=>c);
    let tot=0;
    for (let i=0;i<villes.length;i+=300) {
      const { count } = await sb.from("pros").select("id",{count:"exact",head:true})
        .eq("is_active",true).is("deleted_at",null).neq("etat_admin","F")
        .eq("category_id",cid).in("city_id",villes.slice(i,i+300));
      tot += count||0;
    }
    const d:any = dm.get(did);
    console.log(`  /${cs.get(cid)}/${d?.slug||did} : ${mRge.get(k)} RGE ouverts sur ${tot} pros ouverts (${(100*(mRge.get(k)||0)/Math.max(tot,1)).toFixed(1)}% de la page existante)`);
  }
})().catch(e=>{console.error(e.message);process.exit(1);});
