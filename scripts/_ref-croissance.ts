import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { AI_CATEGORY_IDS } from "../lib/ai/helpers";

async function main() {
  const sb = getServiceClient();
  const aiInList = `(${[...AI_CATEGORY_IDS].join(",")})`;
  const mois = ["2026-04","2026-05","2026-06","2026-07","2026-08","2026-09"];
  console.log("Fiches NON TECH creees par mois (celles qui remplissent 100..147) :");
  for (let i = 0; i < mois.length; i++) {
    const debut = `${mois[i]}-01`;
    const fin = i + 1 < mois.length ? `${mois[i+1]}-01` : "2026-10-01";
    const { count, error } = await sb.from("pros").select("id", { count: "exact", head: true })
      .eq("is_active", true).is("deleted_at", null)
      .not("category_id", "in", aiInList)
      .gte("created_at", debut).lt("created_at", fin);
    console.log(`  ${mois[i]} : ${error ? "ERREUR " + error.message : count}`);
  }
  const { count: total } = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null).not("category_id", "in", aiInList);
  console.log(`\nTotal non tech actuel : ${total}`);
  console.log(`Plafond a 48 fichiers : ${48*45000} -> marge = ${48*45000 - (total||0)} fiches`);
  console.log(`Plafond a 45 fichiers : ${45*45000} -> marge = ${45*45000 - (total||0)} fiches`);
}
main();
