import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const n = async (t: string, col: string, f?: (q:any)=>any) => {
  let q = sb.from(t).select(col, { count: "exact", head: true }).not(col, "is", null);
  if (f) q = f(q); const { count, error } = await q; return error ? "ERR "+error.message.slice(0,60) : count;
};
(async () => {
  for (const col of ["prix_m2_moyen","revenu_median","taux_vacance","logements_autorises","niveau_equipements","densite_hab_km2","nb_mutations"])
    console.log(`commune_data.${col} rempli: ${await n("commune_data", col)}`);
  const act = (q:any)=>q.eq("is_active",true).is("deleted_at",null);
  console.log("pros rge_certified=true :", (await sb.from("pros").select("id",{count:"exact",head:true}).eq("is_active",true).is("deleted_at",null).eq("rge_certified",true)).count);
  console.log("pros google_rating rempli:", await n("pros","google_rating", act));
  console.log("pros photos non vide    :", await n("pros","photos", act));
  console.log("pros forme_juridique    :", await n("pros","forme_juridique", act));
  console.log("pros effectif_range     :", await n("pros","effectif_range", act));
  console.log("pros description        :", await n("pros","description", act));
  // fermetures par annee
  const { data } = await sb.rpc("noop").select?.() ?? {} as any;
  const { data: rows, error } = await sb.from("pros").select("date_fermeture").not("date_fermeture","is",null).gte("date_fermeture","2025-01-01").limit(1000);
  console.log("echantillon fermetures >=2025:", error ? "ERR" : rows?.length);
})().catch(e => { console.error(e.message); process.exit(1); });
