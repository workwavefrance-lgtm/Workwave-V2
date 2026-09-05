import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";

(async () => {
  const sb = getServiceClient();
  // Quels jours d'aout ? (les lots de sitemap heriteraient de ces dates)
  for (let d = 20; d <= 31; d++) {
    const a = `2026-08-${String(d).padStart(2, "0")}`;
    const b = `2026-08-${String(d + 1).padStart(2, "0")}`;
    const bb = d === 31 ? "2026-09-01" : b;
    const { count } = await sb.from("pros").select("id", { count: "exact", head: true })
      .eq("is_active", true).is("deleted_at", null)
      .gte("updated_at", a).lt("updated_at", bb)
      .abortSignal(AbortSignal.timeout(120000));
    console.log(`${a}  ${count}`);
  }
})();
