import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

async function charge(catId:number, naf:string, motif:string){
  let all:any[]=[]; let off=0;
  while(true){
    const { data, error } = await sb.from("pros").select("id,name,naf_code,city_id")
      .eq("category_id",catId).eq("naf_code",naf).eq("is_active",true).is("deleted_at",null)
      .or("etat_admin.is.null,etat_admin.neq.F").ilike("name",`%${motif}%`)
      .order("id").range(off,off+999);
    if (error) throw new Error(error.message);
    const rows=data||[]; if(rows.length===0) break; all.push(...rows); off+=rows.length;
  }
  return all;
}
const LARGE = /\b(VITR|MIROIT)/i;
const ETROIT = /\b(VITRERIE|VITRIER|VITRIERE|MIROITERIE|MIROITIER)/i;

async function main(){
  const lots = [
    {cat:4, nom:"peintre", naf:"4334Z"},
    {cat:5, nom:"menuisier", naf:"4332B"},
    {cat:5, nom:"menuisier", naf:"4332A"},
  ];
  let totLarge=0, totEtroit=0;
  const fpEx:string[]=[]; const okEx:string[]=[]; const perdus:string[]=[];
  for (const l of lots){
    const seen = new Map<number,string>();
    for (const m of ["vitr","miroit"]) {
      for (const r of await charge(l.cat,l.naf,m)) seen.set(r.id, r.name);
    }
    let nl=0, ne=0;
    for (const [id,name] of seen){
      const L = LARGE.test(name), E = ETROIT.test(name);
      if (L) nl++; if (E) ne++;
      if (L && !E && fpEx.length<40) fpEx.push(`${l.naf} ${name}`);
      if (E && okEx.length<25) okEx.push(`${l.naf} ${name}`);
      if (!L && !E && perdus.length<15) perdus.push(`${l.naf} ${name}`);
    }
    totLarge+=nl; totEtroit+=ne;
    console.log(`${l.nom}/${l.naf} : lignes ilike=${seen.size}  regex LARGE=${nl}  regex ETROIT=${ne}`);
  }
  console.log(`\nTOTAL France+BE  LARGE=${totLarge}  ETROIT=${totEtroit}  ecart=${totLarge-totEtroit}`);
  console.log("\n--- captes par LARGE mais PAS par ETROIT (a juger) ---");
  fpEx.forEach(s=>console.log("  ", s));
  console.log("\n--- captes par ETROIT (echantillon) ---");
  okEx.forEach(s=>console.log("  ", s));
  console.log("\n--- ni l'un ni l'autre (ilike seul) ---");
  perdus.forEach(s=>console.log("  ", s));
}
main().then(()=>process.exit(0)).catch(e=>{console.error("ERREUR:",e.message);process.exit(1);});
