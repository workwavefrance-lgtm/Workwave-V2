import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const { count: ouv } = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null).neq("etat_admin", "F");
  console.log("fiches actives et OUVERTES :", ouv);
})().catch(e => console.error(e.message));
