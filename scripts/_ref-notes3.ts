import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main() {
  const { data } = await sb.from("pros")
    .select("slug,name,google_rating,google_reviews_count,category:categories(slug),city:cities(slug,name)")
    .is("deleted_at", null).eq("is_active", true)
    .not("google_rating", "is", null)
    .or("etat_admin.is.null,etat_admin.neq.F")
    .gte("google_reviews_count", 10)
    .order("google_reviews_count", { ascending: false })
    .limit(12);
  for (const p of (data ?? []) as any[]) {
    console.log(`/${p.category?.slug}/${p.city?.slug}`.padEnd(42),
      `note ${p.google_rating} (${p.google_reviews_count} avis)`.padEnd(24), "/artisan/" + p.slug);
  }
}
main().catch(e=>console.error(e.message));
