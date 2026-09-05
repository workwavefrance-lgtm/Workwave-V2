import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb: any = getServiceClient();
const OUV = "etat_admin.is.null,etat_admin.neq.F";
async function compteDept(deptId: number): Promise<number | null> {
  for (let i = 0; i < 6; i++) {
    const { count, error } = await sb.from("pros")
      .select("id, city:cities!inner(department_id)", { count: "exact", head: true })
      .eq("is_active", true).is("deleted_at", null).or(OUV)
      .eq("cities.department_id", deptId);
    if (!error && count !== null) return count;
    await new Promise((r) => setTimeout(r, 4000));
  }
  return null;
}
(async () => {
  const codes = ["34","31","33","59","69","13","75","86"];
  const { data } = await sb.from("departments").select("id, code, name").in("code", codes);
  for (const d of (data || [])) {
    const n = await compteDept(d.id);
    console.log(`${d.code} ${d.name} : ${n === null ? "ECHEC" : n} fiches ouvertes EN BASE`);
  }
})();
