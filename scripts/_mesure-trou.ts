import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data: cats } = await sb.from("categories").select("id").eq("vertical", "tech");
  const ai = new Set((cats || []).map((c) => c.id));
  // Les 3000 lignes suivantes par id, sans filtre : que sont-elles ?
  const { data } = await sb.from("pros").select("id, is_active, deleted_at, category_id").gt("id", 394442).order("id").limit(3000);
  const rows = data || [];
  const c = { actives_non_tech: 0, tech: 0, inactives: 0, supprimees: 0 };
  for (const r of rows) { if (!r.is_active) c.inactives++; else if (r.deleted_at) c.supprimees++; else if (ai.has(r.category_id)) c.tech++; else c.actives_non_tech++; }
  console.log(`ids ${rows[0]?.id} -> ${rows[rows.length - 1]?.id} (3000 lignes brutes) :`, c);
})();
(async () => {
  const { data } = await sb.from("pros").select("id").gt("id", 394442).order("id").limit(3000);
  const ids = (data || []).map((r) => r.id);
  console.log(`distincts : ${new Set(ids).size} sur ${ids.length} · min ${Math.min(...ids)} max ${Math.max(...ids)}`);
  const { count } = await sb.from("pros").select("id", { count: "exact", head: true }).gt("id", 394442).lt("id", 1400000).eq("is_active", true).is("deleted_at", null);
  console.log(`lignes actives entre 394442 et 1 400 000 : ${count}`);
})();
