import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const AI = [43,44,45,46,47,48,79,80,81,82,83,85,86,87];
async function main() {
  const sb = getServiceClient();
  for (const etat of ["A","F"]) {
    const { count, error } = await sb.from("pros").select("id", { count: "exact", head: true })
      .eq("is_active", true).is("deleted_at", null).eq("etat_admin", etat)
      .not("category_id", "in", `(${AI.join(",")})`);
    console.log(`NON-TECH etat=${etat} : ${count} ${error ? "ERR " + error.message : ""}`);
  }
  for (const etat of ["A","F"]) {
    const { count, error } = await sb.from("pros").select("id", { count: "exact", head: true })
      .eq("is_active", true).is("deleted_at", null).eq("etat_admin", etat)
      .in("category_id", AI);
    console.log(`TECH     etat=${etat} : ${count} ${error ? "ERR " + error.message : ""}`);
  }
  const { count: nul } = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null).is("etat_admin", null);
  console.log(`etat_admin NULL (toutes verticales) : ${nul}`);
}
main();
