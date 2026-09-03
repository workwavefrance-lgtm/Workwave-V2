import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data: cats } = await sb.from("categories").select("id").eq("vertical", "tech");
  const ai = (cats || []).map((c) => c.id);
  for (const batch of [4, 5, 6, 7, 20, 40]) {
    const { data: start, error: e0 } = await sb.rpc("sitemap_batch_start_id", { skip_count: batch * 45000, tech_mode: false });
    if (e0 || start === null) { console.log(`lot ${batch} : start ${start} ${e0 ? "ERREUR " + e0.message : "(hors borne)"}`); continue; }
    let lastId = Number(start) - 1, total = 0, pire = 0, erreur = "";
    const t0 = Date.now();
    for (let i = 0; i < 45; i++) {
      const t = Date.now();
      const { data, error } = await sb.from("pros").select("slug, updated_at, claimed_by_user_id, id").eq("is_active", true).is("deleted_at", null).not("category_id", "in", `(${ai.join(",")})`).gt("id", lastId).order("id", { ascending: true }).limit(1000);
      const ms = Date.now() - t; if (ms > pire) pire = ms;
      if (error) { erreur = `page ${i} : ${error.message} (${ms} ms)`; break; }
      const rows = data || []; total += rows.length; if (!rows.length) break; lastId = rows[rows.length - 1].id;
    }
    console.log(`lot ${batch} : ${total} lignes en ${((Date.now() - t0) / 1000).toFixed(1)} s, pire page ${pire} ms ${erreur ? "ERREUR " + erreur : "ok"}`);
  }
})();
