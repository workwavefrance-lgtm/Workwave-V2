import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";

const AI = [43,44,45,46,47,48,79,80,81,82,83,85,86,87];

async function n(label: string, build: (q: any) => any) {
  const sb = getServiceClient();
  let q = sb.from("pros").select("id", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null);
  q = build(q);
  const { count, error } = await q;
  console.log(label, error ? "ERR " + error.message : count);
  return count as number | null;
}

(async () => {
  const notTech = (q: any) => q.not("category_id", "in", `(${AI.join(",")})`);
  await n("TOTAL actif             :", (q) => q);
  await n("TOTAL non-tech (BTP)    :", notTech);
  await n("TOTAL tech              :", (q) => q.in("category_id", AI));
  await n("FERMES total            :", (q) => q.eq("etat_admin", "F"));
  await n("FERMES non-tech         :", (q) => notTech(q).eq("etat_admin", "F"));
  await n("FERMES tech             :", (q) => q.in("category_id", AI).eq("etat_admin", "F"));
  await n("etat_admin NULL total   :", (q) => q.is("etat_admin", null));
  await n("OUVERTS (A) total       :", (q) => q.eq("etat_admin", "A"));
})();
