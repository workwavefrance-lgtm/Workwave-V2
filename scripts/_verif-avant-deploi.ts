/** Ce dont le prochain deploiement depend cote base : les RPC et la vue. */
import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const t0 = Date.now();
  const a = await (sb as any).rpc("sitemap_listings_total");
  console.log(`  sitemap_listings_total()  : ${a.error ? "ERREUR " + a.error.message : a.data + " pages"} (${Date.now() - t0} ms)`);
  const t1 = Date.now();
  const b = await (sb as any).rpc("sitemap_listings_page", { p_offset: 0, p_limit: 3 });
  console.log(`  sitemap_listings_page()   : ${b.error ? "ERREUR " + b.error.message : JSON.stringify(b.data).slice(0, 160)} (${Date.now() - t1} ms)`);
  const t2 = Date.now();
  const c = await (sb as any).rpc("sitemap_batch_start_id", { skip_count: 45000, tech_mode: false });
  console.log(`  sitemap_batch_start_id()  : ${c.error ? "ERREUR " + c.error.message : c.data} (${Date.now() - t2} ms)`);
})();
