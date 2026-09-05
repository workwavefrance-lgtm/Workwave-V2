import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  // Récupère un pro pour voir ses colonnes
  const { data } = await sb.from("pros").select("id, name, category_id, secondary_category_ids, description, phone, email, website, city_id, is_active").limit(1);
  console.log("Sample row :", data?.[0]);
}
main();
