import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const { data, error } = await sb.rpc("sitemap_category_city_counts" as any, {} as any);
  if (error) console.log("RPC sitemap_category_city_counts :", error.message);
  else {
    const arr = Array.isArray(data) ? data : [];
    console.log("RPC combos (cat x ville) retournes :", arr.length);
    console.log("exemple :", JSON.stringify(arr[0]));
  }
  // Comptes bruts
  for (const [lbl, q] of [
    ["communes en base", sb.from("cities").select("id", { count: "exact", head: true })],
    ["departements", sb.from("departments").select("id", { count: "exact", head: true })],
  ] as const) {
    const { count, error: e } = await (q as any);
    console.log(`${lbl} : ${e ? "ERR " + e.message : count}`);
  }
  const { data: cats } = await sb.from("categories").select("id, slug, vertical").in("vertical", ["btp", "domicile", "personne"]);
  console.log("categories BTP/domicile/personne :", (cats || []).length);
})();
