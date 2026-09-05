import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const OUVERT = "etat_admin.is.null,etat_admin.neq.F";
function score(p:any){let s=(p.profile_completion??0)*0.3;const fy=p.founded_year;if(fy&&fy>1900&&fy<=2026)s+=Math.min(2026-fy,20);if(p.claimed_by_user_id)s+=15;s+=Math.min((p.certifications??[]).length,5)*5;if(p.rge_certified)s+=10;if(p.has_decennale)s+=5;if(p.has_rc_pro)s+=5;s+=Math.min((p.photos??[]).length,3)*5;if(p.description)s+=Math.min(Math.floor(p.description.length/100),3)*5;const r=p.google_rating??0;if(r>=4.5)s+=30;else if(r>=4)s+=15;else if(r>=3.5)s+=5;const rc=p.google_reviews_count??0;if(rc>=10)s+=20;else if(rc>=3)s+=10;else if(rc>=1)s+=5;return Math.round(s);}
async function main(){
  const { data: cats } = await sb.from("categories").select("id,slug").in("slug",["demenagement","plombier","electricien","macon","menage","peintre","couvreur","menuisier"]);
  const { data: deps } = await sb.from("departments").select("id,code,name").in("code",["13","33","31","59","69","75","44","06","34","76"]);
  let total=0, un=0, deux=0, doublonSiren=0, top1Alpha=0, sommeMaxRep=0;
  for (const d of deps??[]) {
    const ids:number[]=[]; let off=0;
    while(true){ const {data}=await sb.from("cities").select("id").eq("department_id",d.id).range(off,off+999);
      const r=data??[]; if(r.length===0)break; ids.push(...r.map(c=>c.id)); off+=r.length; }
    for (const c of cats??[]) {
      const { data } = await sb.from("pros").select("id,name,siret,founded_year,profile_completion,claimed_by_user_id,certifications,rge_certified,has_decennale,has_rc_pro,photos,description,google_rating,google_reviews_count")
        .eq("category_id",c.id).in("city_id",ids).is("deleted_at",null).eq("is_active",true).or(OUVERT)
        .order("claimed_by_user_id",{ascending:false,nullsFirst:false}).order("profile_completion",{ascending:false,nullsFirst:false}).limit(100);
      const pros=(data??[]).map(p=>({p,s:score(p)}));
      if (pros.length<10) continue;
      pros.sort((a,b)=>{const ac=!!(a.p as any).claimed_by_user_id,bc=!!(b.p as any).claimed_by_user_id;if(ac!==bc)return ac?-1:1;if(b.s!==a.s)return b.s-a.s;return String(a.p.name??"").localeCompare(String(b.p.name??""));});
      const top=pros.slice(0,10); total++;
      const nsc=new Set(top.map(t=>t.s)).size;
      if(nsc===1) un++; if(nsc===2) deux++;
      const noms=top.map(t=>String(t.p.name??""));
      if(JSON.stringify(noms)===JSON.stringify([...noms].sort((a,b)=>a.localeCompare(b)))) top1Alpha++;
      const sirens=top.map(t=>String((t.p as any).siret??"").slice(0,9));
      if(new Set(sirens).size<10) doublonSiren++;
      const cnt:Record<string,number>={}; for(const s of sirens) cnt[s]=(cnt[s]??0)+1;
      sommeMaxRep+=Math.max(...Object.values(cnt));
    }
  }
  console.log(`Top 10 examines : ${total}`);
  console.log(`  EXACTEMENT 1 score distinct (ordre 100% alphabetique) : ${un} (${(100*un/total).toFixed(1)}%)`);
  console.log(`  exactement 2 scores distincts                          : ${deux} (${(100*deux/total).toFixed(1)}%)`);
  console.log(`  <=2 (chiffre de l audit)                               : ${un+deux} (${(100*(un+deux)/total).toFixed(1)}%)`);
  console.log(`  liste ENTIEREMENT triee alphabetiquement (mesure directe) : ${top1Alpha} (${(100*top1Alpha/total).toFixed(1)}%)`);
  console.log(`  top10 avec >=2 fiches du meme SIREN : ${doublonSiren} (${(100*doublonSiren/total).toFixed(1)}%)`);
  console.log(`  repetition max moyenne d un meme SIREN : ${(sommeMaxRep/total).toFixed(2)}`);
}
main().catch(e=>console.error(e));
