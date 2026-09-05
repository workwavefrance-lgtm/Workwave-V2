import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  for (const fn of ["sitemap_category_city_counts","sitemap_ai_category_city_counts"]) {
    const { data, error } = await sb.rpc(fn as never);
    if (error) { console.log(`${fn}: ERREUR ${error.message.slice(0,110)}`); continue; }
    const rows = (data as never as any[]) || [];
    console.log(`${fn}: ${rows.length} couples (categorie x ville) retournes`);
    if (rows.length) console.log("  exemple:", JSON.stringify(rows[0]));
  }
})().catch(e => { console.error(e.message); process.exit(1); });
