import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

(async () => {
  const { data, error } = await sb
    .from("categories")
    .select("id, slug, name, naf_codes, vertical")
    .in("vertical", ["domicile", "personne", "btp"])
    .order("vertical")
    .order("id");
  if (error) { console.error("ERREUR", error); process.exit(1); }
  for (const c of data || []) {
    console.log(`${c.vertical}\t${c.id}\t${c.slug}\t${JSON.stringify(c.naf_codes)}\t${c.name}`);
  }
  console.log("TOTAL", (data||[]).length);
})();
