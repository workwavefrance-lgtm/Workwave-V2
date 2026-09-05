/** MESURE zone 3 : comptages exacts cibles sur `pros`. */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

async function n(label: string, f: (q: any) => any) {
  const t = Date.now();
  let q: any = sb.from("pros").select("id", { count: "exact", head: true })
    .is("deleted_at", null).eq("is_active", true);
  q = f(q);
  const { count, error } = await q;
  const ligne = `${label.padEnd(58)} ${error ? "ERR " + error.message.slice(0, 70) : String(count).padStart(9)}   ${((Date.now() - t) / 1000).toFixed(1)}s`; require("fs").appendFileSync("/tmp/zone3.txt", ligne + "\n"); console.log(ligne);
  return count ?? 0;
}

(async () => {
  await n("TOTAL fiches actives", (q) => q);
  await n("claimed_by_user_id NOT NULL (fiches reclamees)", (q) => q.not("claimed_by_user_id", "is", null));
  await n("opening_hours NOT NULL", (q) => q.not("opening_hours", "is", null));
  await n("opening_hours NOT NULL ET reclamee", (q) => q.not("opening_hours", "is", null).not("claimed_by_user_id", "is", null));
  await n("google_rating NOT NULL", (q) => q.not("google_rating", "is", null));
  await n("google_place_id NOT NULL", (q) => q.not("google_place_id", "is", null));
  await n("photos <> '[]'", (q) => q.neq("photos", "[]"));
  await n("siren NOT NULL", (q) => q.not("siren", "is", null));
  await n("naf_code IS NULL", (q) => q.is("naf_code", null));
  await n("effectif_range = 'NN'", (q) => q.eq("effectif_range", "NN"));
  await n("effectif_range NOT NULL et <> 'NN'", (q) => q.not("effectif_range", "is", null).neq("effectif_range", "NN"));
  await n("sirene_enrichi_at NOT NULL", (q) => q.not("sirene_enrichi_at", "is", null));
  await n("enseignes NOT NULL", (q) => q.not("enseignes", "is", null));
  await n("enseignes NOT NULL ET sirene_enrichi_at NULL", (q) => q.not("enseignes", "is", null).is("sirene_enrichi_at", null));
  await n("nom_commercial NOT NULL", (q) => q.not("nom_commercial", "is", null));
  await n("finances NOT NULL", (q) => q.not("finances", "is", null));
  await n("prenom_dirigeant NOT NULL", (q) => q.not("prenom_dirigeant", "is", null));
  await n("activite_registre_metier NOT NULL", (q) => q.not("activite_registre_metier", "is", null));
  await n("liste_idcc NOT NULL", (q) => q.not("liste_idcc", "is", null));
  await n("liste_rge NOT NULL", (q) => q.not("liste_rge", "is", null));
  await n("date_debut_activite NOT NULL", (q) => q.not("date_debut_activite", "is", null));
  await n("etab_latitude NOT NULL", (q) => q.not("etab_latitude", "is", null));
  await n("rge_certified = true", (q) => q.eq("rge_certified", true));
  await n("description NOT NULL", (q) => q.not("description", "is", null));
  await n("phone NOT NULL", (q) => q.not("phone", "is", null));
  await n("website NOT NULL", (q) => q.not("website", "is", null));
})();
