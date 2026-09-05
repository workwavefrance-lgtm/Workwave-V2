import { config } from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function main() {
  const { data: cats } = await sb.from("categories").select("id").in("vertical", ["domicile", "personne"]);
  const catIds = (cats || []).map(c => c.id);
  const { count } = await sb.from("pros").select("id", { count: "exact", head: true })
    .in("category_id", catIds).eq("is_active", true).is("deleted_at", null)
    .like("postal_code", "63%");
  console.log(`Puy-de-Dôme (63) domicile+personne en base : ${count}`);
}
main();
