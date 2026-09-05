import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
(async () => {
  // une ville FR bien couverte (prix + revenu + vacance + densite)
  const { data: cd } = await sb.from("commune_data").select("insee_code,prix_m2_moyen,revenu_median,taux_vacance,densite_hab_km2")
    .not("prix_m2_moyen","is",null).not("taux_vacance","is",null).limit(400);
  const inseeOk = new Set((cd||[]).map((x:any)=>x.insee_code));
  const { data: villes } = await sb.from("cities").select("id,name,slug,insee_code").in("insee_code", Array.from(inseeOk).slice(0,300));
  const ids = (villes||[]).map((v:any)=>v.id);
  const { data: pros } = await sb.from("pros").select("slug,name,city_id,etat_admin")
    .in("city_id", ids.slice(0,200)).eq("is_active", true).is("deleted_at", null).limit(5);
  for (const p of (pros||[]) as any[]) {
    const v = (villes||[]).find((x:any)=>x.id===p.city_id) as any;
    const f = (cd||[]).find((x:any)=>x.insee_code===v.insee_code) as any;
    console.log(`${p.slug}  | ${v.name} (${v.insee_code}) | prix=${f.prix_m2_moyen} rev=${f.revenu_median} vac=${f.taux_vacance} dens=${f.densite_hab_km2} | etat=${p.etat_admin}`);
  }
})();
