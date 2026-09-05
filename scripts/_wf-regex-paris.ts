import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const PARIS = 12133;
const REGLES: { naf: string; src: [number,string]; cible: string; motifs: string[] }[] = [
  { naf:"4332B", src:[5,"menuisier"],    cible:"serrurier",  motifs:["serrur"] },
  { naf:"4332B", src:[5,"menuisier"],    cible:"vitrier",    motifs:["vitr","miroit"] },
  { naf:"4334Z", src:[4,"peintre"],      cible:"vitrier",    motifs:["vitr","miroit"] },
  { naf:"4322B", src:[12,"chauffagiste"],cible:"climaticien",motifs:["clim","froid"] },
  { naf:"4322B", src:[12,"chauffagiste"],cible:"ramoneur",   motifs:["ramon"] },
  { naf:"4329B", src:[36,"pisciniste"],  cible:"ascensoriste", motifs:["ascens","monte-charge"] },
  { naf:"4332A", src:[5,"menuisier"],    cible:"cuisiniste", motifs:["cuisin"] },
  { naf:"4321A", src:[2,"electricien"],  cible:"videosurveillance", motifs:["videosurveil","video surveil","telesurveil"] },
  { naf:"4399A", src:[10,"facadier"],    cible:"pisciniste", motifs:["piscin"] },
];
async function compte(catId:number, naf:string, motif?:string):Promise<number>{
  for (let e=0;e<6;e++){
    let q = sb.from("pros").select("id",{count:"exact",head:true})
      .eq("category_id",catId).eq("naf_code",naf).eq("city_id",PARIS)
      .eq("is_active",true).is("deleted_at",null).or("etat_admin.is.null,etat_admin.neq.F");
    if (motif) q = q.ilike("name", `%${motif}%`);
    const { count, error } = await q;
    if (!error && count !== null) return count;
    await new Promise(r=>setTimeout(r, 5000));
  }
  throw new Error(`echec ${catId}/${naf}/${motif ?? "-"}`);
}
async function main(){
  console.log("PARIS seulement (city_id 12133), fiches ouvertes\n");
  for (const r of REGLES){
    const socle = await compte(r.src[0], r.naf);
    let cand = 0; for (const m of r.motifs) cand += await compte(r.src[0], r.naf, m);
    console.log(`${r.naf} ${r.src[1].padEnd(13)} -> ${r.cible.padEnd(18)} socle=${String(socle).padStart(5)} candidats(nom)=${String(cand).padStart(4)}`);
  }
}
main().then(()=>process.exit(0)).catch(e=>{console.error("ERREUR:",e.message);process.exit(1);});
