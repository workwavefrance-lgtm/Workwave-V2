/**
 * Taux de survie par generation d'entreprises du batiment et des services.
 *
 * Sur les etablissements CREES une annee donnee, combien sont encore en
 * activite aujourd hui ? Contrairement au « 50,8 % de fermes » qui melange
 * tout l historique du registre, cette mesure est defendable devant un
 * journaliste : elle compare une generation a elle-meme.
 */
import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const base = () => sb.from("pros").select("id", { count: "exact", head: true })
  .eq("is_active", true).is("deleted_at", null).eq("source", "sirene");
(async () => {
  console.log("  generation   crees   encore ouverts   fermes   part fermee");
  for (const an of [2015, 2018, 2020, 2021, 2022, 2023, 2024]) {
    const d1 = `${an}-01-01`, d2 = `${an + 1}-01-01`;
    const { count: tot, error: e1 } = await base().gte("founding_date", d1).lt("founding_date", d2);
    if (e1) { console.log(`  ${an} : ECHEC ${e1.message || "delai depasse"}`); continue; }
    // Un comptage nul est une ERREUR, jamais un zero. Sans ce test, trois
    // generations sortaient a « 100 % de fermes » sur un simple depassement
    // de delai. C'est le defaut que ce projet a rencontre trois fois le 05/09.
    let ouv: number | null = null;
    for (let essai = 0; essai < 4 && ouv === null; essai++) {
      const r = await base().gte("founding_date", d1).lt("founding_date", d2).eq("etat_admin", "A");
      if (r.error || r.count === null) { await new Promise((x) => setTimeout(x, 3000 * (essai + 1))); continue; }
      ouv = r.count;
    }
    if (ouv === null) { console.log(`  ${an}      ${String(tot).padStart(7)}   COMPTAGE IMPOSSIBLE apres 4 essais`); continue; }
    const fermes = (tot || 0) - ouv;
    console.log(`  ${an}      ${String(tot).padStart(7)} ${String(ouv).padStart(15)} ${String(fermes).padStart(8)}   ${tot ? (fermes / tot * 100).toFixed(1) : "?"} %`);
  }
})();
