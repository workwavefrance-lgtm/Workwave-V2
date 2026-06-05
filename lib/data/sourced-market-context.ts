// Contexte marché BTP/artisanat SOURCÉ par département (Perplexity, web + citations).
// Généré le 2026-05-31. NE PAS éditer à la main :
// relancer `npx tsx scripts/fetch-sourced-market-context.ts`. Zéro chiffre inventé.

export type MarketContext = { text: string; sources: string[]; retrievedAt: string };

// Clé = code département (ex. "31" pour Haute-Garonne).
// Clé spéciale "monaco" = zone de mise en relation transfrontalière (Monaco
// n'est pas un dépt FR) ; utilisée en override dans lib/seo/seo-sections.ts.
export const SOURCED_MARKET_CONTEXT: Record<string, MarketContext> = {
  "monaco": {
    "text": "Le marché monégasque du bâtiment et de la rénovation est tiré par un immobilier parmi les plus chers au monde, avec une activité orientée vers des réalisations et des finitions de haute qualité, comme l’illustre le poids de la construction dans l’économie locale. Sur un territoire d’environ 2 km², très dense, la rareté du foncier pousse Monaco à privilégier les opérations en hauteur et les extensions sur la mer pour créer de nouveaux espaces bâtis. Une part importante des entreprises et artisans intervenant sur ces chantiers vient aussi de la Riviera française voisine, notamment des Alpes-Maritimes et de communes frontalières comme Beausoleil, Cap-d’Ail, Menton ou Nice, où se concentrent des prestataires habitués au marché monégasque.",
    "sources": [
      "https://lobservateurdemonaco.com/infos/cinq-chiffres-impressionnants-sur-le-secteur-de-la-construction-a-monaco/",
      "https://monaco-hebdo.com/economie/btp-le-seuil-des-3-milliards-deuros-de-chiffre-daffaires-franchi-pour-la-premiere-fois/",
      "https://fr.indeed.com/q-construction-l-monaco-(06)-emplois.html"
    ],
    "retrievedAt": "2026-06-05"
  },
  "11": {
    "text": "En 2026, le marché du bâtiment en France reste contrasté, avec un redressement du logement neuf mais une activité encore faible dans l’ensemble, tandis que l’entretien-amélioration se tasse selon la FFB. Dans l’Aude, le tissu d’artisanat du BTP est porté par la CAPEB départementale, et l’activité se concentre surtout autour de Carcassonne, Narbonne et des autres pôles urbains du littoral et de l’axe A61. Le département combine un bâti ancien, souvent en pierre ou en centre historique, et des besoins de rénovation énergétique liés au climat méditerranéen, marqué par la chaleur estivale et les épisodes de sécheresse.",
    "sources": [
      "https://www.b2o.eu/erp-btp/crise-batiment/",
      "https://www.ffbatiment.fr/actualites-batiment/actualite/tendances-recentes-du-batiment--mai-2026",
      "https://www.batiweb.com/actualites/vie-des-societes/marche-btp-region-est-2026-48032",
      "https://www.obat.fr/blog/nouveautes-btp-2026/"
    ],
    "retrievedAt": "2026-05-31"
  },
  "12": {
    "text": "En Aveyron, le marché du bâtiment reste marqué par une activité davantage tournée vers la **rénovation** et les travaux de réhabilitation que vers le neuf, dans un contexte de tensions économiques et de coûts encore élevés pour la filière BTP. Le département s’appuie sur un bâti ancien et patrimonial, avec un tissu de communes et de bourgs autour de pôles comme **Rodez**, **Millau** et **Villefranche-de-Rouergue**, ce qui soutient la demande des artisans locaux. Les enjeux portent notamment sur la **rénovation énergétique**, l’adaptation du logement au climat local et la mise aux normes des bâtiments, tandis que les acteurs du secteur signalent une fragilisation liée aux hausses de coûts et à l’instabilité du contexte réglementaire.",
    "sources": [
      "https://www.le24heures.fr/2025/12/14/btp-en-aveyron-la-tempete-economique-qui-met-le-secteur-du-batiment-a-nu/",
      "https://www.ouestaveyron.fr/developpement/appel-a-projet/",
      "https://tool-advisor.fr/blog/chiffres-batiment-btp/",
      "https://www.francemarches.com/appel-offre/3boamp2645014-2026-renovation-extension-batiment"
    ],
    "retrievedAt": "2026-05-31"
  },
  "13": {
    "text": "Dans les Bouches-du-Rhône, le marché du bâtiment en 2026 reste porté par la **rénovation**, notamment énergétique, tandis que le logement neuf et le tertiaire montrent des évolutions plus contrastées à l’échelle d’Aix-Marseille-Provence et de la région PACA. Le département concentre des besoins liés à un bâti urbain dense, à un patrimoine ancien dans des villes comme Marseille, Aix-en-Provence et Arles, et à un climat méditerranéen qui renforce les enjeux de performance thermique et de confort d’été. Les acteurs locaux signalent aussi un poids croissant des chantiers d’amélioration-entretien, alors que la production du bâtiment en France se maintient à bas niveau au premier trimestre 2026.",
    "sources": [
      "https://www.batiweb.com/actualites/vie-des-societes/btp-paca-etat-marche-perspectives-48120",
      "https://www.ffbatiment.fr/actualites-batiment/actualite/tendances-recentes-du-batiment--mai-2026",
      "https://www.datarespublica.com/ou-ouvrir/construction/bouches-du-rhone",
      "https://mesinfos.fr/provence-alpes-cote-d-azur/le-marche-tertiaire-d-aix-marseille-demarre-l-annee-2026-au-ralenti-244321.html"
    ],
    "retrievedAt": "2026-05-31"
  },
  "22": {
    "text": "Dans les Côtes-d’Armor, le bâtiment reste un pilier de l’artisanat local, avec 37,7 % de l’activité artisanale départementale, et la FFB 22 souligne que les entreprises du secteur sont confrontées en 2026 aux enjeux de recrutement, de transition écologique et d’évolution réglementaire. Le marché est porté par une construction de logements très majoritairement individuelle, tandis que les créations d’établissements du secteur de la construction ont atteint un niveau record en 2023. La rénovation prend une place importante dans un territoire marqué par un bâti diffus, un patrimoine ancien et un climat humide littoral, qui renforcent les besoins d’entretien et de rénovation énergétique, notamment autour de Saint-Brieuc, Lannion, Dinan et Guingamp.",
    "sources": [
      "https://www.armorstat.com/atlas_armorstat_construction.html",
      "https://www.ffbatiment.fr/organisation-ffb/federations-departementales-chambres-syndicales/cotes-d-armor",
      "https://www.bretagne-economique.com/actualites/les-chefs-dentreprises-bretons-plutot-optimistes-pour-2026-sauf-dans-la-construction/",
      "https://www.cma-bretagne.fr/wp-content/uploads/2026/04/les-cotes-darmor-en-2026-1.pdf"
    ],
    "retrievedAt": "2026-05-31"
  },
  "29": {
    "text": "En 2026, le marché du bâtiment en Bretagne reste contrasté et la construction y est encore annoncée en baisse, tandis que les travaux de rénovation demeurent un relais d’activité important pour les entreprises locales. Dans le Finistère, le tissu professionnel est dense, avec 1 113 professionnels BTP actifs observés en avril 2026 et 84 entreprises certifiées RGE, ce qui reflète le poids des chantiers liés à la performance énergétique. Le département combine un bâti ancien, un patrimoine littoral et des contraintes climatiques marquées par l’humidité et les vents, ce qui soutient les besoins d’entretien, d’isolation et de réhabilitation, notamment autour de Brest, Quimper, Morlaix et Concarneau.",
    "sources": [
      "https://www.ffbatiment.fr/organisation-ffb/federations-departementales-chambres-syndicales/finistere",
      "https://www.bretagne-economique.com/actualites/les-chefs-dentreprises-bretons-plutot-optimistes-pour-2026-sauf-dans-la-construction/",
      "https://lobservatoiredespros.com/observations/etat-du-marche/finistere-29/",
      "https://www.helloartisan.com/conseils-pros/guide-quels-marches-offrent-le-plus-dopportunites-en-2026"
    ],
    "retrievedAt": "2026-05-31"
  },
  "30": {
    "text": "Dans le Gard, le marché du bâtiment et de la rénovation reste porté en 2026 par des chantiers de réhabilitation, illustrés par le lancement du premier Prix départemental de la rénovation par le CAUE du Gard, avec jury et résultats annoncés au printemps-été 2026. À Nîmes, plusieurs opérations de rénovation de bâtiments publics confirment cette dynamique, tandis que la FFB du Gard souligne l’importance du maintien des aides à la rénovation énergétique pour le secteur. Le département combine un bâti ancien et patrimonial, un climat méditerranéen qui renforce les besoins de confort d’été, et des besoins marqués dans les principales villes comme Nîmes, Alès et Bagnols-sur-Cèze, ce qui soutient l’activité des artisans du second œuvre et de la rénovation.",
    "sources": [
      "https://cpiegard.fr/prix-departemental-de-la-renovation-du-gard-1re-edition",
      "https://www.lereveildumidi.fr/%C3%A9conomie/b%C3%A2timent/%C2%AB-la-stabilit%C3%A9-oui,-mais-pas-%C3%A0-n%E2%80%99importe-quel-prix-%C2%BB-dit-la-ffb-du-gard-apr%C3%A8s-le-projet-de-loi-de-finances-2026",
      "https://www.francemarches.com/appel-offre/3boamp2649362-2026-marche-travaux-pour",
      "https://www.cma-gard.fr/wp-content/uploads/2026/02/Marche-de-travaux-pour-la-renovation-du-batiment-Guillemette-ex-HDD-a-Nimes.pdf"
    ],
    "retrievedAt": "2026-05-31"
  },
  "31": {
    "text": "En Haute-Garonne, le marché du bâtiment et de la rénovation reste structuré par l’attractivité de Toulouse et de son aire urbaine, où l’activité BTP est un pilier économique local selon la FFB 31 et des acteurs régionaux. En Occitanie, la FFB indique qu’après une forte dégradation du neuf, les mises en chantier et les permis de logements ont progressé sur trois mois à fin novembre 2025, tandis que l’amélioration-entretien reculait encore sur la même période. Le département combine un parc urbain dense, un bâti ancien dans les centres historiques et des besoins de rénovation énergétique, dans un contexte régional de crise du logement neuf et de hausse des contraintes techniques et réglementaires.",
    "sources": [
      "https://www.batiexpo.com/salon-toulouse",
      "https://www.datarespublica.com/ou-ouvrir/construction/haute-garonne",
      "https://www.lejournaltoulousain.fr/occitanie/economie-occitanie/batiment-occitanie-face-crise-precedent-296389/",
      "https://www.ffbatiment.fr/actualites-batiment/actualite/tendances-recentes-du-batiment-jan-2026"
    ],
    "retrievedAt": "2026-05-31"
  },
  "32": {
    "text": "Dans le Gers, le marché du bâtiment et de la rénovation repose surtout sur un tissu d’**entreprises artisanales**, avec une activité portée par les travaux d’entretien-amélioration plus que par le neuf, dans un contexte national où la CAPEB signale encore un recul de l’artisanat du bâtiment au 1er trimestre 2026. Le département s’inscrit dans un territoire de **bâti ancien**, de patrimoine rural et de maisons traditionnelles, ce qui soutient les chantiers de rénovation thermique et de mise aux normes, notamment autour d’**Auch**, **Cazaubon** et **Lectoure**. Les enjeux locaux restent la rénovation énergétique, l’adaptation du bâti aux contraintes climatiques de l’Occitanie et la préservation du patrimoine, tandis que la FFB du Gers continue d’animer la filière artisanale en 2026.",
    "sources": [
      "https://www.ffbatiment.fr/actualites-batiment/presse/cp-semaine-artisanat-2026",
      "https://www.batiweb.com/actualites/evenement-du-batiment/semaine-artisanat-batiment-2026-ffb-48840",
      "https://www.capeb.fr/actualites/artisanat-du-batiment-un-trimestre-a-nouveau-defavorable-qui-ne-permettra-pas-d-encaisser-un-nouveau-choc-sur-les-couts",
      "https://infoartisanat.artisanat.fr/index.php?lvl=notice_display&id=40384"
    ],
    "retrievedAt": "2026-05-31"
  },
  "34": {
    "text": "Dans l’Hérault, le bâtiment et la rénovation restent structurés par un tissu professionnel dense, autour de plus de 750 entreprises et artisans accompagnés par la FFB Hérault, qui indique aussi environ 10 000 salariés dans la profession. Le marché est porté par les besoins de rénovation énergétique et d’adaptation du bâti, dans un département où le climat méditerranéen, la pression urbaine et la diversité du patrimoine construisent une demande soutenue à Montpellier, Béziers, Sète ou dans les communes littorales. Les enjeux 2026 portent donc à la fois sur la rénovation du parc existant, les contraintes réglementaires et la montée en compétence des métiers, alors que la FFB 34 multiplie formations et ateliers pour les professionnels.",
    "sources": [
      "https://ecomnews.fr/news/les-actions-de-la-ffb-herault-un-engagement-fort-pour-le-secteur-du-batiment/",
      "https://info.fr/btp-herault-crise-emploi-construction-2026/",
      "https://www.ffbatiment.fr/actualites-batiment/Agenda/Voeux-ffb",
      "https://lobservatoiredespros.com/observations/etat-du-marche/herault-34/"
    ],
    "retrievedAt": "2026-05-31"
  },
  "35": {
    "text": "En Ille-et-Vilaine, le marché du bâtiment reste porté par un tissu dense d’artisans et d’entreprises, avec 1 350 adhérents à la FFB 35 représentant près de 15 000 salariés, concentrés notamment autour de Rennes, Saint-Malo, Fougères, Redon, Dinard et Vitré. En Bretagne, la production dans la construction devrait encore rester négative en 2026, tandis que l’investissement recule, ce qui traduit une activité de chantier toujours sous tension. Dans ce département au bâti mêlant centres anciens, patrimoine littoral et habitat périurbain, la rénovation, en particulier énergétique, constitue un enjeu majeur pour les ménages comme pour les professionnels.",
    "sources": [
      "https://www.bretagne-economique.com/actualites/les-chefs-dentreprises-bretons-plutot-optimistes-pour-2026-sauf-dans-la-construction/",
      "https://www.ffbatiment.fr/organisation-ffb/federations-departementales-chambres-syndicales/ille-et-vilaine",
      "https://tool-advisor.fr/blog/chiffres-batiment-btp/"
    ],
    "retrievedAt": "2026-05-31"
  },
  "44": {
    "text": "En Loire-Atlantique, le bâtiment et la rénovation restent portés par le besoin d’entretien et d’adaptation d’un parc mêlant habitat urbain, maisons individuelles et bâti ancien, notamment autour de Nantes, Saint-Nazaire, Guérande et Pornic. Dans les Pays de la Loire, les professionnels signalent un marché du BTP davantage orienté vers la rénovation que vers le neuf, avec des tensions possibles de trésorerie pour certaines entreprises. La FFB Loire-Atlantique met aussi en avant en 2026 des rencontres dédiées aux projets de travaux dans le département, signe d’une activité suivie par la profession. Les enjeux portent surtout sur la rénovation énergétique et la remise à niveau technique du parc existant, dans un contexte où le climat océanique renforce les besoins d’entretien des façades et toitures.",
    "sources": [
      "https://tool-advisor.fr/blog/chiffres-batiment-btp/",
      "https://loire-atlantique.cerfrance.fr/actualites/analyses-perspectives-pour-le-secteur-du-btp-2026",
      "https://www.ffbatiment.fr/actualites-batiment/Agenda/chantiers-du-44-2026",
      "https://www.helloartisan.com/conseils-pros/guide-quels-marches-offrent-le-plus-dopportunites-en-2026"
    ],
    "retrievedAt": "2026-05-31"
  },
  "46": {
    "text": "Dans le Lot, le marché du bâtiment et de la rénovation reste porté par un tissu d’artisans et d’entreprises de taille régionale, représentés en Occitanie par la FFB et, localement, par la Chambre de métiers du Lot, très active sur les métiers d’art et l’artisanat. Le département s’appuie aussi sur un patrimoine bâti ancien et touristique, visible notamment autour de Cahors et de Saint-Cirq-Lapopie, ce qui soutient les chantiers de restauration et de rénovation. Les enjeux portent surtout sur l’adaptation du bâti ancien, la rénovation énergétique et les contraintes liées au climat du Sud-Ouest, qui renforcent les besoins d’isolation et de confort d’été.",
    "sources": [
      "https://www.cma-cahors.fr/salon-departemental-des-metiers-dart-2026-appel-a-candidatures/",
      "https://www.ffbatiment.fr/organisation-ffb/federations-regionales/occitanie",
      "https://cahorsagglo.fr/salon-des-metiers-dart-saint-cirq-lapopie",
      "https://www.capeb.fr/occitanie/evenements"
    ],
    "retrievedAt": "2026-05-31"
  },
  "48": {
    "text": "En Lozère, le marché du bâtiment reste surtout porté par la **rénovation** et l’entretien du parc existant, dans un département rural où l’activité neuve est plus limitée que dans les grandes agglomérations. Au niveau national, la construction neuve redresse ses mises en chantier en 2026, tandis que l’amélioration-entretien recule légèrement, ce qui pèse aussi sur les entreprises artisanales du bâtiment. Dans le département, des marchés publics récents montrent des travaux de rénovation thermique et de voirie, confirmant une demande liée à la performance énergétique et à l’adaptation des bâtiments. Le contexte local combine un bâti ancien, des communes comme Mende et Marvejols, et des besoins de rénovation sensibles aux contraintes climatiques de montagne.",
    "sources": [
      "https://www.batiweb.com/actualites/vie-des-societes/marche-btp-region-est-2026-48032",
      "https://www.ffbatiment.fr/actualites-batiment/actualite/tendances-recentes-du-batiment-mars-2026",
      "https://www.francemarches.com/appel-offre/3boamp2651015-2026-travaux-renovation-thermique",
      "https://www.marchesonline.com/appels-offres/avis/programme-de-voirie-2026-phase-1/ao-9604120-1"
    ],
    "retrievedAt": "2026-05-31"
  },
  "49": {
    "text": "En Maine-et-Loire, le bâtiment et l’artisanat restent structurants, avec un tissu dense d’entreprises du BTP et un marché porté par la rénovation plus que par une construction neuve en repli, selon les organisations professionnelles locales et régionales. Dans les Pays de la Loire, la CERC souligne que la transition énergétique continue d’orienter une part importante de l’activité du bâtiment, ce qui soutient les travaux d’isolation, de chauffage et d’adaptation des logements. Le département, marqué par l’habitat angevin, les bourgs anciens et un patrimoine bâti important autour d’Angers, Saumur et Cholet, concentre ainsi des besoins de réhabilitation, de mise aux normes et de restauration du petit patrimoine.",
    "sources": [
      "https://www.artizo.fr/blog/artisanat-btp-maine-et-loire-2026/",
      "https://www.le-kiosque.org/maine-et-loire-les-professionnels-du-batiment-denoncent-le-manque-de-reponse-du-gouvernement-a-une-crise-profonde/",
      "https://www.batiexpo.com/salon-angers",
      "https://www.marches-publics.gouv.fr/?page=Entreprise.EntrepriseAdvancedSearch&AllCons&id=2925452&orgAcronyme=a4n"
    ],
    "retrievedAt": "2026-05-31"
  },
  "53": {
    "text": "En Mayenne, le bâtiment s’appuie sur un tissu d’entreprises fortement structuré, la FFB 53 indiquant représenter plus de 70 % de la masse salariale départementale du secteur, tandis que le bâtiment pèse 7,1 % de l’emploi salarié régional dans les Pays de la Loire fin 2024. Le marché local reste porté par des travaux de construction et de réhabilitation, avec des opérations publiques visibles dans plusieurs communes, dont Louverné et Désertines, ainsi que par le parc de logements à entretenir. Dans un département marqué par un bâti de bourg et de maisons individuelles, les enjeux portent surtout sur la rénovation énergétique et l’adaptation du patrimoine existant, dans un contexte climatique de l’Ouest qui renforce les besoins d’isolation et de maintenance.",
    "sources": [
      "https://www.ffbatiment.fr/organisation-ffb/federations-departementales-chambres-syndicales/mayenne",
      "https://www.francemarches.com/appel-offre/2oufr74554879-2026-extension-amenagement-batiment",
      "https://www.observatoire-emploi-paysdelaloire.fr/portraits-sectoriels/batiment",
      "https://www.territoire-energie53.fr/wp-content/uploads/2026/02/ROB-2026.pdf"
    ],
    "retrievedAt": "2026-05-31"
  },
  "56": {
    "text": "Dans le Morbihan, le marché du bâtiment et de la rénovation reste tiré par l’entretien-amélioration, alors que l’activité de la construction en Bretagne demeure en retrait en 2026 et que le climat des affaires dans le bâtiment est jugé stable par l’Insee, avec des carnets de commandes encore faibles mais en amélioration. Le département s’appuie sur un tissu dense d’artisans et d’entreprises du bâtiment, structuré notamment par la CAPEB 56, et sur des besoins soutenus en rénovation énergétique. Les spécificités locales pèsent aussi sur la demande: habitat ancien, littoral exposé aux vents et à l’humidité, et présence de pôles comme Vannes, Lorient, Pontivy et les communes du Golfe du Morbihan, où l’entretien du bâti et la mise aux normes restent importants.",
    "sources": [
      "https://muzillac.btg-communication.fr/blog/salons-batiment-morbihan-2026-artisans/",
      "https://www.batiweb.com/actualites/vie-des-societes/btp-bretagne-etat-marche-perspectives-48049",
      "https://www.bretagne-economique.com/actualites/les-chefs-dentreprises-bretons-plutot-optimistes-pour-2026-sauf-dans-la-construction/",
      "https://www.insee.fr/fr/statistiques/8730032"
    ],
    "retrievedAt": "2026-05-31"
  },
  "65": {
    "text": "Dans les Hautes-Pyrénées, le marché du bâtiment et de l’artisanat s’inscrit dans une dynamique portée à la fois par la rénovation du parc existant et par des opérations ponctuelles de construction, notamment autour de **Tarbes** et de **Lourdes**. Le département combine un bâti ancien, des enjeux de **patrimoine** et des contraintes de **climat de montagne**, ce qui renforce la place des travaux de réhabilitation, d’isolation et de mise aux normes. La Fédération Française du Bâtiment rappelle que les entreprises du secteur jouent un rôle structurant en Occitanie, tandis que les appels d’offres publics dans le 65 témoignent d’une activité régulière sur les marchés de travaux.",
    "sources": [
      "https://tool-advisor.fr/blog/chiffres-batiment-btp/",
      "https://veillio.fr/marche-public/marche-de-maitrise-doeuvre-pour-lacquisition-et-65-26-25509",
      "https://www.marchesonline.com/appels-offres/lieu/occitanie-R73/hautes-pyrenees-D66?page=3",
      "https://commandepublique.ha-py.fr/avis/index.cfm?fuseaction=pub.affResultats"
    ],
    "retrievedAt": "2026-05-31"
  },
  "66": {
    "text": "Dans les Pyrénées-Orientales, le **marché du bâtiment** reste porté en 2026 par des projets publics et par la **rénovation** plus que par le neuf, alors que les autorisations et les débuts de chantiers de logements restent à des niveaux très faibles dans le département. Le territoire combine un bâti urbain concentré autour de **Perpignan** et des communes littorales, un parc ancien et une forte sensibilité aux enjeux climatiques, ce qui alimente les besoins en **rénovation énergétique** et en adaptation des bâtiments. Le Département indique aussi qu’entre 2021 et 2028, plus d’un milliard d’euros seront injectés sur le territoire, notamment pour la construction de logements et l’aménagement durable, ce qui soutient l’activité des entreprises du bâtiment et de l’artisanat.",
    "sources": [
      "https://ecomnews.fr/news/en-direct-de-perpignan-quelles-sont-les-perspectives-economiques-pour-les-pyrenees-orientales-en-2026-des-defis-structurels-mais-des-raisons-desperer-pour-les-entreprises-et-lemp/",
      "https://www.lasemaineduroussillon.com/economie/construction-dans-les-p-o-tres-leger-redressement-en-janvier-52243/",
      "https://www.ledepartement66.fr/media/2026/04/CD66_Journal_AvrilN43_2026_SD.pdf",
      "https://mercato-emploi.com/dans-les-pyrenees%E2%80%91orientales-le-btp-avance-sous-tension-entre-dynamisme-territorial-et-defis-structurels/"
    ],
    "retrievedAt": "2026-05-31"
  },
  "72": {
    "text": "Dans la Sarthe, le marché du bâtiment et de la rénovation s’inscrit dans un contexte régional où le bâtiment pèse 7,1 % de l’emploi salarié des Pays de la Loire, avec plus de 83 000 salariés fin 2024, et où les TPE restent centrales. En 2026, l’activité locale est portée par la rénovation, notamment thermique, et par les métiers du bois, de la charpente et de la couverture, comme en témoignent les mobilisations professionnelles de la FFB Sarthe. Le territoire, structuré autour du Mans et de pôles comme La Flèche ou Sablé-sur-Sarthe, combine bâti ancien, patrimoine et besoins de mise aux normes énergétiques, ce qui soutient durablement l’artisanat du second œuvre et de la rénovation.",
    "sources": [
      "https://www.observatoire-emploi-paysdelaloire.fr/portraits-sectoriels/batiment",
      "https://www.ffbatiment.fr/actualites-batiment/Agenda/reunion-metiers-du-bois",
      "https://www.capeb.fr/www/capeb/media/pays-de-la-loire/document/303_capeb_infos_mars_2026.pdf",
      "https://www.francemarches.com/appel-offre/13joue002690542026-2026-mission-maitrise-oeuvre"
    ],
    "retrievedAt": "2026-05-31"
  },
  "81": {
    "text": "Dans le Tarn, le marché du bâtiment et de la rénovation reste porté par une activité artisanale suivie par la CAPEB départementale, qui relève en 2026 une amélioration du niveau d’activité et une stabilisation des investissements chez les entreprises artisanales du département. Le contexte local est marqué par un bâti mêlant centres anciens, maisons traditionnelles et patrimoine, dans un département où la rénovation énergétique pèse fortement sur la demande, sur fond de climat contrasté entre plaine et reliefs du sud du Massif central. À l’échelle nationale, la production du bâtiment reste à bas niveau en 2026, tandis que le logement neuf redresse ses permis et mises en chantier, ce qui influence aussi les marchés locaux d’Albi, Castres et Gaillac.",
    "sources": [
      "https://www.cm-tarn.fr/wp-content/uploads/2026/03/INFOGRAPHIE-BAROMETRE-ECO-2026-V6.pdf",
      "https://www.b2o.eu/erp-btp/crise-batiment/",
      "https://www.ffbatiment.fr/actualites-batiment/actualite/tendances-recentes-du-batiment--mai-2026",
      "https://www.datarespublica.com/ou-ouvrir/construction/tarn"
    ],
    "retrievedAt": "2026-05-31"
  },
  "82": {
    "text": "Dans le Tarn-et-Garonne, le marché du bâtiment reste tiré par les besoins en entretien-amélioration et par les travaux liés au logement, alors que la conjoncture nationale du bâtiment montre en 2026 une reprise du neuf mais un recul persistant de l’amélioration-entretien. Le département, centré sur Montauban et desservi par plusieurs marchés publics locaux, compte aussi une activité artisanale visible autour de la construction, de la rénovation et de l’habitat. Les enjeux portent surtout sur la rénovation énergétique et l’adaptation du parc bâti, dans un territoire marqué par un habitat diffus, des communes périurbaines et un patrimoine ancien à rénover.",
    "sources": [
      "https://www.batiexpo.com/salon-montauban",
      "https://www.ffbatiment.fr/actualites-batiment/actualite/tendances-recentes-du-batiment--avril-2026",
      "https://www.tarnetgaronne.fr/marches-publics",
      "https://tool-advisor.fr/blog/chiffres-batiment-btp/"
    ],
    "retrievedAt": "2026-05-31"
  },
  "83": {
    "text": "Dans le Var, le marché du bâtiment reste porté en 2026 par des opérations neuves et surtout par la rénovation, comme l’illustre l’investissement de 110 M€ annoncé par Var Habitat pour des logements sociaux neufs, dans un département où Toulon concentre une part importante de l’activité. Le territoire est marqué par un bâti méditerranéen, un patrimoine urbain ancien et un climat chaud, qui renforcent les besoins d’entretien, d’isolation et d’adaptation thermique. La dynamique locale du BTP s’inscrit aussi dans les enjeux de rénovation énergétique et d’infrastructures, régulièrement mis en avant par les acteurs professionnels du département.",
    "sources": [
      "https://mesinfos.fr/provence-alpes-cote-d-azur/investissement-sans-precedent-pour-var-habitat-en-2026-237289.html",
      "https://www.ffbatiment.fr/actualites-batiment/Agenda/btp83_printemps_btp_2026",
      "https://www.datarespublica.com/ou-ouvrir/construction/var",
      "https://www.info83.fr/municipales-2026-faire-des-infrastructures-une-priorite-selon-le-btp-var/"
    ],
    "retrievedAt": "2026-05-31"
  },
  "84": {
    "text": "En Vaucluse, le BTP aborde 2026 dans un contexte contrasté : la Fédération du BTP 84 décrit une activité qui s’essouffle, avec un recul du bâtiment neuf et de la rénovation, tandis que les travaux publics restent plutôt stables. Le département reste toutefois porté par des opérations à Avignon et dans le Grand Avignon, ainsi que par des chantiers liés au logement, aux équipements publics et aux mobilités. Le marché local est marqué par un bâti ancien et patrimonial, très présent dans les centres urbains, et par des besoins de rénovation énergétique renforcés par les contraintes réglementaires, dont la RE2020 et la gestion des déchets de chantier.",
    "sources": [
      "https://www.echodumardi.com/dossier/le-btp-vauclusien-entre-stagnation-et-defis-structurels-appel-a-une-relance-urgente/",
      "https://mesinfos.fr/84000-avignon/ces-20-chantiers-a-suivre-en-2026-dans-le-vaucluse-237321.html",
      "https://www.batiexpo.com/salon-avignon",
      "https://www.cerc-paca.fr/pole/conjoncture-et-connaissance-des-marches/"
    ],
    "retrievedAt": "2026-05-31"
  },
  "85": {
    "text": "En Vendée, le bâtiment reste un secteur important, avec près de 11 % des emplois salariés départementaux et plus de 600 entreprises de construction créées en 2024 selon des reprises de données Bpifrance par la presse locale. Le marché est porté par des projets de construction et par la rénovation, notamment dans un contexte où les professionnels attendent des commandes des acteurs publics et des bailleurs sociaux. Dans un département marqué par un habitat diffus entre littoral, bourgs et zones rurales, la demande concerne aussi l’entretien du bâti existant et la rénovation énergétique, enjeu suivi à l’échelle régionale dans les Pays de la Loire. La Roche-sur-Yon, Challans et les communes du littoral concentrent une partie des opérations, tandis que les besoins d’adaptation au climat océanique et à l’ancien patrimoine local soutiennent l’activité artisanale.",
    "sources": [
      "https://tvvendee.fr/actu/la-roche-sur-yon-les-grands-projets-du-batiment-pour-2026-en-vendee/",
      "https://www.youtube.com/watch?v=Ks4AhFhdf7w",
      "https://www.marchesonline.com/appels-offres/avis/marche-de-travaux-concernant-la-construction-de-60-log/ao-9570677-1",
      "https://lobservatoiredespros.com/observations/etat-du-marche/vendee-85/"
    ],
    "retrievedAt": "2026-05-31"
  },
  "09": {
    "text": "En Ariège, le marché du bâtiment reste porté par l’**entretien-rénovation**, tandis que le neuf demeure plus fragile au niveau national, avec un climat des affaires jugé stable en janvier 2026 et des carnets de commandes encore faibles dans le bâtiment. Le département combine un bâti ancien, des centres urbains comme **Foix**, **Pamiers** et **Saint-Girons**, et un tissu de communes rurales où la rénovation du logement existant est souvent centrale. Les enjeux locaux sont fortement liés à la **rénovation énergétique** : en 2026, les logements énergivores restent soumis à des restrictions de location, ce qui pousse bailleurs et artisans vers les travaux de mise en conformité. Dans ce contexte, l’artisanat du bâtiment intervient surtout sur la réhabilitation, l’isolation et l’adaptation du parc, dans un territoire où les contraintes de montagne et de patrimoine pèsent sur les chantiers.",
    "sources": [
      "https://www.sudimmodiag.com/details-dpe+et+location+en+ariege+logements+interdits+obligations+des+bailleurs+et+mise+en+conformite+en+2026-1265",
      "https://www.ffbatiment.fr/actualites-batiment/actualite-ba/bilan-2025-previsions-2026-leger-rebond-sans-reprise-batiment",
      "https://www.datarespublica.com/ou-ouvrir/construction/ariege",
      "https://www.insee.fr/fr/statistiques/8730032"
    ],
    "retrievedAt": "2026-05-31"
  },
  "04": {
    "text": "Dans les Alpes-de-Haute-Provence, le marché du bâtiment reste porté en 2026 par la **rénovation énergétique**, la **commande publique** et les travaux sur les bâtiments existants, dans un contexte régional où la rénovation tire l’activité du BTP. Le département s’appuie sur un tissu d’entreprises artisanales suivi par la FFB 04, tandis que des marchés publics 2026-2028 concernent notamment la rénovation et l’urgence sur des bâtiments départementaux. Le parc bâti, souvent composé de logements et d’ouvrages anciens dans des communes comme **Digne-les-Bains** et **Manosque**, impose des chantiers adaptés au patrimoine et au climat de montagne et de vallée.",
    "sources": [
      "https://www.batiweb.com/actualites/vie-des-societes/btp-paca-etat-marche-perspectives-48120",
      "https://mesinfos.fr/04000-digne-les-bains/municipales-quelles-doleances-pour-le-btp-des-alpes-de-haute-provence-239978.html",
      "https://www.e-marchespublics.com/appel-offre/provence-alpes-cote-d-azur/alpes-de-haute-provence/alpes-de-haute-provence/26-39922",
      "https://www.ledauphine.com/economie/2026/02/03/la-hausse-de-la-commande-publique-et-des-chantiers-de-logements-profite-aux-entreprises"
    ],
    "retrievedAt": "2026-05-31"
  },
  "05": {
    "text": "Dans les Hautes-Alpes, le marché du bâtiment en 2026 reste tiré par la rénovation plus que par le neuf, dans un contexte national encore fragile où l’activité du bâtiment recule à prix constants et où l’amélioration-entretien pèse à la baisse au niveau français. Le département combine un bâti de montagne et un patrimoine ancien, ce qui renforce les besoins d’isolation, de mise aux normes et de rénovation énergétique, d’autant que les chantiers doivent s’adapter à un climat hivernal contraignant. L’activité se concentre surtout autour de Gap, Briançon et Embrun, avec une place importante des entreprises artisanales du gros œuvre, de la couverture, de l’électricité et des travaux de second œuvre.",
    "sources": [
      "https://www.batiweb.com/actualites/vie-des-societes/marche-btp-region-est-2026-48032",
      "https://www.b2o.eu/erp-btp/crise-batiment/",
      "https://www.ffbatiment.fr/actualites-batiment/actualite/tendances-recentes-du-batiment-jan-2026",
      "https://www.obat.fr/blog/nouveautes-btp-2026/"
    ],
    "retrievedAt": "2026-05-31"
  },
  "06": {
    "text": "Dans les Alpes-Maritimes, le marché du bâtiment reste soutenu par une reprise de la construction en Provence-Alpes-Côte d’Azur, avec une hausse des logements commencés et des autorisations à fin novembre 2025, et une progression marquée des chantiers non résidentiels dans le département. Le territoire est toutefois structurellement contraint par la rareté foncière, la pression immobilière sur Nice, Cannes et Antibes, et un bâti très présent de logements en copropriété, de maisons anciennes et d’immeubles du littoral, souvent exposés aux besoins de rénovation. Les enjeux portent donc fortement sur la rénovation énergétique, la mise aux normes des copropriétés et l’adaptation du parc aux contraintes locales de climat méditerranéen et de patrimoine bâti.",
    "sources": [
      "https://lloyd-davis-consultant.com/2026/03/17/economie-alpes-maritimes-un-marche-immobilier-sous-tension-entre-reprise-fragile-et-penurie-structurelle/",
      "https://www.antibesimmobilier.com/post/immobilier-alpes-maritimes-en-2026-tendances-du-march%C3%A9-et-conseils-pratiques",
      "https://www.cerc-paca.fr/wp-content/uploads/2026/01/Conj_Bibliotheque_Paca_2026.01.pdf",
      "https://tribuca.net/btp-2026-sera-lannee-de-tous-les-dangers-mais-aussi-de-tous-les-possibles/"
    ],
    "retrievedAt": "2026-05-31"
  }
};
