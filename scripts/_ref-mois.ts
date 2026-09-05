import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  for (const [a, b] of [["2026-04-01", "2026-05-01"], ["2026-05-01", "2026-06-01"], ["2026-06-01", "2026-07-01"], ["2026-07-01", "2026-08-01"], ["2026-08-01", "2026-09-01"]]) {
    const { count, error } = await sb.from("pros").select("id", { count: "exact", head: true })
      .eq("is_active", true).is("deleted_at", null)
      .gte("created_at", a + "T00:00:00Z").lt("created_at", b + "T00:00:00Z");
    console.log(`${a} -> ${b} : ${error ? "ERR " + error.message : count}`);
  }
})();
