/**
 * Client de l'API publique recherche-entreprises.api.gouv.fr (INSEE / data.gouv).
 *
 * GRATUIT, sans clé. Utilisé pour pré-remplir une fiche pro à partir d'un SIRET
 * lors de l'inscription d'un pro qui n'est PAS dans notre base scrapée
 * (cf. /pro/creer-fiche).
 *
 * Doc : https://recherche-entreprises.api.gouv.fr/docs/
 */

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pickEtablissement(result: any, siret: string): any | null {
  const candidates = [
    result?.siege,
    ...((result?.matching_etablissements as unknown[]) || []),
  ].filter(Boolean);
  return candidates.find((e: { siret?: string }) => e?.siret === siret) || null;
}

/**
 * Récupère les infos publiques d'une entreprise depuis son SIRET.
 * Retourne null si SIRET invalide, entreprise introuvable, ou API indisponible
 * (l'appelant retombe alors sur une saisie manuelle).
 */
export async function fetchCompanyBySiret(
  siret: string
): Promise<CompanyInfo | null> {
  const clean = (siret || "").replace(/\D/g, "");
  if (clean.length !== 14) return null;

  try {
    const res = await fetch(
      `https://recherche-entreprises.api.gouv.fr/search?q=${clean}&per_page=5`,
      {
        headers: { "User-Agent": "Workwave/1.0 (+https://workwave.fr)" },
        // Cache 24h : les données légales bougent peu, et ça protège l'API.
        next: { revalidate: 86400 },
      }
    );
    if (!res.ok) return null;

    const data = await res.json();
    const results = data?.results;
    if (!Array.isArray(results) || results.length === 0) return null;

    for (const r of results) {
      const etab = pickEtablissement(r, clean);
      if (!etab) continue;
      const name: string =
        r.nom_complet || r.nom_raison_sociale || r.sigle || "";
      return {
        siret: clean,
        siren: r.siren || clean.slice(0, 9),
        name: name.trim(),
        naf: etab.activite_principale || r.activite_principale || null,
        foundingDate: r.date_creation || etab.date_creation || null,
        address: etab.adresse || null,
        postalCode: etab.code_postal || null,
        commune: etab.libelle_commune || null,
        departement:
          etab.departement ||
          (etab.code_postal ? String(etab.code_postal).slice(0, 2) : null),
        active: (etab.etat_administratif || r.etat_administratif) === "A",
      };
    }
    return null;
  } catch {
    return null;
  }
}
