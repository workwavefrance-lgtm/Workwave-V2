import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

async function main() {
  // reproduit EXACTEMENT la requete du scraper du 05/09
  for (let essai = 1; essai <= 5; essai++) {
    const { data, error } = await sb
      .from("categories")
      .select("id, slug, name, naf_codes, vertical")
      .eq("vertical", "btp");
    if (error) { console.error("ERREUR", error); process.exit(1); }
    const cats = data || [];
    console.log(`essai ${essai} (${cats.length} cat) :`, cats.map(c => `${c.id}`).join(","));
  }

  // ordre complet des 202 sans filtre : ou diverge-t-il des id ?
  const { data: all } = await sb.from("categories").select("id, slug, vertical");
  const ids = (all || []).map(c => c.id);
  for (let i = 1; i < ids.length; i++) {
    if (ids[i] < ids[i-1]) {
      console.log(`\ndivergence a l'index ${i} : ...${ids[i-3]},${ids[i-2]},${ids[i-1]} puis ${ids[i]},${ids[i+1]},${ids[i+2]}`);
      break;
    }
  }
}
main();
