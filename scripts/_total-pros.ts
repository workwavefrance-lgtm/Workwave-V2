/** Le vrai total de fiches, par etat. Un `count` nul est une ERREUR, pas un zero. */
import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const q = () => sb.from("pros").select("id", { count: "exact", head: true }).eq("is_active", true).is("deleted_at", null);
(async () => {
  for (const [nom, f] of [
    ["ouvertes (etat A)", () => q().eq("etat_admin", "A")],
    ["fermees  (etat F)", () => q().eq("etat_admin", "F")],
    ["etat inconnu     ", () => q().is("etat_admin", null)],
    ["TOTAL actives    ", () => q()],
  ] as [string, () => any][]) {
    const t = Date.now();
    const r = await f();
    console.log(`  ${nom} : ${r.error ? "ECHEC (" + (r.error.message || r.error.code || "delai depasse") + ")" : r.count} (${Date.now() - t} ms)`);
  }
})();
