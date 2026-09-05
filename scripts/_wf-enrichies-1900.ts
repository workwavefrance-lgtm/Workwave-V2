import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  // Les 2 000 fiches passees par l'enrichissement annuaire (convention unite legale)
  let off = 0; const rows: any[] = [];
  while (true) {
    const { data, error } = await sb.from("pros").select("id, slug, founding_date, founded_year")
      .not("sirene_enrichi_at", "is", null).range(off, off + 999).abortSignal(AbortSignal.timeout(120_000));
    if (error) { console.log("ERREUR", error.message); break; }
    if (!data || data.length === 0) break;
    rows.push(...data); off += data.length;
  }
  console.log(`fiches enrichies (sirene_enrichi_at non vide) : ${rows.length}`);
  const avecDate = rows.filter(r => r.founding_date);
  console.log(`  avec founding_date : ${avecDate.length}`);
  console.log(`  founding_date = 1900-01-01 : ${rows.filter(r => String(r.founding_date).slice(0,10) === "1900-01-01").length}`);
  console.log(`  date au 1er janvier (approximation) : ${avecDate.filter(r => String(r.founding_date).slice(5,10) === "01-01").length}`);
  const annees = avecDate.filter(r => r.founded_year && Number(String(r.founding_date).slice(0,4)) !== r.founded_year).length;
  console.log(`  annee de founding_date differente de founded_year : ${annees}`);
})();
