import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";

const AI = [43,44,45,46,47,48,79,80,81,82,83,85,86,87];

async function main() {
  const sb = getServiceClient();
  // Population EXACTE du sitemap /artisan/ : active, non supprimee, non tech
  for (const [label, filtre] of [
    ["TOTAL fiches du sitemap /artisan/", null],
    ["dont FERMEES (etat_admin='F')", "F"],
    ["dont OUVERTES (etat_admin='A')", "A"],
  ] as [string, string | null][]) {
    let q = sb.from("pros").select("id", { count: "exact", head: true })
      .eq("is_active", true).is("deleted_at", null)
      .not("category_id", "in", `(${AI.join(",")})`);
    if (filtre) q = q.eq("etat_admin", filtre);
    const { count, error } = await q.abortSignal(AbortSignal.timeout(180000));
    console.log(`${label} : ${error ? "ERREUR " + error.message : count}`);
  }
}
main();
