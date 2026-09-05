import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
(async () => {
  const PAGE=1000; let dernier=0; let total=0;
  const parSiren = new Map<string, number>();
  const parSirenVille = new Map<string, number>();
  while(true){
    const { data, error } = await sb.from("pros").select("id, siret, city_id")
      .eq("is_active",true).is("deleted_at",null).not("siret","is",null)
      .gt("id",dernier).order("id",{ascending:true}).limit(PAGE);
    if (error) { console.error("ERREUR:", error.message); process.exit(1); }
    const r=data||[]; if(!r.length) break;
    for(const p of r){
      total++;
      const siren=(p.siret||"").slice(0,9);
      if(!siren) continue;
      parSiren.set(siren,(parSiren.get(siren)||0)+1);
      const k=`${siren}|${p.city_id}`;
      parSirenVille.set(k,(parSirenVille.get(k)||0)+1);
    }
    dernier=r[r.length-1].id;
    if(total%500000<PAGE) console.log(`   ${total.toLocaleString("fr-FR")} fiches lues...`);
  }
  const entreprises = parSiren.size;
  const multi = [...parSiren.values()].filter(v=>v>1).length;
  const fichesEnTrop = total - entreprises;
  const doublonsMemeVille = [...parSirenVille.values()].reduce((s,v)=>s+(v-1),0);
  console.log(`\nfiches actives avec SIRET : ${total.toLocaleString("fr-FR")}`);
  console.log(`entreprises distinctes (SIREN) : ${entreprises.toLocaleString("fr-FR")}`);
  console.log(`entreprises a plusieurs etablissements : ${multi.toLocaleString("fr-FR")}`);
  console.log(`\nfiches au-dela d'une par entreprise    : ${fichesEnTrop.toLocaleString("fr-FR")}  (${(fichesEnTrop/total*100).toFixed(1)} %)`);
  console.log(`fiches en doublon DANS LA MEME COMMUNE : ${doublonsMemeVille.toLocaleString("fr-FR")}  (${(doublonsMemeVille/total*100).toFixed(1)} %)`);
})();
