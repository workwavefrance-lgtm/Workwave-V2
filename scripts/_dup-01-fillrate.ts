/** MESURE 1 : taux de remplissage des colonnes de `pros` sur un echantillon
 *  aleatoire de fiches OUVERTES, pour savoir quelles donnees existent deja. */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });

const COLS = ["siret","siren","address","postal_code","phone","email","website","description","logo_url",
  "photos","cover_url","naf_code","forme_juridique","founded_year","opening_hours","certifications",
  "rge_certified","rge_qualifications","founding_date","effectif_range","etat_admin","date_fermeture",
  "entreprise_etat","etab_latitude","etab_longitude","activite_registre_metier","liste_rge","enseignes",
  "nom_commercial","date_debut_activite","caractere_employeur","liste_idcc","nombre_etablissements",
  "categorie_entreprise","finances","labels_officiels","prenom_dirigeant","nom_dirigeant",
  "google_rating","google_reviews_count","workwave_reviews_count","specialties","hourly_rate",
  "sirene_enrichi_at","sirene_synced_at","claimed_by_user_id"];

function rempli(v: any): boolean {
  if (v === null || v === undefined) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  if (typeof v === "string") return v.trim() !== "";
  if (typeof v === "number") return true;
  if (typeof v === "boolean") return v === true;
  return true;
}

(async () => {
  // Echantillon reparti : on prend 40 tranches d'id, 250 fiches ouvertes chacune.
  const MAXID = 4_600_000, TRANCHES = 40, PARLOT = 250;
  const compte: Record<string, number> = {}; COLS.forEach((c) => (compte[c] = 0));
  let n = 0;
  for (let t = 0; t < TRANCHES; t++) {
    const depart = Math.floor((MAXID / TRANCHES) * t);
    const { data, error } = await sb.from("pros").select(COLS.join(","))
      .eq("is_active", true).is("deleted_at", null)
      .or("etat_admin.is.null,etat_admin.neq.F")
      .gt("id", depart).order("id").limit(PARLOT);
    if (error) { console.log("erreur", error.message); continue; }
    for (const r of (data || []) as any[]) { n++; for (const c of COLS) if (rempli(r[c])) compte[c]++; }
  }
  console.log(`fiches OUVERTES echantillonnees : ${n}\n`);
  const lignes = COLS.map((c) => ({ c, pct: (compte[c] / n) * 100 })).sort((a, b) => b.pct - a.pct);
  for (const l of lignes) console.log(`${l.pct.toFixed(1).padStart(6)} %  ${l.c}`);
})();
