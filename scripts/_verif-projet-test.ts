import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data } = await sb.from("projects").select("id, created_at, status, broadcast_count, broadcasted_at, admin_notified_at, admin_notification_error, suspicion_score, email, description").ilike("description", "TEST TECHNIQUE WORKWAVE%").order("created_at", { ascending: false }).limit(2);
  for (const p of data || []) console.log(JSON.stringify({ ...p, description: p.description.slice(0, 40) }));
  const test = (data || [])[0];
  if (test && test.status !== "deleted") {
    const { error, count } = await sb.from("projects").update({ status: "deleted" }, { count: "exact" }).eq("id", test.id).ilike("description", "TEST TECHNIQUE WORKWAVE%");
    console.log(error ? "suppression ERREUR " + error.message : `projet test #${test.id} passe en deleted (${count} ligne)`);
  }
})();
