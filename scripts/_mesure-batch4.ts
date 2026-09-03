import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data: cats } = await sb.from("categories").select("id").eq("vertical", "tech");
  const ai = (cats || []).map((c) => c.id);
  const { data: start } = await sb.rpc("sitemap_batch_start_id", { skip_count: 180000, tech_mode: false });
  let lastId = Number(start) - 1, total = 0, pire = 0, pireId = 0;
  const t0 = Date.now();
  for (let i = 0; i < 45; i++) {
    const t = Date.now();
    const { data, error } = await sb.from("pros").select("slug, updated_at, claimed_by_user_id, id").eq("is_active", true).is("deleted_at", null).not("category_id", "in", `(${ai.join(",")})`).gt("id", lastId).order("id", { ascending: true }).limit(1000);
    const ms = Date.now() - t;
    if (error) { console.log(`page ${i} (id > ${lastId}) : ERREUR ${error.message} apres ${ms} ms`); break; }
    const rows = data || []; total += rows.length; if (ms > pire) { pire = ms; pireId = lastId; }
    if (rows.length === 0) break;
    lastId = rows[rows.length - 1].id;
    if (ms > 2000) console.log(`page ${i} (id > ${lastId}) : ${ms} ms`);
  }
  console.log(`batch 4 : ${total} lignes, ${((Date.now() - t0) / 1000).toFixed(1)} s au total, pire page ${pire} ms (id > ${pireId}), dernier id ${lastId}`);
})();
