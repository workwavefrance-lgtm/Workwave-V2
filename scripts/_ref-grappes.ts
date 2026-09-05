import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { FILTRE_OUVERTS } from "../lib/queries/pros";
(async () => {
  const sb = getServiceClient();
  // echantillon aleatoire de fiches OUVERTES (celles qui portent le bloc "pros similaires")
  const ech: { id: number; category_id: number; city_id: number }[] = [];
  while (ech.length < 200) {
    const ids: number[] = []; for (let i = 0; i < 400; i++) ids.push(Math.floor(Math.random() * 2_450_000) + 1);
    const { data, error } = await sb.from("pros").select("id,category_id,city_id")
      .in("id", ids).eq("is_active", true).is("deleted_at", null).or(FILTRE_OUVERTS).limit(300);
    if (error) { console.log("ERR", error.message); break; }
    for (const p of (data as any[]) || []) if (p.city_id && p.category_id) ech.push(p);
  }
  const lot = ech.slice(0, 200);
  const tailles: number[] = [];
  for (let i = 0; i < lot.length; i += 10) {
    const res = await Promise.all(lot.slice(i, i + 10).map(async (p) => {
      const { count } = await sb.from("pros").select("id", { count: "exact", head: true })
        .eq("category_id", p.category_id).eq("city_id", p.city_id)
        .eq("is_active", true).is("deleted_at", null).or(FILTRE_OUVERTS);
      return count || 0;
    }));
    tailles.push(...res);
  }
  tailles.sort((a, b) => a - b);
  const n = tailles.length;
  const pct = (x: number) => tailles[Math.min(n - 1, Math.floor(n * x))];
  console.log(`fiches ouvertes echantillonnees : ${n}`);
  console.log(`taille de la grappe (metier x commune, fiches OUVERTES) : mediane ${pct(0.5)}, p75 ${pct(0.75)}, p90 ${pct(0.9)}, max ${tailles[n-1]}`);
  const seuils = [1,2,3,4,5,6,11,21,51];
  for (const s of seuils) {
    const k = tailles.filter(t => t <= s).length;
    console.log(`  grappe <= ${s} fiches : ${k}/${n} (${(100*k/n).toFixed(1)} %)`);
  }
  // le bloc "pros similaires" retourne min(5, grappe-1) liens.
  const satures = tailles.filter(t => t - 1 <= 5).length;
  console.log(`\n=> fiches dont TOUTE la grappe tient deja dans les 5 liens (rien a decorreler) : ${satures}/${n} (${(100*satures/n).toFixed(1)} %)`);
  const zero = tailles.filter(t => t <= 1).length;
  console.log(`=> fiches SEULES de leur grappe (0 lien similaire emis) : ${zero}/${n} (${(100*zero/n).toFixed(1)} %)`);
})();
