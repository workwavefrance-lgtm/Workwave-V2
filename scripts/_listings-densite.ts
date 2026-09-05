/**
 * Les listings grandes villes sont en position 35 a 57. Hypothese : la page
 * est trop maigre pour la requete (peu de pros affiches). Mesure : combien de
 * pros OUVERTS la page montre-t-elle vraiment, ville par ville.
 *
 * Rappel du 04/08 : le scraper Sirene ne ramenait que les 1 000 premiers par
 * metier x departement (parametre curseur absent au 1er appel). Les
 * departements DENSES etaient ampute de l'essentiel. Correction faite le
 * 04/08 ; ce script dit si le rattrapage a eu lieu.
 */
import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const VILLES = ["montpellier", "poitiers", "nantes", "marseille", "bordeaux", "villeurbanne", "toulouse", "paris", "lyon", "lille", "nice", "strasbourg"];
(async () => {
  const { data: cat } = await sb.from("categories").select("id").eq("slug", "plombier").single();
  console.log("plombiers OUVERTS par ville, tels que la page les compte :\n");
  console.log("  ville             pros ouverts   fermes   total fiches");
  for (const v of VILLES) {
    const { data: c } = await sb.from("cities").select("id, name, population").eq("slug", v).maybeSingle();
    if (!c) { console.log(`  ${v.padEnd(16)} commune introuvable`); continue; }
    const q = () => sb.from("pros").select("id", { count: "exact", head: true }).eq("category_id", cat!.id).eq("city_id", c.id).eq("is_active", true).is("deleted_at", null);
    const { count: ouverts } = await q().or("etat_admin.is.null,etat_admin.neq.F");
    const { count: fermes } = await q().eq("etat_admin", "F");
    console.log(`  ${c.name.padEnd(16)} ${String(ouverts).padStart(9)} ${String(fermes).padStart(9)} ${String((ouverts || 0) + (fermes || 0)).padStart(14)}`);
  }
})();
