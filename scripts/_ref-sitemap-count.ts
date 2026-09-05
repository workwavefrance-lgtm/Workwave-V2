import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { AI_CATEGORY_IDS } from "../lib/ai/helpers";

async function main() {
  const sb = getServiceClient();
  const aiIds = [...AI_CATEGORY_IDS];
  const aiInList = `(${aiIds.join(",")})`;

  for (const [nom, req] of [
    ["non tech (NOT IN)", () => sb.from("pros").select("id", { count: "exact", head: true })
      .eq("is_active", true).is("deleted_at", null).not("category_id", "in", aiInList)],
    ["tech (IN)", () => sb.from("pros").select("id", { count: "exact", head: true })
      .eq("is_active", true).is("deleted_at", null).in("category_id", aiIds)],
  ] as const) {
    const t0 = Date.now();
    try {
      const { count, error } = await (req as any)();
      console.log(`${nom}: count=${count} erreur=${error ? error.message : "aucune"} duree=${((Date.now()-t0)/1000).toFixed(1)}s`);
    } catch (e: any) {
      console.log(`${nom}: EXCEPTION ${e.message} duree=${((Date.now()-t0)/1000).toFixed(1)}s`);
    }
  }
}
main();
