/** MESURE 13 : donnees PRESENTES en base mais NON AFFICHEES parce qu'un
 *  verrou (sirene_enrichi_at) les bloque. */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
(async () => {
  const cols = ["effectif_range","caractere_employeur","nombre_etablissements","categorie_entreprise","enseignes","nom_commercial","liste_idcc","finances","labels_officiels","activite_registre_metier","etab_latitude"];
  const MAXID = 4_600_000, T = 40, N = 250;
  let n = 0, enrichies = 0;
  const bloquees: Record<string, number> = {}; cols.forEach(c => bloquees[c] = 0);
  const presentes: Record<string, number> = {}; cols.forEach(c => presentes[c] = 0);
  for (let t = 0; t < T; t++) {
    const { data } = await sb.from("pros").select(["id","sirene_enrichi_at", ...cols].join(","))
      .eq("is_active", true).is("deleted_at", null).or("etat_admin.is.null,etat_admin.neq.F")
      .gt("id", Math.floor((MAXID / T) * t)).order("id").limit(N);
    for (const r of (data || []) as any[]) {
      n++; const enr = !!r.sirene_enrichi_at; if (enr) enrichies++;
      for (const c of cols) {
        const v = r[c];
        const rempli = v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0) &&
          !(typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0) && v !== "";
        if (rempli) { presentes[c]++; if (!enr) bloquees[c]++; }
      }
    }
  }
  console.log(`fiches OUVERTES echantillonnees : ${n}`);
  console.log(`dont marquees "enrichies annuaire" (sirene_enrichi_at) : ${enrichies} (${((enrichies/n)*100).toFixed(2)} %)\n`);
  console.log("colonne                    presente   dont NON AFFICHEE (verrou sirene_enrichi_at)");
  for (const c of cols)
    console.log(`${c.padEnd(26)} ${((presentes[c]/n)*100).toFixed(1).padStart(6)} %   ${((bloquees[c]/n)*100).toFixed(1).padStart(6)} %  soit ~${Math.round((bloquees[c]/n)*1233038).toLocaleString("fr-FR")} fiches ouvertes`);
})();
