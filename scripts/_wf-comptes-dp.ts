import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function villes(deptId: number) { const ids: number[] = []; let o = 0;
  for (;;) { const { data } = await sb.from("cities").select("id").eq("department_id", deptId).range(o, o + 999);
    const r = data || []; if (!r.length) break; ids.push(...r.map((x: any) => x.id)); o += r.length; } return ids; }
async function compte(catId: number, ids: number[]) { let n = 0;
  for (let i = 0; i < ids.length; i += 400) { const lot = ids.slice(i, i + 400); let o = 0;
    for (;;) { const { data, error } = await sb.from("pros").select("id").eq("category_id", catId).in("city_id", lot)
        .eq("is_active", true).is("deleted_at", null).or("etat_admin.is.null,etat_admin.neq.F").order("id").range(o, o + 999);
      if (error) { await new Promise(r=>setTimeout(r,3000)); continue; }
      const r = data || []; if (!r.length) break; n += r.length; o += r.length; } } return n; }
(async () => {
  const { data: cats } = await sb.from("categories").select("id, slug").in("slug", ["menage", "garde-enfants", "demenagement"]);
  const { data: depts } = await sb.from("departments").select("id, code").in("code", ["75", "13", "69", "93"]);
  for (const c of cats || []) for (const d of depts || []) {
    const n = await compte(c.id, await villes(d.id));
    console.log(`${String(c.slug).padEnd(15)} dept ${d.code} : ${n}`);
  }
})();
