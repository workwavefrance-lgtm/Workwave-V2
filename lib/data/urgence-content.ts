// Contenu sourcé via Perplexity API (recherche web + citations) — généré le 2026-06-10.
// Régénérer : npx tsx scripts/fetch-urgence-content.ts
// RÈGLE : zéro chiffre inventé — tout chiffre affiché vient des sources listées.

export type UrgenceContent = {
  priceRanges: { label: string; low: number; high: number }[];
  majorations: string;
  legalFacts: string[];
  scamWarnings: string[];
  goodReflexes: string[];
  sources: string[];
  retrievedAt: string;
};

export const URGENCE_CONTENT: Record<string, UrgenceContent> = {
  serrurier: {
    "priceRanges": [
      {
        "label": "Ouverture de porte claquée (jour, semaine)",
        "low": 55,
        "high": 180
      },
      {
        "label": "Ouverture de porte verrouillée/blindée",
        "low": 110,
        "high": 300
      },
      {
        "label": "Remplacement de serrure standard",
        "low": 100,
        "high": 450
      },
      {
        "label": "Remplacement de cylindre",
        "low": 130,
        "high": 300
      }
    ],
    "majorations": "Les sources récentes constatent des majorations d’environ +20 % à +100 % la nuit, le week-end et les jours fériés, avec une moyenne souvent citée autour de +30 %. Certaines grilles évoquent aussi des suppléments de 30 % à 50 % selon la plage horaire et la zone.",
    "legalFacts": [
      "Il n’existe pas de réglementation générale fixant les tarifs des serruriers en France : le prix est librement déterminé par l’entreprise, sous réserve d’information loyale du consommateur.",
      "L’arrêté du 24 janvier 2017 impose, pour les prestations de dépannage à domicile, l’information préalable du consommateur et un devis écrit au-delà de 150 € TTC ; certaines sources résument aussi cette exigence comme un contrat écrit dès le 1er euro.",
      "Le droit de rétractation de 14 jours existe pour les contrats conclus hors établissement, mais il ne s’applique pas lorsque le client demande expressément une intervention immédiate en urgence à domicile pour travaux de réparation ou d’entretien.",
      "En cas de litige ou de pratique trompeuse, le consommateur peut signaler l’entreprise via SignalConso ou saisir la DGCCRF.",
      "Les dépanneurs doivent pouvoir identifier clairement leur entreprise et remettre un document écrit avant intervention, avec les informations essentielles sur l’identité du professionnel et le prix."
    ],
    "scamWarnings": [
      "Prix d’appel très bas annoncé au téléphone puis facture fortement augmentée sur place.",
      "Remplacement de serrure ou de cylindre imposé alors qu’une ouverture simple ou un réglage suffisait.",
      "Absence de devis écrit ou devis incomplet avant intervention.",
      "Matériel facturé à un prix manifestement excessif par rapport au marché.",
      "Démarchage via prospectus ou annonces donnant l’apparence d’un service officiel ou local alors qu’il s’agit d’une entreprise privée."
    ],
    "goodReflexes": [
      "Vérifier le SIRET et l’identité exacte de l’entreprise avant d’accepter l’intervention.",
      "Exiger un devis écrit détaillant déplacement, main-d’œuvre, pièces et TVA avant toute opération.",
      "Demander si la porte est seulement claquée ou réellement verrouillée, car la technique et le coût ne sont pas les mêmes.",
      "Contacter son assurance habitation, car certaines garanties prennent en charge tout ou partie de l’ouverture de porte ou du remplacement après effraction.",
      "Refuser toute intervention sans validation préalable du prix total et des éventuelles pièces à remplacer.",
      "Conserver photos, devis, facture et échanges en cas de contestation ou de signalement."
    ],
    "sources": [
      "https://goodassur.com/assurance-habitation/serrurier",
      "https://www.habitatpresto.com/mag/menuiserie/portail-portillon/prix-serrurier-tarif-intervention",
      "https://www.serrurerie-gadenne.com/blog/faq/prix-du-serrurier/",
      "https://travaux.obat.fr/guides/prix-serrurier/",
      "https://www.mesdepanneurs.fr/blog/prix-serrurier",
      "https://arcane-depannage-serrurerie-vitrerie.fr/blog/serrurier-prix-depannage-2026"
    ],
    "retrievedAt": "2026-06-10"
  },
  chauffagiste: {
    "priceRanges": [
      {
        "label": "Dépannage chaudière urgent (déplacement + main d'œuvre, hors pièces)",
        "low": 100,
        "high": 300
      },
      {
        "label": "Tarif horaire chauffagiste",
        "low": 40,
        "high": 80
      },
      {
        "label": "Entretien annuel chaudière",
        "low": 90,
        "high": 180
      },
      {
        "label": "Remplacement pièce courante (circulateur ou thermostat), hors pièce selon cas",
        "low": 200,
        "high": 500
      }
    ],
    "majorations": "En pratique, les majorations constatées pour une intervention de dépannage chauffage/chaudière en soirée, la nuit, le week-end ou les jours fériés sont généralement de l’ordre de +25 % à +50 %, avec des cas plus élevés selon la zone et l’urgence.",
    "legalFacts": [
      "L’entretien annuel est obligatoire pour les chaudières dont la puissance nominale est comprise entre 4 et 400 kW, selon le décret du 9 juin 2009.",
      "L’attestation d’entretien doit être remise après la visite annuelle ; elle sert de justificatif de conformité de l’entretien.",
      "Pour les prestations de dépannage à domicile, un devis écrit est obligatoire avant exécution dans les cas prévus par l’arrêté du 24 janvier 2017.",
      "Les litiges ou pratiques commerciales douteuses peuvent être signalés via SignalConso, outil de signalement de la DGCCRF.",
      "L’entretien annuel de la chaudière est à la charge de l’occupant des lieux dans le cas d’une location, sauf stipulation contraire du bail."
    ],
    "scamWarnings": [
      "Forcer un remplacement complet de chaudière alors qu’une réparation ciblée ou un simple changement de pièce suffit.",
      "Ajouter des frais de déplacement, diagnostic ou petite fourniture sans les annoncer clairement avant l’intervention.",
      "Présenter un prix d’appel bas puis gonfler la facture avec des majorations de nuit, week-end ou urgence non expliquées.",
      "Facturer des pièces à un prix très supérieur au marché sans détail de la pièce, de la référence et de la main-d’œuvre.",
      "Refuser de remettre un devis ou de faire apparaître séparément déplacement, main-d’œuvre et pièces.",
      "Exiger un paiement immédiat avant toute explication écrite de la panne, des réparations et du coût final."
    ],
    "goodReflexes": [
      "Demander le prix exact avant déplacement et vérifier s’il inclut déplacement, diagnostic, main-d’œuvre et TVA.",
      "Exiger un devis écrit avant toute réparation, surtout si des pièces doivent être remplacées.",
      "Comparer au moins deux ou trois entreprises locales quand la situation n’est pas une urgence absolue.",
      "Demander la référence de la pièce remplacée et conserver la facture détaillée, avec le coût des pièces séparé de la main-d’œuvre.",
      "Conserver l’attestation d’entretien annuel et le rapport d’intervention pour tout contrôle ou litige.",
      "En cas de doute sur une pratique abusive, signaler rapidement le professionnel via SignalConso."
    ],
    "sources": [
      "https://plombier-kebgaz.fr/plomberie/chauffagiste-urgence/",
      "https://www.chaudieregaz.com/blog/prix-depannage-chaudiere-gaz/",
      "https://travaux.obat.fr/guides/tarif-chauffagiste/",
      "https://monjoel.fr/blog/prix-intervention-plombier-urgence",
      "https://www.fournisseurs-electricite.com/renovation-energetique/chauffage/chaudiere/entretien/depannage",
      "https://www.quelleenergie.fr/economies-energie/chaudiere-gaz-condensation/depannage"
    ],
    "retrievedAt": "2026-06-10"
  },
  ramoneur: {
    "priceRanges": [
      {
        "label": "ramonage cheminée bois (conduit simple)",
        "low": 50,
        "high": 100
      },
      {
        "label": "ramonage poêle à bois",
        "low": 50,
        "high": 120
      },
      {
        "label": "ramonage poêle à granulés",
        "low": 50,
        "high": 120
      },
      {
        "label": "ramonage chaudière gaz/fioul",
        "low": 60,
        "high": 175
      }
    ],
    "majorations": "En haute saison, surtout de septembre à décembre, les délais d’intervention s’allongent nettement ; les professionnels recommandent de réserver au printemps ou en été pour éviter l’attente.",
    "legalFacts": [
      "Le ramonage des conduits de fumée est obligatoire en France pour les appareils à combustion, avec une fréquence d’une à deux fois par an selon le combustible et le règlement local applicable.",
      "Le décret n° 2023-641 du 20 juillet 2023 a codifié dans le Code de la santé publique des obligations d’entretien liées aux appareils à combustion et au ramonage des conduits de fumée.",
      "La fréquence minimale est généralement d’un ramonage annuel pour les conduits gaz, et de deux ramonages par an pour les combustibles solides ou liquides dans de nombreux règlements sanitaires départementaux, dont un pendant la période de chauffe.",
      "Le professionnel doit délivrer un certificat/attestation de ramonage à l’issue de l’intervention ; ce document sert de preuve en cas de contrôle et peut être demandé par l’assurance habitation après sinistre.",
      "Le non-respect de l’obligation de ramonage peut exposer à une contravention pouvant aller jusqu’à 450 €."
    ],
    "scamWarnings": [
      "Démarchage téléphonique ou porte-à-porte de faux ramoneurs se présentant comme mandatés par la mairie, le bailleur ou l’assureur.",
      "Prix d’appel anormalement bas puis ajout de suppléments après intervention, par exemple pour déplacement, encrassement, accès difficile ou « pièces à changer ».",
      "Faux certificats de ramonage ou attestations délivrées sans intervention réelle.",
      "Pression commerciale pour faire remplacer immédiatement des pièces, un conduit, un tubage ou l’appareil sans diagnostic indépendant.",
      "Facturation de prestations non demandées ou non annoncées avant l’intervention.",
      "Absence de coordonnées vérifiables, de numéro SIRET ou de mention claire de l’entreprise sur le devis et la facture."
    ],
    "goodReflexes": [
      "Demander un devis écrit avant intervention, avec le détail du prix, du déplacement et des éventuels suppléments.",
      "Vérifier que le professionnel est déclaré et identifiable, avec entreprise, SIRET et facture nominative.",
      "Conserver le certificat de ramonage et la facture, puis les transmettre à l’assureur si demandé.",
      "Réserver hors saison de chauffe pour obtenir plus facilement un rendez-vous et éviter les surcoûts de dernière minute.",
      "Se méfier de toute offre trop basse ou d’une urgence artificielle visant à vous faire décider immédiatement.",
      "Consulter la réglementation locale du département, car certaines obligations sont renforcées par arrêté ou règlement sanitaire départemental."
    ],
    "sources": [
      "https://lacompagniedesramoneurs.fr/blog/ramonage-obligatoire-que-dit-la-loi-en-2026",
      "https://www.neozone.org/societe/dossier-prix-certificat-legislation-tout-savoir-sur-le-ramonage-en-2026/",
      "https://www.ramonage-cheminee.fr",
      "https://ramonage-rhonalpin.fr/index.php/reglementation",
      "https://www.jotul.fr/utilisation-entretien/ramonage-de-cheminee-fonctionnement-et-obligations-2026",
      "https://www.depannageurgence.com/blog/ramonage-cheminee-obligation-prix-guide.html"
    ],
    "retrievedAt": "2026-06-10"
  },
  climaticien: {
    "priceRanges": [
      {
        "label": "Pose clim monosplit (matériel + pose)",
        "low": 2000,
        "high": 4000
      },
      {
        "label": "Pose clim multisplit (matériel + pose)",
        "low": 4000,
        "high": 15000
      },
      {
        "label": "Clim gainable (matériel + pose)",
        "low": 6000,
        "high": 18000
      },
      {
        "label": "Entretien annuel climatisation",
        "low": 100,
        "high": 300
      }
    ],
    "majorations": "En haute saison (été/canicule), les délais d’intervention et de pose s’allongent nettement ; il est recommandé d’anticiper au printemps pour éviter les hausses de délai et les tensions de planning.",
    "legalFacts": [
      "La manipulation d’un circuit contenant des fluides frigorigènes nécessite une attestation de capacité détenue par l’entreprise ; l’autoinstallation complète d’une climatisation avec raccordement frigorifique n’est donc pas librement réalisable par un particulier. ",
      "L’entretien d’une climatisation/pompe à chaleur air-air peut être obligatoire selon la puissance et les caractéristiques de l’équipement ; l’inspection d’étanchéité s’applique à certains équipements contenant des gaz fluorés au-delà de seuils réglementaires. ",
      "L’installation d’une unité extérieure peut nécessiter une autorisation en copropriété et/ou une vérification des règles d’urbanisme locales, car elle modifie les parties communes ou l’aspect extérieur. ",
      "La climatisation réversible air-air n’est pas éligible à MaPrimeRénov’ en tant que telle ; les aides citées pour ce type d’équipement portent surtout sur la TVA réduite et, selon les cas, sur d’autres dispositifs distincts, pas sur MaPrimeRénov’ pour la simple climatisation. ",
      "Le taux de TVA réduit mentionné pour la pose de climatisation réversible est de 10 % sur la main-d’œuvre selon les sources consultées, sous conditions de recours à un professionnel qualifié. "
    ],
    "scamWarnings": [
      "Démarchage insistant ou pression à la signature immédiate, notamment en période de forte chaleur, avec promesses de pose rapide 'sans attente'. ",
      "Devis artificiellement bas au départ puis réévaluations importantes après visite technique, souvent justifiées par des 'travaux complémentaires' non annoncés. ",
      "Sous-dimensionnement volontaire de l’appareil pour afficher un prix d’appel bas, au détriment du confort, de la consommation et de la durée de vie. ",
      "Pose réalisée sans preuve d’attestation de capacité fluides frigorigènes ou sans entreprise habilitée pour le circuit frigorifique. ",
      "Facturation de prestations floues ou redondantes sous des intitulés comme 'mise en service', 'forfait accessoires' ou 'frais techniques' non détaillés. ",
      "Vente de 'clim réversible éligible à toutes les aides' alors que la clim air-air n’entre pas dans MaPrimeRénov’ comme une rénovation globale standard. "
    ],
    "goodReflexes": [
      "Demander au moins trois devis détaillés mentionnant matériel, main-d’œuvre, mise en service, accessoires et garanties.",
      "Vérifier que l’installateur possède bien les qualifications requises pour manipuler les fluides frigorigènes et qu’il peut fournir les attestations demandées.",
      "Faire valider la puissance et le dimensionnement par une étude thermique simple ou a minima par une visite technique sérieuse avant de signer.",
      "Anticiper l’achat et la pose au printemps pour éviter les délais de l’été et obtenir plus facilement plusieurs devis comparables.",
      "En copropriété, demander l’accord écrit du syndic/AG avant toute pose d’unité extérieure visible ou impactant les parties communes.",
      "Exiger un devis séparant clairement le prix du matériel, la pose, la mise en service et l’entretien éventuel, puis comparer à périmètre identique."
    ],
    "sources": [
      "https://www.quelleenergie.fr/prix-travaux/climatiseur",
      "https://www.lesinstallateurs.fr/blog/prix-climatisation-maison-2026",
      "https://www.laprimeenergie.fr/les-travaux/la-pompe-a-chaleur/clim-reversible/prix",
      "https://www.engie-homeservices.fr/dossiers/prix-climatisation-reversible-pose-comprise",
      "https://www.garanka.fr/prix-climatisation-gainable-en-2025/",
      "https://particuliers.engie.fr/economies-energie/conseils-equipements-chauffage/climatiseur/clim-reversible-prix.html"
    ],
    "retrievedAt": "2026-06-10"
  },
  menage: {
    "priceRanges": [
      {
        "label": "Ménage de fin de séjour studio/T2 (forfait)",
        "low": 35,
        "high": 70
      },
      {
        "label": "Ménage maison/villa (forfait)",
        "low": 80,
        "high": 180
      },
      {
        "label": "Tarif horaire d'une entreprise de ménage",
        "low": 25,
        "high": 45
      },
      {
        "label": "Blanchisserie/linge par lit",
        "low": 10,
        "high": 25
      }
    ],
    "majorations": "En haute saison touristique, notamment l’été sur le littoral et l’hiver en stations de ski, les créneaux de ménage sont plus tendus, surtout autour des arrivées/départs du samedi; réserver le prestataire à l’avance limite le risque de rupture de service.",
    "legalFacts": [
      "Le travail dissimulé est interdit et expose le propriétaire à des redressements et sanctions URSSAF s’il rémunère un intervenant sans cadre déclaré.",
      "Un particulier qui emploie directement une personne relève du statut particulier-employeur (avec recours au CESU), alors qu’une entreprise de ménage doit fournir une facture et couvrir son activité par une assurance responsabilité civile professionnelle.",
      "Les frais de ménage peuvent être facturés au voyageur sur les plateformes de location saisonnière.",
      "Depuis 2025-2026, les meublés de tourisme sont soumis à des obligations renforcées de déclaration/enregistrement selon les communes, avec numéro d’enregistrement à afficher sur les annonces lorsque la commune l’exige.",
      "Le régime fiscal des locations meublées de tourisme non classées a été fortement resserré en 2025-2026, ce qui réduit l’intérêt de certaines structures en micro-BIC."
    ],
    "scamWarnings": [
      "Prestataire non déclaré: en cas d’accident, de litige social ou de contrôle, la responsabilité du propriétaire peut être engagée.",
      "Absence d’assurance RC pro: un dégât pendant le ménage peut rester à la charge du propriétaire si le prestataire n’est pas correctement couvert.",
      "No-show ou annulation de dernière minute en haute saison sans contrat écrit ni pénalité prévue.",
      "Suppléments surprise après intervention: escaliers, vitres, linge, état très sale, inventaire non annoncé.",
      "Absence de photos d’état des lieux avant/après, qui complique toute preuve en cas de casse ou de désaccord."
    ],
    "goodReflexes": [
      "Signer un contrat écrit, même pour des interventions récurrentes.",
      "Vérifier le SIRET, l’activité déclarée et l’assurance RC pro du prestataire.",
      "Partager une check-list de ménage standardisée pour chaque logement.",
      "Synchroniser les horaires de ménage avec le calendrier de réservation et les heures d’arrivée/départ.",
      "Sécuriser la remise des clés ou l’accès au logement avec un protocole clair.",
      "Prendre des photos avant/après à chaque passage sensible."
    ],
    "sources": [
      "https://news.lesiteimmo.com/2026/06/05/location-saisonniere-nouvelles-regles-2026/",
      "https://www.lodgify.com/blog/fr/villes-francaises-airbnb/",
      "https://hello.pricelabs.co/fr/blog/grille-tarifaire-location-saisonniere/",
      "https://www.loftely.com/blog/actualites/reglementation-locations-saisonnieres-2026.html",
      "https://www.holidu.fr/magazine/actualites-location-saisonniere-reglementations-hotes",
      "https://www.jedeclaremonmeuble.com/guide-gestion-location-saisonniere/"
    ],
    "retrievedAt": "2026-06-11"
  },
};
