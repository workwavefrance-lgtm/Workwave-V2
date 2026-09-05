import { config } from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
(async () => {
  const since = new Date(Date.now() - 60 * 864e5).toISOString();
  const { data } = await sb.from("events").select("event_name,metadata,session_id,created_at")
    .in("event_name", ["project_form_started", "project_step_reached", "project_form_submitted"])
    .gte("created_at", since).limit(20000);
  const rows = data || [];
  console.log(`${rows.length} evenements sur 60 jours\n`);
  console.log("--- exemple de metadata ---");
  rows.filter(r=>r.event_name==="project_step_reached").slice(0,3).forEach(r=>console.log("   ", JSON.stringify(r.metadata)));
  const parEtape: Record<string, Set<string>> = {};
  rows.forEach((r: any) => {
    const m = r.metadata || {};
    const et = String(m.step ?? m.etape ?? m.name ?? m.step_name ?? "?");
    const cle = r.event_name === "project_step_reached" ? `etape ${et}` : r.event_name;
    (parEtape[cle] ||= new Set()).add(r.session_id || r.created_at);
  });
  console.log("\n--- SESSIONS UNIQUES PAR ETAPE ---");
  Object.entries(parEtape).sort((a,b)=>b[1].size-a[1].size)
    .forEach(([k, v]) => console.log(`  ${String(v.size).padStart(5)}  ${k}`));
})();
