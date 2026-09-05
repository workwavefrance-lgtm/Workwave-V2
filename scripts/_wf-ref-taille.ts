import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  let off = 0, n = 0; const t0 = Date.now();
  while (true) {
    const { data, error } = await sb.from("pros").select("id")
      .eq("category_id", 36).eq("is_active", true).is("deleted_at", null)
      .order("id").range(off, off + 999);
    if (error) { console.log("ERREUR:", error.message); return; }
    const r = data || []; if (r.length === 0) break;
    n += r.length; off += r.length;
    if (n > 400000) { console.log("cap 400k"); break; }
  }
  console.log(`pisciniste (36) actives = ${n} lignes, lues en ${((Date.now()-t0)/1000).toFixed(1)}s`);
})();
