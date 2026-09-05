import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

async function dates(catId: number, cp: string, label: string) {
  const PAGE = 1000; let offset = 0; const buckets: Record<string, number> = {};
  while (true) {
    const { data, error } = await sb.from("pros").select("created_at")
      .eq("category_id", catId).eq("is_active", true).is("deleted_at", null)
      .like("postal_code", cp + "%").range(offset, offset + PAGE - 1);
    if (error) { console.log("ERR", error.message); return; }
    const rows = data || [];
    if (rows.length === 0) break;
    for (const r of rows) { const m = (r.created_at || "").slice(0, 7); buckets[m] = (buckets[m] || 0) + 1; }
    offset += rows.length;
  }
  const s = Object.entries(buckets).sort().map(([k, v]) => `${k}:${v}`).join("  ");
  console.log(`${label} -> ${s}`);
}
(async () => {
  await dates(1, "75", "plombier Paris   ");
  await dates(1, "13", "plombier BdR     ");
  await dates(2, "13", "electricien BdR  ");
  await dates(2, "75", "electricien Paris");
  await dates(1, "23", "plombier Creuse  ");
})();
