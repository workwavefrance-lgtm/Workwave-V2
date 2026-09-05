import { config } from "dotenv"; import path from "path";
import { createClient } from "@supabase/supabase-js";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
(async () => {
  const { data, error } = await sb.from("pros").select("slug,name,cover_url,claimed_by_user_id")
    .not("cover_url", "is", null).eq("is_active", true).is("deleted_at", null).limit(5000);
  if (error) return console.log("ERR", error.message);
  const rows = (data || []).filter((p: any) => (p.cover_url || "").startsWith("http"));
  const duPro = rows.filter((p: any) => p.cover_url.includes("/pro-photos/"));
  const google = rows.filter((p: any) => p.cover_url.includes("places.googleapis"));
  const autre = rows.filter((p: any) => !p.cover_url.includes("/pro-photos/") && !p.cover_url.includes("places.googleapis"));
  console.log(`fiches avec une couverture : ${rows.length}`);
  console.log(`  du pro (pro-photos)      : ${duPro.length}   dont reclamees : ${duPro.filter((p:any)=>p.claimed_by_user_id).length}`);
  console.log(`  Google Places            : ${google.length}`);
  console.log(`  autre origine            : ${autre.length}`);
  console.log("\nexemples du pro :");
  duPro.slice(0, 5).forEach((p: any) => console.log(`   ${p.slug}`));
  if (autre.length) { console.log("\nexemples autre origine :"); autre.slice(0,3).forEach((p:any)=>console.log(`   ${p.slug} -> ${p.cover_url.slice(0,70)}`)); }
})();
