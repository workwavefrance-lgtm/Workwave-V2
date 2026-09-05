import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const villes = [["Montpellier","plombier"],["Lyon","climaticien"],["Lyon","plombier"],["Marseille","plombier"],["Bordeaux","plombier"],["Nantes","plombier"],["Toulouse","plombier"],["Poitiers","plombier"],["Nantes","nettoyage-vitres"]];
  for (const [ville, metier] of villes) {
    const { data: c } = await sb.from("cities").select("id,name").ilike("name", ville).limit(5);
    const { data: cat } = await sb.from("categories").select("id,slug").eq("slug", metier).limit(1);
    if (!c?.length || !cat?.length) { console.log(`${ville}/${metier}: introuvable`); continue; }
    const ids = c.map(x => x.id);
    const { count: tot } = await sb.from("pros").select("id", { count: "exact", head: true })
      .in("city_id", ids).eq("category_id", cat[0].id).eq("is_active", true).is("deleted_at", null);
    const { count: ouv } = await sb.from("pros").select("id", { count: "exact", head: true })
      .in("city_id", ids).eq("category_id", cat[0].id).eq("is_active", true).is("deleted_at", null).neq("etat_admin", "F");
    console.log(`${(ville+"/"+metier).padEnd(28)} total actifs ${String(tot).padStart(5)} | OUVERTS ${String(ouv).padStart(5)} | fermes ${String((tot||0)-(ouv||0)).padStart(5)}`);
  }
  // Avis : la meta promet "avis verifies"
  const { count: av } = await sb.from("pro_reviews").select("id", { count: "exact", head: true });
  const { count: avp } = await sb.from("pro_reviews").select("id", { count: "exact", head: true }).eq("status","published");
  console.log(`\npro_reviews : ${av} lignes au total, ${avp} publiees`);
  // Combien de couples (categorie, ville) ont >=1 pro OUVERT : la surface reellement servable
  const { data: rpc, error } = await sb.rpc("count_category_city_pros" as never).select?.("*") as never;
  if (error) console.log("(pas de RPC de comptage, ignore)");
})().catch(e => { console.error(e.message); process.exit(1); });
