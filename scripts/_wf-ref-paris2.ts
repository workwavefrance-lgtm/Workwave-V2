import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const PARIS = 12133;
async function noms(catId:number, naf:string, motif?:string){
  let all:any[]=[]; let off=0;
  while(true){
    let q = sb.from("pros").select("id,name").eq("category_id",catId).eq("naf_code",naf)
      .eq("city_id",PARIS).eq("is_active",true).is("deleted_at",null)
      .or("etat_admin.is.null,etat_admin.neq.F").order("id").range(off,off+999);
    if (motif) q = q.ilike("name",`%${motif}%`);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const rows=data||[]; if(rows.length===0) break; all.push(...rows); off+=rows.length;
  }
  return all;
}
async function compteCat(catId:number){
  const { count, error } = await sb.from("pros").select("id",{count:"exact",head:true})
    .eq("category_id",catId).eq("city_id",PARIS).eq("is_active",true).is("deleted_at",null)
    .or("etat_admin.is.null,etat_admin.neq.F");
  if (error||count===null) throw new Error("compteCat "+catId+" "+(error?.message||"null"));
  return count;
}
async function main(){
  console.log("== Paris city_id 12133, fiches ouvertes ==");
  for (const [id,nom] of [[11,"serrurier"],[37,"vitrier"],[13,"climaticien"],[5,"menuisier"],[4,"peintre"],[12,"chauffagiste"],[1,"plombier"]] as [number,string][]) {
    console.log(`  ${nom.padEnd(14)} = ${await compteCat(id)}`);
  }
  const lots = [
    {t:"serrurier",  cat:5, naf:"4332B", motifs:["serrur"]},
    {t:"vitrier",    cat:5, naf:"4332B", motifs:["vitr","miroit"]},
    {t:"vitrier",    cat:4, naf:"4334Z", motifs:["vitr","miroit"]},
    {t:"climaticien",cat:12,naf:"4322B", motifs:["clim","froid"]},
  ];
  const LARGE:Record<string,RegExp> = { serrurier:/\bSERRUR/i, vitrier:/\b(VITR|MIROIT)/i, climaticien:/\b(CLIM|FROID)/i };
  for (const l of lots){
    const seen = new Map<number,string>();
    for (const m of l.motifs) for (const r of await noms(l.cat,l.naf,m)) seen.set(r.id,r.name);
    const rx = LARGE[l.t];
    const ok = [...seen.values()].filter(n=>rx.test(n));
    console.log(`\n${l.t} <- cat${l.cat}/${l.naf} : ilike=${seen.size} regexLARGE=${ok.length}`);
    ok.slice(0,25).forEach(n=>console.log("    +", n));
    const rej=[...seen.values()].filter(n=>!rx.test(n));
    if(rej.length) { console.log("   rejetes par regex:"); rej.slice(0,10).forEach(n=>console.log("    -", n)); }
  }
}
main().then(()=>process.exit(0)).catch(e=>{console.error("ERREUR:",e.message);process.exit(1);});
