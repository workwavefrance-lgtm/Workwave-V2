import { config } from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data, error } = await sb.from("pros")
    .select("id, slug, name, siret, email, phone, website, is_active, deleted_at, claimed_by_user_id, do_not_contact, category_id, categories(slug, name), cities(name, slug)")
    .eq("siret", "91339111600013");
  if (error) throw error;
  console.log(JSON.stringify(data, null, 2));
}
main();
