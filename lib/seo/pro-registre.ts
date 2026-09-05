/**
 * Faits OFFICIELS d'une fiche pro, tels que renvoyes par l'annuaire des
 * entreprises (scripts/enrichir-fiches-sirene.ts, migration 2026-09-02).
 *
 * POURQUOI. Mesure du 02/09/2026 : deux fiches voisines (meme metier, meme
 * commune) partagent 71 % de leur texte, dont 43 points de gabarit et 28
 * points imputables au couple metier x ville. Ces 28 points ne se reduisent
 * qu'avec des faits propres a CHAQUE fiche. Regle du 07/06 : de la vraie
 * donnee officielle, jamais une donnee inventee. Tout ce qui sort d'ici vient
 * d'une colonne en base.
 *
 * Ce module ne fait AUCUNE requete : il assemble des colonnes deja lues par
 * la fiche (le SELECT de getProBySlug fait `*` sur pros). Il sert a la fois a
 * la page (cartes « Ce que dit le registre ») et a la prose SEO
 * (lib/seo/pro-seo-sections.ts), pour que les deux disent la meme chose.
 *
 * REGLE DE DISTINCTION (lecon du 20/08) : un fait partage par la majorite des
 * fiches n'est PAS affiche, il ajouterait du texte commun. Mesure du 03/09 sur
 * les 1 998 fiches ouvertes du pilote :
 *   caractere_employeur = N        76 %  -> on n'affiche que O (11 %)
 *   categorie_entreprise = PME     65 %  -> PME seulement hors entrepreneur
 *                                           individuel ; ETI et GE toujours
 *   est_association (label)        fait doublon avec la forme juridique 9220
 *   activite_registre_metier       code NAFA, aucun libelle dans le depot :
 *                                     rien plutot qu'un code brut
 *   liste_idcc, liste_rge          codes sans libelle : idem (le drapeau
 *                                     est_rge porte deja l'information RGE)
 */
import { formatEffectifRange } from "@/lib/utils/sirene";
import { formeJuridiqueDistinctive } from "@/lib/data/formes-juridiques";

/** Sous-ensemble de `Pro` lu par ce module. Toutes les cles sont optionnelles :
 *  une colonne absente (migration non appliquee) vaut « pas de donnee ». */
export type ProPourRegistre = {
  name: string;
  claimed_by_user_id?: string | null;
  sirene_enrichi_at?: string | null;
  forme_juridique?: string | null;
  effectif_range?: string | null;
  enseignes?: string[] | null;
  nom_commercial?: string | null;
  caractere_employeur?: string | null;
  nombre_etablissements?: number | null;
  categorie_entreprise?: string | null;
  finances?: Record<string, { ca: number | null; resultat_net: number | null }> | null;
  labels_officiels?: Record<string, true> | null;
  city?: { country?: string | null } | null;
};

/**
 * Vrai quand la fiche est passee par l'enrichissement annuaire ET que ses
 * donnees viennent bien de Sirene (pas la Belgique : la BCE est un autre
 * registre, et l'API francaise ne connait pas ses numeros).
 */
export function estEnrichieSirene(pro: ProPourRegistre): boolean {
  return !!pro.sirene_enrichi_at && pro.city?.country !== "BE";
}

/**
 * La date de creation de l'UNITE LEGALE fait foi quand la fiche a ete
 * enrichie et que le pro n'a pas lui-meme saisi une annee dans son tableau
 * de bord (`founded_year` est editable une fois la fiche reclamee).
 * Mesure du 03/09 : sur 1 998 fiches enrichies, 569 ont un `founded_year`
 * (date de l'etablissement, backfill Stock) different de l'annee de
 * `founding_date` (date de l'entreprise, annuaire). C'est cette derniere qui
 * repond a « quand l'entreprise a-t-elle ete creee ».
 */
export function dateSireneFaitFoi(pro: ProPourRegistre): boolean {
  return estEnrichieSirene(pro) && !pro.claimed_by_user_id;
}

/** "SARL BRIMAUD" et "Sarl  Brimaud" designent la meme chose. */
function normaliser(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

/**
 * Enseignes et nom commercial qui different du nom de la fiche, sans
 * doublon. L'ordre est stable : enseignes d'abord, nom commercial ensuite.
 */
export function nomsAlternatifs(pro: ProPourRegistre): { enseignes: string[]; nomCommercial: string | null } {
  const ref = normaliser(pro.name || "");
  const vus = new Set<string>([ref]);
  const enseignes: string[] = [];
  for (const e of Array.isArray(pro.enseignes) ? pro.enseignes : []) {
    if (typeof e !== "string") continue;
    const t = e.trim();
    const n = normaliser(t);
    if (!n || vus.has(n)) continue;
    vus.add(n);
    enseignes.push(t);
  }
  let nomCommercial: string | null = null;
  if (typeof pro.nom_commercial === "string") {
    const t = pro.nom_commercial.trim();
    const n = normaliser(t);
    if (n && !vus.has(n)) nomCommercial = t;
  }
  return { enseignes, nomCommercial };
}

/** Derniers comptes deposes : l'annee la plus recente qui porte au moins un chiffre. */
export function derniersComptes(
  finances: ProPourRegistre["finances"]
): { annee: string; ca: number | null; resultat: number | null } | null {
  if (!finances || typeof finances !== "object") return null;
  const annees = Object.keys(finances)
    .filter((a) => /^\d{4}$/.test(a))
    .sort()
    .reverse();
  for (const annee of annees) {
    const f = finances[annee];
    if (!f || typeof f !== "object") continue;
    // Un chiffre d'affaires a 0 avec un resultat renseigne = compte depose
    // sans CA exploitable (commentaire de la migration) : on ne montre que
    // le resultat. Un CA negatif ou absurde n'est pas un CA.
    const ca = typeof f.ca === "number" && Number.isFinite(f.ca) && f.ca > 0 ? Math.round(f.ca) : null;
    const resultat =
      typeof f.resultat_net === "number" && Number.isFinite(f.resultat_net) ? Math.round(f.resultat_net) : null;
    if (ca === null && resultat === null) continue;
    return { annee, ca, resultat };
  }
  return null;
}

/** "1 398 421 €" (espace fine insecable, comme partout sur le site). */
export function formatMontantEuros(n: number): string {
  return `${n.toLocaleString("fr-FR")} €`;
}

const LIBELLES_LABELS: Record<string, string> = {
  est_rge: "RGE (reconnu garant de l'environnement)",
  est_qualiopi: "Qualiopi",
  est_organisme_formation: "Organisme de formation",
  est_ess: "Économie sociale et solidaire",
  est_patrimoine_vivant: "Entreprise du patrimoine vivant",
};

/** Labels officiels lisibles, dans un ordre stable. `est_association` est
 *  volontairement absent : la forme juridique (9220) le dit deja. */
export function labelsOfficiels(labels: ProPourRegistre["labels_officiels"]): string[] {
  if (!labels || typeof labels !== "object") return [];
  return Object.keys(LIBELLES_LABELS)
    .filter((k) => labels[k] === true)
    .map((k) => LIBELLES_LABELS[k]);
}

/**
 * Categorie d'entreprise INSEE a afficher, ou null. ETI et GE toujours ;
 * PME seulement pour une societe (hors entrepreneur individuel, code 1000),
 * parce que « PME » sur un artisan seul n'apprend rien et se retrouve sur
 * 65 % des fiches enrichies.
 */
export function libelleCategorieEntreprise(pro: ProPourRegistre): string | null {
  const c = (pro.categorie_entreprise || "").toUpperCase();
  if (c === "GE") return "Grande entreprise";
  if (c === "ETI") return "Entreprise de taille intermédiaire (ETI)";
  if (c === "PME") {
    const forme = String(pro.forme_juridique || "").trim();
    return forme && forme !== "1000" ? "PME" : null;
  }
  return null;
}

export type FaitRegistre = {
  cle: "enseigne" | "nom_commercial" | "employeur" | "etablissements" | "categorie" | "comptes" | "labels";
  titre: string;
  valeur: string;
  /** Complement en petit, a droite de la valeur. */
  detail?: string;
};

/**
 * Cartes « Ce que dit le registre », dans l'ordre d'affichage. Liste vide =
 * aucune carte, la fiche garde son rendu d'avant. Ne contient PAS la date de
 * creation, l'effectif, l'activite ni la forme juridique : ces quatre cartes
 * existent deja sur la fiche (app/(public)/artisan/[slug]/page.tsx).
 */
export function faitsRegistre(pro: ProPourRegistre): FaitRegistre[] {
  if (!estEnrichieSirene(pro)) return [];
  const faits: FaitRegistre[] = [];

  const { enseignes, nomCommercial } = nomsAlternatifs(pro);
  if (enseignes.length > 0) {
    faits.push({
      cle: "enseigne",
      titre: enseignes.length > 1 ? "Enseignes" : "Enseigne",
      valeur: enseignes.join(" · "),
    });
  }
  if (nomCommercial) {
    faits.push({ cle: "nom_commercial", titre: "Nom commercial", valeur: nomCommercial });
  }

  // Employeur : seulement quand la tranche d'effectif n'est pas deja affichee
  // (la carte « Taille de l'equipe » le dit mieux), et seulement O.
  if (pro.caractere_employeur === "O" && !formatEffectifRange(pro.effectif_range)) {
    faits.push({ cle: "employeur", titre: "Salariés", valeur: "Établissement employeur", detail: "Sirene" });
  }

  const nb = typeof pro.nombre_etablissements === "number" ? pro.nombre_etablissements : 0;
  if (nb > 1) {
    faits.push({
      cle: "etablissements",
      titre: "Établissements",
      valeur: `${nb} établissements`,
      detail: "pour l'ensemble de l'entreprise",
    });
  }

  const categorie = libelleCategorieEntreprise(pro);
  if (categorie) {
    faits.push({ cle: "categorie", titre: "Catégorie d'entreprise", valeur: categorie, detail: "INSEE" });
  }

  const comptes = derniersComptes(pro.finances);
  if (comptes) {
    const parts: string[] = [];
    if (comptes.ca !== null) parts.push(`Chiffre d'affaires ${formatMontantEuros(comptes.ca)}`);
    if (comptes.resultat !== null) parts.push(`Résultat net ${formatMontantEuros(comptes.resultat)}`);
    faits.push({
      cle: "comptes",
      titre: `Comptes déposés ${comptes.annee}`,
      valeur: parts.join(" · "),
      detail: "Registre national des entreprises",
    });
  }

  const labels = labelsOfficiels(pro.labels_officiels);
  if (labels.length > 0) {
    faits.push({
      cle: "labels",
      titre: labels.length > 1 ? "Labels officiels" : "Label officiel",
      valeur: labels.join(" · "),
      detail: "d'après le registre officiel",
    });
  }

  return faits;
}

/** "3 septembre 2026" a partir d'un timestamptz, pour la ligne de source. */
export function formatDateMaj(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
}

/** Ordinal francais : 1er/1re, 2e, 3e... */
export function ordinalFr(n: number, feminin: boolean): string {
  if (n === 1) return feminin ? "1re" : "1er";
  return `${n}e`;
}

/** "1,2 km", "850 m" : jamais "0,0 km". */
export function formatDistanceKm(km: number): string {
  if (km < 0.1) return "moins de 100 m";
  if (km < 1) return `${Math.round(km * 100) * 10} m`;
  return `${km.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
}

/**
 * Le titre et la description que Google affiche pour une fiche OUVERTE.
 *
 * POURQUOI (mesure du 04/09/2026, 148 868 affichages) : les fiches
 * d'etablissements FERMES, refaites le 02/09, recoivent 43 % de clics en plus
 * que les fiches ouvertes, a position egale. Elles annoncent des faits, les
 * ouvertes servaient « Untel, Plombier a Tulle. Contactez ce professionnel
 * gratuitement. », qui ne dit rien de plus que le titre. On aligne l'ouvert sur
 * ce qui convertit, avec les memes sources : le registre, rien d'autre.
 *
 * Ce que la fonction NE fait PAS : elle ne remplace jamais la description
 * ecrite par le professionnel lui-meme, ni celle generee pour sa fiche. Elle
 * ne sert que de repli, la ou il n'y avait qu'une phrase vide.
 *
 * Le titre porte l'annee de creation quand elle tient : Google coupe au-dela
 * d'environ 65 caracteres, et un nom long mangerait deja la ville.
 */
export type FaitsFicheOuverte = {
  nom: string;
  metierSingulier: string;
  ville: string;
  codePostal?: string | null;
  pays?: string | null;
  dateCreation?: string | null;
  formeJuridiqueCode?: string | null;
};

const LONGUEUR_TITRE_MAX = 65;
const LONGUEUR_DESC_MAX = 158;

/**
 * Espaces normalises. 4 185 noms en base portent un double espace herite du
 * registre ("Bureau d'architectes  DOYEN") : on ne touche pas a la colonne
 * (une reecriture de masse reordonne la table, cf. lecon du 03/09), on
 * nettoie a l'affichage.
 */
function nettoyer(t: string): string {
  return t.replace(/\s+/g, " ").trim();
}

/** Coupe a la derniere phrase entiere, jamais en plein mot. */
function couperPhrase(texte: string, max: number): string {
  if (texte.length <= max) return texte;
  const bout = texte.slice(0, max);
  const point = bout.lastIndexOf(". ");
  if (point > max * 0.6) return bout.slice(0, point + 1);
  const espace = bout.lastIndexOf(" ");
  return `${bout.slice(0, espace > 0 ? espace : max)}...`;
}

/** "13 juillet 2007", avec "1er" au lieu de "1" pour le premier du mois. */
export function dateEnToutesLettres(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const jour = d.getUTCDate();
  const mois = d.toLocaleDateString("fr-FR", { month: "long", timeZone: "UTC" });
  return `${jour === 1 ? "1er" : jour} ${mois} ${d.getUTCFullYear()}`;
}

export function titreFicheOuverte(
  f: FaitsFicheOuverte,
  metierAffiche: string,
  autreNom?: string | null
): string {
  const base = `${nettoyer(f.nom)}${autreNom ? ` (${nettoyer(autreNom)})` : ""} - ${metierAffiche}${f.ville ? ` à ${f.ville}` : ""}`;
  const d = f.dateCreation ? new Date(f.dateCreation) : null;
  const annee = d && !Number.isNaN(d.getTime()) ? d.getUTCFullYear() : null;
  if (!annee) return base;
  const avecAnnee = `${base}, depuis ${annee}`;
  return avecAnnee.length <= LONGUEUR_TITRE_MAX ? avecAnnee : base;
}

export function descriptionFicheOuverte(f: FaitsFicheOuverte): string {
  const ou = f.ville ? ` à ${f.ville}` : "";
  const cp = f.codePostal ? ` (${f.codePostal})` : "";
  const tete = `${nettoyer(f.nom)}, ${f.metierSingulier}${ou}${cp}.`;

  // Ordre de valeur decroissante : ce qui saute en premier a la troncature est
  // ce qui compte le moins. Un nom long ne doit jamais couter l'appel a
  // l'action, seul bout de la phrase qui fait cliquer.
  const milieu: string[] = [];
  const creation = dateEnToutesLettres(f.dateCreation);
  if (creation) {
    const d = new Date(f.dateCreation as string);
    const ans = new Date().getUTCFullYear() - d.getUTCFullYear();
    milieu.push(
      ans >= 1
        ? `Entreprise créée le ${creation}, ${ans} ${ans > 1 ? "ans" : "an"} d'activité.`
        : `Entreprise créée le ${creation}.`
    );
  }
  const forme = formeJuridiqueDistinctive(f.formeJuridiqueCode);
  if (forme) milieu.push(`${forme}.`);
  // Belgique : ces entreprises ont un numero BCE, pas un SIRET. L'annoncer
  // faux serait une erreur de fait sur 100 % des fiches belges.
  milieu.push(
    f.pays === "BE"
      ? "Numéro d'entreprise vérifié à la BCE."
      : "SIRET vérifié au registre officiel."
  );

  const queue = "Demandez un devis gratuitement.";
  const garde = [...milieu];
  while (garde.length && [tete, ...garde, queue].join(" ").length > LONGUEUR_DESC_MAX) {
    garde.pop();
  }
  const phrase = [tete, ...garde, queue].join(" ");
  return phrase.length <= LONGUEUR_DESC_MAX ? phrase : couperPhrase(phrase, LONGUEUR_DESC_MAX);
}
