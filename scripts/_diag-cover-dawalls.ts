import { config } from "dotenv"; import path from "path";
import { createClient } from "@supabase/supabase-js";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
(async () => {
  const { data } = await sb.from("pros").select("slug,cover_url").eq("slug", "dawalls-00015").maybeSingle();
  console.log("cover_url :", data?.cover_url ? String(data.cover_url).slice(0, 90) : "(vide)");
})();
