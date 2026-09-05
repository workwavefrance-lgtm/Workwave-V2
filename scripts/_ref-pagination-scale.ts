import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";

// Combien de couples (categorie, ville) et (categorie, departement) ont plus de
// 10 pros OUVERTS ? C'est le nombre de listings qui ont une page 2.
async function main() {
  const sb = getServiceClient();
  // On reutilise la RPC d'agregat existante (lecture seule) sur les villes du sitemap.
  // Mais elle ne filtre pas les fermes. On mesure donc autrement : par ville du sitemap.
  const { data: villes, error: e1 } = await sb
    .from("cities")
    .select("id, name, population")
    .order("population", { ascending: false })
    .limit(300);
  if (e1) throw e1;
  console.log("villes chargees:", villes?.length);
  console.log("top 5:", villes?.slice(0, 5).map((v: any) => `${v.name} (${v.population})`).join(", "));
}
main().catch((e) => { console.error(e); process.exit(1); });
