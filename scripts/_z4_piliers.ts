import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const PAGE = 1000;
async function nbVilles(metier: string) {
  let offset = 0, total = 0;
  while (true) {
    const { data, error } = await sb.from("listing_cat_ville").select("ville").eq("metier", metier).range(offset, offset + PAGE - 1);
    if (error) throw new Error(error.message);
    const rows = data || [];
    if (rows.length === 0) break;
    total += rows.length; offset += rows.length;
  }
  return total;
}
async function main() {
  for (const m of ["serrurier", "chauffagiste", "climaticien", "ramoneur", "menage"]) {
    console.log(m, "villes >=3 artisans ouverts =", await nbVilles(m));
  }
}
main();
