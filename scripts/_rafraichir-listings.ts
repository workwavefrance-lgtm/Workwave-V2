import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const a = await (sb as any).rpc("sitemap_listings_total");
  console.log(`avant : ${a.error ? "ECHEC " + a.error.message : a.data} pages metier x ville`);
  const t = Date.now();
  const r = await (sb as any).rpc("rafraichir_listings");
  console.log(r.error ? `RAFRAICHISSEMENT EN ECHEC : ${r.error.message}` : `rafraichi en ${Math.round((Date.now() - t) / 1000)} s`);
  const b = await (sb as any).rpc("sitemap_listings_total");
  console.log(`apres : ${b.error ? "ECHEC " + b.error.message : b.data} pages metier x ville`);
  if (!a.error && !b.error) console.log(`gain : +${(b.data || 0) - (a.data || 0)} pages`);
})();
