import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  // echantillon aleatoire de fiches OUVERTES non-tech
  const ids: number[] = []; for (let i = 0; i < 1200; i++) ids.push(Math.floor(Math.random()*2_450_000)+1);
  const { data } = await sb.from("pros").select("id,slug,category_id,city_id,categories(vertical)")
    .in("id", ids).eq("is_active", true).is("deleted_at", null).eq("etat_admin","A").limit(400);
  const ech = (data as any[]).filter(p => p.categories?.vertical !== "tech" && p.city_id).slice(0, 300);
  console.log(`echantillon de fiches ouvertes non-tech : ${ech.length}`);
  const tailles: number[] = [];
  for (let i = 0; i < ech.length; i += 12) {
    const res = await Promise.all(ech.slice(i, i+12).map(async (p:any) => {
      const { count } = await sb.from("pros").select("id", { count: "exact", head: true })
        .eq("category_id", p.category_id).eq("city_id", p.city_id)
        .eq("is_active", true).is("deleted_at", null).eq("etat_admin","A");
      return count ?? 0;
    }));
    tailles.push(...res);
  }
  tailles.sort((a,b)=>a-b);
  const q = (p:number)=>tailles[Math.floor(tailles.length*p)];
  console.log(`taille du couple (metier, commune) vue par une fiche au hasard :`);
  console.log(`  min ${tailles[0]} | p25 ${q(0.25)} | mediane ${q(0.5)} | p75 ${q(0.75)} | p90 ${q(0.9)} | max ${tailles[tailles.length-1]}`);
  const seuils = [1,2,3,6,11,21,51];
  for (const s of seuils) {
    const n = tailles.filter(t => t <= s).length;
    console.log(`  fiches dont le vivier compte <= ${s} confreres ouverts : ${n}/${tailles.length} (${(n/tailles.length*100).toFixed(1)} %)`);
  }
  // combien de cibles NOUVELLES un tirage aleatoire peut-il apporter ?
  // avec limite 5 : gain = min(taille-1, 5) est deja atteint ; le gain vient des viviers > 6
  const gagnants = tailles.filter(t => t > 6).length;
  console.log(`fiches dont le vivier depasse 6 (les SEULES ou un tirage change quelque chose) : ${gagnants}/${tailles.length} (${(gagnants/tailles.length*100).toFixed(1)} %)`);
})();
