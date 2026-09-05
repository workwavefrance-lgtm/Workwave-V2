import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function main() {
  const base = () => sb.from("pros").select("id", { count: "exact", head: true })
    .eq("category_id", 3).eq("is_active", true).is("deleted_at", null).like("postal_code", "12%");
  const { count: total } = await base();
  const { count: withEmail } = await base().not("email", "is", null).neq("email", "");
  const { count: withPhone } = await base().not("phone", "is", null).neq("phone", "");
  console.log(`MAÇONS en Aveyron (12) dans notre base :`);
  console.log(`  Total                : ${total}`);
  console.log(`  Avec un EMAIL        : ${withEmail}`);
  console.log(`  Avec un TÉLÉPHONE    : ${withPhone}`);
  // Comparaison : Vienne (86) où on a enrichi via Apify
  const base86 = () => sb.from("pros").select("id", { count: "exact", head: true })
    .eq("category_id", 3).eq("is_active", true).is("deleted_at", null).like("postal_code", "86%");
  const { count: t86 } = await base86();
  const { count: e86 } = await base86().not("email", "is", null).neq("email", "");
  console.log(`\nComparaison Vienne (86, enrichie Apify) : ${t86} maçons, dont ${e86} avec email.`);
}
main().catch(e=>{console.error(e.message);process.exit(1);});
