/**
 * Sous-specialites par metier (Phase A2 SEO).
 *
 * Approche routing-only : pas de schema change. Les pages /[metier]/[specialite]/[ville]
 * affichent le meme listing pros que /[metier]/[ville] mais avec un contenu SEO different
 * (H1, intro, FAQ, schema specifique).
 *
 * 8 metiers prioritaires x 5 specialites = 40 specialites au total.
 * Multiplie par 10 villes top Vienne = ~400 pages indexables.
 */

export type SpecialtyFaq = {
  question: string;
  answer: string;
};

export type Specialty = {
  /** slug URL (ex. "depannage") */
  slug: string;
  /** Nom affichage long (ex. "Dépannage urgent") */
  name: string;
  /** Forme courte pour titres fluides (ex. "dépannage") */
  shortLabel: string;
  /** Phrase ouverte (ex. "spécialisé en dépannage et urgences") */
  longLabel: string;
  /** Description meta (1 phrase, < 150 chars) */
  description: string;
  /** Intro SEO de la page (3-5 phrases) */
  intro: string;
  /** 3 FAQ spécifiques à la spécialité (schema FAQPage) */
  faqs: SpecialtyFaq[];
};

export type SpecialtyMap = Record<string, Specialty[]>;

export const SPECIALTIES: SpecialtyMap = {
  // ===========================================================================
  // PLOMBIER (5 spécialités)
  // ===========================================================================
  plombier: [
    {
      slug: "depannage",
      name: "Dépannage urgent",
      shortLabel: "dépannage",
      longLabel: "spécialisé en dépannage et urgences",
      description:
        "Plombier dépannage urgent : fuite, canalisation bouchée, chauffe-eau en panne. Intervention rapide.",
      intro:
        "Une fuite d'eau, une canalisation bouchée, un chauffe-eau qui ne fonctionne plus ? Les plombiers spécialisés en dépannage interviennent rapidement, souvent dans la journée et parfois 24h/24 pour les urgences. Workwave référence les plombiers dépannage qui couvrent votre zone, avec leurs coordonnées directes pour un contact immédiat.",
      faqs: [
        {
          question: "Combien coûte une intervention de plombier en urgence ?",
          answer:
            "Le tarif d'une intervention en urgence varie de 80 € à 250 € pour un dépannage simple, hors pièces. Les majorations soir/week-end vont de 30 % à 100 %. Demandez toujours un devis ou un ordre de prix au téléphone avant l'intervention.",
        },
        {
          question: "Un plombier peut-il intervenir le week-end ?",
          answer:
            "Oui, de nombreux plombiers proposent un service d'astreinte le week-end et la nuit. Sur Workwave, les fiches précisent quand le pro indique être disponible en urgence. Privilégiez ceux qui affichent un numéro direct et une réponse rapide.",
        },
        {
          question: "Quelles urgences justifient d'appeler un plombier ?",
          answer:
            "Fuite active non maîtrisable, canalisation principale bouchée, absence totale d'eau chaude en hiver, débordement de WC, dégât des eaux. Pour les fuites mineures, un simple rendez-vous en journée suffit (et coûte moins cher).",
        },
      ],
    },
    {
      slug: "debouchage",
      name: "Débouchage canalisation",
      shortLabel: "débouchage",
      longLabel: "spécialisé en débouchage de canalisations",
      description:
        "Plombier débouchage canalisation : évier, WC, douche, baignoire. Intervention rapide avec caméra et furet.",
      intro:
        "Une canalisation bouchée peut provoquer débordements, mauvaises odeurs et dégâts des eaux. Les plombiers spécialisés en débouchage utilisent furets motorisés, caméras d'inspection et hydrocureurs haute pression pour identifier et résoudre rapidement le problème, qu'il s'agisse d'un évier, d'un WC ou d'une canalisation enterrée.",
      faqs: [
        {
          question: "Quel est le prix d'un débouchage de canalisation ?",
          answer:
            "Pour un débouchage simple (évier, lavabo) : 80 € à 150 €. Pour un débouchage complexe au furet motorisé : 150 € à 300 €. L'inspection caméra ajoute 100 € à 200 €. Hydrocurage : 200 € à 500 € selon la longueur.",
        },
        {
          question: "Comment éviter de boucher ses canalisations ?",
          answer:
            "Ne jetez jamais d'huile, de marc de café, de cheveux ou de lingettes dans les canalisations. Versez régulièrement de l'eau bouillante avec du bicarbonate dans les éviers. Posez des grilles anti-cheveux dans les douches.",
        },
        {
          question: "Mon assurance prend-elle en charge le débouchage ?",
          answer:
            "Non, le débouchage relève de l'entretien à la charge de l'occupant. Seuls les dégâts des eaux causés par un bouchon (fuite, infiltration chez le voisin) peuvent être pris en charge par votre assurance multirisque habitation.",
        },
      ],
    },
    {
      slug: "chauffe-eau",
      name: "Installation chauffe-eau",
      shortLabel: "installation de chauffe-eau",
      longLabel: "spécialisé en installation et remplacement de chauffe-eau",
      description:
        "Plombier installation chauffe-eau : électrique, thermodynamique, gaz. Devis gratuit, pose par professionnel.",
      intro:
        "Le remplacement ou l'installation d'un chauffe-eau (électrique, thermodynamique, gaz, solaire) demande une pose conforme et le respect des normes de raccordement. Les plombiers spécialisés vous conseillent sur la taille de cuve adaptée à votre foyer et le type le plus économique sur le long terme.",
      faqs: [
        {
          question: "Quel chauffe-eau choisir : électrique ou thermodynamique ?",
          answer:
            "Le chauffe-eau thermodynamique consomme 3 à 4 fois moins d'électricité qu'un modèle classique, mais coûte 2 000 € à 4 000 € installé contre 600 € à 1 500 € pour un électrique. Rentable en 4 à 7 ans pour une famille de 3 personnes ou plus, avec aides MaPrimeRénov' éligibles.",
        },
        {
          question: "Combien coûte le remplacement d'un chauffe-eau ?",
          answer:
            "Pose comprise : 600 € à 1 500 € pour un électrique 200L, 2 500 € à 4 500 € pour un thermodynamique. Ajoutez 100 € à 200 € pour la dépose de l'ancien et 50 € à 150 € si modification de l'arrivée d'eau ou raccordement électrique.",
        },
        {
          question: "Faut-il un plombier ou un électricien ?",
          answer:
            "Pour un chauffe-eau électrique standard, un plombier-chauffagiste suffit (raccordement eau + branchement électrique sur ligne dédiée). Pour un thermodynamique ou un raccordement complexe, un installateur certifié RGE QualiPAC est obligatoire pour bénéficier des aides.",
        },
      ],
    },
    {
      slug: "sanitaire",
      name: "Installation sanitaire",
      shortLabel: "installation sanitaire",
      longLabel: "spécialisé en installation sanitaire (lavabo, WC, douche)",
      description:
        "Plombier installation sanitaire : lavabo, WC, douche, baignoire. Pose et remplacement par un professionnel.",
      intro:
        "Pose ou remplacement de WC, lavabo, douche, baignoire, robinetterie : les plombiers spécialisés en sanitaire interviennent pour rénover votre salle de bain ou remplacer un équipement défectueux. Conseils sur les marques, raccordements aux normes, finitions soignées.",
      faqs: [
        {
          question: "Combien coûte la pose d'un WC ?",
          answer:
            "Pose seule d'un WC standard : 150 € à 300 €. Pose d'un WC suspendu (avec bâti-support) : 400 € à 800 €. Comptez 200 € à 500 € supplémentaires pour le matériel selon la gamme choisie.",
        },
        {
          question: "Quel délai pour rénover une salle de bain ?",
          answer:
            "Pour une rénovation complète (dépose + pose des nouveaux équipements + carrelage) : 1 à 3 semaines en moyenne. La pose seule des sanitaires sans carrelage : 2 à 5 jours.",
        },
        {
          question: "Faut-il un plombier certifié pour la robinetterie ?",
          answer:
            "Aucune certification spécifique n'est exigée pour la pose de robinetterie classique. Vérifiez simplement que le pro a une assurance décennale valide et de l'expérience sur la marque ou le modèle choisi (notamment pour les mitigeurs thermostatiques).",
        },
      ],
    },
    {
      slug: "fuite",
      name: "Recherche de fuite",
      shortLabel: "recherche de fuite",
      longLabel: "spécialisé en recherche et réparation de fuite",
      description:
        "Plombier recherche de fuite : détection non destructive (gaz traceur, caméra thermique, électroacoustique).",
      intro:
        "Trace d'humidité au plafond, facture d'eau anormale, sol qui sonne creux : la recherche de fuite demande des techniques spécialisées (gaz traceur, caméra thermique, électroacoustique, colorimétrie) pour localiser précisément l'origine sans casser. Les plombiers spécialisés évitent les travaux invasifs inutiles.",
      faqs: [
        {
          question: "Combien coûte une recherche de fuite ?",
          answer:
            "Recherche non destructive : 200 € à 600 € selon la complexité et les techniques utilisées. La réparation après détection est facturée séparément (50 € à 800 € selon l'ampleur).",
        },
        {
          question: "Mon assurance rembourse-t-elle la recherche de fuite ?",
          answer:
            "Oui, dans 90 % des cas. La garantie 'recherche de fuite' est incluse dans la plupart des contrats multirisques habitation, avec un plafond de 1 500 € à 5 000 €. Conservez la facture et déclarez le sinistre dans les 5 jours.",
        },
        {
          question: "Comment savoir si j'ai une fuite cachée ?",
          answer:
            "Relevez votre compteur d'eau le soir, fermez tous les robinets, relevez à nouveau le matin. Une consommation nocturne supérieure à 5L indique probablement une fuite. Tache d'humidité, moisissure ou facture qui double sont aussi des signes clairs.",
        },
      ],
    },
  ],

  // ===========================================================================
  // ELECTRICIEN (5 spécialités)
  // ===========================================================================
  electricien: [
    {
      slug: "depannage",
      name: "Dépannage électrique",
      shortLabel: "dépannage",
      longLabel: "spécialisé en dépannage électrique",
      description:
        "Électricien dépannage urgent : panne, court-circuit, prise HS, disjoncteur. Intervention rapide.",
      intro:
        "Coupure générale, prise qui ne fonctionne plus, disjoncteur qui saute en boucle, court-circuit : les électriciens spécialisés en dépannage interviennent rapidement pour diagnostiquer et résoudre la panne, dans le respect des normes de sécurité (NF C 15-100). Demandez toujours une attestation de remise en service.",
      faqs: [
        {
          question: "Combien coûte une intervention électrique en urgence ?",
          answer:
            "Diagnostic et dépannage simple : 80 € à 200 €. Remplacement d'un disjoncteur ou d'une prise : 100 € à 300 € pose comprise. Majorations week-end et nuit : +30 % à +100 %.",
        },
        {
          question: "Que faire en cas de coupure générale ?",
          answer:
            "Vérifiez d'abord le compteur Linky (témoin orange = surconsommation). Coupez tous les appareils, ré-enclenchez progressivement. Si le disjoncteur principal saute encore, appelez un électricien : risque de court-circuit ou de défaut d'isolement à diagnostiquer.",
        },
        {
          question: "Mon assurance couvre-t-elle un dégât électrique ?",
          answer:
            "Oui, la garantie 'dommages électriques' est incluse dans la majorité des multirisques habitation, avec un plafond de 1 000 € à 5 000 €. Elle couvre la surtension, la foudre et certaines pannes. Conservez le rapport d'intervention de l'électricien.",
        },
      ],
    },
    {
      slug: "mise-aux-normes",
      name: "Mise aux normes électriques",
      shortLabel: "mise aux normes",
      longLabel: "spécialisé en mise aux normes NF C 15-100",
      description:
        "Électricien mise aux normes NF C 15-100 : tableau, prises, terre. Diagnostic et travaux par certifié.",
      intro:
        "La norme NF C 15-100 impose un niveau d'équipement minimum dans les logements (nombre de prises par pièce, tableau électrique, mise à la terre, protection différentielle). Une mise aux normes est souvent demandée à la vente d'un bien ou avant une rénovation, et peut être éligible à MaPrimeRénov' selon les travaux.",
      faqs: [
        {
          question: "Combien coûte une mise aux normes électrique complète ?",
          answer:
            "Pour un T3-T4 ancien : 5 000 € à 12 000 €. Pour une simple mise aux normes du tableau : 1 500 € à 3 500 €. Le diagnostic préalable seul (Diagnostic Électrique Obligatoire) coûte 100 € à 200 €.",
        },
        {
          question: "Suis-je obligé de mettre mon installation aux normes ?",
          answer:
            "Non, sauf si votre installation présente un danger immédiat (Consuel négatif). En cas de vente, le diagnostic électrique est obligatoire mais sans obligation de travaux. En cas de location, le bailleur doit garantir la sécurité électrique du logement.",
        },
        {
          question: "Quels travaux pour passer la norme NF C 15-100 ?",
          answer:
            "Tableau divisionnaire avec différentiels 30 mA, mise à la terre vérifiée, GTL (Gaine Technique Logement), prises adaptées par pièce (5 dans une cuisine, 3 dans un séjour, etc.), liaison équipotentielle dans la salle de bain.",
        },
      ],
    },
    {
      slug: "tableau-electrique",
      name: "Tableau électrique",
      shortLabel: "tableau électrique",
      longLabel: "spécialisé en remplacement et mise à niveau de tableau électrique",
      description:
        "Électricien remplacement tableau électrique : pose, mise à niveau, protection différentielle.",
      intro:
        "Le tableau électrique est le cœur de votre installation : remplacement d'un ancien tableau à fusibles, ajout de différentiels 30 mA, repérage des circuits, ajout d'un module domotique. Le passage à un tableau modulaire moderne améliore la sécurité et facilite les futures évolutions.",
      faqs: [
        {
          question: "Quand faut-il remplacer son tableau électrique ?",
          answer:
            "Si vous avez encore des fusibles à porcelaine, plus de 25 ans d'âge, pas de différentiel 30 mA, ou si vous ajoutez plusieurs gros consommateurs (PAC, borne véhicule électrique). Le coût va de 1 500 € à 3 500 € selon la taille.",
        },
        {
          question: "Combien de temps pour changer un tableau électrique ?",
          answer:
            "Une journée à une journée et demie pour un tableau standard. La coupure d'électricité dure 4 à 8 heures selon la complexité. Prévenez votre fournisseur si vous êtes en télétravail.",
        },
        {
          question: "Faut-il un Consuel après changement de tableau ?",
          answer:
            "Non, sauf en cas de modification importante (nouveau type de raccordement, augmentation de puissance). Pour un simple remplacement à puissance équivalente, l'attestation de l'électricien suffit.",
        },
      ],
    },
    {
      slug: "domotique",
      name: "Domotique et maison connectée",
      shortLabel: "domotique",
      longLabel: "spécialisé en installation domotique et maison connectée",
      description:
        "Électricien domotique : volets, éclairage, chauffage connecté. Installation et configuration par certifié.",
      intro:
        "Volets roulants connectés, éclairage piloté par smartphone, thermostats intelligents, alarme et caméras intégrées : les électriciens spécialisés en domotique installent et configurent les systèmes filaires (KNX) ou sans fil (Zigbee, Z-Wave, Wi-Fi). Une bonne installation augmente la valeur du bien et réduit les consommations.",
      faqs: [
        {
          question: "Combien coûte une installation domotique complète ?",
          answer:
            "Pour une maison de 100 m² : 3 000 € à 15 000 € selon la couverture (éclairage seul, +chauffage, +volets, +alarme). Une box domotique simple démarre à 300 € installée, une installation KNX professionnelle dépasse souvent 10 000 €.",
        },
        {
          question: "Faut-il prévoir la domotique dès la construction ?",
          answer:
            "Idéalement oui, pour passer un bus filaire (KNX) avant les cloisons. En rénovation, les solutions sans fil (Zigbee, modules pour interrupteurs existants) permettent d'éviter les saignées et de poser progressivement.",
        },
        {
          question: "Quelles sont les vraies économies attendues ?",
          answer:
            "Un thermostat connecté permet 10 à 20 % d'économie de chauffage. Un éclairage piloté par détecteurs : 5 à 10 % de la facture électrique. Le retour sur investissement est de 3 à 7 ans pour les fonctions les plus utiles.",
        },
      ],
    },
    {
      slug: "renovation",
      name: "Rénovation électrique",
      shortLabel: "rénovation électrique",
      longLabel: "spécialisé en rénovation électrique complète",
      description:
        "Électricien rénovation électrique complète : refonte du circuit, normes 2026, devis gratuit.",
      intro:
        "Refaire l'électricité d'une maison ancienne, d'un appartement après achat ou avant location : la rénovation électrique consiste à remplacer toute l'installation (câbles, prises, interrupteurs, tableau) tout en respectant la norme NF C 15-100. Travaux souvent éligibles à MaPrimeRénov' s'ils accompagnent une rénovation énergétique globale.",
      faqs: [
        {
          question: "Combien coûte une rénovation électrique complète ?",
          answer:
            "Comptez 80 € à 130 € par m² pour une rénovation totale d'un logement habité (passage en encastré). Pour un T3 de 70 m² : 5 600 € à 9 100 €. Une rénovation lourde tous corps de métier ouverts coûte moins cher au m² (60 € à 90 €).",
        },
        {
          question: "Combien de temps pour rénover toute l'électricité ?",
          answer:
            "Pour un T3 de 70 m² : 1 à 2 semaines en site occupé, 5 à 10 jours en site vide. Comptez en plus 2 à 3 jours pour les finitions (rebouchage, peinture).",
        },
        {
          question: "Peut-on vivre dans le logement pendant les travaux ?",
          answer:
            "Oui, mais avec des coupures fréquentes et de la poussière. Si possible, libérez le logement les jours de tableau, de tirage de câbles et de saignées. La cuisine et la salle de bain peuvent rester opérationnelles si on planifie pièce par pièce.",
        },
      ],
    },
  ],

  // ===========================================================================
  // CHAUFFAGISTE (5 spécialités)
  // ===========================================================================
  chauffagiste: [
    {
      slug: "depannage",
      name: "Dépannage chauffage",
      shortLabel: "dépannage",
      longLabel: "spécialisé en dépannage chauffage",
      description:
        "Chauffagiste dépannage : panne chaudière, radiateur froid, eau chaude HS. Intervention rapide.",
      intro:
        "Une chaudière en panne en plein hiver, des radiateurs froids, plus d'eau chaude : les chauffagistes spécialisés en dépannage interviennent sous 24 à 48 h, parfois en urgence. Diagnostic, remplacement de pièces (circulateur, vase d'expansion, sonde, brûleur), purge et remise en route.",
      faqs: [
        {
          question: "Combien coûte un dépannage chauffage en urgence ?",
          answer:
            "Diagnostic et déplacement : 80 € à 150 €. Remplacement d'une pièce courante (circulateur, vase d'expansion) : 200 € à 600 € pose comprise. Majoration nuit/week-end : +30 % à +100 %.",
        },
        {
          question: "Mon contrat d'entretien couvre-t-il les pannes ?",
          answer:
            "Les contrats d'entretien standards couvrent généralement la main-d'œuvre du dépannage et les pièces d'usure (joints, sonde). Le remplacement de pièces majeures (circulateur, brûleur) reste à votre charge sauf contrat tous risques.",
        },
        {
          question: "Combien de temps pour faire venir un chauffagiste l'hiver ?",
          answer:
            "En période de pic (novembre-mars), comptez 2 à 5 jours pour un rendez-vous classique, et quelques heures pour une vraie urgence (pas de chauffage avec enfants ou personnes âgées).",
        },
      ],
    },
    {
      slug: "pompe-a-chaleur",
      name: "Pompe à chaleur",
      shortLabel: "pompe à chaleur",
      longLabel: "spécialisé en installation de pompe à chaleur",
      description:
        "Chauffagiste pompe à chaleur : air-eau, air-air, géothermie. Installation RGE QualiPAC certifié.",
      intro:
        "L'installation d'une pompe à chaleur (air-eau, air-air, géothermie) demande une étude thermique préalable et un installateur certifié RGE QualiPAC pour bénéficier de MaPrimeRénov' et de la TVA à 5,5 %. Aides pouvant atteindre 4 000 € à 11 000 € selon vos revenus et le type de PAC choisi.",
      faqs: [
        {
          question: "Quel prix pour installer une pompe à chaleur ?",
          answer:
            "PAC air-eau : 10 000 € à 18 000 € installée. PAC air-air (climatisation réversible) : 4 000 € à 10 000 €. Géothermie : 18 000 € à 30 000 €. Aides MaPrimeRénov' : 2 500 € à 5 000 € pour les ménages modestes, jusqu'à 4 000 € à 11 000 € avec MaPrimeRénov' Sérénité.",
        },
        {
          question: "Quelle est la durée de vie d'une PAC ?",
          answer:
            "15 à 20 ans pour une PAC air-eau bien entretenue. La géothermie atteint souvent 25 à 30 ans. L'entretien annuel obligatoire (depuis 2020) est essentiel pour la durabilité et la garantie.",
        },
        {
          question: "Faut-il être certifié RGE pour les aides ?",
          answer:
            "Oui, pour bénéficier de MaPrimeRénov', du CEE et de la TVA à 5,5 %, l'installateur doit être titulaire du label RGE QualiPAC en cours de validité. Vérifiez sur france-renov.gouv.fr.",
        },
      ],
    },
    {
      slug: "chaudiere",
      name: "Installation chaudière",
      shortLabel: "installation de chaudière",
      longLabel: "spécialisé en installation de chaudière (gaz, granulés, fioul)",
      description:
        "Chauffagiste installation chaudière : gaz, granulés bois, fioul. Devis gratuit, certifié RGE.",
      intro:
        "Remplacement d'une vieille chaudière par un modèle à condensation, à granulés bois ou à fioul de dernière génération : un chauffagiste qualifié assure l'étude de dimensionnement, la pose, le raccordement et la mise en service. Aides MaPrimeRénov' disponibles pour les chaudières granulés (jusqu'à 7 000 €).",
      faqs: [
        {
          question: "Quelle chaudière choisir aujourd'hui ?",
          answer:
            "La chaudière à granulés bois reste la solution la plus aidée (MaPrimeRénov' jusqu'à 7 000 €). La chaudière gaz à condensation est interdite à la pose en construction neuve depuis 2022 mais reste autorisée en rénovation. La chaudière fioul est interdite à la pose neuve depuis 2022.",
        },
        {
          question: "Combien coûte une chaudière à granulés ?",
          answer:
            "Chaudière à granulés bois 25 kW + silo : 18 000 € à 28 000 € installée. Aides MaPrimeRénov' + CEE : 5 000 € à 11 000 € selon revenus. Prix net après aides : 7 000 € à 17 000 €.",
        },
        {
          question: "Quand faut-il remplacer sa chaudière ?",
          answer:
            "Au-delà de 15 ans pour une chaudière gaz, 20 ans pour une chaudière fioul. Si la consommation a augmenté de plus de 20 %, si elle nécessite des dépannages réguliers, ou si elle n'est pas à condensation : c'est rentable de remplacer.",
        },
      ],
    },
    {
      slug: "entretien",
      name: "Entretien annuel",
      shortLabel: "entretien",
      longLabel: "spécialisé en entretien annuel de chaudière",
      description:
        "Chauffagiste entretien annuel chaudière : obligation légale, contrôle, réglage, nettoyage.",
      intro:
        "L'entretien annuel d'une chaudière (gaz, fioul, bois, PAC) est une obligation légale (décret 2020-912). Il garantit la sécurité, optimise la consommation et conditionne la prise en charge de votre assurance en cas de sinistre. Le chauffagiste vous remet une attestation à conserver.",
      faqs: [
        {
          question: "Combien coûte l'entretien annuel d'une chaudière ?",
          answer:
            "Entretien gaz : 80 € à 150 €. Entretien fioul : 150 € à 250 €. Entretien chaudière granulés : 180 € à 300 €. Entretien PAC : 150 € à 250 €. Tarifs HT à majorer de la TVA à 10 %.",
        },
        {
          question: "Mon contrat d'entretien est-il obligatoire ?",
          answer:
            "Le contrat n'est pas obligatoire mais l'entretien annuel l'est. Le contrat (60 € à 250 €/an) inclut l'entretien et souvent un dépannage gratuit dans l'année. Pratique mais pas indispensable.",
        },
        {
          question: "Quand programmer l'entretien ?",
          answer:
            "Idéalement en septembre-octobre, avant la saison de chauffe. Évitez décembre-février (délais longs et tarifs plus élevés). Le chauffagiste vous fixe ensuite un rendez-vous annuel automatique.",
        },
      ],
    },
    {
      slug: "remplacement",
      name: "Remplacement chaudière",
      shortLabel: "remplacement de chaudière",
      longLabel: "spécialisé en remplacement de chaudière",
      description:
        "Chauffagiste remplacement chaudière : ancienne par condensation, granulés ou PAC. Aides 2026.",
      intro:
        "Remplacer une vieille chaudière par un modèle à condensation, une chaudière à granulés ou une pompe à chaleur permet de diviser sa consommation par 2 à 4. Étude personnalisée, dimensionnement, dépose de l'ancien équipement, pose, raccordement et mise en service par un chauffagiste qualifié.",
      faqs: [
        {
          question: "Quel est le coût total d'un remplacement de chaudière ?",
          answer:
            "Chaudière gaz à condensation : 4 000 € à 8 000 € installée. Chaudière granulés : 18 000 € à 28 000 €. PAC air-eau : 10 000 € à 18 000 €. Avec MaPrimeRénov' + CEE, le reste à charge peut être divisé par 2 ou 3.",
        },
        {
          question: "Puis-je garder mes radiateurs existants ?",
          answer:
            "Oui dans la majorité des cas. Les radiateurs à eau actuels sont compatibles avec une chaudière à condensation et avec une PAC haute température. Pour une PAC basse température, il faut vérifier le dimensionnement (surface d'échange).",
        },
        {
          question: "Quel délai pour remplacer ma chaudière ?",
          answer:
            "Comptez 2 à 6 semaines entre la signature du devis et l'installation. Hors saison (avril-septembre) : 2 à 3 semaines. En pic d'hiver : jusqu'à 6 semaines pour une PAC ou une chaudière granulés (commandes longues).",
        },
      ],
    },
  ],

  // ===========================================================================
  // MENUISIER (5 spécialités)
  // ===========================================================================
  menuisier: [
    {
      slug: "sur-mesure",
      name: "Menuiserie sur mesure",
      shortLabel: "sur mesure",
      longLabel: "spécialisé en menuiserie sur mesure",
      description:
        "Menuisier sur mesure : meubles, dressings, bibliothèques, escaliers. Conception et pose à la carte.",
      intro:
        "Bibliothèque qui épouse un mur biscornu, dressing optimisé pour un sous-pente, escalier sur mesure, meuble TV intégré : la menuiserie sur mesure permet d'exploiter chaque centimètre de votre intérieur. Étude personnalisée, choix des matériaux (chêne, hêtre, MDF, mélaminé), fabrication en atelier puis pose à domicile.",
      faqs: [
        {
          question: "Combien coûte une bibliothèque sur mesure ?",
          answer:
            "Bibliothèque mélaminé blanche 3 m × 2,5 m : 1 500 € à 3 000 €. En bois massif (chêne) : 4 000 € à 8 000 €. Avec portes coulissantes et éclairage LED : ajoutez 30 % à 50 %.",
        },
        {
          question: "Quel délai entre la commande et la pose ?",
          answer:
            "Comptez 4 à 8 semaines : 1 à 2 semaines pour la conception, 2 à 4 semaines pour la fabrication en atelier, 1 à 3 jours pour la pose à domicile.",
        },
        {
          question: "Quelle différence entre menuisier et ébéniste ?",
          answer:
            "Le menuisier travaille principalement les ouvrages de bâtiment (portes, fenêtres, escaliers, parquets, dressings). L'ébéniste se spécialise dans la fabrication et la restauration de meubles haut de gamme. Pour du sur-mesure d'aménagement, le menuisier convient parfaitement.",
        },
      ],
    },
    {
      slug: "fenetre",
      name: "Pose de fenêtres",
      shortLabel: "pose de fenêtres",
      longLabel: "spécialisé en pose et remplacement de fenêtres",
      description:
        "Menuisier pose de fenêtres : PVC, alu, bois. Double vitrage, certifié RGE pour les aides.",
      intro:
        "Le remplacement de vos fenêtres améliore l'isolation thermique et phonique de votre logement, réduit votre facture de chauffage de 10 à 15 % et augmente la valeur de votre bien. Choix entre PVC, aluminium et bois, double ou triple vitrage. Travaux éligibles à MaPrimeRénov' et au CEE si l'installateur est certifié RGE.",
      faqs: [
        {
          question: "Quel matériau choisir : PVC, alu ou bois ?",
          answer:
            "PVC : meilleur rapport qualité/prix/isolation, durée de vie 30 à 40 ans. Alu : design moderne, plus cher, idéal pour grandes baies. Bois : esthétique chaleureux, isolant, mais entretien tous les 5 à 10 ans. Pour la performance énergétique, les 3 matériaux sont équivalents si bien posés.",
        },
        {
          question: "Combien coûte le remplacement de mes fenêtres ?",
          answer:
            "Fenêtre PVC double vitrage 1m × 1,2m : 400 € à 700 € posée. Aluminium : 600 € à 1 200 €. Bois : 700 € à 1 500 €. Pour une maison de 8 fenêtres : 4 000 € à 12 000 € selon matériau et type de pose (rénovation ou dépose totale).",
        },
        {
          question: "Quelles aides pour changer ses fenêtres en 2026 ?",
          answer:
            "MaPrimeRénov' : 40 € à 100 € par fenêtre selon vos revenus. CEE : 30 € à 80 € par fenêtre. TVA à 5,5 %. Installateur RGE obligatoire pour bénéficier des aides.",
        },
      ],
    },
    {
      slug: "porte",
      name: "Pose de portes",
      shortLabel: "pose de portes",
      longLabel: "spécialisé en pose et remplacement de portes",
      description:
        "Menuisier pose de portes : intérieures, blindées, d'entrée. Sur mesure et standard.",
      intro:
        "Porte d'entrée à remplacer pour gagner en isolation et sécurité, portes intérieures à harmoniser après une rénovation, porte blindée pour la sérénité : les menuisiers spécialisés interviennent sur tous types de portes (PVC, alu, bois, mixte) en pose neuve ou en rénovation.",
      faqs: [
        {
          question: "Combien coûte une porte d'entrée ?",
          answer:
            "Porte d'entrée PVC : 800 € à 1 800 € posée. Alu : 1 500 € à 3 500 €. Bois : 1 200 € à 4 000 €. Porte blindée A2P** : 2 500 € à 5 000 € posée. Tarifs hors aides.",
        },
        {
          question: "Quel délai pour remplacer une porte d'entrée ?",
          answer:
            "Délai entre commande et pose : 4 à 8 semaines pour du sur-mesure, 2 à 4 semaines en standard. La pose elle-même prend une demi-journée à une journée.",
        },
        {
          question: "Faut-il un menuisier ou un serrurier pour une porte blindée ?",
          answer:
            "Pour une porte blindée d'entrée standard, un menuisier qualifié suffit. Pour un blindage sur porte existante ou un coffre-fort, un serrurier-métallier est plus adapté. Vérifiez la certification A2P** pour la sécurité (assurance habitation).",
        },
      ],
    },
    {
      slug: "cuisine",
      name: "Aménagement cuisine",
      shortLabel: "aménagement de cuisine",
      longLabel: "spécialisé en aménagement et pose de cuisine sur mesure",
      description:
        "Menuisier cuisine sur mesure : conception, fabrication, pose. Plan de travail bois, ilot central.",
      intro:
        "Cuisine entièrement sur mesure dans un logement aux dimensions atypiques, ilot central, plan de travail bois massif, façades en chêne : le menuisier conçoit et fabrique votre cuisine selon vos besoins, sans contrainte de format standard. Alternative haut de gamme aux cuisinistes industriels.",
      faqs: [
        {
          question: "Cuisine sur mesure ou cuisiniste, quelles différences ?",
          answer:
            "Le cuisiniste vend des modules standards (Schmidt, Mobalpa, Ikea) avec un certain niveau de personnalisation. Le menuisier sur mesure fabrique chaque élément aux cotes exactes, avec des matériaux nobles. Tarif souvent comparable à du haut de gamme cuisiniste.",
        },
        {
          question: "Combien coûte une cuisine sur mesure ?",
          answer:
            "Cuisine sur mesure complète mélaminé : 7 000 € à 15 000 €. En bois massif : 15 000 € à 35 000 €. L'électroménager et le plan de travail (granit, quartz) ne sont généralement pas compris.",
        },
        {
          question: "Quel délai pour une cuisine sur mesure ?",
          answer:
            "Conception : 2 à 4 semaines (relevé, plans, validation). Fabrication atelier : 4 à 8 semaines. Pose : 3 à 5 jours. Total : 2,5 à 4 mois entre signature et cuisine fonctionnelle.",
        },
      ],
    },
    {
      slug: "agencement",
      name: "Agencement intérieur",
      shortLabel: "agencement intérieur",
      longLabel: "spécialisé en agencement intérieur et boiseries",
      description:
        "Menuisier agencement intérieur : dressings, placards, lambris, parquet, escalier.",
      intro:
        "Dressing dans une chambre, placard sous-pente, parquet massif, lambris, habillage de cheminée, escalier en bois sur mesure : l'agencement intérieur transforme l'usage de vos espaces. Le menuisier spécialisé conçoit, fabrique et pose des solutions adaptées à votre style et à votre budget.",
      faqs: [
        {
          question: "Combien coûte un dressing sur mesure ?",
          answer:
            "Dressing mélaminé blanc 3 m linéaire : 1 800 € à 3 500 €. En bois massif avec portes coulissantes : 4 500 € à 8 000 €. Comptez +30 % pour des accessoires haut de gamme (tringles éclairées, paniers coulissants).",
        },
        {
          question: "Quel parquet choisir pour une rénovation ?",
          answer:
            "Parquet massif chêne : 50 € à 150 €/m² posé, durée de vie 50+ ans. Contrecollé : 30 € à 80 €/m², durable 25 à 30 ans, peut être rénové. Stratifié : 15 € à 50 €/m², 10 à 20 ans. Pour rénover un ancien parquet : ponçage + vitrification : 25 € à 50 €/m².",
        },
        {
          question: "Peut-on poser un parquet sur du carrelage ?",
          answer:
            "Oui, sous conditions : carrelage plan et solidaire du support, prévoir une sous-couche acoustique adaptée, et anticiper la perte de hauteur (8 à 15 mm). Le contrecollé ou stratifié sont idéaux dans ce cas.",
        },
      ],
    },
  ],

  // ===========================================================================
  // MAÇON (5 spécialités)
  // ===========================================================================
  macon: [
    {
      slug: "renovation",
      name: "Rénovation maison",
      shortLabel: "rénovation",
      longLabel: "spécialisé en rénovation de maison",
      description:
        "Maçon rénovation maison : ouverture de mur, dalle, escalier, ravalement intérieur.",
      intro:
        "Ouverture d'un mur porteur, création d'une dalle béton, reprise de fondations, restauration de pierres apparentes, transformation d'une grange en habitation : le maçon spécialisé en rénovation intervient sur les structures existantes avec étude technique préalable et garantie décennale.",
      faqs: [
        {
          question: "Combien coûte une rénovation de maison au m² ?",
          answer:
            "Rénovation légère (peinture, sols) : 200 € à 500 €/m². Rénovation moyenne (cuisine + SDB + murs) : 500 € à 1 200 €/m². Rénovation lourde (gros œuvre, structure) : 1 200 € à 2 500 €/m². Pour une maison de 100 m², comptez 50 000 € à 250 000 € selon l'ampleur.",
        },
        {
          question: "Quelles aides pour rénover une vieille maison ?",
          answer:
            "MaPrimeRénov' (jusqu'à 70 000 € pour rénovation globale), Éco-PTZ (jusqu'à 50 000 €), TVA à 5,5 % sur travaux énergétiques, aides ANAH si revenus modestes, exonération taxe foncière dans certaines communes. Cumulables sous conditions.",
        },
        {
          question: "Faut-il un permis pour ouvrir un mur porteur ?",
          answer:
            "Non, pas de permis si pas de modification de façade. Mais un bureau d'études béton armé est obligatoire pour calculer la poutre IPN. En copropriété, l'accord du syndic est requis si le mur est commun.",
        },
      ],
    },
    {
      slug: "extension",
      name: "Extension maison",
      shortLabel: "extension",
      longLabel: "spécialisé en extension de maison",
      description:
        "Maçon extension maison : surélévation, agrandissement, véranda. Permis et étude technique.",
      intro:
        "Agrandir sa maison plutôt que déménager : extension de plain-pied, surélévation d'un étage, véranda maçonnée. Étude de faisabilité, permis de construire ou déclaration préalable selon la surface, raccordement à l'existant et finitions. Solution souvent rentable face au prix du mètre carré dans la zone.",
      faqs: [
        {
          question: "Combien coûte une extension de maison au m² ?",
          answer:
            "Extension classique parpaing/brique : 1 800 € à 2 800 €/m². Extension ossature bois : 1 500 € à 2 400 €/m². Surélévation : 2 000 € à 3 500 €/m². Pour 30 m² supplémentaires : comptez 50 000 € à 100 000 € tout compris (gros œuvre + second œuvre).",
        },
        {
          question: "Permis ou déclaration préalable ?",
          answer:
            "Jusqu'à 20 m² : déclaration préalable suffit (40 m² en zone urbaine couverte par un PLU). Au-delà : permis de construire obligatoire. Si votre extension porte la surface totale au-dessus de 150 m², l'architecte est obligatoire.",
        },
        {
          question: "Quel délai pour une extension de maison ?",
          answer:
            "Étude + permis : 3 à 6 mois. Travaux : 4 à 9 mois selon la taille. Total : 8 à 15 mois entre la décision et la livraison.",
        },
      ],
    },
    {
      slug: "construction-neuve",
      name: "Construction neuve",
      shortLabel: "construction neuve",
      longLabel: "spécialisé en construction neuve",
      description:
        "Maçon construction neuve : fondations, élévation murs, dalles. Étude RT 2020 conforme.",
      intro:
        "Construction d'une maison individuelle ou d'un local professionnel : terrassement, fondations, élévation des murs porteurs en parpaing, brique ou béton banché, dalles, charpente. Le maçon est le pilote du gros œuvre et coordonne souvent les autres corps de métier.",
      faqs: [
        {
          question: "Combien coûte le gros œuvre d'une maison neuve ?",
          answer:
            "Gros œuvre seul (fondations + murs + dalles + charpente couverte) : 800 € à 1 400 €/m². Pour une maison de 100 m² : 80 000 € à 140 000 €. Le second œuvre (cloisons, plomberie, élec, finitions) double souvent ce prix.",
        },
        {
          question: "Faut-il passer par un constructeur ou un maçon ?",
          answer:
            "Constructeur (CCMI) : prix fixe, garanties solides, mais marge sur les travaux. Maçon en direct : prix souvent 15 à 25 % moins cher, mais vous coordonnez tous les corps de métier (plus de travail et de risques). Architecte + maçon : meilleure qualité architecturale.",
        },
        {
          question: "Combien de temps pour construire une maison ?",
          answer:
            "Du dépôt de permis à la livraison : 12 à 18 mois en moyenne. Permis : 3 à 5 mois. Travaux : 8 à 12 mois pour une maison classique de 100 à 150 m².",
        },
      ],
    },
    {
      slug: "mur-cloture",
      name: "Mur et clôture",
      shortLabel: "mur et clôture",
      longLabel: "spécialisé en construction de murs et de clôtures",
      description:
        "Maçon construction mur, clôture, muret : parpaing, pierre, béton banché. Devis gratuit.",
      intro:
        "Mur de soutènement, clôture mitoyenne, muret de jardin, mur de séparation, gabion : le maçon dimensionne, terrassine, coule les fondations et monte la structure selon vos besoins (parpaing, pierre, béton banché, panneau préfabriqué).",
      faqs: [
        {
          question: "Quel prix pour un mur de clôture en parpaing ?",
          answer:
            "Mur en parpaing 1,5 m de haut, fondations comprises : 80 € à 130 €/ml posé. En pierre apparente : 200 € à 400 €/ml. En béton banché : 130 € à 200 €/ml. Pour 50 ml : 4 000 € à 20 000 € selon matériau.",
        },
        {
          question: "Faut-il une autorisation pour construire un mur ?",
          answer:
            "Mur de moins de 2 m de hauteur : aucune autorisation. Au-delà : déclaration préalable obligatoire en mairie. Si le mur sépare deux propriétés, l'accord écrit du voisin est recommandé pour éviter les litiges.",
        },
        {
          question: "Quel délai pour construire un mur ?",
          answer:
            "Pour 30 ml de mur : 3 à 5 jours de travaux + 21 jours de séchage avant enduit ou peinture. Pour un mur de soutènement, comptez 2 à 4 semaines selon hauteur et terrain.",
        },
      ],
    },
    {
      slug: "terrassement",
      name: "Terrassement",
      shortLabel: "terrassement",
      longLabel: "spécialisé en terrassement et VRD",
      description:
        "Maçon terrassement : fouilles, viabilisation, déblaiement, mise en place dalle béton.",
      intro:
        "Terrassement avant construction, viabilisation d'un terrain (eau, électricité, assainissement), nivellement pour piscine ou terrasse, création d'accès véhicule : le maçon spécialisé en terrassement maîtrise les engins de chantier (mini-pelle, bulldozer) et lit les plans topographiques.",
      faqs: [
        {
          question: "Combien coûte un terrassement de terrain ?",
          answer:
            "Terrassement simple (déblai/remblai) : 30 € à 60 €/m³. Terrassement avec évacuation : 80 € à 150 €/m³. Pour une maison de 100 m² au sol : comptez 5 000 € à 15 000 € selon la nature du sol et l'accessibilité.",
        },
        {
          question: "Quand prévoir un terrassement ?",
          answer:
            "Avant toute construction (maison, piscine, terrasse béton, mur de soutènement). Idéalement par temps sec, en début de saison de travaux (mars-juin) pour laisser le terrain se stabiliser avant la suite des travaux.",
        },
        {
          question: "Faut-il une étude de sol avant de terrasser ?",
          answer:
            "Étude G2 (avant projet) recommandée pour toute construction de plus de 30 m² ou en zone à risque (argile, sable, présence d'eau). Coût : 1 500 € à 3 500 €. Permet de dimensionner correctement les fondations et d'éviter des fissures futures.",
        },
      ],
    },
  ],

  // ===========================================================================
  // PEINTRE (5 spécialités)
  // ===========================================================================
  peintre: [
    {
      slug: "interieur",
      name: "Peinture intérieure",
      shortLabel: "peinture intérieure",
      longLabel: "spécialisé en peinture intérieure",
      description:
        "Peintre intérieur : murs, plafonds, boiseries. Préparation, pose, finitions soignées.",
      intro:
        "Rafraîchissement complet d'un appartement, peinture d'une pièce après travaux, mise en peinture d'une maison neuve : le peintre intérieur prépare les supports (rebouchage, ponçage, sous-couche), choisit les bons produits selon les pièces (acrylique, glycéro, chaux) et applique avec un soin du détail.",
      faqs: [
        {
          question: "Combien coûte la peinture intérieure au m² ?",
          answer:
            "Peinture standard 2 couches (préparation comprise) : 25 € à 40 €/m² murs et plafonds. Peinture haut de gamme avec préparation poussée : 40 € à 70 €/m². Pour un T3 de 70 m² : 4 000 € à 7 500 € pour murs + plafonds.",
        },
        {
          question: "Combien de temps pour peindre un appartement ?",
          answer:
            "T2 (45 m²) : 4 à 6 jours. T3 (70 m²) : 6 à 9 jours. T4 (90 m²) : 9 à 12 jours. Comptez 1 jour de séchage entre chaque couche, et 2 jours de protection avant emménagement.",
        },
        {
          question: "Acrylique ou glycéro ?",
          answer:
            "Acrylique (à l'eau) : sans odeur, séchage rapide, écologique, idéal pour 90 % des cas. Glycéro (à l'huile) : plus résistant, pour boiseries et pièces humides, mais COV élevés. Privilégiez l'acrylique sauf besoin spécifique.",
        },
      ],
    },
    {
      slug: "exterieur",
      name: "Peinture extérieure",
      shortLabel: "peinture extérieure",
      longLabel: "spécialisé en peinture extérieure",
      description:
        "Peintre extérieur : façade, volets, portail, terrasse bois. Traitement et finition.",
      intro:
        "Peinture de façade, volets, portail, garde-corps, terrasse bois : la peinture extérieure protège les supports des intempéries et embellit votre maison. Choix des produits adaptés (peinture façade pliolite, lasure bois, peinture fer antirouille) et application en conditions météo favorables.",
      faqs: [
        {
          question: "Combien coûte la peinture d'une façade ?",
          answer:
            "Peinture façade en bon état : 25 € à 50 €/m². Avec réparations préalables (fissures, enduit) : 50 € à 100 €/m². Pour une maison de 100 m² au sol (≈200 m² de façade) : 5 000 € à 20 000 €.",
        },
        {
          question: "Quand peindre l'extérieur de sa maison ?",
          answer:
            "Saisons idéales : avril-juin et septembre-octobre. Évitez les fortes chaleurs (plus de 25°C), le gel, la pluie et l'humidité élevée. La température idéale d'application est entre 10 et 25°C.",
        },
        {
          question: "Peinture façade : quel produit choisir ?",
          answer:
            "Peinture pliolite : excellent rapport qualité/prix, perméable à la vapeur d'eau, durée 8 à 12 ans. Peinture siloxane : haut de gamme, déperlante, durée 12 à 15 ans. Lasure pour bois : pénétrante, à renouveler tous les 3 à 8 ans selon exposition.",
        },
      ],
    },
    {
      slug: "ravalement",
      name: "Ravalement façade",
      shortLabel: "ravalement",
      longLabel: "spécialisé en ravalement de façade",
      description:
        "Peintre ravalement façade : nettoyage, réparation, enduit, peinture. Devis gratuit.",
      intro:
        "Le ravalement de façade est obligatoire tous les 10 ans dans certaines communes. Il comprend nettoyage haute pression ou hydrogommage, traitement des fissures, application d'un enduit minéral et finition (peinture, crépi). Solution durable pour redonner du cachet et protéger votre maison.",
      faqs: [
        {
          question: "Combien coûte un ravalement de façade ?",
          answer:
            "Ravalement complet : 50 € à 130 €/m² selon état initial et finition choisie. Pour une maison de 100 m² (≈200 m² de façade) : 10 000 € à 26 000 €. Aides MaPrimeRénov' possibles si couplé avec une isolation extérieure (jusqu'à 15 000 €).",
        },
        {
          question: "Le ravalement est-il obligatoire ?",
          answer:
            "Oui dans certaines communes (Paris, grandes villes), tous les 10 ans. Hors zones réglementées, pas d'obligation, mais une façade dégradée peut faire l'objet d'une mise en demeure du maire si elle nuit à l'esthétique du quartier.",
        },
        {
          question: "Quel délai pour un ravalement ?",
          answer:
            "Pour une maison de 100 m² au sol : 1 à 3 semaines de travaux selon technique (nettoyage simple ou ravalement avec enduit). Échafaudage compris dans le devis dans la majorité des cas.",
        },
      ],
    },
    {
      slug: "decoratif",
      name: "Peinture décorative",
      shortLabel: "peinture décorative",
      longLabel: "spécialisé en peinture décorative et finitions haut de gamme",
      description:
        "Peintre décorateur : effets, patines, béton ciré, tadelakt, stuc, chaux décorative.",
      intro:
        "Béton ciré, tadelakt, stuc vénitien, patine vieillie, effet métallisé, fresque murale : la peinture décorative transforme un mur en pièce maîtresse. Le peintre décorateur maîtrise des techniques artisanales pour des finitions uniques et haut de gamme.",
      faqs: [
        {
          question: "Quel prix pour du béton ciré au mur ?",
          answer:
            "Béton ciré décoratif au mur (préparation + 3 couches + protection) : 80 € à 180 €/m². Au sol : 100 € à 250 €/m². Pour une crédence de cuisine ou un mur d'accent (5 à 10 m²) : 800 € à 2 500 €.",
        },
        {
          question: "Tadelakt ou béton ciré dans une salle de bain ?",
          answer:
            "Tadelakt : enduit à la chaux marocain, naturel, hydrofuge, esthétique mat profonde. Béton ciré : matière contemporaine, finition lisse, plus large palette de couleurs. Tadelakt plus cher (150 à 300 €/m²) mais ambiance unique.",
        },
        {
          question: "Quel délai pour une peinture décorative ?",
          answer:
            "1 à 3 jours par mur selon la technique. Le tadelakt et le béton ciré demandent plusieurs couches espacées de séchages (24 à 48 h chacune). Pour une pièce complète : 5 à 10 jours hors préparation.",
        },
      ],
    },
    {
      slug: "tapisserie",
      name: "Pose de tapisserie",
      shortLabel: "pose de tapisserie",
      longLabel: "spécialisé en pose de papier peint et tapisserie",
      description:
        "Peintre poseur de tapisserie : papier peint, intissé, vinyle, panoramique. Pose précise.",
      intro:
        "Pose de papier peint traditionnel ou intissé, panoramique grande largeur, papier peint vinyle pour pièces humides : le peintre tapissier prépare le support (lessivage, ponçage, sous-couche), encolle, marouflle et raccorde les motifs avec précision pour une finition impeccable.",
      faqs: [
        {
          question: "Combien coûte la pose de papier peint au m² ?",
          answer:
            "Pose seule (sans fourniture) : 15 € à 30 €/m². Pose intissé : 20 € à 40 €/m². Pose panoramique grand format : 35 € à 80 €/m². Préparation des murs (rebouchage, sous-couche) : 5 à 15 €/m² supplémentaires.",
        },
        {
          question: "Combien de temps pour tapisser une pièce ?",
          answer:
            "Pièce de 15 m² (4 murs) : 1 à 2 jours pose seule. Avec préparation des murs : 3 à 4 jours. Le délai dépend du raccord du motif (un panneau panoramique uni va plus vite qu'un papier à motifs complexes).",
        },
        {
          question: "Comment choisir entre papier peint et peinture ?",
          answer:
            "Papier peint : style, motifs, masque mieux les défauts du mur, durée 10 à 15 ans. Peinture : plus économique au m², plus facile à rafraîchir tous les 5 à 7 ans. Mix gagnant : peinture sur 3 murs + papier peint sur le mur d'accent.",
        },
      ],
    },
  ],

  // ===========================================================================
  // CARRELEUR (5 spécialités)
  // ===========================================================================
  carreleur: [
    {
      slug: "salle-de-bain",
      name: "Salle de bain",
      shortLabel: "salle de bain",
      longLabel: "spécialisé en carrelage de salle de bain",
      description:
        "Carreleur salle de bain : sol, mur, douche italienne, faïence. Étanchéité garantie.",
      intro:
        "Pose de carrelage sol et mur de salle de bain, douche à l'italienne avec siphon de sol, faïence murale, mosaïque, joints époxy étanches : le carreleur spécialisé maîtrise les contraintes d'étanchéité (système SPEC), les pentes pour évacuation et les finitions soignées dans les angles.",
      faqs: [
        {
          question: "Combien coûte le carrelage d'une salle de bain ?",
          answer:
            "Carrelage sol + mur d'une SDB de 6 m² : pose seule 1 200 € à 2 500 €. Avec fourniture entrée/moyenne gamme : 2 000 € à 4 500 €. Avec douche italienne : ajoutez 800 € à 1 500 €.",
        },
        {
          question: "Quel carrelage choisir pour une salle de bain ?",
          answer:
            "Au sol : grès cérame antidérapant (R10 minimum, R11 idéal pour douche italienne), 25 à 80 €/m². Au mur : faïence ou grès cérame, 15 à 60 €/m². Pour douche : système SPEC ou natte d'étanchéité obligatoire avant la pose.",
        },
        {
          question: "Combien de temps pour carreler une salle de bain ?",
          answer:
            "SDB de 6 m² : 3 à 5 jours pour pose sol + mur + douche. Comptez 24 à 48 h de séchage avant utilisation des sanitaires, et 7 jours avant utilisation intensive de la douche (séchage des joints).",
        },
      ],
    },
    {
      slug: "cuisine",
      name: "Carrelage cuisine",
      shortLabel: "carrelage cuisine",
      longLabel: "spécialisé en carrelage de cuisine",
      description:
        "Carreleur cuisine : sol, crédence, plan de travail. Pose précise et finitions joints.",
      intro:
        "Sol de cuisine en grès cérame format XXL ou imitation parquet, crédence en faïence ou mosaïque verre, plan de travail carrelé : le carreleur de cuisine pose des matériaux résistants à la chaleur, aux taches et à l'humidité, avec un soin particulier autour des éléments (évier, plaque de cuisson).",
      faqs: [
        {
          question: "Combien coûte le carrelage d'une cuisine ?",
          answer:
            "Sol cuisine 12 m² : 800 € à 1 800 € pose comprise (entrée/moyen de gamme). Crédence faïence sur 5 ml : 400 € à 1 200 €. Pour cuisine ouverte avec sol XXL et grand format, comptez 30 à 50 €/m² de pose en plus.",
        },
        {
          question: "Format XXL : quel intérêt et quels écueils ?",
          answer:
            "Format XXL (60 × 60, 80 × 80, 120 × 60) : moins de joints, rendu très contemporain, idéal pour grandes pièces. Inconvénients : pose plus délicate (planéité parfaite du support nécessaire), prix de la pose +30 à 50 %, manutention de carreaux lourds.",
        },
        {
          question: "Carrelage ou parquet pour la cuisine ?",
          answer:
            "Carrelage : meilleure résistance à l'eau, aux taches, à la chaleur, durabilité 50+ ans. Parquet contrecollé adapté humidité : esthétique plus chaleureuse, mais demande plus d'attention. Tendance moderne : carrelage imitation bois grand format pour le meilleur des deux mondes.",
        },
      ],
    },
    {
      slug: "terrasse",
      name: "Carrelage terrasse",
      shortLabel: "carrelage terrasse",
      longLabel: "spécialisé en carrelage de terrasse extérieure",
      description:
        "Carreleur terrasse extérieure : grès cérame, pierre, dalle plot. Antidérapant et résistant.",
      intro:
        "Pose de carrelage en grès cérame extérieur, pierre naturelle, terre cuite ou dalle sur plot pour terrasse, allée, plage de piscine. Le carreleur extérieur respecte les pentes d'écoulement (1 à 2 %), prévoit les joints de dilatation et utilise des produits résistants au gel et aux UV.",
      faqs: [
        {
          question: "Combien coûte le carrelage d'une terrasse ?",
          answer:
            "Pose seule : 30 € à 70 €/m². Avec fourniture grès cérame extérieur : 70 € à 130 €/m². Pour une terrasse de 25 m² : 2 000 € à 3 500 € tout compris. La dalle sur plot est plus rapide : 60 € à 120 €/m² posée.",
        },
        {
          question: "Quel carrelage extérieur antidérapant ?",
          answer:
            "Norme R11 minimum pour terrasse exposée à la pluie, R12 ou R13 pour plage de piscine. Le grès cérame structuré (effet pierre, bois) offre une bonne adhérence sans sacrifier l'esthétique. Évitez les carrelages polis intérieurs en extérieur.",
        },
        {
          question: "Carrelage ou bois pour ma terrasse ?",
          answer:
            "Carrelage extérieur : durable 30+ ans, sans entretien, ne se déforme pas, plus cher à la pose. Bois (pin, ipé, composite) : esthétique plus chaleureuse, demande un entretien annuel, 15 à 25 ans de vie. Choix selon style et budget entretien.",
        },
      ],
    },
    {
      slug: "sol-pvc",
      name: "Sol PVC et vinyle",
      shortLabel: "sol PVC",
      longLabel: "spécialisé en pose de sol PVC et vinyle",
      description:
        "Carreleur pose sol PVC, vinyle, lame LVT clipsée. Alternative économique au carrelage.",
      intro:
        "Le sol PVC en lame, dalle ou rouleau (LVT) est devenu une alternative crédible au carrelage et au parquet : imitation bois ou pierre très réaliste, pose rapide (clipsable ou collé), résistance à l'eau, isolation phonique. Idéal pour rénovation rapide ou pièces humides hors zones de douche.",
      faqs: [
        {
          question: "Combien coûte la pose d'un sol PVC ?",
          answer:
            "Pose seule (préparation comprise) : 15 € à 30 €/m². Avec fourniture LVT moyenne gamme : 35 € à 70 €/m². Pour un T3 de 70 m² : 2 500 € à 5 000 € tout compris.",
        },
        {
          question: "Sol PVC ou stratifié ?",
          answer:
            "PVC LVT : 100 % résistant à l'eau (cuisine, SDB hors douche), plus chaud sous le pied, isolation phonique. Stratifié : moins cher, supporte mal l'eau, sensible aux rayures profondes. PVC plus polyvalent et moderne.",
        },
        {
          question: "Peut-on poser du PVC sur du carrelage ?",
          answer:
            "Oui, c'est même un cas idéal. Le carrelage existant sert de support stable. Vérifiez la planéité, comblez les joints creux, posez une sous-couche si besoin. Perte de hauteur minime (5 à 8 mm).",
        },
      ],
    },
    {
      slug: "faience",
      name: "Faïence murale",
      shortLabel: "faïence",
      longLabel: "spécialisé en pose de faïence murale",
      description:
        "Carreleur pose de faïence murale : crédence, salle de bain, mosaïque verre. Joints précis.",
      intro:
        "Pose de faïence murale en crédence de cuisine, dans la salle de bain, en mur d'accent : le carreleur prépare le support (planéité, primaire), trace les repères, coupe les carreaux à la disqueuse ou cliveuse, jointe avec un mortier adapté à l'usage (humide, sec).",
      faqs: [
        {
          question: "Combien coûte la pose de faïence murale ?",
          answer:
            "Pose seule : 30 € à 60 €/m² selon format. Mosaïque ou petits formats (plus complexe) : 60 € à 120 €/m². Pour une crédence de 5 m² : 200 € à 600 € pose seule, 400 € à 1 500 € avec faïence moyenne gamme.",
        },
        {
          question: "Quel mortier-colle pour de la faïence ?",
          answer:
            "Pour faïence intérieure sur mur : colle C2 ou C2T (déformable). Pour mur de douche : colle C2-S1 (déformable + résistance à l'eau). Pour faïence sur ancien carrelage : C2-T avec primaire d'accrochage adapté.",
        },
        {
          question: "Joints clairs ou foncés ?",
          answer:
            "Joints clairs (gris, blanc) : agrandissent l'espace, mais salissants à long terme. Joints foncés (gris anthracite, noir) : plus modernes, masquent les saletés. Pour la cuisine et la SDB, privilégiez les joints époxy (anti-tâche) en moyen-gris.",
        },
      ],
    },
  ],

  // ===========================================================================
  // PAYSAGISTE (5 spécialités)
  // ===========================================================================
  paysagiste: [
    {
      slug: "creation-jardin",
      name: "Création de jardin",
      shortLabel: "création de jardin",
      longLabel: "spécialisé en création de jardin",
      description:
        "Paysagiste création de jardin : plan, terrassement, plantations, gazon, allées.",
      intro:
        "Conception complète d'un jardin : plan paysager, terrassement, plantations adaptées au sol et au climat, pose de gazon ou prairie fleurie, création d'allées, bordures, points d'eau, éclairage extérieur. Le paysagiste concepteur dessine d'abord un plan personnalisé avant les travaux.",
      faqs: [
        {
          question: "Combien coûte la création d'un jardin ?",
          answer:
            "Conception seule (plan + 3D) : 800 € à 2 500 €. Création complète clé en main : 60 € à 200 €/m² selon ambition. Pour un jardin de 200 m² : 12 000 € à 40 000 € tout compris (terrassement, plantations, allées, arrosage).",
        },
        {
          question: "Quel délai pour créer un jardin de A à Z ?",
          answer:
            "Étude et plans : 4 à 8 semaines. Travaux : 4 à 12 semaines selon ampleur. Plantations idéalement en automne ou au printemps pour une bonne reprise.",
        },
        {
          question: "Quelles plantes choisir pour un jardin sans entretien ?",
          answer:
            "Vivaces résistantes (sauges, lavandes, gaura, geraniums vivaces), graminées ornementales, arbustes persistants (laurier, photinia), couvre-sols (lierre, vinca). Privilégiez les espèces locales adaptées au climat et au sol.",
        },
      ],
    },
    {
      slug: "entretien",
      name: "Entretien jardin",
      shortLabel: "entretien jardin",
      longLabel: "spécialisé en entretien de jardin",
      description:
        "Paysagiste entretien jardin : tonte, taille, désherbage, fertilisation. Forfait annuel.",
      intro:
        "Tonte régulière, taille des haies et arbustes, désherbage, scarification du gazon, fertilisation, ramassage des feuilles : l'entretien régulier d'un jardin demande du temps et du matériel adapté. Faire appel à un paysagiste libère votre temps tout en garantissant un jardin sain toute l'année.",
      faqs: [
        {
          question: "Combien coûte l'entretien annuel d'un jardin ?",
          answer:
            "Forfait annuel pour un jardin de 500 m² : 800 € à 2 500 €/an selon fréquence (1 à 2 passages/mois en saison). À l'heure : 30 € à 50 €/h. Crédit d'impôt service à la personne de 50 % pour les travaux d'entretien (plafond 5 000 €/an).",
        },
        {
          question: "Quand tailler les haies et arbustes ?",
          answer:
            "Haies persistantes (laurier, thuya) : juin et octobre. Haies à fleurs : après floraison. Arbustes à floraison printanière : juste après la floraison. Fruitiers : taille de formation hiver, taille en vert juin-juillet. Évitez la nidification (mars-juillet).",
        },
        {
          question: "Comment éviter les mauvaises herbes durablement ?",
          answer:
            "Paillage organique (5 à 10 cm) sur les massifs, plantes couvre-sols, désherbage manuel régulier (avant floraison des annuelles), géotextile sous gravier. Évitez les désherbants chimiques (interdits aux particuliers depuis 2019).",
        },
      ],
    },
    {
      slug: "terrasse",
      name: "Terrasse et allée",
      shortLabel: "terrasse et allée",
      longLabel: "spécialisé en création de terrasse et d'allée extérieure",
      description:
        "Paysagiste création terrasse et allée : bois, pierre, gravier, dalle béton.",
      intro:
        "Création d'une terrasse en bois (pin traité, ipé, composite), en pierre naturelle, en dalle béton ou en travertin. Allée d'accès en gravier stabilisé, pavés autobloquants, dalles ou résine drainante. Le paysagiste-terrassier coule les fondations, pose le revêtement et soigne les finitions.",
      faqs: [
        {
          question: "Combien coûte une terrasse en bois ?",
          answer:
            "Terrasse pin traité : 60 € à 110 €/m² posée. Composite : 100 € à 180 €/m². Bois exotique (ipé, cumaru) : 150 € à 280 €/m². Pour 30 m² : 1 800 € à 8 400 €. Pour une terrasse pierre, comptez 80 € à 200 €/m² posée.",
        },
        {
          question: "Quelle allée pour mon entrée de maison ?",
          answer:
            "Gravier stabilisé en nid d'abeille : 40 à 80 €/m² (économique, perméable). Pavés autobloquants : 80 à 150 €/m² (durable, classique). Béton désactivé : 70 à 120 €/m² (moderne). Résine de marbre : 130 à 200 €/m² (haut de gamme, drainante).",
        },
        {
          question: "Faut-il un permis pour une terrasse ou allée ?",
          answer:
            "Terrasse de plain-pied (au niveau du sol) : aucune autorisation. Terrasse surélevée de plus de 60 cm ou créant plus de 5 m² : déclaration préalable. Allée privée : aucune démarche. Vérifiez votre PLU pour les zones protégées.",
        },
      ],
    },
    {
      slug: "elagage",
      name: "Élagage et abattage",
      shortLabel: "élagage",
      longLabel: "spécialisé en élagage et abattage d'arbres",
      description:
        "Paysagiste élagage et abattage d'arbres : taille douce, sécurité, évacuation des déchets.",
      intro:
        "Élagage d'entretien d'arbres ornementaux ou fruitiers, taille de mise en sécurité, abattage d'arbre dangereux ou en fin de vie, dessouchage : l'élagueur grimpeur intervient avec matériel professionnel (cordes, tronçonneuse, broyeur) en respectant les règles de sécurité.",
      faqs: [
        {
          question: "Combien coûte l'élagage d'un arbre ?",
          answer:
            "Petit arbre (<10 m) : 100 € à 250 €. Arbre moyen (10-20 m) : 250 € à 600 €. Grand arbre (>20 m) : 600 € à 1 500 €. Abattage avec dessouchage : 300 € à 2 000 € selon taille et accessibilité. Évacuation des déchets souvent comprise.",
        },
        {
          question: "Quand élaguer ses arbres ?",
          answer:
            "Arbres caducs : taille en hiver (novembre-mars), hors période de gel intense. Arbres persistants : juin-juillet. Fruitiers : taille de fructification fin d'hiver, taille en vert mai-juin. Évitez la période de nidification des oiseaux (mars-juillet).",
        },
        {
          question: "Faut-il une autorisation pour abattre un arbre ?",
          answer:
            "En général non sur sa propriété privée. Mais : autorisation si arbre classé ou protégé (PLU, zone Natura 2000), accord du voisin si arbre mitoyen, déclaration préalable parfois requise en zone urbaine. Vérifiez en mairie avant.",
        },
      ],
    },
    {
      slug: "arrosage",
      name: "Arrosage automatique",
      shortLabel: "arrosage automatique",
      longLabel: "spécialisé en installation d'arrosage automatique",
      description:
        "Paysagiste installation arrosage automatique : goutte-à-goutte, asperseurs, programmateur.",
      intro:
        "Installation d'un système d'arrosage automatique enterré (asperseurs pour pelouse, goutte-à-goutte pour massifs et potager) avec programmateur intelligent : économies d'eau, plantes toujours bien hydratées, plus besoin d'y penser pendant les vacances.",
      faqs: [
        {
          question: "Combien coûte un arrosage automatique ?",
          answer:
            "Pour un jardin de 200 m² avec pelouse + massifs : 1 500 € à 4 000 € installé. Système avec programmateur connecté + capteur d'humidité : ajoutez 200 € à 600 €. Économie d'eau de 30 à 50 % vs arrosage manuel.",
        },
        {
          question: "Asperseur ou goutte-à-goutte ?",
          answer:
            "Asperseur : pour pelouse et grandes zones. Goutte-à-goutte : pour massifs, haies, potager (plus économe en eau, mieux ciblé). Souvent les deux sont combinés sur une même installation avec différents secteurs et programmes.",
        },
        {
          question: "Puis-je raccorder mon arrosage à un récupérateur d'eau ?",
          answer:
            "Oui pour le goutte-à-goutte, qui demande peu de pression. Pour les asperseurs, il faut une pompe surpresseur. Cuve de 1 000 à 5 000 L avec pompe : 800 € à 2 500 €. Économie sur la facture d'eau : 100 € à 400 €/an selon climat.",
        },
      ],
    },
  ],
};

/**
 * Retourne une spécialité par metier + slug, ou null si introuvable.
 */
export function getSpecialty(
  metierSlug: string,
  specialtySlug: string
): Specialty | null {
  return SPECIALTIES[metierSlug]?.find((s) => s.slug === specialtySlug) || null;
}

/**
 * Retourne toutes les spécialités d'un métier.
 */
export function getSpecialtiesForMetier(metierSlug: string): Specialty[] {
  return SPECIALTIES[metierSlug] || [];
}

/**
 * Retourne tous les couples (metierSlug, specialtySlug) pour le sitemap.
 */
export function getAllSpecialtyPairs(): Array<{ metierSlug: string; specialty: Specialty }> {
  const pairs: Array<{ metierSlug: string; specialty: Specialty }> = [];
  for (const [metierSlug, specs] of Object.entries(SPECIALTIES)) {
    for (const spec of specs) {
      pairs.push({ metierSlug, specialty: spec });
    }
  }
  return pairs;
}

/**
 * Retourne true si le couple (metier, specialite) est valide.
 */
export function isValidSpecialty(
  metierSlug: string,
  specialtySlug: string
): boolean {
  return getSpecialty(metierSlug, specialtySlug) !== null;
}
