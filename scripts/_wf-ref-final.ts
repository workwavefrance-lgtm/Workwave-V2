import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  // Contre-mesure independante : pagination brute, aucun filtre, categorie 199.
  let off = 0, n = 0;
  while (true) {
    const { data, error } = await sb.from("pros").select("id, is_active, deleted_at")
      .eq("category_id", 199).order("id").range(off, off + 999);
    if (error) { console.log("ERREUR (donc pas un zero) :", error.message); return; }
    const r = data || []; if (r.length === 0) break;
    n += r.length; off += r.length;
  }
  console.log("pagination brute, category_id=199, AUCUN filtre :", n, "lignes");
  // et le meme comptage sur 198 pour comparaison
  let o2 = 0, n2 = 0;
  while (true) {
    const { data, error } = await sb.from("pros").select("id").eq("category_id", 198).order("id").range(o2, o2 + 999);
    if (error) { console.log("ERREUR 198:", error.message); return; }
    const r = data || []; if (r.length === 0) break;
    n2 += r.length; o2 += r.length;
  }
  console.log("pagination brute, category_id=198 (traitement-nuisibles) :", n2, "lignes");
})();
