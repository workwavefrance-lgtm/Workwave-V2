import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data, error } = await sb
    .from("pros")
    .select("id, name, avatar_url, logo_url, photos, avatar_color, theme_color")
    .eq("id", 1432477)
    .maybeSingle();
  console.log("error:", error);
  console.log("data:", data);
}
main();
