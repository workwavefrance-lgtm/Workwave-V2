import * as dotenv from "dotenv"; import path from "path";
import { createClient } from "@supabase/supabase-js";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
  // Dept 86 (Vienne, notre dept le plus scrapé) : par métier
  const { data: d86 } = await sb.from("prospects").select("category_slug, name, phone").eq("department_code", "86");
  const byCat: Record<string, number> = {};
  (d86 || []).forEach((r: any) => { byCat[r.category_slug] = (byCat[r.category_slug]||0)+1; });
  console.log("Prospects dept 86 par métier :", JSON.stringify(byCat));
  // Top 5 départements par volume de prospects (= nos nouvelles régions, peu d'overlap)
  const { data: all } = await sb.from("prospects").select("department_code");
  const byDept: Record<string, number> = {};
  (all || []).forEach((r: any) => { byDept[r.department_code] = (byDept[r.department_code]||0)+1; });
  const top = Object.entries(byDept).sort((a,b)=>b[1]-a[1]).slice(0,8);
  console.log("\nTop départements (volume prospects) :");
  top.forEach(([d,n]) => console.log(`  dept ${d} : ${n}`));
})();
