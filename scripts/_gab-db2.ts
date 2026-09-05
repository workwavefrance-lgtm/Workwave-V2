import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const OUVERT = "etat_admin.is.null,etat_admin.neq.F";
async function main() {
  // Echantillon : 20 tranches de 1000 lignes reparties sur toute la plage d'id
  const { data: mm } = await sb.from("pros").select("id").order("id",{ascending:false}).limit(1);
  const maxId = mm![0].id as number;
  console.log("max id =", maxId);
  const cols = "id,phone,email,website,description,photos,certifications,google_rating,google_reviews_count,workwave_reviews_count,profile_completion,founded_year,rge_certified,has_decennale,has_rc_pro,logo_url,opening_hours,siret";
  const rows: any[] = [];
  for (let k = 0; k < 25; k++) {
    const start = Math.floor((maxId / 25) * k);
    const { data, error } = await sb.from("pros").select(cols).is("deleted_at",null).eq("is_active",true).or(OUVERT).gte("id", start).order("id").limit(1000);
    if (error) { console.log("err", error.message); continue; }
    rows.push(...(data ?? []));
  }
  const n = rows.length;
  const pct = (f: (r:any)=>boolean) => { const c = rows.filter(f).length; return `${c}/${n} = ${(100*c/n).toFixed(2)}%`; };
  console.log(`\nECHANTILLON ${n} fiches ouvertes (25 tranches reparties sur toute la plage d'id)`);
  console.log("phone renseigne        :", pct(r=>!!r.phone));
  console.log("email renseigne        :", pct(r=>!!r.email));
  console.log("website renseigne      :", pct(r=>!!r.website));
  console.log("description non vide   :", pct(r=>!!r.description && r.description.length>0));
  console.log("logo_url               :", pct(r=>!!r.logo_url));
  console.log("photos >= 1            :", pct(r=>Array.isArray(r.photos) && r.photos.length>0));
  console.log("certifications >= 1    :", pct(r=>Array.isArray(r.certifications) && r.certifications.length>0));
  console.log("google_rating          :", pct(r=>r.google_rating!=null));
  console.log("google_reviews_count>0 :", pct(r=>(r.google_reviews_count??0)>0));
  console.log("workwave_reviews>0     :", pct(r=>(r.workwave_reviews_count??0)>0));
  console.log("profile_completion > 0 :", pct(r=>(r.profile_completion??0)>0));
  console.log("founded_year           :", pct(r=>r.founded_year!=null));
  console.log("rge_certified          :", pct(r=>r.rge_certified===true));
  console.log("has_decennale          :", pct(r=>r.has_decennale===true));
  console.log("opening_hours          :", pct(r=>!!r.opening_hours));
  // score distribution
  const score = (p:any) => {
    let s = (p.profile_completion ?? 0) * 0.3;
    const fy = p.founded_year; if (fy && fy>1900 && fy<=2026) s += Math.min(2026-fy,20);
    if (p.claimed_by_user_id) s += 15;
    s += Math.min((p.certifications??[]).length,5)*5;
    if (p.rge_certified) s+=10; if (p.has_decennale) s+=5; if (p.has_rc_pro) s+=5;
    s += Math.min((p.photos??[]).length,3)*5;
    if (p.description) s += Math.min(Math.floor(p.description.length/100),3)*5;
    const r0=p.google_rating??0; if(r0>=4.5)s+=30; else if(r0>=4)s+=15; else if(r0>=3.5)s+=5;
    const rc=p.google_reviews_count??0; if(rc>=10)s+=20; else if(rc>=3)s+=10; else if(rc>=1)s+=5;
    return Math.round(s);
  };
  const scores = rows.map(score);
  const distinct = new Set(scores).size;
  console.log(`\nSCORE computeProScore sur l'echantillon : ${distinct} valeurs distinctes pour ${n} fiches`);
  console.log("  score = 0 (aucun signal hors anciennete) :", pct(r=>score(r)===0));
  const onlyAge = rows.filter(r => score(r) === Math.min(2026-(r.founded_year??2026),20) && (r.founded_year!=null)).length;
  console.log(`  score = anciennete SEULE : ${onlyAge}/${n} = ${(100*onlyAge/n).toFixed(2)}%`);
}
main().catch(e=>console.error(e.message));
