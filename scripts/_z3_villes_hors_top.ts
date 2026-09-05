import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main() {
  const { data: top } = await sb.from("cities").select("slug").order("population", { ascending: false, nullsFirst: false }).limit(100);
  const topSet = new Set((top || []).map((c: any) => c.slug));
  // villes menuisier hors top100
  let offset = 0; const hors: string[] = [];
  while (hors.length < 5) {
    const { data } = await sb.from("listing_cat_ville").select("ville,n").eq("metier", "menuisier").order("n", { ascending: false }).range(offset, offset + 999);
    const rows = (data || []) as any[];
    if (rows.length === 0) break;
    for (const r of rows) if (!topSet.has(r.ville) && hors.length < 5) hors.push(`${r.ville} (${r.n})`);
    offset += rows.length;
  }
  console.log("villes menuisier >=3 hors top100 :", hors);
}
main();
