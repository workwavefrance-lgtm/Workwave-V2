import * as path from "path"; import * as dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const { data } = await sb.from("categories").select("slug,vertical").in("vertical", ["btp","domicile","personne"]);
  console.log("categories BTP/domicile/personne =", (data||[]).length);
  const { data: g } = await sb.from("price_guides").select("slug,scope,metier_slug");
  const rows = g || [];
  const byScope: Record<string, number> = {};
  for (const r of rows as any[]) byScope[r.scope || "null"] = (byScope[r.scope || "null"] || 0) + 1;
  console.log("price_guides par scope :", JSON.stringify(byScope));
})();
