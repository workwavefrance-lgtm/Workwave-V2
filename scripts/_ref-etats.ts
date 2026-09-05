import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
async function main() {
  const sb = getServiceClient();
  const base = () => sb.from("pros").select("*", { count: "exact", head: true }).eq("is_active", true).is("deleted_at", null);
  const { count: a } = await base().eq("etat_admin", "A");
  const { count: f } = await base().eq("etat_admin", "F");
  const { count: n } = await base().is("etat_admin", null);
  console.log(`etat_admin A=${a} F=${f} NULL=${n} total=${(a||0)+(f||0)+(n||0)}`);
}
main();
