import { config } from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // récupérer les ids tech comme le fait le sitemap
  const { data: cats } = await sb.from("categories").select("id").eq("vertical", "tech");
  const aiIds = (cats || []).map(c => c.id);
  console.log(`cat tech : ${aiIds.length} ids`);

  for (const skip of [450000, 900000, 1125000, 1350000, 1755000]) {
    const t0 = Date.now();
    const { data, error } = await sb
      .from("pros")
      .select("id")
      .eq("is_active", true)
      .is("deleted_at", null)
      .not("category_id", "in", `(${aiIds.join(",")})`)
      .order("id", { ascending: true })
      .range(skip - 1, skip - 1);
    const ms = Date.now() - t0;
    if (error) console.log(`skip ${skip} : ❌ ERREUR ${ms}ms : ${error.message}`);
    else console.log(`skip ${skip} : id=${(data as {id:number}[])?.[0]?.id ?? "AUCUN"} en ${ms}ms`);
  }
}
main();
