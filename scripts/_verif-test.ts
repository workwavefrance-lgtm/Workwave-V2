import { config } from "dotenv"; import path from "path";
import { createClient } from "@supabase/supabase-js";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
(async () => {
  const { data } = await sb.from("projects").select("*").ilike("description","%TEST TECHNIQUE WORKWAVE%").order("id",{ascending:false});
  for (const p of (data||[])) {
    console.log(`projet #${p.id} | ${p.created_at} | statut=${p.status} | budget=${p.budget} | urgence=${p.urgency}`);
    console.log(`   broadcast_count = ${p.broadcast_count} | suspicion=${p.suspicion_score ?? "-"}`);
    const { data: leads } = await sb.from("project_leads").select("pro_id,status").eq("project_id", p.id);
    console.log(`   project_leads : ${(leads||[]).length}`, (leads||[]).map((l:any)=>l.pro_id).join(", ") || "(aucun)");
    const { data: ev } = await sb.from("events").select("id").eq("project_id", p.id);
    const { data: un } = await sb.from("lead_unlocks").select("id").eq("project_id", p.id);
    console.log(`   events : ${(ev||[]).length} | lead_unlocks : ${(un||[]).length}`);
  }
  if (!data?.length) console.log("aucun projet test trouve");
})();
