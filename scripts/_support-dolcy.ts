import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
(async () => {
  const { data: ca } = await sb.from("claim_attempts").select("siret, email, success, created_at").ilike("email", "%dolcyservice%").order("created_at", { ascending: false }).limit(5);
  console.log("--- claim_attempts ---"); for (const c of ca || []) console.log(JSON.stringify(c));
  const sirets = [...new Set((ca || []).map((c) => c.siret))];
  const { data: pros } = await sb.from("pros")
    .select("id, name, slug, email, siret, category_id, categories(slug), secondary_category_ids, enabled_category_ids, intervention_radius_km, claimed_at, claimed_by_user_id, cities(id, name, latitude, longitude), is_active, deleted_at, paused_until")
    .or(`name.ilike.AMPION AMPION%,siret.in.(${sirets.join(",") || "0"})`).limit(5);
  console.log("--- fiches ---"); for (const p of pros || []) console.log(JSON.stringify(p));
  const ids = (pros || []).map((p) => p.id);
  const { data: leads } = await sb.from("project_leads").select("pro_id, project_id, sent_at, status, projects(category_id, categories(slug), cities(name), created_at)").in("pro_id", ids).order("sent_at", { ascending: false }).limit(10);
  console.log("--- project_leads ---"); for (const l of leads || []) console.log(JSON.stringify(l));
  const { data: ev } = await sb.from("events").select("name, created_at, metadata").in("pro_id", ids).order("created_at", { ascending: false }).limit(10);
  console.log("--- events ---"); for (const e of ev || []) console.log(JSON.stringify(e));
})();
