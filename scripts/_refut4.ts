import * as dotenv from "dotenv"; import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
// Combien d'URL /page/N l'action proposee ajouterait-elle ? (cout en budget de crawl)
// Approche : compter par (category_id, city_id) les pros OUVERTS, pages = ceil(n/20)-1
async function main() {
  const sb = getServiceClient();
  const { data, error } = await (sb as any).rpc("sitemap_category_city_counts");
  if (error) { console.log("RPC indispo:", error.message); return; }
  const rows = (data || []) as { category_id: number; city_id: number; n: number }[];
  console.log("combos cat x ville renvoyes par la RPC du sitemap :", rows.length);
  let urls = 0, combosAvecPagination = 0;
  for (const r of rows) {
    const n = Number((r as any).n ?? (r as any).count ?? 0);
    const pages = Math.ceil(n / 20) - 1;
    if (pages > 0) { urls += pages; combosAvecPagination++; }
  }
  console.log("combos avec au moins une page 2 :", combosAvecPagination);
  console.log("URL /page/N qui seraient ajoutees (villes seulement, hors departements) :", urls);
}
main().catch(e => console.log("ERR", e.message));
