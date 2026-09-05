import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main() {
  const { data: dep, error: e1 } = await sb.from("departments").select("id, code, name").eq("code", "75");
  if (e1) throw e1;
  console.log("dept:", JSON.stringify(dep));
  const { data, error } = await sb.from("cities").select("id, name, insee_code, country").eq("department_id", dep![0].id);
  if (error) throw error;
  console.log("villes dept 75:", data!.length);
  console.log(JSON.stringify(data!.slice(0, 30)));
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
