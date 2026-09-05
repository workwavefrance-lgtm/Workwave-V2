import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
async function main() {
  const sb = getServiceClient();
  // 1. somme des pros dans les couples >= 3
  let offset = 0, somme = 0, lignes = 0;
  const distrib: Record<string, number> = {};
  while (true) {
    const { data, error } = await sb.from("listing_cat_ville").select("n")
      .order("n", { ascending: false }).order("metier").order("ville")
      .range(offset, offset + 999);
    if (error) { console.log("ERR", error.message); break; }
    const rows = data || [];
    if (rows.length === 0) break;
    for (const r of rows as any[]) {
      somme += r.n; lignes++;
      const b = r.n >= 100 ? "100+" : r.n >= 20 ? "20-99" : r.n >= 10 ? "10-19" : r.n >= 5 ? "5-9" : "3-4";
      distrib[b] = (distrib[b] || 0) + 1;
    }
    offset += rows.length;
  }
  console.log(`couples >=3 pros ouverts (vue) : ${lignes}, somme des pros dedans : ${somme}`);
  console.log("distribution :", JSON.stringify(distrib));
  // 2. pros ouverts non tech
  const catsTech = [43,44,45,46,47,48,79,80,81,82,83,85,86,87];
  const { count: ouvertsTotal } = await sb.from("pros").select("*", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null).neq("etat_admin", "F");
  console.log("pros ouverts (etat_admin <> F, tous verticaux) :", ouvertsTotal);
  const { count: ouvertsTech } = await sb.from("pros").select("*", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null).neq("etat_admin", "F").in("category_id", catsTech);
  console.log("dont tech :", ouvertsTech);
  const nonTech = (ouvertsTotal || 0) - (ouvertsTech || 0);
  console.log("pros ouverts NON tech :", nonTech);
  const reste = nonTech - somme;
  console.log(`pros non tech hors couples>=3 : ${reste}`);
  console.log(`=> nb de couples >=1 est compris entre ${lignes + Math.ceil(reste/2)} et ${lignes + reste}`);
}
main();
