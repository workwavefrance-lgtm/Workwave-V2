import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

async function main() {
  // 1. Comptes exacts sur toute la table (filtres serveur, pas d'echantillon)
  const q = (b: any) => b.is("deleted_at", null).eq("is_active", true);
  const c1 = await q(sb.from("pros").select("id", { count: "exact", head: true })).not("logo_url","is",null);
  console.log("pros actifs avec logo_url non nul :", c1.count, c1.error?.message ?? "");
  const c2 = await q(sb.from("pros").select("id", { count: "exact", head: true })).neq("photos","[]").not("photos","is",null);
  console.log("pros actifs avec photos != [] :", c2.count, c2.error?.message ?? "");
  const c3 = await q(sb.from("pros").select("id", { count: "exact", head: true }));
  console.log("pros actifs total :", c3.count, c3.error?.message ?? "");
}
main().catch(e => console.error(e.message));
