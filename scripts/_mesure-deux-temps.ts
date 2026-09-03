import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data: cats } = await sb.from("categories").select("id").eq("vertical", "tech");
  const ai = (cats || []).map((c) => c.id);
  for (const after of [394442, 394442, 800000]) {
    let t = Date.now();
    const ids = await sb.from("pros").select("id").eq("is_active", true).is("deleted_at", null).not("category_id", "in", `(${ai.join(",")})`).gt("id", after).order("id").limit(1000);
    const t1 = Date.now() - t;
    if (ids.error) { console.log(`ids apres ${after} : ERREUR ${ids.error.message} (${t1} ms)`); continue; }
    const liste = (ids.data || []).map((r) => r.id);
    t = Date.now();
    const rows = await sb.from("pros").select("slug, updated_at, claimed_by_user_id, id").in("id", liste);
    console.log(`apres ${after} : etape 1 (ids seuls) ${t1} ms · etape 2 (${liste.length} lignes par id) ${Date.now() - t} ms ${rows.error ? "ERREUR " + rows.error.message : "ok " + (rows.data || []).length} · dernier id ${liste[liste.length - 1]}`);
  }
})();
