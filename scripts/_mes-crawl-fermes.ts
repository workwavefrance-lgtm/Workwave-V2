import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const slugs = fs.readFileSync(process.argv[2], "utf8").split("\n").map(s=>s.trim()).filter(Boolean);
  console.log(`slugs crawles par Google (distincts) : ${slugs.length}`);
  let trouves = 0, ouverts = 0, fermes = 0, inconnu = 0, entrCessees = 0;
  for (let i = 0; i < slugs.length; i += 200) {
    const lot = slugs.slice(i, i + 200);
    const { data, error } = await sb.from("pros").select("slug, etat_admin, entreprise_etat, is_active, deleted_at").in("slug", lot);
    if (error) { console.log("ERREUR", error.message); break; }
    for (const r of data || []) {
      trouves++;
      if (r.etat_admin === "F") fermes++;
      else if (r.etat_admin === "A") ouverts++;
      else inconnu++;
      if (r.entreprise_etat === "C") entrCessees++;
    }
  }
  console.log(`trouves en base   : ${trouves}  (${slugs.length - trouves} absents/404)`);
  console.log(`  etat_admin = A (OUVERT) : ${ouverts}  (${(100*ouverts/trouves).toFixed(1)} %)`);
  console.log(`  etat_admin = F (FERME)  : ${fermes}  (${(100*fermes/trouves).toFixed(1)} %)`);
  console.log(`  etat_admin non renseigne: ${inconnu}`);
  console.log(`  entreprise_etat = C (cessee) : ${entrCessees}  (${(100*entrCessees/trouves).toFixed(1)} %)`);
  // reference : part de fermes dans la base entiere
  const { count: cA } = await sb.from("pros").select("id", { count: "exact", head: true }).eq("is_active", true).is("deleted_at", null).eq("etat_admin", "A");
  const { count: cF } = await sb.from("pros").select("id", { count: "exact", head: true }).eq("is_active", true).is("deleted_at", null).eq("etat_admin", "F");
  console.log(`\nREFERENCE base : ouverts=${cA} fermes=${cF} -> part fermee = ${(100*(cF!)/((cA!)+(cF!))).toFixed(1)} %`);
})();
