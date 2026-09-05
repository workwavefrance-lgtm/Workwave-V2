import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const q = (f: (x: any) => any) => f(sb.from("pros").select("id", { count: "exact", head: true }));
  const base = () => sb.from("pros").select("id", { count: "exact", head: true }).eq("is_active", true).is("deleted_at", null);
  const { count: actifs } = await base();
  const { count: ouverts } = await base().neq("etat_admin", "F");
  const { count: rge } = await base().eq("rge_certified", true);
  const { count: rgeOuv } = await base().neq("etat_admin", "F").eq("rge_certified", true);
  console.log("pros actifs        :", actifs);
  console.log("pros OUVERTS       :", ouverts);
  console.log("rge_certified=true (actifs) :", rge, "->", ((rge! / actifs!) * 100).toFixed(2), "% des actifs");
  console.log("rge_certified=true (ouverts):", rgeOuv, "->", ((rgeOuv! / ouverts!) * 100).toFixed(2), "% des ouverts");
})();
