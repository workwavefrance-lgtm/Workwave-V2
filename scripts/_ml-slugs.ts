import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";

async function main() {
  const sb = getServiceClient();
  const ids: number[] = [];
  for (let i = 0; i < 60; i++) ids.push(Math.floor(Math.random() * 2_450_000) + 1);
  const { data, error } = await sb
    .from("pros")
    .select("id, slug, name, etat_admin, categories(slug,name,vertical), cities(name,slug,department_id, departments(code,name))")
    .in("id", ids)
    .eq("is_active", true)
    .is("deleted_at", null)
    .limit(20);
  if (error) console.error("err pros", error.message);
  for (const p of (data || []).slice(0, 12)) {
    const c: any = p.categories, v: any = p.cities;
    console.log([p.id, p.slug, p.etat_admin, c?.slug, c?.vertical, v?.slug, v?.departments?.code].join(" | "));
  }
}
main();
