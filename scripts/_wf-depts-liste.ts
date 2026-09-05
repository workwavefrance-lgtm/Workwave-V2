import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data: depts, error } = await sb.from("departments").select("id, code, name, region").order("code");
  if (error) { console.log("ERREUR depts:", error.message); process.exit(1); }
  console.log(`${(depts||[]).length} departements en base`);
  for (const d of depts || []) console.log(`${String(d.code).padEnd(5)} ${String(d.name).padEnd(28)} ${d.region ?? ""}`);
  const { data: cats, error: e2 } = await sb.from("categories").select("id, slug, name, naf_codes, vertical").in("slug", ["plombier","electricien","macon"]);
  if (e2) { console.log("ERREUR cats:", e2.message); process.exit(1); }
  console.log("\ncategories:");
  for (const c of cats || []) console.log(JSON.stringify(c));
})();
