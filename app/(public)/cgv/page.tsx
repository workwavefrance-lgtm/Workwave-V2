import type { Metadata } from "next";
import LegalDoc, { type LegalSection } from "@/components/legal/LegalDoc";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente",
  description:
    "Conditions Générales de Vente de la plateforme Workwave : service de mise en relation et de déblocage de leads pour les professionnels.",
  alternates: { canonical: "https://workwave.fr/cgv" },
};

const LAST_UPDATED = "19 juillet 2026";

const SECTIONS: LegalSection[] = [
  {
    title: "1. Objet et champ d'application",
    blocks: [
      { p: "Les présentes Conditions Générales de Vente (les « CGV ») régissent les services payants proposés par la plateforme Workwave (la « Plateforme »), éditée par l'éditeur identifié dans les [Mentions légales](/mentions-legales) (ci-après « Workwave »), aux professionnels qui les utilisent (le « Professionnel »)." },
      { p: "Workwave est une plateforme de mise en relation entre des particuliers ayant un besoin de travaux ou de services (le « Particulier ») et des professionnels susceptibles d'y répondre. Toute utilisation d'un service payant implique l'acceptation pleine et entière des présentes CGV. Le Professionnel reconnaît agir dans le cadre de son activité professionnelle." },
    ],
  },
  {
    title: "2. Définitions",
    blocks: [
      {
        ul: [
          "**Projet** : une demande déposée par un Particulier sur la Plateforme, décrivant un besoin de travaux ou de services.",
          "**Lead** : un Projet d'un Particulier, accompagné de ses coordonnées de contact, mis à disposition d'un Professionnel.",
          "**Déblocage** : l'action par laquelle un Professionnel accède, contre paiement, aux coordonnées du Particulier liées à un Lead.",
        ],
      },
    ],
  },
  {
    title: "3. Service de déblocage de Lead (paiement à l'unité)",
    blocks: [
      { p: "Le Professionnel peut, à son initiative, débloquer un Lead afin d'obtenir les coordonnées du Particulier (nom, téléphone, e-mail et, le cas échéant, précisions sur le Projet) telles que déclarées par ce dernier lors du dépôt de sa demande." },
      { p: "Le service vendu consiste **exclusivement** en la mise à disposition de ces coordonnées et en la mise en relation qui en résulte. Il ne comprend ni la réalisation des travaux, ni l'établissement d'un devis, ni aucune garantie quant à la suite donnée par le Particulier." },
    ],
  },
  {
    title: "4. Prix et paiement",
    blocks: [
      { p: "Le prix de chaque Déblocage est de **9,90 € par Lead**. **TVA non applicable, article 293 B du Code général des impôts** (franchise en base) : le prix de 9,90 € est un **prix net**, non majoré de TVA. Le prix applicable est celui affiché au moment du Déblocage. Le paiement est exigible immédiatement et s'effectue par carte bancaire via notre prestataire de paiement sécurisé Stripe. L'accès aux coordonnées est délivré dès la confirmation du paiement." },
    ],
  },
  {
    title: "5. Nature de la prestation et absence de garantie de résultat",
    blocks: [
      { p: "Le Déblocage constitue une prestation de **mise en relation**, soumise à une **obligation de moyens** et non de résultat. Workwave fournit au Professionnel des coordonnées déclarées par le Particulier ; elle n'intervient pas dans les échanges ultérieurs entre eux." },
      { p: "Workwave **ne garantit en aucune manière** que le Particulier :" },
      {
        ul: [
          "répondra aux appels, e-mails, SMS ou messages du Professionnel ;",
          "décrochera son téléphone ou rappellera ;",
          "sera joignable ou disponible ;",
          "maintiendra sa demande ou son intérêt ;",
          "n'aura pas déjà retenu un autre professionnel ;",
          "acceptera un devis, signera un contrat ou donnera suite au Projet.",
        ],
      },
      { p: "Le Particulier demeure entièrement **libre** de répondre ou non au Professionnel. Workwave n'a aucun moyen de le contraindre à décrocher, à répondre ou à donner suite, et ne saurait être tenue responsable de son comportement, de son inertie ou de son absence de réponse." },
    ],
  },
  {
    title: "6. Caractère définitif du Déblocage — absence de remboursement",
    blocks: [
      { p: "Chaque Déblocage est **ferme et définitif**. Le Professionnel agit dans le cadre de son activité professionnelle : s'agissant de l'achat d'un Lead relevant de son activité, le droit de rétractation prévu par le Code de la consommation ne lui est en principe pas applicable (article L. 221-3 du Code de la consommation). En tout état de cause, en validant le Déblocage, le Professionnel **demande expressément l'exécution immédiate** de la fourniture des coordonnées. **Aucun remboursement** ne pourra être exigé une fois le Lead débloqué." },
      { p: "En particulier, et sans que cette liste soit limitative, **ne constituent pas un motif de remboursement** :" },
      {
        ul: [
          "l'absence de réponse, de prise d'appel, de rappel ou de joignabilité du Particulier ;",
          "le changement d'avis ou l'abandon du Projet par le Particulier ;",
          "le fait que le Particulier ait déjà confié son Projet à un autre professionnel ;",
          "l'absence de devis, de rendez-vous, de signature ou de conclusion d'un contrat ;",
          "un délai de prise de contact du Professionnel jugé trop tardif par le Particulier ;",
          "une divergence d'appréciation sur le budget, la nature ou l'ampleur du Projet par rapport à ce qui a été déclaré.",
        ],
      },
      { p: "**Garantie « coordonnée inexploitable ».** Si les coordonnées d'un Lead s'avèrent **manifestement inexploitables**, Workwave procède, sur demande adressée à contact@workwave.fr **dans les 7 jours** suivant le Déblocage et après vérification, au **remplacement du Lead** par un Lead équivalent ou, à défaut de Lead disponible, à l'octroi d'un **avoir d'un montant équivalent**." },
      { p: "Cette garantie s'entend strictement et suppose que **l'ensemble des canaux de contact fournis soient inexploitables**, c'est-à-dire que le **numéro de téléphone ET l'adresse e-mail** communiqués soient tous deux invalides (numéro inexistant ou non attribué, adresse e-mail syntaxiquement erronée ou rejetée de manière permanente par le serveur destinataire). L'inexploitabilité d'un **seul** des canaux, alors qu'un autre canal permet de joindre le Particulier, **n'ouvre droit à aucun remplacement, avoir ou remboursement**." },
      { p: "**Toute demande présentée hors du délai de 7 jours ou ne respectant pas la forme requise (envoi à contact@workwave.fr, identification du Lead concerné) n'est pas recevable.**" },
      { p: "Cette garantie couvre **exclusivement** l'inexploitabilité **technique** des coordonnées. Elle ne s'applique pas à la décision du Particulier de ne pas donner suite, ni à son absence de réponse, qui sont inhérentes à toute mise en relation et relèvent du risque normal du service, et ne donnent lieu à aucun remboursement, remplacement ou avoir." },
    ],
  },
  {
    title: "7. Limitation de responsabilité",
    blocks: [
      { p: "Workwave agit exclusivement en qualité d'**intermédiaire technique** de mise en relation. Elle n'est partie à aucune relation, négociation, devis, contrat, prestation ou paiement conclu entre le Professionnel et le Particulier, et n'exerce aucun contrôle sur leur déroulement." },
      { p: "Workwave ne saurait être tenue responsable des litiges, retards, inexécutions, défauts de paiement, malfaçons ou de tout différend survenant entre le Professionnel et le Particulier. En cas de litige, les parties s'adressent aux voies de recours habituelles (médiation, juridictions compétentes)." },
      { p: "En toute hypothèse, et dans la mesure permise par la loi, la responsabilité de Workwave au titre d'un Déblocage, si elle était engagée, est limitée au montant effectivement payé pour ce Déblocage, soit 9,90 €. Cette limitation ne s'applique pas en cas de faute lourde ou dolosive de Workwave, ni dans les cas où la loi en interdit la limitation." },
    ],
  },
  {
    title: "8. Obligations et déclarations du Professionnel",
    blocks: [
      { p: "Le Professionnel s'engage à :" },
      {
        ul: [
          "contacter le Particulier dans un délai raisonnable et de manière professionnelle ;",
          "utiliser les coordonnées du Particulier **uniquement** pour répondre au Projet concerné, à l'exclusion de toute autre prospection, cession ou réutilisation ;",
          "fournir des informations exactes sur son entreprise et ses qualifications, et respecter la réglementation applicable à son activité.",
        ],
      },
      { p: "**Déclarations et garanties du Professionnel.** En utilisant un service payant de la Plateforme, le Professionnel déclare et garantit à Workwave, sous sa seule responsabilité :" },
      {
        ul: [
          "être **régulièrement immatriculé** (SIRET / SIREN en France, numéro d'entreprise auprès de la Banque-Carrefour des Entreprises en Belgique) et exercer son activité en conformité avec la réglementation applicable ;",
          "**être à jour de ses assurances**, notamment de sa responsabilité civile professionnelle et, lorsque son activité l'exige, de sa garantie décennale, et détenir les **qualifications, certifications ou autorisations** légalement requises ;",
          "**établir lui-même** ses **devis et factures** à destination du Particulier ;",
          "**mettre en place son propre dispositif de médiation de la consommation** et en communiquer les coordonnées à ses clients particuliers (articles L. 612-1 et suivants du Code de la consommation).",
        ],
      },
      { p: "Ces déclarations sont déterminantes du consentement de Workwave. Leur inexactitude engage la seule responsabilité du Professionnel et autorise les mesures prévues à l'article 11." },
    ],
  },
  {
    title: "9. Anti-contournement",
    blocks: [
      { p: "Les Leads sont mis à la disposition du Professionnel pour son **usage propre et exclusif**, aux seules fins de répondre au Projet concerné. Il est **interdit** au Professionnel, directement ou par personne interposée : de **céder, partager, revendre, louer ou transmettre** un Lead ou les coordonnées qu'il contient à un tiers, à titre gratuit ou onéreux ; de **détourner** un Lead au profit d'un autre professionnel ou d'une autre entreprise que la sienne ; d'**inciter le Particulier à finaliser la relation en dehors** des conditions normales de la mise en relation, dans le but de contourner le présent service." },
      { p: "Tout manquement au présent article donne lieu, en cas de manquement constaté, au paiement d'une **indemnité forfaitaire de 300 € par Lead détourné, à titre de clause pénale au sens de l'article 1231-5 du Code civil, sans préjudice de tous autres dommages et intérêts**. Ce manquement autorise en outre Workwave à procéder à la **fermeture immédiate du compte** et à la suspension de l'accès au service de Déblocage, sans préavis ni indemnité." },
    ],
  },
  {
    title: "10. Indemnisation (garantie du Professionnel)",
    blocks: [
      { p: "Le Professionnel **garantit et relève indemne** Workwave, ainsi que ses éventuels préposés et prestataires, de toute **réclamation, plainte, action, demande, condamnation, indemnité, amende ou sanction**, ainsi que des **frais de défense raisonnables** (notamment frais d'avocat et de procédure), qui trouveraient leur origine dans :" },
      {
        ul: [
          "la **prestation** proposée, réalisée ou non réalisée par le Professionnel au bénéfice d'un Particulier ;",
          "l'**inexactitude** de l'une quelconque de ses déclarations ou garanties, notamment celles de l'article 8 ;",
          "son **usage des coordonnées** d'un Particulier, y compris tout usage non conforme au RGPD ou toute prospection non autorisée ;",
          "le **non-respect** par le Professionnel de la réglementation applicable à son activité ou des présentes CGV.",
        ],
      },
      { p: "Workwave laisse au Professionnel, dans la mesure du possible, la conduite de sa défense, et l'informe de la réclamation concernée." },
    ],
  },
  {
    title: "11. Suspension, exclusion et lutte contre la fraude",
    blocks: [
      { p: "Afin de préserver l'intégrité de la Plateforme et la confiance des Particuliers, Workwave se réserve le droit, **à son appréciation raisonnable**, de **bloquer un Déblocage**, de **suspendre l'accès au service** ou de **fermer le compte** d'un Professionnel, **sans préavis ni indemnité**, en cas de :" },
      {
        ul: [
          "**SIRET, SIREN ou numéro d'entreprise (BCE) faux, usurpé ou inactif** ;",
          "**fausses qualifications, certifications, assurances ou déclarations** ;",
          "**revente, partage ou détournement de Leads** (article 9) ;",
          "**fraude avérée ou raisonnablement présumée** au paiement ou à l'identité ;",
          "**comportement abusif** envers un Particulier, un tiers ou Workwave (harcèlement, propos injurieux, manœuvres déloyales).",
        ],
      },
      { p: "Ces mesures sont mises en œuvre de manière **proportionnée** à la gravité et à la répétition du manquement constaté. Lorsque les circonstances le permettent, Workwave privilégie un avertissement préalable et invite le Professionnel à régulariser sa situation ou à fournir des justificatifs. Les mesures prises en application du présent article ne donnent lieu à **aucun remboursement des Déblocages déjà réalisés**, ceux-ci demeurant fermes et définitifs conformément à l'article 6." },
    ],
  },
  {
    title: "12. Données personnelles",
    blocks: [
      { p: "Les coordonnées du Particulier transmises lors d'un Déblocage sont confiées au Professionnel pour la seule finalité de répondre à la demande du Particulier. Le Professionnel en devient responsable de traitement et s'engage à les traiter conformément au RGPD, notamment à ne pas les conserver au-delà du nécessaire ni les utiliser à d'autres fins." },
    ],
  },
  {
    title: "13. Force majeure et clauses de sauvegarde",
    blocks: [
      { p: "**Force majeure.** La responsabilité de Workwave ne saurait être engagée en cas d'inexécution ou de retard résultant d'un cas de **force majeure** au sens de l'article 1218 du Code civil, ni d'un fait imprévisible et insurmontable d'un tiers ou du Particulier." },
      { p: "**Disponibilité de la Plateforme.** Workwave est tenue, quant au fonctionnement de la Plateforme, à une **obligation de moyens**. Elle s'efforce d'en assurer l'accessibilité mais ne garantit pas une disponibilité continue et ininterrompue : la Plateforme peut être momentanément indisponible pour maintenance, mise à jour, incident technique ou fait d'un tiers (hébergeur, prestataire de paiement, réseau). Une telle indisponibilité n'ouvre droit à aucune indemnité." },
      { p: "**Divisibilité.** Si l'une des stipulations des présentes CGV était jugée nulle, illicite ou inapplicable, les autres stipulations conserveraient leur pleine valeur, et la stipulation concernée serait remplacée par une stipulation valable d'effet économique équivalent." },
      { p: "**Non-renonciation.** Le fait pour Workwave de ne pas se prévaloir, à un moment donné, de l'une quelconque des présentes stipulations ne peut être interprété comme une renonciation à s'en prévaloir ultérieurement." },
      { p: "**Intégralité de l'accord.** Les présentes CGV, ensemble avec les Mentions légales, expriment l'intégralité de l'accord entre le Professionnel et Workwave au titre des services payants, et prévalent sur toute proposition, échange ou condition antérieure ou contraire." },
    ],
  },
  {
    title: "14. Modification, droit applicable et litiges",
    blocks: [
      { p: "Workwave se réserve le droit de modifier les présentes CGV à tout moment. La version applicable est celle en vigueur au jour du Déblocage. Toute réclamation relative à un Déblocage doit être adressée à contact@workwave.fr ; Workwave s'engage à y répondre dans un délai raisonnable. Les présentes CGV sont soumises au **droit français**. Les parties s'efforcent de résoudre amiablement tout différend." },
      { p: "**Relation entre professionnels (B2B).** Le Professionnel reconnaissant agir dans le cadre de son activité professionnelle, il est expressément convenu qu'à défaut de résolution amiable, tout litige relatif à la formation, l'exécution ou l'interprétation des présentes CGV relève de la compétence exclusive du **tribunal de commerce du ressort du siège de l'éditeur**, y compris en cas de pluralité de défendeurs, d'appel en garantie ou de demande incidente. Le service s'adressant exclusivement à des professionnels agissant dans le cadre de leur activité, le droit de rétractation prévu par le Code de la consommation ne trouve pas à s'appliquer." },
      { p: "Le Particulier n'est pas partie aux présentes CGV ; sa relation avec Workwave est régie par les [Conditions Générales d'Utilisation](/cgu)." },
    ],
  },
];

export default function CGVPage() {
  return (
    <LegalDoc
      title="Conditions Générales de Vente"
      lastUpdated={LAST_UPDATED}
      sections={SECTIONS}
      footerNote="Pour toute question, contactez-nous à contact@workwave.fr"
    />
  );
}
