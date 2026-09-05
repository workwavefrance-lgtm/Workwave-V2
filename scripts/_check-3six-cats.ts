import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function main(){
  const { data: p } = await sb.from("pros")
    .select("id, name, category_id, secondary_category_ids, enabled_category_ids, intervention_radius_km")
    .ilike("name","%3SIX%").maybeSingle();
  console.log(`3SIX : cat_principale=${p?.category_id} | secondaires=${JSON.stringify(p?.secondary_category_ids)} | activées=${JSON.stringify(p?.enabled_category_ids)} | rayon=${p?.intervention_radius_km}km`);
  // Nettoyage vitres = cat 23. Est-elle dans ses catégories ?
  const cats = [p?.category_id, ...(p?.secondary_category_ids||[]), ...(p?.enabled_category_ids||[])].filter(x=>x!=null);
  console.log(`→ Nettoyage vitres (23) dans ses catégories ? ${cats.includes(23) ? "OUI (match volontaire)" : "NON (= bug de routage, il ne fait PAS ça)"}`);
}
main().catch(e=>{console.error(e.message);process.exit(1);});
