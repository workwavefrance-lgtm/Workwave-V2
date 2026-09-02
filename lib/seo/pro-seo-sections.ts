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
import { formatDateCreation } from "@/lib/utils/sirene";
import { getCategoryListing } from "@/lib/utils/category-grammar";

type ProForContent = {
  name: string;
  siret?: string | null;
  founded_year?: number | null;
  founding_date?: string | null;
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
  if (pro.founded_year && pro.founded_year > 1800) return pro.founded_year;
  if (pro.founding_date) {
    const y = new Date(pro.founding_date).getFullYear();
    if (!Number.isNaN(y) && y > 1800) return y;
  }
  return null;
}

export function buildProContent(pro: ProForContent): ProContent | null {
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
      : `Informations société issues du répertoire Sirene (INSEE)`) +
    (sourced ? ` · tarifs indicatifs d'après des sources web (${sourced.retrievedAt})` : "") +
    `.`;

  return { about, faqs, sourcesNote };
}
