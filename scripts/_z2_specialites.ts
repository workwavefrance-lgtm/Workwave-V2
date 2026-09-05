import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { SPECIALTIES } from "../lib/specialties";

const sb = getServiceClient();
const PAGE = 1000;

async function villesDuMetier(metier: string): Promise<number> {
  let offset = 0, total = 0;
  while (true) {
    const { data, error } = await sb
      .from("listing_cat_ville")
      .select("ville")
      .eq("metier", metier)
      .range(offset, offset + PAGE - 1);
    if (error) throw new Error(metier + " : " + error.message);
    const rows = data || [];
    if (rows.length === 0) break;
    total += rows.length;
    offset += rows.length;
  }
  return total;
}

async function main() {
  const metiers = Object.keys(SPECIALTIES);
  let universTotal = 0;
  for (const m of metiers) {
    const nbVilles = await villesDuMetier(m);
    const nbSpec = SPECIALTIES[m].length;
    const combos = nbVilles * nbSpec;
    universTotal += combos;
    console.log(`${m.padEnd(14)} specialites=${String(nbSpec).padStart(2)} villes>=3=${String(nbVilles).padStart(6)} pages=${String(combos).padStart(7)}`);
  }
  console.log("UNIVERS TOTAL (villes >=3 artisans ouverts) =", universTotal);

  // Combien de villes dans le top 100 par population (ce que le sitemap utilise)
  const { data: top } = await sb.from("cities").select("slug,population").order("population", { ascending: false, nullsFirst: false }).limit(100);
  console.log("100e ville par population :", top?.[99]);
}
main();
