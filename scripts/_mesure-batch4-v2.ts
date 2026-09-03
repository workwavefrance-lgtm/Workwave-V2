import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data: cats } = await sb.from("categories").select("id").eq("vertical", "tech");
  const ai = (cats || []).map((c) => c.id);
  for (const batch of [4, 7, 12]) {
    const { data: start } = await sb.rpc("sitemap_batch_start_id", { skip_count: batch * 45000, tech_mode: false });
    let lastId = Number(start) - 1, total = 0, pire = 0, erreur = "";
    const t0 = Date.now();
    for (let i = 0; i < 45; i++) {
      const t = Date.now();
      const ids = await sb.from("pros").select("id").eq("is_active", true).is("deleted_at", null).not("category_id", "in", `(${ai.join(",")})`).gt("id", lastId).order("id").limit(1000);
      if (ids.error) { erreur = `page ${i} ids : ${ids.error.message}`; break; }
      const liste = (ids.data || []).map((r) => r.id); if (!liste.length) break;
      const rows = await sb.from("pros").select("slug, updated_at, claimed_by_user_id, id").in("id", liste).order("id");
      if (rows.error) { erreur = `page ${i} lignes : ${rows.error.message}`; break; }
      const ms = Date.now() - t; if (ms > pire) pire = ms; total += rows.data!.length; lastId = liste[liste.length - 1];
    }
    console.log(`lot ${batch} en deux temps : ${total} lignes en ${((Date.now() - t0) / 1000).toFixed(1)} s, pire page ${pire} ms ${erreur ? "ERREUR " + erreur : "ok"}`);
  }
})();
