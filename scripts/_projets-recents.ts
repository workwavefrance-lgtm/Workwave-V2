import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const depuis = new Date(Date.now() - 21 * 86400e3).toISOString();
  const { data, error } = await sb.from("projects").select("id, created_at, status, broadcast_count, broadcasted_at, category_id, city_id, suspicion_score").gte("created_at", depuis).order("created_at", { ascending: false });
  if (error) { console.error(error.message); return; }
  const parJour: Record<string, number> = {};
  for (const p of data || []) { const j = p.created_at.slice(0, 10); parJour[j] = (parJour[j] || 0) + 1; }
  console.log("projets deposes par jour (21 j) :", JSON.stringify(parJour));
  console.log("derniers :"); for (const p of (data || []).slice(0, 6)) console.log(`  #${p.id} ${p.created_at.slice(0, 16)} statut=${p.status} broadcast=${p.broadcast_count} suspicion=${p.suspicion_score}`);
})();
