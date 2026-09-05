/** Pouvoir de distinction d un fait de COMMUNE sur une fiche pro :
 *  combien de fiches ouvertes recevraient la phrase IDENTIQUE ?
 *  Echantillon uniforme de fiches -> distribution ponderee par fiche. */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
const OUV = (q:any) => q.eq("is_active",true).is("deleted_at",null).or("etat_admin.is.null,etat_admin.neq.F");
(async () => {
  const { count: maxId } = await sb.from("pros").select("id",{count:"estimated",head:true});
  const N = 80; const freres: number[] = []; const villes = new Set<number>();
  let essais = 0;
  while (freres.length < N && essais < N*4) {
    essais++;
    const r = Math.floor(Math.random() * (maxId || 2500000));
    const { data } = await OUV(sb.from("pros").select("id,city_id")).gt("id", r).not("city_id","is",null).order("id").limit(1);
    const p = (data||[])[0] as any; if (!p) continue;
    const { count } = await OUV(sb.from("pros").select("id",{count:"exact",head:true})).eq("city_id", p.city_id);
    freres.push(count || 0); villes.add(p.city_id);
  }
  freres.sort((a,b)=>a-b);
  const med = freres[Math.floor(freres.length/2)];
  const moy = freres.reduce((a,b)=>a+b,0)/freres.length;
  const p10 = freres[Math.floor(freres.length*0.10)], p90 = freres[Math.floor(freres.length*0.90)];
  console.log(`echantillon : ${freres.length} fiches ouvertes tirees au hasard, ${villes.size} communes distinctes`);
  console.log(`fiches ouvertes partageant la MEME commune (donc la meme phrase) :`);
  console.log(`  median ${med} · moyenne ${moy.toFixed(0)} · p10 ${p10} · p90 ${p90} · min ${freres[0]} · max ${freres[freres.length-1]}`);
  const seules = freres.filter(x=>x<=1).length;
  console.log(`  fiches seules dans leur commune : ${seules}/${freres.length} (${(seules/freres.length*100).toFixed(0)} %)`);
  const grosses = freres.filter(x=>x>=100).length;
  console.log(`  fiches dans une commune a >=100 fiches ouvertes : ${grosses}/${freres.length} (${(grosses/freres.length*100).toFixed(0)} %)`);
})();
