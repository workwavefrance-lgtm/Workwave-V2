import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const OUVERT = "etat_admin.is.null,etat_admin.neq.F";
function score(p:any){let s=(p.profile_completion??0)*0.3;const fy=p.founded_year;if(fy&&fy>1900&&fy<=2026)s+=Math.min(2026-fy,20);if(p.claimed_by_user_id)s+=15;s+=Math.min((p.certifications??[]).length,5)*5;if(p.rge_certified)s+=10;if(p.has_decennale)s+=5;if(p.has_rc_pro)s+=5;s+=Math.min((p.photos??[]).length,3)*5;if(p.description)s+=Math.min(Math.floor(p.description.length/100),3)*5;const r=p.google_rating??0;if(r>=4.5)s+=30;else if(r>=4)s+=15;else if(r>=3.5)s+=5;const rc=p.google_reviews_count??0;if(rc>=10)s+=20;else if(rc>=3)s+=10;else if(rc>=1)s+=5;return Math.round(s);}
const COLS="id,name,siret,founded_year,profile_completion,claimed_by_user_id,certifications,rge_certified,has_decennale,has_rc_pro,photos,description,google_rating,google_reviews_count";
async function main(){
  const { data: cats } = await sb.from("categories").select("id,slug").in("slug",["demenagement","plombier","electricien","macon","menage","peintre","couvreur","menuisier"]);
  const { data: deps } = await sb.from("departments").select("id,code,name").in("code",["13","33","31","59","69","75","44","06","34","76"]);
  for (const d of deps??[]) {
    const { data: cA } = await sb.from("cities").select("id").eq("department_id",d.id).limit(1000);
    const idsA=(cA??[]).map(c=>c.id);
    const idsB:number[]=[]; let off=0;
    while(true){ const {data}=await sb.from("cities").select("id").eq("department_id",d.id).range(off,off+999);
      const r=data??[]; if(r.length===0)break; idsB.push(...r.map(c=>c.id)); off+=r.length; }
    if(idsA.length!==idsB.length) console.log(`!! ${d.code} villes limit=${idsA.length} paginé=${idsB.length}`);
    for (const c of cats??[]) {
      const q=(ids:number[])=>sb.from("pros").select(COLS)
        .eq("category_id",c.id).in("city_id",ids).is("deleted_at",null).eq("is_active",true).or(OUVERT)
        .order("claimed_by_user_id",{ascending:false,nullsFirst:false}).order("profile_completion",{ascending:false,nullsFirst:false}).limit(100);
      const { data: dA } = await q(idsA); const { data: dB } = await q(idsB);
      const mk=(rows:any[])=>{const p=rows.map(x=>({p:x,s:score(x)}));if(p.length<10)return null;
        p.sort((a,b)=>{const ac=!!a.p.claimed_by_user_id,bc=!!b.p.claimed_by_user_id;if(ac!==bc)return ac?-1:1;if(b.s!==a.s)return b.s-a.s;return String(a.p.name??"").localeCompare(String(b.p.name??""));});
        const t=p.slice(0,10);return {nsc:new Set(t.map(x=>x.s)).size, ids:t.map(x=>x.p.id).join(",")};};
      const A=mk(dA??[]), B=mk(dB??[]);
      if(!A||!B) continue;
      if(A.nsc!==B.nsc || A.ids!==B.ids)
        console.log(`DIFF ${c.slug} x ${d.code} : nscA=${A.nsc} nscB=${B.nsc} | memes ids ? ${A.ids===B.ids}`);
    }
  }
  console.log("fin");
}
main().catch(e=>console.error(e));
