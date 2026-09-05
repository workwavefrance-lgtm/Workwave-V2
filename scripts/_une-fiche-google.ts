import { config } from "dotenv"; import path from "path";
import { createClient } from "@supabase/supabase-js";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const url = (p: any) => (typeof p === "string" ? p : p?.url || "");
(async () => {
  const { data } = await sb.from("pros").select("slug,name,photos")
    .neq("photos", "[]").eq("is_active", true).is("deleted_at", null).limit(5000);
  const google = (data || []).find((p: any) =>
    Array.isArray(p.photos) && p.photos.length >= 3 &&
    p.photos.map(url).every((u: string) => !u.includes("/pro-photos/")));
  console.log(google ? `${google.slug} (${(google as any).photos.length} photos Google)` : "aucune");
})();
