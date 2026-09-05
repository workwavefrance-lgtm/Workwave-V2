import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

async function c(label: string, build: (q: any) => any) {
  const q = build(sb.from("pros").select("id", { count: "exact", head: true }));
  const { count, error } = await q;
  console.log(label, "=>", error ? "ERREUR " + error.message : count);
}

(async () => {
  await c("pros total lignes", (q: any) => q);
  await c("pros is_active=true, deleted_at null", (q: any) => q.eq("is_active", true).is("deleted_at", null));
  await c("  + etat_admin <> F", (q: any) => q.eq("is_active", true).is("deleted_at", null).neq("etat_admin", "F"));
  await c("  + etat_admin = F", (q: any) => q.eq("is_active", true).is("deleted_at", null).eq("etat_admin", "F"));
  await c("  + etat_admin null", (q: any) => q.eq("is_active", true).is("deleted_at", null).is("etat_admin", null));

  const { count: nbCities, error: e2 } = await sb.from("cities").select("id", { count: "exact", head: true });
  console.log("cities =>", e2 ? "ERREUR " + e2.message : nbCities);
  const { count: nbDept, error: e3 } = await sb.from("departments").select("id", { count: "exact", head: true });
  console.log("departments =>", e3 ? "ERREUR " + e3.message : nbDept);
  const { count: nbCat, error: e4 } = await sb.from("categories").select("id", { count: "exact", head: true });
  console.log("categories =>", e4 ? "ERREUR " + e4.message : nbCat);
})();
