import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

const CATS: Record<string, number> = { plombier: 1, electricien: 2, macon: 3, peintre: 4, menuisier: 5 };
const DEPTS = ["75", "69", "13", "59", "33", "31", "06", "44", "23", "86"];

async function cnt(catId: number, cp: string, extra?: (q: any) => any) {
  let q = sb.from("pros").select("id", { count: "exact", head: true })
    .eq("category_id", catId).eq("is_active", true).is("deleted_at", null)
    .like("postal_code", cp + "%");
  if (extra) q = extra(q);
  const { count, error } = await q;
  if (error) return "ERR:" + error.message;
  return count;
}

async function main() {
  for (const [slug, id] of Object.entries(CATS)) {
    if (slug !== "plombier" && slug !== "electricien") continue;
    for (const d of DEPTS) {
      const tot = await cnt(id, d);
      const ouv = await cnt(id, d, (q) => q.neq("etat_admin", "F"));
      const ferm = await cnt(id, d, (q) => q.eq("etat_admin", "F"));
      console.log(`${slug.padEnd(12)} dept ${d}  total=${tot}  ouverts=${ouv}  fermes=${ferm}`);
    }
    console.log("");
  }
}
main();
