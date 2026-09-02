/**
 * Client de l'API publique recherche-entreprises.api.gouv.fr (INSEE / data.gouv).
 *
 * GRATUIT, sans clé. Deux usages :
 *   - pré-remplir une fiche pro à partir d'un SIRET lors de l'inscription d'un
 *     pro qui n'est PAS dans notre base scrapée (cf. /pro/creer-fiche) ;
 *   - enrichir les fiches existantes avec les données officielles
 *     (scripts/enrichir-fiches-sirene.ts).
 *
 * Doc : https://recherche-entreprises.api.gouv.fr/docs/
 * Limite documentée : 7 requêtes par seconde et par adresse IP.
 *
 * Noms de champs VÉRIFIÉS sur des appels réels le 02/09/2026 (pas recopiés de
 * mémoire) : `date_creation`, `nature_juridique`, `tranche_effectif_salarie`,
 * `etat_administratif`, `activite_principale`, `siege`, `matching_etablissements`,
 * `activite_principale_registre_metier`, `liste_rge`, `liste_enseignes`,
 * `nom_commercial`, `date_debut_activite`, `caractere_employeur`, `liste_idcc`,
 * `latitude`, `longitude` (renvoyées en CHAÎNES), `nombre_etablissements`,
 * `categorie_entreprise`, `finances`, `complements`.
 *
 * `dirigeants` (personnes physiques) n'est volontairement NI typé NI relu.
 */

/** Un établissement tel que renvoyé dans `siege` ou `matching_etablissements`. */
export type EtablissementSirene = {
  siret: string;
  est_siege: boolean | null;
  date_creation: string | null; // "YYYY-MM-DD"
  date_fermeture: string | null;
  /** Début de la période ACTUELLE dans Sirene : pour un établissement fermé, c'est la date de fermeture. */
  date_debut_activite: string | null;
  etat_administratif: string | null; // "A" (actif) ou "F" (fermé)
  activite_principale: string | null; // "43.22A" (avec point)
  activite_principale_registre_metier: string | null; // code NAFA, ex. "4322AZ"
  tranche_effectif_salarie: string | null; // "NN", "00", "01", "03"...
  annee_tranche_effectif_salarie: string | null;
  caractere_employeur: string | null; // "O" ou "N"
  latitude: string | null; // chaîne, à convertir
  longitude: string | null;
  liste_rge: string[] | null; // codes de qualification RGE
  liste_enseignes: string[] | null;
  liste_idcc: string[] | null; // conventions collectives
  nom_commercial: string | null;
  adresse: string | null;
  code_postal: string | null;
  libelle_commune: string | null;
  departement: string | null;
};

/** L'unité légale (entreprise), avec son siège et les établissements qui ont matché. */
export type UniteLegaleSirene = {
  siren: string;
  nom_complet: string | null;
  nom_raison_sociale: string | null;
  sigle: string | null;
  nature_juridique: string | null; // code INSEE 4 chiffres : "1000", "5499"
  date_creation: string | null;
  date_fermeture: string | null;
  etat_administratif: string | null; // "A" (active) ou "C" (cessée)
  activite_principale: string | null;
  tranche_effectif_salarie: string | null;
  categorie_entreprise: string | null; // "PME", "ETI", "GE"
  nombre_etablissements: number | null;
  nombre_etablissements_ouverts: number | null;
  /** {"2024": {"ca": 123, "resultat_net": 45}} pour les sociétés qui déposent leurs comptes. */
  finances: Record<string, { ca: number | null; resultat_net: number | null }> | null;
  /** Drapeaux officiels (est_rge, est_qualiopi...) et liste_idcc de l'entreprise. */
  complements: Record<string, unknown> | null;
  siege: EtablissementSirene | null;
  matching_etablissements: EtablissementSirene[];
};

export type RechercheSiret =
  | { statut: "ok"; unite: UniteLegaleSirene; etablissement: EtablissementSirene }
  | {
      statut: "non_trouve";
      /** siret_invalide : pas 14 chiffres. aucun_resultat : l'API ne connaît pas ce SIRET. etablissement_absent : l'entreprise est renvoyée mais sans cet établissement. */
      raison: "siret_invalide" | "aucun_resultat" | "etablissement_absent";
    }
  | { statut: "erreur_api"; http: number | null; detail: string };

const API_URL = "https://recherche-entreprises.api.gouv.fr/search";

function pickEtablissement(
  unite: UniteLegaleSirene,
  siret: string
): EtablissementSirene | null {
  const candidats = [unite.siege, ...(unite.matching_etablissements || [])];
  return candidats.find((e) => e && e.siret === siret) || null;
}

/**
 * Recherche un SIRET précis et renvoie l'unité légale ET l'établissement
 * correspondant. Distingue trois issues, parce qu'un script d'enrichissement
 * ne doit pas traiter de la même façon « l'API est en panne » (réessayer plus
 * tard) et « ce SIRET n'existe pas » (ne plus jamais le redemander).
 *
 * `cacheNext` : ajoute `next: { revalidate: 86400 }` pour le cache de Next.js
 * (côté application). Sans effet hors Next (scripts).
 */
export async function rechercherParSiret(
  siret: string,
  options?: { signal?: AbortSignal; cacheNext?: boolean }
): Promise<RechercheSiret> {
  const clean = (siret || "").replace(/\D/g, "");
  if (clean.length !== 14) return { statut: "non_trouve", raison: "siret_invalide" };

  const init: RequestInit & { next?: { revalidate: number } } = {
    headers: {
      "User-Agent": "Workwave/1.0 (+https://workwave.fr)",
      Accept: "application/json",
    },
  };
  if (options?.signal) init.signal = options.signal;
  if (options?.cacheNext) init.next = { revalidate: 86400 };

  let res: Response;
  try {
    res = await fetch(`${API_URL}?q=${clean}&per_page=5`, init);
  } catch (e) {
    return {
      statut: "erreur_api",
      http: null,
      detail: e instanceof Error ? e.message : String(e),
    };
  }
  if (!res.ok) {
    return { statut: "erreur_api", http: res.status, detail: `HTTP ${res.status}` };
  }

  let data: { results?: unknown } | null = null;
  try {
    data = (await res.json()) as { results?: unknown };
  } catch {
    return { statut: "erreur_api", http: res.status, detail: "JSON invalide" };
  }
  const results = data?.results;
  if (!Array.isArray(results) || results.length === 0) {
    return { statut: "non_trouve", raison: "aucun_resultat" };
  }

  for (const brut of results as UniteLegaleSirene[]) {
    const etab = pickEtablissement(brut, clean);
    if (etab) return { statut: "ok", unite: brut, etablissement: etab };
  }
  return { statut: "non_trouve", raison: "etablissement_absent" };
}

export type CompanyInfo = {
  siret: string;
  siren: string;
  name: string;
  naf: string | null; // ex. "43.32A"
  foundingDate: string | null; // "YYYY-MM-DD"
  address: string | null; // adresse complète (rue + cp + commune)
  postalCode: string | null;
  commune: string | null;
  departement: string | null; // code département ("86", "75", "2A"...)
  active: boolean; // etat_administratif === "A"
};

/**
 * Récupère les infos publiques d'une entreprise depuis son SIRET.
 * Retourne null si SIRET invalide, entreprise introuvable, ou API indisponible
 * (l'appelant retombe alors sur une saisie manuelle).
 */
export async function fetchCompanyBySiret(
  siret: string
): Promise<CompanyInfo | null> {
  // Cache 24h : les données légales bougent peu, et ça protège l'API.
  const r = await rechercherParSiret(siret, { cacheNext: true });
  if (r.statut !== "ok") return null;
  const { unite, etablissement: etab } = r;
  const name: string =
    unite.nom_complet || unite.nom_raison_sociale || unite.sigle || "";
  return {
    siret: etab.siret,
    siren: unite.siren || etab.siret.slice(0, 9),
    name: name.trim(),
    naf: etab.activite_principale || unite.activite_principale || null,
    foundingDate: unite.date_creation || etab.date_creation || null,
    address: etab.adresse || null,
    postalCode: etab.code_postal || null,
    commune: etab.libelle_commune || null,
    departement:
      etab.departement ||
      (etab.code_postal ? String(etab.code_postal).slice(0, 2) : null),
    active: (etab.etat_administratif || unite.etat_administratif) === "A",
  };
}
