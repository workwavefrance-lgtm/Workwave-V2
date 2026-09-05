import { config } from "dotenv"; import path from "path";
import { createClient } from "@supabase/supabase-js";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
(async () => {
  const { count } = await sb.from("pros").select("*", { count: "exact", head: true })
    .not("cover_url", "is", null).eq("is_active", true).is("deleted_at", null);
  console.log("fiches avec une couverture :", count);
  const { data } = await sb.from("pros").select("slug,cover_url,claimed_by_user_id")
    .not("cover_url", "is", null).eq("is_active", true).is("deleted_at", null).limit(200);
  const r = data || [];
  const pro = r.filter((p: any) => String(p.cover_url).includes("/pro-photos/"));
  console.log("  dont stockees chez nous  :", pro.length, "/", r.length);
  console.log("  dont fiches reclamees    :", r.filter((p: any) => p.claimed_by_user_id).length, "/", r.length);
})();
