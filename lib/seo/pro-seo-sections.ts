/**
 * Contenu SEO/AEO UNIQUE par fiche pro, 100% factuel (Sirene + prix sourcés),
 * zéro invention. Conçu pour sortir les ~1M fiches du "squelette" et les rendre
 * indexables/uniques SANS dupliquer le contenu des pages listing /[metier]/[ville]
 * (ici on parle de CETTE entreprise : nom, SIRET, ancienneté, ville).
 *
 * Coût : 0 $ (assemblage de données existantes, pas d'appel IA).
 */
import { SOURCED_PRICES } from "@/lib/data/sourced-prices";
import { SOURCED_PRICES_BE } from "@/lib/data/sourced-prices-be";
import { libelleNaf } from "@/lib/data/naf-labels";
import { formeJuridiqueDistinctive } from "@/lib/data/formes-juridiques";
import { formatDateCreation, formatEffectifRange } from "@/lib/utils/sirene";
import { getCategoryListing } from "@/lib/utils/category-grammar";
import {
  dateSireneFaitFoi,
  derniersComptes,
  estEnrichieSirene,
  formatDistanceKm,
  formatMontantEuros,
  labelsOfficiels,
  libelleCategorieEntreprise,
  nomsAlternatifs,
  ordinalFr,
} from "@/lib/seo/pro-registre";
import type { ReperesFiche } from "@/lib/queries/pros";

type ProForContent = {
  /** Sert uniquement a varier la tournure des phrases d'une fiche a l'autre. */
  id?: number | null;
  name: string;
  siret?: string | null;
  claimed_by_user_id?: string | null;
  founded_year?: number | null;
  founding_date?: string | null;
  // Annuaire des entreprises (migration 2026-09-02). Absentes = pas de donnee.
  sirene_enrichi_at?: string | null;
  effectif_range?: string | null;
  enseignes?: string[] | null;
  nom_commercial?: string | null;
  caractere_employeur?: string | null;
  nombre_etablissements?: number | null;
  categorie_entreprise?: string | null;
  finances?: Record<string, { ca: number | null; resultat_net: number | null }> | null;
  labels_officiels?: Record<string, true> | null;
  /** Code d'activité principale (NAF rév. 2), tel que stocké par le scrape. */
  naf_code?: string | null;
  /** Code de catégorie juridique INSEE à 4 chiffres (1000 = entreprise individuelle). */
  forme_juridique?: string | null;
  /** Adresse de l'établissement (rue), telle que fournie par le registre. */
  address?: string | null;
  phone?: string | null;
  /** État de l'établissement au registre : 'F' = fermé. Colonne absente = ouvert. */
  etat_admin?: string | null;
  /** Date de fermeture de l'établissement (YYYY-MM-DD), null ou absente si inconnue. */
  date_fermeture?: string | null;
  /** État de l'unité légale : 'A' = existe encore ailleurs, 'C' = cessée. */
  entreprise_etat?: string | null;
  entreprise_date_fermeture?: string | null;
  category?: { name?: string | null; slug?: string | null } | null;
  city?: {
    name?: string | null;
    slug?: string | null;
    country?: string | null;
    department?: { name?: string | null; country?: string | null } | null;
  } | null;
};

export type ProFaq = {
  question: string;
  answer: string;
  /** Liens affichés sous la réponse (fiche fermée : listing + dépôt de projet). Absents sur une fiche ouverte. */
  links?: { label: string; href: string }[];
};
export type ProContent = { about: string; faqs: ProFaq[]; sourcesNote: string };

function getYear(pro: ProForContent): number | null {
  // Fiche enrichie par l'annuaire et non reclamee : la date de creation de
  // l'entreprise (founding_date) fait foi, meme si founded_year (date de
  // l'etablissement, backfill Stock) en differe. Cf. lib/seo/pro-registre.ts.
  const anneeSirene = pro.founding_date ? Number(String(pro.founding_date).slice(0, 4)) : NaN;
  if (dateSireneFaitFoi(pro) && !Number.isNaN(anneeSirene) && anneeSirene > 1800) return anneeSirene;
  if (pro.founded_year && pro.founded_year > 1800) return pro.founded_year;
  if (!Number.isNaN(anneeSirene) && anneeSirene > 1800) return anneeSirene;
  return null;
}

/**
 * @param reperes  Reperes calcules en base pour une fiche enrichie
 *                 (getReperesFiche). Absents ou null : aucune phrase ajoutee,
 *                 le texte est identique a celui d'avant le 03/09/2026.
 */
export function buildProContent(pro: ProForContent, reperes?: ReperesFiche | null): ProContent | null {
  const name = (pro.name || "").trim();
  const catName = pro.category?.name || null;
  const cityName = pro.city?.name || null;
  // Sans nom + métier + ville, pas de contenu sensé : on s'abstient (pas d'invention).
  if (!name || !catName || !cityName) return null;

  const catLower = catName.toLowerCase();
  const deptName = pro.city?.department?.name || null;
  const year = getYear(pro);
  const anc = year ? new Date().getFullYear() - year : 0;

  // Date de creation COMPLETE ("12 mars 2009") plutot que la seule annee.
  // Mesure du 20/08/2026 : 24 annees distinctes pour 40 voisins, mais 300
  // jours calendaires distincts pour 1000 fiches. C'est donc le fait gratuit
  // le plus discriminant dont on dispose, et il couvre 93,8 % des fiches.
  //
  // Garde-fou : founded_year est EDITABLE par le pro dans son tableau de
  // bord et prime sur la date Sirene. Si les deux se contredisent, on
  // retombe sur l'annee, pour ne jamais afficher une date que le pro a
  // lui-meme corrigee.
  const dateSirene = formatDateCreation(pro.founding_date);
  const anneeSirene = pro.founding_date ? Number(String(pro.founding_date).slice(0, 4)) : null;
  const dateCreation = dateSirene && (!year || year === anneeSirene) ? dateSirene : null;
  // "le 12 mars 2009" ou, a defaut, "2009".
  const quand = dateCreation ? `le ${dateCreation}` : year ? String(year) : null;

  // Belgique : registre = Banque-Carrefour des Entreprises (BCE), pas Sirene/INSEE.
  // Obligation d'attribution de la licence BCE (art. 2.8) + signal "site belge".
  const isBE = pro.city?.department?.country === "BE";
  const registreNom = isBE ? "la Banque-Carrefour des Entreprises (BCE)" : "le répertoire Sirene de l'INSEE";
  // 17/08/2026 : la phrase disait "inscrite A LE répertoire Sirene", une faute
  // de français servie a l'identique sur 2,5 millions de pages. On porte donc
  // la preposition correcte avec le nom du registre.
  const registreAvecPrep = isBE
    ? "à la Banque-Carrefour des Entreprises (BCE)"
    : "au répertoire Sirene de l'INSEE";
  const numLabel = isBE ? "numéro d'entreprise" : "SIRET";

  // Libellé officiel du code d'activité (table figée INSEE, aucun appel
  // exterieur, aucun cout). Present sur 2 050 350 fiches.
  const activite = libelleNaf(pro.naf_code);
  // Forme juridique. Mesure du 20/08 sur 4 000 fiches reparties dans toute
  // la base : 94,6 % de NOS artisans sont "entrepreneur individuel" (le
  // fichier national de l'INSEE annonce 67 %, mais il compte toutes les
  // entreprises, pas seulement les artisans). L'afficher partout reviendrait
  // donc a recopier la meme phrase sur 2,3 millions de pages, c'est-a-dire a
  // aggraver la cause mesuree de notre non-indexation. On ne la garde que
  // sur les 5,4 % ou elle apprend quelque chose (SAS, SARL, SCI, association).
  const forme = formeJuridiqueDistinctive(pro.forme_juridique);

  // ── LES FAITS PROPRES A CETTE ENTREPRISE ──
  // 17/08/2026. Mesure : deux artisans du meme metier dans la meme ville
  // partageaient 80 % de texte identique, et 466 mots sur 816 venaient de
  // blocs de gabarit calques sur "metier + ville". Les appels a l'action
  // restent INTACTS (ce sont eux qui convertissent, decision Willy) : c'est
  // le texte AUTOUR qui doit parler de CETTE entreprise et d'aucune autre.
  //
  // On tisse donc dans chaque reponse les seules donnees qui changent
  // vraiment d'un voisin a l'autre : la rue, l'annee de creation, le numero
  // officiel, l'activite declaree. Mesure de reference : sur 40 pros d'un
  // meme groupe ville x metier, on compte 24 annees de creation distinctes
  // pour seulement 2 codes d'activite. L'anciennete est donc le meilleur
  // discriminant dont on dispose gratuitement.
  const rue = (pro.address || "").trim() || null;
  // "installée 12 rue des Lilas" / "installée à Sanary-sur-Mer" en repli.
  const situee = rue ? `installée ${rue} à ${cityName}` : `installée à ${cityName}`;
  const depuis = quand
    ? anc >= 1
      ? `exerce depuis ${quand}, soit ${anc} ${anc > 1 ? "ans" : "an"} d'activité`
      : `exerce depuis ${quand}`
    : null;

  // ── ÉTABLISSEMENT FERMÉ (02/09/2026) ──
  // 45 % des fiches sont des établissements fermés d'après Sirene. La page
  // reste en ligne et dit la vérité : ici, plus aucune phrase qui invite à
  // contacter CETTE entreprise ou à lui demander un devis. Le texte reste
  // factuel (création, fermeture, métier, ville) et renvoie vers les pros
  // en activité. Tout ce qui s'affiche vient d'une colonne en base.
  if (pro.etat_admin === "F") {
    const listing = getCategoryListing(pro.category?.slug || "", catName);
    const dateFermeture = formatDateCreation(pro.date_fermeture);
    const depuisFermeture = dateFermeture ? ` depuis le ${dateFermeture}` : "";
    // "créée le 12 mars 2009" ou "créée en 2009".
    const creation = dateCreation ? `le ${dateCreation}` : year ? `en ${year}` : null;
    const dateCessation = formatDateCreation(pro.entreprise_date_fermeture);
    const entreprise =
      pro.entreprise_etat === "A"
        ? " L'entreprise poursuit son activité dans un autre établissement."
        : pro.entreprise_etat === "C"
          ? ` L'entreprise elle-même a cessé son activité${dateCessation ? ` le ${dateCessation}` : ""}.`
          : "";
    const citySlug = pro.city?.slug || null;
    const hrefListing = pro.category?.slug && citySlug ? `/${pro.category.slug}/${citySlug}` : null;
    const hrefDepot =
      `/deposer-projet` +
      (pro.category?.slug
        ? `?categorie=${pro.category.slug}${citySlug ? `&ville=${citySlug}` : ""}`
        : "");

    const aboutFerme: string[] = [
      `${name} est référencé sur Workwave comme ${catLower} à ${cityName}${deptName ? ` (${deptName})` : ""}.`,
      `D'après ${registreNom}, cet établissement est fermé${depuisFermeture}${creation ? ` ; il avait été créé ${creation}` : ""}.`,
    ];
    if (pro.siret) aboutFerme.push(`Son ${numLabel} est le ${pro.siret}.`);
    if (activite) aboutFerme.push(`Son activité déclarée était : ${activite}.`);
    if (entreprise) aboutFerme.push(entreprise.trim());
    aboutFerme.push(
      `Les ${listing.plural} en activité à ${cityName} sont référencés sur Workwave, où vous pouvez déposer votre projet gratuitement.`
    );

    const faqsFerme: ProFaq[] = [
      {
        question: `Cette entreprise est-elle toujours en activité ?`,
        answer:
          `Non. D'après ${registreNom}, l'établissement ${name} à ${cityName}${pro.siret ? ` (${numLabel} ${pro.siret})` : ""} est fermé${depuisFermeture}.` +
          entreprise,
      },
      {
        question: `Comment trouver ${listing.article} ${listing.singular} en activité à ${cityName} ?`,
        answer:
          `Consultez la liste des ${listing.plural} à ${cityName} sur Workwave, ou déposez votre projet gratuitement : ` +
          `les ${listing.plural} en activité à ${cityName} et alentours le reçoivent et vous répondent.`,
        links: [
          ...(hrefListing ? [{ label: `Voir les ${listing.plural} à ${cityName}`, href: hrefListing }] : []),
          { label: "Déposer mon projet", href: hrefDepot },
        ],
      },
      {
        question: `${name} est-elle une entreprise vérifiée ?`,
        answer:
          `${name} était inscrite ${registreAvecPrep}${pro.siret ? ` (${numLabel} ${pro.siret})` : ""}${creation ? `, créée ${creation}` : ""}${activite ? `, sous l'activité « ${activite} »` : ""}. ` +
          `Le registre indique aujourd'hui un établissement fermé${depuisFermeture}. Workwave affiche cet état tel qu'il figure au registre.`,
      },
    ];

    const sourcesNoteFerme = isBE
      ? `Informations société et état de l'établissement issus de la Banque-Carrefour des Entreprises (BCE, SPF Économie).`
      : `Informations société et état de l'établissement issus du répertoire Sirene (INSEE).`;

    return { about: aboutFerme.join(" "), faqs: faqsFerme, sourcesNote: sourcesNoteFerme };
  }

  // ── « À propos » : prose factuelle, unique par pro (nom/métier/ville/SIRET/année) ──
  const aboutParts: string[] = [
    `${name} est référencé comme ${catLower} à ${cityName}${deptName ? ` (${deptName})` : ""} sur Workwave.`,
  ];
  const facts: string[] = [];
  if (pro.siret) facts.push(`inscrite ${registreAvecPrep} sous le ${numLabel} ${pro.siret}`);
  if (quand) facts.push(`active depuis ${quand}${anc >= 1 ? ` (${anc} ${anc > 1 ? "ans" : "an"} d'activité)` : ""}`);
  if (facts.length > 0) aboutParts.push(`Cette entreprise est ${facts.join(", ")}.`);
  if (activite) {
    aboutParts.push(
      `Son activité déclarée ${isBE ? "à la BCE" : "au répertoire Sirene"} est : ${activite}.`
    );
  }
  if (forme) {
    aboutParts.push(`Elle est enregistrée sous la forme juridique : ${forme}.`);
  }

  // ── FAITS DE L'ANNUAIRE DES ENTREPRISES + REPÈRES CALCULÉS (03/09/2026) ──
  // Uniquement sur une fiche enrichie (sirene_enrichi_at) : une fiche non
  // enrichie garde mot pour mot le texte d'avant. Chaque phrase n'existe que
  // si la donnée existe ; la tournure alterne selon la parité de l'id pour
  // que deux voisines enrichies ne produisent pas la même phrase avec deux
  // nombres différents. Aucun chiffre ici n'est estimé : colonnes en base
  // ou comptes faits en base (lib/queries/pros.ts, getReperesFiche).
  const enrichie = estEnrichieSirene(pro);
  const variante = Math.abs(Number(pro.id) || 0) % 2;
  const listing = getCategoryListing(pro.category?.slug || "", catName);
  const feminin = listing.article === "une";
  const { enseignes, nomCommercial } = enrichie ? nomsAlternatifs(pro) : { enseignes: [], nomCommercial: null };
  const comptes = enrichie ? derniersComptes(pro.finances) : null;
  const labels = enrichie ? labelsOfficiels(pro.labels_officiels) : [];
  const effectif = enrichie ? formatEffectifRange(pro.effectif_range) : null;
  const categorieEntreprise = enrichie ? libelleCategorieEntreprise(pro) : null;
  const nbEtab = enrichie && typeof pro.nombre_etablissements === "number" ? pro.nombre_etablissements : 0;
  const guillemets = (s: string) => `« ${s} »`;

  if (enrichie) {
    if (enseignes.length > 0 && nomCommercial) {
      aboutParts.push(
        `Elle exerce sous l'enseigne ${enseignes.map(guillemets).join(" et ")} et le nom commercial ${guillemets(nomCommercial)}.`
      );
    } else if (enseignes.length > 1) {
      aboutParts.push(`Elle exerce sous les enseignes ${enseignes.map(guillemets).join(" et ")}.`);
    } else if (enseignes.length === 1) {
      aboutParts.push(
        variante === 0
          ? `Elle exerce sous l'enseigne ${guillemets(enseignes[0])}.`
          : `Son enseigne déclarée est ${guillemets(enseignes[0])}.`
      );
    } else if (nomCommercial) {
      aboutParts.push(
        variante === 0
          ? `Elle est connue sous le nom commercial ${guillemets(nomCommercial)}.`
          : `Son nom commercial déclaré est ${guillemets(nomCommercial)}.`
      );
    }

    if (effectif) {
      aboutParts.push(
        effectif.startsWith("0 ")
          ? `Elle n'a pas de salarié d'après l'INSEE.`
          : `Elle compte ${effectif} d'après l'INSEE.`
      );
    } else if (pro.caractere_employeur === "O") {
      aboutParts.push(`Sirene la classe parmi les établissements employeurs.`);
    }
    if (nbEtab > 1) {
      aboutParts.push(
        variante === 0
          ? `L'entreprise compte ${nbEtab} établissements au total.`
          : `Au total, l'entreprise regroupe ${nbEtab} établissements.`
      );
    }
    if (categorieEntreprise) {
      aboutParts.push(
        categorieEntreprise === "PME"
          ? `L'INSEE la classe parmi les PME.`
          : categorieEntreprise === "Grande entreprise"
            ? `L'INSEE la classe parmi les grandes entreprises.`
            : `L'INSEE la classe parmi les entreprises de taille intermédiaire (ETI).`
      );
    }
    if (comptes) {
      const ca = comptes.ca !== null ? `d'un chiffre d'affaires de ${formatMontantEuros(comptes.ca)}` : null;
      const res = comptes.resultat !== null ? `d'un résultat net de ${formatMontantEuros(comptes.resultat)}` : null;
      aboutParts.push(
        `Ses derniers comptes déposés (exercice ${comptes.annee}) font état ${[ca, res].filter(Boolean).join(" et ")}.`
      );
    }
    if (labels.length > 0) {
      aboutParts.push(
        labels.length > 1
          ? `Le registre officiel lui reconnaît les labels ${labels.join(", ")}.`
          : `Le registre officiel lui reconnaît le label ${labels[0]}.`
      );
    }
  }

  const rang = reperes?.rangAnciennete ?? null;
  const confreres = reperes?.confreres ?? null;
  if (rang) {
    // Si toutes les fiches de la commune ne sont pas datées (80 à 99 %), le
    // dénominateur est nommé pour ce qu'il est : les fiches datées.
    const exact = rang.total === rang.totalCommune;
    const denominateur = exact
      ? `${rang.total} ${listing.plural} en activité de ${cityName}`
      : `${rang.total} ${listing.plural} de ${cityName} dont la date de création est connue (sur ${rang.totalCommune} en activité)`;
    if (rang.rang === 1) {
      aboutParts.push(
        `Par sa date de création, c'est ${feminin ? "la plus ancienne" : "le plus ancien"} des ${denominateur}.`
      );
    } else {
      aboutParts.push(
        variante === 0
          ? `Par sa date de création, elle se classe ${ordinalFr(rang.rang, feminin)} sur les ${denominateur}, du plus ancien au plus récent.`
          : `Parmi les ${denominateur}, c'est ${feminin ? "la" : "le"} ${ordinalFr(rang.rang, feminin)} plus ${feminin ? "ancienne" : "ancien"}.`
      );
    }
  }
  if (confreres) {
    const n = confreres.total;
    const proches = confreres.plusProches
      .map((p) => `${p.name} (${formatDistanceKm(p.distanceKm)})`)
      .join(", ");
    if (n === 0) {
      aboutParts.push(
        `Aucun${feminin ? "e" : ""} autre ${listing.singular} en activité n'est référencé${feminin ? "e" : ""} sur Workwave dans les communes à moins de 10 km.`
      );
    } else {
      const nom = n > 1 ? listing.plural : listing.singular;
      const tete =
        variante === 0
          ? `${n} autre${n > 1 ? "s" : ""} ${nom} ${n > 1 ? "sont" : "est"} en activité dans les communes à moins de 10 km`
          : `Dans les communes à moins de 10 km, Workwave référence ${n} autre${n > 1 ? "s" : ""} ${nom} en activité`;
      aboutParts.push(proches ? `${tete}, dont ${proches}.` : `${tete}.`);
    }
  }
  if (reperes?.distanceCentreKm != null) {
    aboutParts.push(`Son adresse se situe à ${formatDistanceKm(reperes.distanceCentreKm)} du centre de ${cityName}.`);
  }

  aboutParts.push(
    `Pour comparer les ${catLower}s à ${cityName} et recevoir des devis gratuits, déposez votre projet sur Workwave : la mise en relation est gratuite et sans engagement.`
  );
  const about = aboutParts.join(" ");

  // ── FAQ propre à CETTE entreprise (factuelle + signal AEO/FAQPage) ──
  // Chaque réponse ouvre sur un fait qui n'appartient qu'à cette entreprise
  // (rue, année, numéro officiel, activité) AVANT la phrase d'appel à
  // l'action, qui elle reste identique et intacte partout : c'est elle qui
  // convertit, et on ne la touche pas.
  const faqs: ProFaq[] = [
    {
      question: `Comment contacter ${name} ?`,
      answer:
        `${name} est ${situee}${depuis ? ` et ${depuis}` : ""}. ` +
        (pro.phone
          ? `Ses coordonnées sont affichées sur cette fiche. Vous pouvez aussi déposer votre projet sur Workwave pour être recontacté par ce ${catLower} et d'autres professionnels de ${cityName}.`
          : `Déposez votre projet sur Workwave (gratuit, 60 secondes) : ${name} et d'autres ${catLower}s de ${cityName} pourront étudier votre demande et vous recontacter.`),
    },
    {
      question: `${name} est-elle une entreprise vérifiée ?`,
      answer: `${name} est une entreprise inscrite ${registreAvecPrep}${pro.siret ? ` (${numLabel} ${pro.siret})` : ""}${quand ? `, active depuis ${quand}` : ""}${activite ? `, sous l'activité « ${activite} »` : ""}. Workwave ne référence que des entreprises disposant d'un identifiant officiel valide.`,
    },
  ];

  // Ancienneté : la donnée la plus discriminante dont on dispose (24 valeurs
  // distinctes pour 40 pros d'un même groupe ville x métier, mesuré le 17/08).
  if (year && anc >= 1) {
    faqs.push({
      question: `Depuis combien de temps ${name} exerce-t-elle ?`,
      answer:
        `${name} est enregistrée depuis ${quand}, soit ${anc} ${anc > 1 ? "ans" : "an"} d'activité` +
        `${rue ? `, à l'adresse ${rue} à ${cityName}` : ` à ${cityName}`}. ` +
        `Cette date est celle ${isBE ? "de la BCE" : "du répertoire Sirene de l'INSEE"} et non une information déclarative.`,
    });
  }

  const sourced = pro.category?.slug ? (isBE ? SOURCED_PRICES_BE : SOURCED_PRICES)[pro.category.slug] : undefined;
  if (sourced && sourced.ranges.length >= 2) {
    const ex = sourced.ranges
      .slice(0, 2)
      .map((r) => `${r.label.toLowerCase()} (${r.range})`)
      .join(", ");
    faqs.push({
      question: `Quels sont les tarifs de ${name} ?`,
      answer:
        `${name} fixe librement ses prix : Workwave ne les publie pas et n'intervient pas dessus. ` +
        `À titre de repère pour un ${catLower}, les tarifs dépendent de la prestation, par exemple ${ex}. ` +
        `Ces fourchettes sont indicatives (sources web ${sourced.retrievedAt}), demandez un devis à ${name} pour une estimation précise.`,
    });
  }

  // ── Questions propres à une fiche enrichie (03/09/2026). Chacune n'existe
  // que si la donnée existe ; une fiche non enrichie n'en reçoit aucune. ──
  if (enseignes.length > 0 || nomCommercial) {
    const autre = enseignes[0] || (nomCommercial as string);
    const nature = enseignes.length > 0 ? "l'enseigne déclarée" : "le nom commercial déclaré";
    faqs.push({
      question: `${autre} et ${name}, est-ce la même entreprise ?`,
      answer:
        `Oui. ${guillemets(autre)} est ${nature} de l'établissement de ${name} à ${cityName}` +
        `${pro.siret ? ` (${numLabel} ${pro.siret})` : ""}, d'après le registre Sirene. ` +
        `Les deux noms désignent la même entreprise.`,
    });
  }
  if (comptes) {
    const ca = comptes.ca !== null ? `un chiffre d'affaires de ${formatMontantEuros(comptes.ca)}` : null;
    const res = comptes.resultat !== null ? `un résultat net de ${formatMontantEuros(comptes.resultat)}` : null;
    faqs.push({
      question:
        comptes.ca !== null
          ? `Quel est le chiffre d'affaires de ${name} ?`
          : `${name} publie-t-elle ses comptes ?`,
      answer:
        `D'après les comptes déposés au Registre national des entreprises pour l'exercice ${comptes.annee}, ` +
        `${name} affiche ${[ca, res].filter(Boolean).join(" et ")}. ` +
        `Ces chiffres sont ceux du dépôt officiel, pas une estimation de Workwave.`,
    });
  }
  if (confreres && confreres.total > 0) {
    const n = confreres.total;
    const nom = n > 1 ? listing.plural : listing.singular;
    const proches = confreres.plusProches;
    faqs.push({
      // La question ne promet « les plus proches » que si la réponse les nomme.
      question:
        proches.length > 0
          ? `Quels sont les ${listing.plural} les plus proches de ${name} ?`
          : `Combien de ${listing.plural} exercent près de ${name} ?`,
      answer:
        `Dans les communes à moins de 10 km de ${name}, Workwave référence ${n} autre${n > 1 ? "s" : ""} ${nom} en activité` +
        (proches.length > 0
          ? `. Parmi les adresses géolocalisées, ${proches.length > 1 ? "les plus proches sont" : "la plus proche est"} ${proches
              .map((p) => `${p.name}${p.cityName ? ` à ${p.cityName}` : ""} (${formatDistanceKm(p.distanceKm)})`)
              .join(", ")}. `
          : ". ") +
        `Déposez votre projet sur Workwave pour les comparer gratuitement.`,
      ...(proches.length > 0
        ? { links: proches.map((p) => ({ label: p.name, href: `/artisan/${p.slug}` })) }
        : {}),
    });
  }

  faqs.push({
    question: `Comment obtenir un devis de ${name} ?`,
    answer:
      `Déposez votre projet sur Workwave en 60 secondes (gratuit, sans engagement). ` +
      `${name}${pro.siret ? `, ${numLabel} ${pro.siret}` : ""}${rue ? `, ${rue}` : ""}, ` +
      `et d'autres ${catLower}s de ${cityName} pourront vous proposer un devis.`,
  });

  const sourcesNote =
    (isBE
      ? `Informations société issues de la Banque-Carrefour des Entreprises (BCE, SPF Économie)`
      : enrichie
        ? `Informations société issues du répertoire Sirene (INSEE) et du Registre national des entreprises`
        : `Informations société issues du répertoire Sirene (INSEE)`) +
    (reperes && (reperes.rangAnciennete || reperes.confreres)
      ? ` · rang et voisinage calculés sur les fiches en activité référencées sur Workwave`
      : "") +
    (sourced ? ` · tarifs indicatifs d'après des sources web (${sourced.retrievedAt})` : "") +
    `.`;

  return { about, faqs, sourcesNote };
}
