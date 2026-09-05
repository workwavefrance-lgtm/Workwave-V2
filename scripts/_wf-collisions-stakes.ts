import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

const IMPLIQUEES = [2,39,4,37,5,41,11,10,36,12,13,38,199];

async function main() {
  const { data: cats } = await sb.from("categories")
    .select("id, slug, naf_codes, vertical").in("id", IMPLIQUEES);
  for (const c of (cats||[])) {
    // compte total de fiches
    const { count, error } = await sb.from("pros")
      .select("id", { count: "exact", head: true }).eq("category_id", c.id);
    if (error || count === null) { console.log(`${c.slug} (${c.id}) : COMPTAGE EN ERREUR`, error?.message); continue; }
    console.log(`${c.slug.padEnd(30)} id=${String(c.id).padEnd(4)} naf=[${(c.naf_codes||[]).join(",")}]  fiches=${count}`);
  }
}
main();
