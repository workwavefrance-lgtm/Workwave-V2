import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const OUVERT = "etat_admin.is.null,etat_admin.neq.F";
// reproduit computeProScore + scoreAndSelectTop (lib/queries/top-pros.ts)
function score(p:any){let s=(p.profile_completion??0)*0.3;const fy=p.founded_year;if(fy&&fy>1900&&fy<=2026)s+=Math.min(2026-fy,20);if(p.claimed_by_user_id)s+=15;s+=Math.min((p.certifications??[]).length,5)*5;if(p.rge_certified)s+=10;if(p.has_decennale)s+=5;if(p.has_rc_pro)s+=5;s+=Math.min((p.photos??[]).length,3)*5;if(p.description)s+=Math.min(Math.floor(p.description.length/100),3)*5;const r=p.google_rating??0;if(r>=4.5)s+=30;else if(r>=4)s+=15;else if(r>=3.5)s+=5;const rc=p.google_reviews_count??0;if(rc>=10)s+=20;else if(rc>=3)s+=10;else if(rc>=1)s+=5;return Math.round(s);}
async function main() {
  const { data: cats } = await sb.from("categories").select("id,slug").in("slug",["demenagement","plombier","electricien","macon","menage","peintre","couvreur","menuisier"]);
  const { data: deps } = await sb.from("departments").select("id,code,name").in("code",["13","33","31","59","69","75","44","06","34","76"]);
  let total=0, avecDoublon=0, sommeDistincts=0, tiesAlpha=0;
  for (const d of deps??[]) {
    const { data: cs } = await sb.from("cities").select("id").eq("department_id", d.id).limit(1000);
    const ids=(cs??[]).map(c=>c.id);
    for (const c of cats??[]) {
      const { data } = await sb.from("pros").select("id,name,siret,founded_year,profile_completion,claimed_by_user_id,certifications,rge_certified,has_decennale,has_rc_pro,photos,description,google_rating,google_reviews_count")
        .eq("category_id",c.id).in("city_id",ids).is("deleted_at",null).eq("is_active",true).or(OUVERT)
        .order("claimed_by_user_id",{ascending:false,nullsFirst:false}).order("profile_completion",{ascending:false,nullsFirst:false}).limit(100);
      const pros=(data??[]).map(p=>({p,s:score(p)}));
      if (pros.length<10) continue;
      pros.sort((a,b)=>{const ac=!!(a.p as any).claimed_by_user_id,bc=!!(b.p as any).claimed_by_user_id;if(ac!==bc)return ac?-1:1;if(b.s!==a.s)return b.s-a.s;return String(a.p.name??"").localeCompare(String(b.p.name??""));});
      const top=pros.slice(0,10);
      total++;
      const sirens=top.map(t=>String((t.p as any).siret??"").slice(0,9));
      const nd=new Set(sirens).size; sommeDistincts+=nd;
      if (nd<10) avecDoublon++;
      // combien de scores distincts dans le top 10 (ties = departage alphabetique)
      const sc=new Set(top.map(t=>t.s)).size;
      if (sc<=2) tiesAlpha++;
    }
  }
  console.log(`Top 10 examines (categorie x departement, >=10 pros) : ${total}`);
  console.log(`  top 10 contenant au moins 2 fiches du MEME SIREN : ${avecDoublon} (${(100*avecDoublon/total).toFixed(1)}%)`);
  console.log(`  entreprises distinctes moyennes dans un "Top 10" : ${(sommeDistincts/total).toFixed(2)} / 10`);
  console.log(`  top 10 ou <=2 scores distincts (donc classement quasi alphabetique) : ${tiesAlpha} (${(100*tiesAlpha/total).toFixed(1)}%)`);
}
main().catch(e=>console.error(e.message));
