import * as dotenv from "dotenv"; import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
async function main() {
  const sb = getServiceClient();
  // contre-verification par un autre operateur : longueur du tableau jsonb > 0
  const a = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null).not("photos", "eq", "[]").not("photos", "is", null);
  console.log("controle 1 (not eq [] et not null) :", a.count, a.error?.message ?? "");
  const b = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null).not("photos", "cs", "[]");
  console.log("controle 2 (photos ne contient pas []) :", b.count, b.error?.message ?? "");
  const c = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null).is("photos", null);
  console.log("photos null :", c.count, c.error?.message ?? "");
}
main().catch((e) => { console.error(e.message); process.exit(1); });
