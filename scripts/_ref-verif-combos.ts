import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const t = await (sb as any).rpc("sitemap_listings_total");
  console.log("RPC sitemap_listings_total ->", t.error ? "ERR " + t.error.message : t.data);
  // lecture directe de la vue materialisee, par tranches, pour recompter villes distinctes
  let off = 0; const villes = new Set<string>(); const metiers = new Set<string>(); let lignes = 0; let n3 = 0;
  while (true) {
    const { data, error } = await (sb as any).rpc("sitemap_listings_page", { p_offset: off, p_limit: 20000 });
    if (error) { console.log("ERR page", off, error.message); break; }
    const rows = (data || []) as { m: string; v: string; n: number }[];
    if (rows.length === 0) break;
    for (const r of rows) { villes.add(r.v); metiers.add(r.m); lignes++; if (r.n >= 3) n3++; }
    off += rows.length;
    if (rows.length < 20000) break;
  }
  console.log("lignes lues dans la vue :", lignes, "| villes distinctes :", villes.size, "| metiers distincts :", metiers.size, "| n>=3 :", n3);
})().catch(e => { console.error(e.message); process.exit(1); });
