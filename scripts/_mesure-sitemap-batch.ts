import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data: cats } = await sb.from("categories").select("id").eq("vertical", "tech");
  const ai = (cats || []).map((c) => c.id);
  for (const skip of [180000, 1350000, 2200000]) {
    let t = Date.now();
    const { data: start, error } = await sb.rpc("sitemap_batch_start_id", { skip_count: skip, tech_mode: false });
    const tRpc = Date.now() - t;
    if (error) { console.log(`skip ${skip} : RPC ERREUR ${error.message} (${tRpc} ms)`); continue; }
    t = Date.now();
    const { data: rows, error: e2 } = await sb.from("pros").select("slug, updated_at, claimed_by_user_id, id").eq("is_active", true).is("deleted_at", null).not("category_id", "in", `(${ai.join(",")})`).gt("id", Number(start) - 1).order("id", { ascending: true }).limit(1000);
    console.log(`skip ${skip} : start id ${start} en ${tRpc} ms · 1000 lignes en ${Date.now() - t} ms ${e2 ? "ERREUR " + e2.message : "ok " + (rows || []).length}`);
  }
})();
