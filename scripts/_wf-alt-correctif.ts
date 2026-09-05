import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main(){
  // Piste A : la vue materialisee metier x ville, deja construite et indexee.
  let t0 = Date.now();
  const { data, error } = await sb.from("listing_cat_ville").select("metier, ville, n").limit(5);
  console.log(`lecture directe listing_cat_ville : ${(Date.now()-t0)/1000}s ->`,
    error ? "ECHEC " + error.message : `OK, exemple ${JSON.stringify(data?.[0])}`);

  // Piste B : la tranche via la RPC prevue pour le sitemap (service_role).
  t0 = Date.now();
  const { data: tot, error: e2 } = await sb.rpc("sitemap_listings_total" as any);
  console.log(`sitemap_listings_total() : ${(Date.now()-t0)/1000}s ->`, e2 ? "ECHEC " + e2.message : `${tot} couples metier x ville`);

  t0 = Date.now();
  const { data: page, error: e3 } = await sb.rpc("sitemap_listings_page" as any, { p_offset: 0, p_limit: 1000 });
  console.log(`sitemap_listings_page(0,1000) : ${(Date.now()-t0)/1000}s ->`, e3 ? "ECHEC " + e3.message : `${(page as any[]).length} lignes`);
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e.message);process.exit(1);});
