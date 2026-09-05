import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  for (let i = 0; i < 3; i++) {
    const { count, error } = await sb.from("pros").select("id", { count: "exact", head: true })
      .eq("is_active", true).is("deleted_at", null);
    console.log("essai", i + 1, "actifs =>", error ? "ERREUR [" + error.message + "] code=" + error.code : count);
    if (!error) break;
  }
  // repartition etat_admin sur les actifs
  for (const v of ["A", "F"]) {
    const { count, error } = await sb.from("pros").select("id", { count: "exact", head: true })
      .eq("is_active", true).is("deleted_at", null).eq("etat_admin", v);
    console.log("actifs etat_admin=" + v, "=>", error ? "ERREUR " + error.message : count);
  }
  const { count: cN, error: eN } = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null).is("etat_admin", null);
  console.log("actifs etat_admin NULL =>", eN ? "ERREUR " + eN.message : cN);
})();
