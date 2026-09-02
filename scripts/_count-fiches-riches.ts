import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
(async () => {
  const base = () => sb.from("pros").select("id", { count: "exact", head: true }).eq("is_active", true).is("deleted_at", null);
  const t0 = Date.now();
  const [tout, riches, reclamees] = await Promise.all([
    base(),
    base().or("phone.not.is.null,email.not.is.null,description.not.is.null,claimed_by_user_id.not.is.null"),
    base().not("claimed_by_user_id", "is", null),
  ]);
  console.log(`actives ${tout.count ?? "ERREUR " + tout.error?.message} · avec tel/email/description/reclamee ${riches.count ?? "ERREUR " + riches.error?.message} · reclamees ${reclamees.count ?? "ERREUR"} · ${((Date.now() - t0) / 1000).toFixed(1)} s`);
})();
