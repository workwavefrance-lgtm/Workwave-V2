import { config } from "dotenv"; import path from "path";
import { createClient } from "@supabase/supabase-js";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
(async () => {
  const { data } = await sb.from("projects")
    .select("id,created_at,category_id,city_id,broadcast_count,status,budget,urgency,categories(name)")
    .ilike("description","TEST TECHNIQUE WORKWAVE%").order("id");
  console.log(`projets de test trouves : ${(data||[]).length}\n`);
  for (const p of (data||[])) {
    const { data: leads } = await sb.from("project_leads").select("pro_id").eq("project_id", p.id);
    console.log(`#${p.id} ${(p as any).categories?.name?.padEnd(14)} | broadcast=${p.broadcast_count ?? 0} | leads=${(leads||[]).length} | statut=${p.status} | budget=${p.budget}`);
  }
})();
