import * as dotenv from "dotenv"; import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
async function main() {
  const sb = getServiceClient();
  const a = await sb.from("pros").select("slug, name, logo_url, category_id, city_id, etat_admin")
    .eq("is_active", true).is("deleted_at", null).not("logo_url", "is", null).limit(40);
  for (const r of (a.data ?? []).slice(0, 12)) {
    const c = await sb.from("categories").select("slug").eq("id", r.category_id as number).single();
    const v = await sb.from("cities").select("slug, name").eq("id", r.city_id as number).single();
    console.log(`/${c.data?.slug}/${v.data?.slug}  <- ${r.name} (etat=${r.etat_admin ?? "null"})  fiche=/artisan/${r.slug}`);
  }
}
main().catch((e) => { console.error(e.message); process.exit(1); });
