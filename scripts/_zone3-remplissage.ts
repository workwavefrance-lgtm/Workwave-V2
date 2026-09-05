/** MESURE zone 3 : taux de remplissage des colonnes de `pros` (echantillon aleatoire). */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

const COLS = [
  "siret","siren","address","phone","email","website","description","logo_url","cover_url",
  "photos","photo_captions","naf_code","forme_juridique","founded_year","founding_date",
  "effectif_range","etat_admin","date_fermeture","entreprise_etat","entreprise_date_fermeture",
  "sirene_synced_at","sirene_enrichi_at","etab_latitude","etab_longitude",
  "activite_registre_metier","liste_rge","enseignes","nom_commercial","date_debut_activite",
  "caractere_employeur","liste_idcc","nombre_etablissements","categorie_entreprise",
  "finances","labels_officiels","rge_certified","rge_qualifications","rge_number",
  "certifications","specialties","languages","opening_hours","payment_methods",
  "instagram","facebook","linkedin","hourly_rate","travel_fee","min_budget",
  "prenom_dirigeant","nom_dirigeant","google_place_id","google_rating","google_reviews_count",
  "workwave_reviews_count","claimed_by_user_id","secondary_category_ids","profile_completion",
];

function rempli(v: any): boolean {
  if (v === null || v === undefined) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  if (typeof v === "string") return v.trim() !== "";
  if (typeof v === "boolean") return v === true;
  if (typeof v === "number") return true;
  return true;
}

(async () => {
  // Echantillon : 40 tranches de 500 lignes reparties sur toute la plage d'id.
  const { data: mx } = await sb.from("pros").select("id").order("id", { ascending: false }).limit(1);
  const maxId = (mx as any[])[0].id as number;
  console.log("id max :", maxId);
  const TRANCHES = 40, TAILLE = 500;
  const compte: Record<string, number> = {}; COLS.forEach(c => compte[c] = 0);
  let n = 0, ouverts = 0;
  for (let t = 0; t < TRANCHES; t++) {
    const start = Math.floor((maxId / TRANCHES) * t);
    const { data, error } = await sb.from("pros")
      .select(["id","is_active","deleted_at", ...COLS].join(","))
      .gte("id", start).is("deleted_at", null).eq("is_active", true)
      .order("id", { ascending: true }).limit(TAILLE);
    if (error) { console.log("ERR", error.message.slice(0, 120)); continue; }
    const rows = (data || []) as any[];
    for (const r of rows) {
      n++;
      if (r.etat_admin !== "F") ouverts++;
      for (const c of COLS) if (rempli(r[c])) compte[c]++;
    }
  }
  console.log(`lignes echantillonnees (actives) : ${n} · dont ouvertes : ${ouverts}\n`);
  const TOTAL_ACTIFS = 2439976;
  COLS.map(c => ({ c, p: (compte[c] / n) * 100 })).sort((a, b) => b.p - a.p)
    .forEach(l => console.log(`${l.p.toFixed(2).padStart(7)} %  ${l.c.padEnd(28)} ~${Math.round(l.p / 100 * TOTAL_ACTIFS).toLocaleString("fr-FR")} fiches`));
})();
