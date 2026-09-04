import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data } = await sb.from("projects")
    .select("id, created_at, status, broadcast_count, broadcasted_at, suspicion_score, urgency, budget, description, categories(name, slug), cities(name, latitude, longitude, departments(name, code))")
    .gte("created_at", new Date(Date.now() - 3 * 86400e3).toISOString())
    .order("created_at", { ascending: false });
  for (const p of (data || []) as any[]) {
    console.log(`#${p.id} ${p.created_at.slice(0,16)} ${p.categories?.name} a ${p.cities?.name} (${p.cities?.departments?.code}) · statut ${p.status} · diffuse a ${p.broadcast_count ?? 0} pros · suspicion ${p.suspicion_score}`);
    console.log(`   ${(p.description || "").slice(0, 150)}`);
    if (p.status !== "deleted" && p.cities?.latitude) {
      const { data: pros } = await sb.from("pros").select("id, name, email, phone, claimed_by_user_id, cities(name, latitude, longitude)")
        .eq("category_id", (p as any).category_id ?? -1).eq("is_active", true).is("deleted_at", null).limit(1);
      void pros;
    }
  }
})();
