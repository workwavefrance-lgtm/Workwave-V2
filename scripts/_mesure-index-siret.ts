import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data } = await sb.from("pros").select("siret, slug").eq("is_active", true).is("etat_verifie_at", null).not("siret", "is", null).limit(3);
  for (const p of data || []) {
    let t = Date.now(); await sb.from("pros").select("id").eq("siret", p.siret); const a = Date.now() - t;
    t = Date.now(); await sb.from("pros").select("id").eq("slug", p.slug); const b = Date.now() - t;
    t = Date.now(); await sb.from("pros").select("id").eq("siret", p.siret).eq("is_active", true).is("deleted_at", null); const c = Date.now() - t;
    console.log(`siret=${p.siret} : lecture par siret ${a} ms · par slug ${b} ms · par siret+actif ${c} ms`);
  }
})();
