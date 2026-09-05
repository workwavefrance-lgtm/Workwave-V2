/** Qui sont vraiment les groupes utilises par _dup-16 ? */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
(async () => {
  const { data: cats } = await sb.from("categories").select("id,slug,vertical").in("id",[43,85,14,29]);
  console.log("categories des 6 groupes du script :"); console.table(cats);
  const { data: villes } = await sb.from("cities").select("id,name").in("id",[12133,16720,24646,6283]);
  console.log("villes :"); console.table(villes);
  // taille REELLE de chaque groupe, contre l echantillon de 250 ids consecutifs
  for (const [ville, cat] of [[12133,43],[12133,85],[16720,85],[12133,14],[24646,85],[6283,29]] as [number,number][]) {
    const { count } = await sb.from("pros").select("id", { count: "exact", head: true })
      .eq("city_id", ville).eq("category_id", cat)
      .eq("is_active", true).is("deleted_at", null).or("etat_admin.is.null,etat_admin.neq.F");
    console.log(`groupe ${ville}|${cat} : taille REELLE en base = ${count}`);
  }
})();
