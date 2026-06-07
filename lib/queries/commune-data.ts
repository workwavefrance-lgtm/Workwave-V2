import { createClient } from "@/lib/supabase/server";

/**
 * Enrichissement commune via data.gouv.fr (table commune_data, keyée insee_code).
 * Données RÉELLES, sourcées, Licence Ouverte. Toutes nullable (secret stat /
 * arrondissements / communes sans données). cf. migration 2026-06-07.
 */
export type CommuneData = {
  insee_code: string;
  prix_m2_moyen: number | null;
  prix_moyen_bien: number | null;
  nb_mutations: number | null;
  surface_moy: number | null;
  prop_maison: number | null;
  dvf_annee: number | null;
  revenu_median: number | null;
  part_menages_imposes: number | null;
  logements_prive_total: number | null;
  logements_vacants: number | null;
  logements_vacants_2ans: number | null;
  taux_vacance: number | null;
  densite_hab_km2: number | null;
  niveau_equipements: number | null;
  grille_densite: number | null;
};

const COLS =
  "insee_code, prix_m2_moyen, prix_moyen_bien, nb_mutations, surface_moy, prop_maison, dvf_annee, revenu_median, part_menages_imposes, logements_prive_total, logements_vacants, logements_vacants_2ans, taux_vacance, densite_hab_km2, niveau_equipements, grille_densite";

/** Récupère l'enrichissement d'une commune par son code INSEE. null si absent. */
export async function getCommuneData(
  inseeCode: string | null | undefined
): Promise<CommuneData | null> {
  if (!inseeCode) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("commune_data")
    .select(COLS)
    .eq("insee_code", inseeCode)
    .maybeSingle();
  return (data as CommuneData | null) ?? null;
}

/**
 * Vrai si la commune a au moins une donnée d'enrichissement exploitable
 * (sinon le bloc se rabat sur les estimations population).
 */
export function hasCommuneData(d: CommuneData | null | undefined): boolean {
  if (!d) return false;
  return (
    d.prix_m2_moyen != null ||
    d.revenu_median != null ||
    d.taux_vacance != null ||
    d.densite_hab_km2 != null
  );
}
