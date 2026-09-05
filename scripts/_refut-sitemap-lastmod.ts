import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";

(async () => {
  const sb = getServiceClient();
  // Distribution de updated_at : le lastmod "reel" propose par l'audit en depend.
  const bornes = [
    ["avant 2026-08-01", null, "2026-08-01"],
    ["aout 01-31", "2026-08-01", "2026-09-01"],
    ["2026-09-01", "2026-09-01", "2026-09-02"],
    ["2026-09-02", "2026-09-02", "2026-09-03"],
    ["2026-09-03", "2026-09-03", "2026-09-04"],
    ["2026-09-04", "2026-09-04", "2026-09-05"],
  ] as const;
  for (const [label, a, b] of bornes) {
    const t0 = Date.now();
    let q = sb.from("pros").select("id", { count: "exact", head: true })
      .eq("is_active", true).is("deleted_at", null);
    if (a) q = q.gte("updated_at", a);
    if (b) q = q.lt("updated_at", b);
    const { count, error } = await q.abortSignal(AbortSignal.timeout(120000));
    console.log(`${label.padEnd(18)} count=${count ?? "ERREUR:" + error?.message} (${Date.now() - t0} ms)`);
  }
})();
