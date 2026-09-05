import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function main() {
  const c = async (label: string, q: any) => {
    const { count, error } = await q;
    console.log(`  ${label.padEnd(34)} : ${error ? "ERR "+error.message : count}`);
  };
  const P = () => sb.from("pros").select("id", { count: "exact", head: true }).eq("is_active", true).is("deleted_at", null);
  await c("TOUS les maçons (cat 3) France", P().eq("category_id", 3));
  await c("Maçons Aveyron (12)", P().eq("category_id", 3).like("postal_code", "12%"));
  await c("Maçons Vienne (86)", P().eq("category_id", 3).like("postal_code", "86%"));
  await c("TOUS pros actifs (référence)", P());
}
main().catch(e=>{console.error(e.message);process.exit(1);});
