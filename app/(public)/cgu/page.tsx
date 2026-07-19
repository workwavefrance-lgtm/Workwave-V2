import type { Metadata } from "next";
import LegalDoc, { type LegalSection } from "@/components/legal/LegalDoc";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation",
  description:
    "Conditions Générales d'Utilisation de la plateforme Workwave : accès au site, compte professionnel, dépôt de projet, avis, données et responsabilités.",
  alternates: { canonical: "https://workwave.fr/cgu" },
};

const LAST_UPDATED = "19 juillet 2026";

const INTRO =
  "Les présentes Conditions Générales d'Utilisation (les « CGU ») régissent l'accès et l'utilisation de la plateforme Workwave. Elles complètent les [Conditions Générales de Vente](/cgv) applicables aux services payants et les [Mentions légales](/mentions-legales), qui identifient l'éditeur et le responsable de traitement.";

const SECTIONS: LegalSection[] = [
  {
    title: "Article 1 — Objet et acceptation",
    blocks: [
      { p: "1.1. Les présentes CGU définissent les conditions dans lesquelles Workwave met la Plateforme à disposition de ses utilisateurs, ainsi que les droits et obligations des parties." },
      { p: "1.2. Workwave est un service de mise en relation qui permet à un Particulier de déposer gratuitement un Projet, et à un Professionnel de consulter ce Projet puis, s'il le souhaite, de débloquer les coordonnées du Particulier afin de le contacter. Le fonctionnement, le prix et les conditions du service payant de Déblocage sont détaillés dans les CGV." },
      { p: "1.3. **L'accès à la Plateforme et son utilisation (consultation, dépôt d'un Projet, création d'un compte, Déblocage d'un Lead) valent acceptation pleine et entière des présentes CGU.** L'utilisateur qui n'accepte pas les CGU doit cesser d'utiliser la Plateforme." },
      { p: "1.4. La version applicable est celle en vigueur à la date de l'utilisation considérée. Workwave se réserve le droit de modifier les CGU à tout moment ; les modifications s'appliquent dès leur publication, sans effet rétroactif sur les Déblocages déjà réalisés. **Pour les titulaires d'un compte, toute modification substantielle est portée à leur connaissance par un moyen approprié avant son entrée en vigueur.**" },
    ],
  },
  {
    title: "Article 2 — Définitions",
    blocks: [
      {
        ul: [
          "**Plateforme** : le site workwave.fr et l'ensemble de ses fonctionnalités.",
          "**Workwave** : l'éditeur de la Plateforme, identifié dans les Mentions légales (Willy Gauvrit, entrepreneur individuel).",
          "**Professionnel** : toute personne physique ou morale qui utilise la Plateforme dans le cadre de son activité professionnelle.",
          "**Particulier** : toute personne qui dépose un Projet correspondant à un besoin de travaux ou de services.",
          "**Projet** : une demande déposée par un Particulier, décrivant un besoin.",
          "**Lead** : un Projet accompagné des coordonnées de contact du Particulier, mis à disposition d'un Professionnel.",
          "**Déblocage** : l'action par laquelle un Professionnel accède, dans les conditions des CGV, aux coordonnées du Particulier liées à un Lead.",
        ],
      },
    ],
  },
  {
    title: "Article 3 — Accès à la Plateforme et disponibilité",
    blocks: [
      { p: "3.1. La consultation de la Plateforme et le dépôt d'un Projet sont gratuits. Seul le Déblocage d'un Lead est payant." },
      { p: "3.2. **Obligation de moyens.** Workwave s'efforce de maintenir la Plateforme accessible 24h/24 et 7j/7, mais est tenue à une obligation de moyens, non de résultat, quant à la disponibilité, la continuité et l'absence d'erreur. Elle ne garantit pas un accès ininterrompu ou exempt d'anomalie." },
      { p: "3.3. **Maintenance.** Workwave peut, à tout moment et sans préavis, suspendre ou limiter l'accès pour maintenance, mise à jour, sécurité ou évolution technique, en s'efforçant d'en limiter l'impact." },
      { p: "3.4. **Force majeure.** La responsabilité de Workwave ne saurait être engagée en cas d'indisponibilité résultant d'un cas de force majeure (art. 1218 du Code civil) ou d'un événement échappant à son contrôle raisonnable : défaillance des réseaux, panne d'un service d'hébergement ou de paiement tiers, cyberattaque, coupure d'électricité, incendie, catastrophe naturelle, décision d'une autorité publique." },
      { p: "3.5. L'utilisateur fait son affaire de l'équipement, de la connexion et des logiciels nécessaires à l'accès à la Plateforme." },
    ],
  },
  {
    title: "Article 4 — Compte Professionnel",
    blocks: [
      { p: "4.1. **Création.** L'accès à certaines fonctionnalités, notamment le Déblocage, suppose la création d'un compte. Le Professionnel garantit agir dans le cadre de son activité professionnelle." },
      { p: "4.2. **Exactitude.** Le Professionnel fournit des informations exactes, complètes et à jour (identité, coordonnées, SIRET en France ou numéro BCE en Belgique, qualifications) et les met à jour en cas de changement. Toute information inexacte ou frauduleuse engage sa seule responsabilité." },
      { p: "4.3. **Identifiants.** Les identifiants sont personnels et confidentiels. Le Professionnel en est seul responsable et informe sans délai Workwave (contact@workwave.fr) de toute perte, vol ou usage non autorisé." },
      { p: "4.4. **Un compte par entreprise.** Sauf accord contraire, un seul compte par entreprise (SIRET / BCE). Les comptes multiples destinés à contourner les CGU sont prohibés." },
      { p: "4.5. **Usage frauduleux.** Toute action depuis le compte est réputée effectuée par le Professionnel, qui en demeure responsable jusqu'au signalement d'une compromission." },
    ],
  },
  {
    title: "Article 5 — Dépôt d'un Projet et fiabilité des déclarations du Particulier",
    blocks: [
      { p: "5.1. Le Particulier dépose gratuitement un Projet en décrivant sincèrement son besoin et en fournissant des coordonnées valides." },
      { p: "5.2. **Garantie de sincérité.** Le Particulier garantit l'exactitude, la sincérité et le sérieux des informations communiquées (identité, coordonnées, nature, budget, description). Il s'engage à ne déposer que des demandes réelles et à tenir ses coordonnées à jour tant que le Projet est actif." },
      { p: "5.3. **Loyauté.** Le Particulier reconnaît qu'un Professionnel est susceptible de le contacter, s'engage à répondre de bonne foi et à signaler, dans la mesure du possible, lorsqu'il n'a plus besoin d'être contacté. Le dépôt n'emporte aucune obligation de conclure : le Particulier reste libre de donner suite ou non." },
      { p: "5.4. **Demandes non sincères.** Les déclarations du Particulier sont une base essentielle du service rendu au Professionnel. Le dépôt d'un Projet fantôme, fictif ou frauduleux, ou des coordonnées volontairement erronées, constituent un manquement susceptible d'engager sa responsabilité et de justifier les mesures de l'article 10. Workwave se réserve le droit de ne pas diffuser, retirer ou modérer tout Projet manifestement non sérieux ou frauduleux." },
    ],
  },
  {
    title: "Article 6 — Usages et contenus interdits",
    blocks: [
      { p: "Sont notamment interdits :" },
      {
        ul: [
          "le dépôt de fausses demandes, de Projets fictifs ou destinés à tromper les Professionnels ;",
          "l'usurpation d'identité (d'un tiers, d'une entreprise, de Workwave) et la fourniture d'informations mensongères sur son identité ou ses qualifications ;",
          "tout contenu illicite, diffamatoire, injurieux, dénigrant, haineux, discriminatoire ou portant atteinte aux droits d'autrui ;",
          "l'extraction, l'aspiration, l'indexation ou la collecte automatisée de tout ou partie du contenu (robots, scrapers, crawlers, scripts), hors usage normal ;",
          "toute tentative d'accès non autorisé, d'atteinte à la sécurité, d'introduction de code malveillant ou de perturbation ;",
          "le détournement de la Plateforme de sa finalité et tout contournement des mesures techniques ou du service de Déblocage ;",
          "la revente, la cession, la location ou la mise à disposition de tiers des Leads débloqués, et l'usage des coordonnées à d'autres fins que la réponse au Projet concerné.",
        ],
      },
    ],
  },
  {
    title: "Article 7 — Avis",
    blocks: [
      { p: "7.1. La Plateforme peut proposer un système d'avis permettant au Particulier de partager son expérience." },
      { p: "7.2. **Conditions.** Un avis ne peut être déposé qu'après un contact ou une prestation réels. L'auteur garantit une expérience personnelle, vécue et sincère. Sont interdits les avis mensongers, fictifs, achetés, en contrepartie d'un avantage, ou déposés sans relation réelle avec le Professionnel." },
      { p: "7.3. **Responsabilité.** L'auteur est seul responsable de son avis et s'engage à s'exprimer de manière mesurée et factuelle." },
      { p: "7.4. **Modération.** Workwave peut modérer, refuser ou retirer tout avis contraire aux CGU, à la loi ou manifestement inauthentique. Lorsque ce système est actif, les mentions imposées par l'article L111-7-2 du Code de la consommation (existence d'un contrôle, procédure de vérification, date, motifs de rejet) sont affichées près des avis." },
    ],
  },
  {
    title: "Article 8 — Rôle d'hébergeur et signalement",
    blocks: [
      { p: "8.1. Les Projets déposés par les Particuliers, les avis et les contenus ajoutés par les Professionnels sur leur fiche constituent des **contenus tiers** : à leur égard, Workwave agit en qualité d'**hébergeur** (art. 6 de la LCEN du 21 juin 2004). **Les fiches établies à partir de données publiques (registre Sirene) relèvent de la responsabilité éditoriale de Workwave**, tout Professionnel pouvant en demander la rectification ou la suppression via le lien prévu à cet effet." },
      { p: "8.2. Pour les contenus tiers, Workwave n'est pas soumise à une obligation générale de surveillance et n'engage sa responsabilité qu'à défaut d'avoir agi promptement pour retirer un contenu manifestement illicite dont elle a eu connaissance." },
      { p: "8.3. **Signalement.** Tout contenu paraissant illicite peut être signalé à contact@workwave.fr (identité du déclarant, description et URL du contenu, motif). Signaler un contenu comme illicite en sachant l'information inexacte engage la responsabilité de son auteur." },
    ],
  },
  {
    title: "Article 9 — Propriété intellectuelle et base de données",
    blocks: [
      { p: "9.1. La Plateforme (structure, design, textes, logos, marque, éléments graphiques et logiciels) est protégée par le droit de la propriété intellectuelle et demeure la propriété exclusive de Workwave. Toute reproduction ou exploitation sans autorisation écrite est interdite." },
      { p: "9.2. La base de données de Workwave (fiches, Projets, Leads et données associées) est protégée par le **droit sui generis du producteur de bases de données** (art. L341-1 et suivants du Code de la propriété intellectuelle)." },
      { p: "9.3. Sont interdites, sauf autorisation écrite, l'**extraction** et la **réutilisation** d'une partie substantielle du contenu de la base, ainsi que l'extraction ou la réutilisation répétée et systématique de parties non substantielles excédant l'usage normal. Cette interdiction couvre tout scraping ou collecte automatisée visés à l'article 6." },
    ],
  },
  {
    title: "Article 10 — Suspension, résiliation et lutte contre la fraude",
    blocks: [
      { p: "10.1. L'utilisateur peut cesser d'utiliser la Plateforme à tout moment. Le Professionnel peut demander la fermeture de son compte (contact@workwave.fr), sans remise en cause des Déblocages déjà réalisés ni droit à remboursement." },
      { p: "10.2. Workwave peut **suspendre l'accès, restreindre les fonctionnalités ou fermer le compte**, sans préavis ni indemnité, en cas de manquement, notamment : SIRET/BCE faux, inexistant, radié ou usurpé ; fausses qualifications ; Projets fantômes ou usurpation ; revente ou détournement de Leads ; scraping ou usage automatisé prohibé ; comportement abusif ; tentative de contournement du paiement ; fraude avérée ou raisonnablement présumée." },
      { p: "10.3. **Proportionnalité.** Ces mesures sont mises en œuvre de manière proportionnée. Lorsque la situation le permet, Workwave privilégie une mise en demeure préalable et un délai de régularisation." },
      { p: "10.4. **Information.** Sauf interdiction légale ou risque de compromettre la prévention d'une fraude, Workwave informe l'utilisateur de la mesure et de son motif et lui offre la possibilité de présenter ses observations." },
    ],
  },
  {
    title: "Article 11 — Données personnelles",
    blocks: [
      { p: "11.1. Le traitement des données (finalités, bases légales, durées, droits) est décrit dans les [Mentions légales](/mentions-legales)." },
      { p: "11.2. Les coordonnées transmises au Professionnel lors d'un Déblocage ne peuvent être utilisées que pour répondre au Projet concerné. Le Professionnel en devient responsable de traitement au sens du RGPD." },
      { p: "11.3. Toute personne peut exercer ses droits (accès, rectification, effacement, opposition, limitation, portabilité) à contact@workwave.fr, et saisir la CNIL." },
    ],
  },
  {
    title: "Article 12 — Dispositions générales",
    blocks: [
      { p: "12.1. **Divisibilité.** Si une stipulation était déclarée nulle ou inapplicable, elle serait réputée non écrite sans affecter la validité des autres." },
      { p: "12.2. **Non-renonciation.** Le fait pour Workwave de ne pas se prévaloir d'une stipulation ne vaut pas renonciation à s'en prévaloir ultérieurement." },
      { p: "12.3. **Intégralité.** Les CGU, ensemble les CGV et les Mentions légales, expriment l'intégralité de l'accord relatif à l'utilisation de la Plateforme." },
      { p: "12.4. **Convention de preuve.** Les registres et journaux conservés par Workwave ou ses prestataires font foi entre les parties des actions accomplies sur la Plateforme (dépôts, Déblocages, paiements), sauf preuve contraire." },
    ],
  },
  {
    title: "Article 13 — Droit applicable, médiation et juridiction",
    blocks: [
      { p: "13.1. Les présentes CGU sont régies par le **droit français**. **Si l'utilisateur est un consommateur résidant dans un autre État de l'Union européenne, notamment en Belgique, il conserve le bénéfice des dispositions impératives protectrices de la loi de son pays de résidence, que le choix du droit français ne saurait écarter.**" },
      { p: "13.2. **Réclamation préalable.** Toute réclamation est adressée à contact@workwave.fr ; Workwave s'engage à y répondre dans un délai raisonnable et à rechercher une solution amiable." },
      { p: "13.3. **Médiation.** Le service fourni au Particulier étant entièrement gratuit, la relation ne constitue pas un litige de consommation au sens de l'article L611-1 du Code de la consommation. Workwave s'engage néanmoins à rechercher une solution amiable à toute réclamation." },
      { p: "13.4. **Juridiction.** Pour un litige impliquant un Particulier consommateur, celui-ci conserve les règles de compétence protectrices de la loi (il peut notamment saisir la juridiction de son domicile). Pour un litige impliquant un Professionnel, et à défaut d'accord amiable, compétence est attribuée au tribunal de commerce du ressort du siège de l'éditeur." },
    ],
  },
];

export default function CGUPage() {
  return (
    <LegalDoc
      title="Conditions Générales d'Utilisation"
      lastUpdated={LAST_UPDATED}
      intro={INTRO}
      sections={SECTIONS}
      footerNote="Pour toute question relative aux présentes CGU, contactez-nous à contact@workwave.fr"
    />
  );
}
