/**
 * Logique métier de /verifier-artisan : fonctions PURES, sans réseau ni base.
 *
 * Elles transforment la réponse brute de l'API Annuaire des entreprises
 * (types de lib/utils/recherche-entreprises.ts) en un modèle d'affichage
 * sérialisable, renvoyé tel quel par la Server Action au composant client.
 *
 * Règle (leçon du 21/08/2026) : n'affirmer que ce que la donnée dit. Chaque
 * ligne affichée vient d'un champ du registre ; quand le champ est vide, la
 * ligne dit « non renseigné » ou disparaît, jamais une valeur devinée.
 */

import type {
  EtablissementSirene,
  UniteLegaleSirene,
} from "@/lib/utils/recherche-entreprises";
import { libelleNaf } from "@/lib/data/naf-labels";
import { libelleFormeJuridique } from "@/lib/data/formes-juridiques";
import { formatDateCreation, formatEffectifRange } from "@/lib/utils/sirene";

export type NumeroSaisi =
  | { type: "siret"; valeur: string }
  | { type: "siren"; valeur: string }
  | { type: "invalide" };

/** 14 chiffres = SIRET, 9 chiffres = SIREN, tout le reste est refusé. */
export function analyserNumero(brut: string): NumeroSaisi {
  const chiffres = (brut || "").replace(/[\s.\-]/g, "");
  if (!/^\d+$/.test(chiffres)) return { type: "invalide" };
  if (chiffres.length === 14) return { type: "siret", valeur: chiffres };
  if (chiffres.length === 9) return { type: "siren", valeur: chiffres };
  return { type: "invalide" };
}

/** "123 456 789 00012" pour un SIRET, "123 456 789" pour un SIREN. */
export function formaterNumero(chiffres: string): string {
  const groupes = [chiffres.slice(0, 3), chiffres.slice(3, 6), chiffres.slice(6, 9)];
  if (chiffres.length === 14) groupes.push(chiffres.slice(9));
  return groupes.filter(Boolean).join(" ");
}

/**
 * Ancienneté en toutes lettres depuis une date "YYYY-MM-DD", calculée en mois
 * révolus : "12 ans", "1 an", "6 mois", "moins d'un mois". Null si la date
 * est absente, mal formée ou dans le futur.
 */
export function anciennete(dateIso: string | null | undefined, maintenant: Date): string | null {
  if (!dateIso) return null;
  const m = String(dateIso).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const annee = Number(m[1]);
  const mois = Number(m[2]);
  const jour = Number(m[3]);
  let moisRevolus =
    (maintenant.getFullYear() - annee) * 12 + (maintenant.getMonth() + 1 - mois);
  if (maintenant.getDate() < jour) moisRevolus -= 1;
  if (moisRevolus < 0) return null;
  if (moisRevolus < 1) return "moins d'un mois";
  if (moisRevolus < 12) return `${moisRevolus} mois`;
  const ans = Math.floor(moisRevolus / 12);
  return ans === 1 ? "1 an" : `${ans} ans`;
}

export type EtatEtablissement =
  | { code: "ouvert"; libelle: "En activité" }
  | { code: "ferme"; libelle: string; dateIso: string | null }
  | { code: "inconnu"; libelle: "État non renseigné" };

export type EtatEntreprise =
  | { code: "active"; libelle: "Entreprise active" }
  | { code: "cessee"; libelle: string; dateIso: string | null }
  | { code: "inconnu"; libelle: "État non renseigné" };

export type ResultatVerification = {
  /** Numéro tel que saisi, normalisé : ce que le visiteur a demandé. */
  numeroSaisi: { type: "siret" | "siren"; valeur: string; affichage: string };
  siret: string;
  siretAffichage: string;
  siren: string;
  nom: string;
  nomCommercial: string | null;
  estSiege: boolean | null;
  activite: { code: string; libelle: string | null } | null;
  adresse: string | null;
  etablissement: EtatEtablissement;
  entreprise: EtatEntreprise;
  /** Nombre d'établissements encore ouverts dans l'entreprise, si le registre le donne. */
  etablissementsOuverts: number | null;
  /** Siège en activité, quand l'établissement demandé est fermé et que le siège est un autre établissement ouvert. */
  siegeEnActivite: { siret: string; siretAffichage: string; adresse: string | null } | null;
  creation: { dateIso: string; texte: string; anciennete: string | null } | null;
  formeJuridique: { code: string; libelle: string | null } | null;
  effectif: { libelle: string; annee: string | null } | null;
  rge: { certifie: boolean; qualifications: number };
  /** "2 septembre 2026" : date de consultation du registre. */
  consulteLe: string;
};

function etatEtablissement(etab: EtablissementSirene): EtatEtablissement {
  if (etab.etat_administratif === "A") return { code: "ouvert", libelle: "En activité" };
  if (etab.etat_administratif === "F") {
    // Pour un établissement fermé, `date_fermeture` est renseignée ; sinon
    // `date_debut_activite` marque le début de la période « F » (cf. type).
    const dateIso = etab.date_fermeture || etab.date_debut_activite || null;
    const texte = formatDateCreation(dateIso);
    return {
      code: "ferme",
      libelle: texte ? `Établissement fermé depuis le ${texte}` : "Établissement fermé",
      dateIso: texte ? String(dateIso).slice(0, 10) : null,
    };
  }
  return { code: "inconnu", libelle: "État non renseigné" };
}

function etatEntreprise(unite: UniteLegaleSirene): EtatEntreprise {
  if (unite.etat_administratif === "A") return { code: "active", libelle: "Entreprise active" };
  if (unite.etat_administratif === "C") {
    const texte = formatDateCreation(unite.date_fermeture);
    return {
      code: "cessee",
      libelle: texte ? `Entreprise cessée depuis le ${texte}` : "Entreprise cessée",
      dateIso: texte ? String(unite.date_fermeture).slice(0, 10) : null,
    };
  }
  return { code: "inconnu", libelle: "État non renseigné" };
}

function nomEntreprise(unite: UniteLegaleSirene): string {
  const nom = (unite.nom_complet || unite.nom_raison_sociale || unite.sigle || "").trim();
  return nom || "Nom non renseigné";
}

export function construireResultat(
  numero: { type: "siret" | "siren"; valeur: string },
  unite: UniteLegaleSirene,
  etab: EtablissementSirene,
  maintenant: Date
): ResultatVerification {
  const codeActivite = etab.activite_principale || unite.activite_principale || null;
  const dateCreation = etab.date_creation || null;
  const texteCreation = formatDateCreation(dateCreation);

  const etatEtab = etatEtablissement(etab);
  const siege = unite.siege;
  const siegeEnActivite =
    etatEtab.code === "ferme" &&
    siege &&
    siege.siret !== etab.siret &&
    siege.etat_administratif === "A"
      ? {
          siret: siege.siret,
          siretAffichage: formaterNumero(siege.siret),
          adresse: siege.adresse || null,
        }
      : null;

  const effectifLibelle = formatEffectifRange(etab.tranche_effectif_salarie);
  const complements = unite.complements || {};
  const nomCommercial = (etab.nom_commercial || "").trim();
  const nom = nomEntreprise(unite);

  return {
    numeroSaisi: {
      type: numero.type,
      valeur: numero.valeur,
      affichage: formaterNumero(numero.valeur),
    },
    siret: etab.siret,
    siretAffichage: formaterNumero(etab.siret),
    siren: unite.siren || etab.siret.slice(0, 9),
    nom,
    // Le nom commercial est déjà cité entre parenthèses dans nom_complet
    // (« AMPION AMPION (DOLCY - SERVICE A DOMICILE) ») : on ne le répète pas.
    nomCommercial: nomCommercial && !nom.includes(nomCommercial) ? nomCommercial : null,
    estSiege: etab.est_siege,
    activite: codeActivite ? { code: codeActivite, libelle: libelleNaf(codeActivite) } : null,
    adresse: etab.adresse || null,
    etablissement: etatEtab,
    entreprise: etatEntreprise(unite),
    etablissementsOuverts:
      typeof unite.nombre_etablissements_ouverts === "number"
        ? unite.nombre_etablissements_ouverts
        : null,
    siegeEnActivite,
    creation:
      dateCreation && texteCreation
        ? {
            dateIso: String(dateCreation).slice(0, 10),
            texte: texteCreation,
            anciennete: anciennete(dateCreation, maintenant),
          }
        : null,
    formeJuridique: unite.nature_juridique
      ? { code: unite.nature_juridique, libelle: libelleFormeJuridique(unite.nature_juridique) }
      : null,
    effectif: effectifLibelle
      ? { libelle: effectifLibelle, annee: etab.annee_tranche_effectif_salarie || null }
      : null,
    rge: {
      certifie: complements.est_rge === true,
      qualifications: Array.isArray(etab.liste_rge) ? etab.liste_rge.length : 0,
    },
    consulteLe: new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(maintenant),
  };
}
