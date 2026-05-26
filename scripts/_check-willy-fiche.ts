import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data } = await sb
    .from("pros")
    .select("id, slug, name, claimed_by_user_id, claimed_at, category_id, source, is_active, deleted_at, email")
    .ilike("slug", "%willy-gauvrit%")
    .order("id", { ascending: false });
  console.log("Fiches willy-gauvrit:");
  console.table(data);
}
main();
