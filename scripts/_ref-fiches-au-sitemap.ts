/**
 * Toutes les fiches sont-elles declarees au sitemap ? buildProsUrls ne filtre
 * ni etat_admin ni rien d autre : is_active + deleted_at null. La seule limite
 * est le nombre de sous-sitemaps declares (48 x 45 000 non-tech, 14 x 45 000 tech).
 */
import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const AI = [43,44,45,46,47,48];
async function main() {
  const sb = getServiceClient();
  const { count: nonTech } = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null).not("category_id", "in", `(${AI.join(",")})`);
  const { count: nonTechOuvertes } = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null).eq("etat_admin", "A").not("category_id", "in", `(${AI.join(",")})`);
  const { count: tech } = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null).in("category_id", AI);
  const capaciteNonTech = 48 * 45000, capaciteTech = 14 * 45000;
  console.log(`fiches non-tech actives      : ${(nonTech||0).toLocaleString("fr-FR")}`);
  console.log(`  dont OUVERTES (etat_admin A): ${(nonTechOuvertes||0).toLocaleString("fr-FR")}`);
  console.log(`fiches tech actives          : ${(tech||0).toLocaleString("fr-FR")}`);
  console.log(`\ncapacite declaree au sitemap : ${capaciteNonTech.toLocaleString("fr-FR")} non-tech, ${capaciteTech.toLocaleString("fr-FR")} tech`);
  console.log(`couverture non-tech : ${Math.min(100, 100*capaciteNonTech/(nonTech||1)).toFixed(1)} %`);
  console.log(`couverture tech     : ${Math.min(100, 100*capaciteTech/(tech||1)).toFixed(1)} %`);
  console.log(`\n=> fiches non declarees faute de sous-sitemap : ${Math.max(0,(nonTech||0)-capaciteNonTech).toLocaleString("fr-FR")} non-tech, ${Math.max(0,(tech||0)-capaciteTech).toLocaleString("fr-FR")} tech`);
}
main();
