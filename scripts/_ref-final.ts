import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const OUVERT="etat_admin.is.null,etat_admin.neq.F";
function score(p:any){let s=(p.profile_completion??0)*0.3;const fy=p.founded_year;if(fy&&fy>1900&&fy<=2026)s+=Math.min(2026-fy,20);if(p.claimed_by_user_id)s+=15;s+=Math.min((p.certifications??[]).length,5)*5;if(p.rge_certified)s+=10;if(p.has_decennale)s+=5;if(p.has_rc_pro)s+=5;s+=Math.min((p.photos??[]).length,3)*5;if(p.description)s+=Math.min(Math.floor(p.description.length/100),3)*5;const r=p.google_rating??0;if(r>=4.5)s+=30;else if(r>=4)s+=15;else if(r>=3.5)s+=5;const rc=p.google_reviews_count??0;if(rc>=10)s+=20;else if(rc>=3)s+=10;else if(rc>=1)s+=5;return Math.round(s);}
const COLS="id,name,siren,founded_year,profile_completion,claimed_by_user_id,certifications,rge_certified,has_decennale,has_rc_pro,photos,description,google_rating,google_reviews_count";
const slugify=(n:string)=>String(n).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
async function main(){
  const { data: cats } = await sb.from("categories").select("id,slug").in("vertical",["btp","domicile","personne"]).order("id");
  const { data: deps } = await sb.from("departments").select("id,code,name,country").order("code");
  const depSample=(deps??[]).filter((_,i)=>i%4===0);
  let total=0, alpha=0, dup=0, sommeDist=0, be=0; const pires:any[]=[];
  for(const d of depSample){
    const ids:number[]=[]; let off=0;
    while(true){ const {data}=await sb.from("cities").select("id").eq("department_id",d.id).order("id").range(off,off+999);
      const r=data??[]; if(r.length===0)break; ids.push(...r.map(c=>c.id)); off+=r.length; }
    if(!ids.length) continue;
    for(const c of (cats??[])){
      const { data } = await sb.from("pros").select(COLS)
        .eq("category_id",c.id).in("city_id",ids).is("deleted_at",null).eq("is_active",true).or(OUVERT)
        .order("claimed_by_user_id",{ascending:false,nullsFirst:false}).order("profile_completion",{ascending:false,nullsFirst:false})
        .order("id",{ascending:true}).limit(100);
      const rows=data??[]; if(rows.length<10) continue;
      const p=rows.map(x=>({p:x,s:score(x)}));
      p.sort((a,b)=>{const ac=!!a.p.claimed_by_user_id,bc=!!b.p.claimed_by_user_id;if(ac!==bc)return ac?-1:1;if(b.s!==a.s)return b.s-a.s;return String(a.p.name??"").localeCompare(String(b.p.name??""));});
      const top=p.slice(0,10); total++;
      if(top.every(t=>!t.p.siren)){ be++; continue; }   // pros belges : pas de SIREN, hors perimetre du dedupe
      const noms=top.map(t=>String(t.p.name??""));
      if(JSON.stringify(noms)===JSON.stringify([...noms].sort((a,b)=>a.localeCompare(b)))) alpha++;
      const sir=top.map(t=>t.p.siren).filter(Boolean).map(String);
      const cnt:Record<string,number>={}; for(const s of sir) cnt[s]=(cnt[s]??0)+1;
      const m=sir.length? Math.max(...Object.values(cnt)) : 1;
      const nd=new Set(sir).size + top.filter(t=>!t.p.siren).length;
      sommeDist+=nd;
      if(m>=2){ dup++; if(m>=3) pires.push({url:`/${c.slug}/${slugify(d.name)}-${d.code}`, rep:m, nd, noms}); }
    }
  }
  const fr=total-be;
  console.log(`\n=== ${total} Top 10 analyses, dont ${be} 100% belges (sans SIREN, exclus) -> ${fr} exploitables ===`);
  console.log(`  liste ENTIEREMENT alphabetique           : ${alpha} (${(100*alpha/fr).toFixed(1)}%)`);
  console.log(`  >=2 etablissements du MEME SIREN         : ${dup} (${(100*dup/fr).toFixed(1)}%)`);
  console.log(`  entreprises distinctes moyennes /10      : ${(sommeDist/fr).toFixed(2)}`);
  console.log(`  cas a >=3 fiches du meme SIREN           : ${pires.length} (${(100*pires.length/fr).toFixed(1)}%)`);
  pires.sort((a,b)=>b.rep-a.rep);
  console.log(`\n  PIRES CAS REELS :`);
  for(const x of pires.slice(0,5)) console.log(`    ${x.url} : ${x.rep}/10 places pour 1 entreprise, ${x.nd} distinctes -> ${x.noms.slice(0,4).join(" | ")}`);
}
main().catch(e=>console.error(e));
