// Contenu pro par métier pour /trouver-des-chantiers/[metier].
// Généré par scripts/fetch-chantiers-pro-content.ts (Perplexity sonar, sourcé).
// 🔴 CE FICHIER EST RELU COMME DU JSON PUR par son générateur : n'écris
// AUCUN commentaire à l'intérieur du littéral (leçon metier-content du 01/09).
// Régénérer : npx tsx scripts/fetch-chantiers-pro-content.ts [--force]

export type ChantiersProEntry = {
  marche: string;
  chantiersDemandes: string[];
  saisonnalite: string;
  conseils: string[];
  sources: string[];
  retrievedAt: string;
};

export const CHANTIERS_PRO_CONTENT: Record<string, ChantiersProEntry> = {
  "architecte": {
    "marche": "La demande des particuliers reste portée par la rénovation, l’extension et la surélévation, avec une commande privée qui pèse l’essentiel de l’activité des agences d’architecture. Les architectes restent peu présents sur la maison individuelle neuve, ce qui limite le volume de marché accessible sur ce segment, alors que les besoins en projet privé demeurent réels.",
    "chantiersDemandes": [
      "Extension de maison",
      "Surélévation",
      "Rénovation thermique",
      "Rénovation intérieure complète"
    ],
    "saisonnalite": "La demande est plus forte au printemps et à la rentrée, quand les particuliers relancent leurs projets et veulent démarrer avant l’hiver. L’été marque souvent un ralentissement, avec des congés et moins de nouveaux chantiers, tandis que l’hiver reste plus favorable aux projets intérieurs.",
    "conseils": [
      "Répondez très vite aux demandes, avec un premier retour clair et un créneau de rappel rapide.",
      "Montrez des photos avant après de chantiers similaires, avec des réalisations récentes et locales.",
      "Rendez le devis lisible, précis et rapide, avec des options simples et un calendrier de mission clair."
    ],
    "sources": [
      "https://www.xerfi.com/presentationetude/le-marche-des-architectes_sae13",
      "https://entreprendre.service-public.gouv.fr/vosdroits/F38232",
      "https://www.service-public.gouv.fr/particuliers/vosdroits/F20568",
      "https://demande-de-permis.fr/blog/prix-architecte-permis-construire",
      "https://www.architectes-pour-tous.fr/"
    ],
    "retrievedAt": "2026-09-01"
  },
  "ascensoriste": {
    "marche": "La demande des particuliers pour l’ascenseur et le monte-escalier existe surtout sur l’entretien, le dépannage et la modernisation, avec une forte part de besoins récurrents liés à l’obligation d’entretien en France. Le marché reste tendu sur les interventions urgentes, car les professionnels doivent répondre vite, avec des astreintes possibles la nuit et les jours fériés. La tendance est soutenue par des besoins réguliers en maintenance et par des projets de mise en service ou d’adaptation, même si les sources disponibles ne donnent pas ici de volume global chiffré sur la demande des particuliers.",
    "chantiersDemandes": [
      "Dépannage d’ascenseur bloqué ou en panne",
      "Entretien périodique et maintenance préventive",
      "Modernisation, mise aux normes, remplacement de pièces ou d’équipements",
      "Installation ou remplacement de monte-escalier et d’ascenseur privatif"
    ],
    "saisonnalite": "La demande est la plus forte quand les pannes doivent être traitées vite, car les interventions d’urgence sont prioritaires toute l’année. La demande est plus faible sur les chantiers planifiés quand les particuliers repoussent les travaux non urgents, mais les sources consultées ne donnent pas de saison précise chiffrée.",
    "conseils": [
      "Répondez très vite aux demandes, avec un rappel court et un créneau d’intervention clair, car la réactivité compte beaucoup sur l’urgence.",
      "Montrez des photos avant et après, des chantiers réels et des explications simples sur vos interventions, cela rassure les particuliers sur votre sérieux.",
      "Demandez un avis client après chaque chantier, puis affichez-le avec votre devis détaillé, vos délais et votre zone d’intervention pour transformer plus de demandes en signature"
    ],
    "sources": [
      "https://www.appel-doffre.com/appel-doffre-ascenseur/",
      "https://www.service-public.gouv.fr/particuliers/vosdroits/F10538?lang=en",
      "https://www.vital-ascenseurs.fr/installation/",
      "https://www.pagesjaunes.fr/activites/ascensoriste.html",
      "https://servicesartisans.fr/devis/ascensoriste"
    ],
    "retrievedAt": "2026-09-01"
  },
  "carreleur": {
    "marche": "La demande des particuliers reste soutenue pour le carrelage, portée surtout par la rénovation, avec des offres qui signalent un fort accroissement d’activité sur des chantiers de rénovation et de construction neuve. Le marché français des revêtements de sols et de murs pèse près de 4 Md€ en 2023, ce qui confirme un volume d’activité important autour du carrelage. Les études de marché récentes indiquent aussi que la rénovation et le remplacement restent le moteur principal, avec une demande qui tient bien malgré un contexte plus sélectif.",
    "chantiersDemandes": [
      "Rénovation de salle de bains",
      "Rénovation de cuisine",
      "Pose de carrelage au sol dans un logement",
      "Faïence et carrelage mural dans pièces humides"
    ],
    "saisonnalite": "La demande remonte souvent après l’été, avec des pics de demandes de devis en septembre et octobre, puis à nouveau en mars et avril. Les creux sont plus fréquents en juillet et août, avec une activité plus faible sur les demandes des particuliers.",
    "conseils": [
      "Répondez très vite aux demandes. Un rappel dans la journée augmente nettement les chances de transformer le contact en rendez-vous.",
      "Montrez des photos nettes de vos chantiers finis. Privilégiez avant et après, ainsi que des détails de finition.",
      "Demandez des avis clients après chaque chantier. Un petit nombre d’avis récents rassure davantage qu’un long discours, surtout sur des travaux de salle de bains ou de cuisine."
    ],
    "sources": [
      "https://candidat.francetravail.fr/offres/recherche/detail/208KKJT",
      "https://www.xerfi.com/presentationetude/le-marche-des-revetements-de-sols-et-de-murs_bpa04",
      "https://www.carrelage-market.com/",
      "https://www.interim-batiment.fr/metiers/carreleur",
      "https://www.mordorintelligence.com/fr/industry-reports/france-ceramic-tiles-market"
    ],
    "retrievedAt": "2026-09-01"
  },
  "charpentier": {
    "marche": "La demande des particuliers pour un charpentier reste soutenue en 2026, avec des besoins visibles sur la rénovation, la réparation et les chantiers de toiture, dans un contexte où les recrutements du secteur restent tendus. Les signaux de marché montrent aussi une pression durable sur les métiers de charpente, avec des offres actives et des projets de recrutement importants, ce qui traduit un volume de travaux encore réel pour les artisans.",
    "chantiersDemandes": [
      "Réparation de charpente, remplacement de pièces abîmées ou attaquées par l’humidité ou les insectes.",
      "Rénovation de toiture avec reprise ou renforcement de la structure bois.",
      "Aménagement de combles avec modification de charpente.",
      "Surélévation ou extension en ossature bois pour gagner de la surface."
    ],
    "saisonnalite": "La demande est généralement plus forte du printemps au début de l’automne, quand les particuliers lancent les travaux extérieurs et les rénovations lourdes. Elle baisse souvent en hiver, puis connaît un creux en août avec les congés, même si les demandes urgentes restent présentes toute l’année.",
    "conseils": [
      "Répondez vite aux demandes, avec un rappel le jour même si possible, car les particuliers comparent plusieurs artisans.",
      "Montrez des photos avant après de chantiers similaires, cela rassure et aide à vendre votre savoir-faire.",
      "Donnez un devis clair et rapide, avec des options simples, puis demandez un avis client dès la fin du chantier pour renforcer votre crédibilité."
    ],
    "sources": [
      "https://entreprendre.service-public.gouv.fr/vosdroits/F39044",
      "https://candidat.francetravail.fr/offres/recherche/detail/213BGRP",
      "https://servicesartisans.fr/tarifs/charpentier",
      "https://www.ccca-btp.fr/fr/tendances-btp/besoin-de-main-doeuvre-2026-le-secteur-de-la-construction-face-une-baisse-des",
      "https://www.metiers-btp.fr/actualites/projets-recrutement-bmo-2026/"
    ],
    "retrievedAt": "2026-09-01"
  },
  "chauffagiste": {
    "marche": "La demande des particuliers pour les travaux de chauffage reste portée par les aides à la rénovation, notamment pour le remplacement d’un ancien système et les équipements compatibles avec les dispositifs publics. La tension est forte sur les interventions utiles, comme le dépannage, l’entretien et les remplacements, avec une demande soutenue des ménages propriétaires et occupants, surtout quand les aides exigent un professionnel qualifié. Les sources disponibles ne donnent pas ici de volume national précis pour 2026.",
    "chantiersDemandes": [
      "Entretien annuel de chaudière et maintenance de chauffage",
      "Dépannage urgent de panne ou de baisse de chauffage",
      "Remplacement de chaudière par une solution plus performante",
      "Installation de pompe à chaleur ou de chauffe-eau thermodynamique"
    ],
    "saisonnalite": "La demande est la plus forte à l’automne et en hiver, quand les pannes et les besoins de remise en route augmentent. Elle baisse en général au printemps et en été, sauf pour les chantiers de remplacement et de rénovation énergétique.",
    "conseils": [
      "Répondez vite aux demandes, avec un rappel rapide et un créneau proposé dans la journée si possible.",
      "Montrez des preuves de confiance, avec des avis clients récents, des photos de chantiers propres et des explications simples sur le devis.",
      "Proposez des devis clairs et courts, avec un délai annoncé, des options bien séparées et une relance systématique après envoi."
    ],
    "sources": [
      "https://www.economie.gouv.fr/particuliers/faire-des-economies-denergie/comment-beneficier-de-la-prime-coup-de-pouce-chauffage",
      "https://candidat.francetravail.fr/offres/recherche/detail/203SWTD",
      "https://assets.rte-france.com/prod/public/2020-12/Rapport%20chauffage_RTE_Ademe.pdf",
      "https://entreprendre.service-public.gouv.fr/vosdroits/F39033",
      "https://devismatic.fr/blog/prix-chauffagiste-2026"
    ],
    "retrievedAt": "2026-09-01"
  },
  "climaticien": {
    "marche": "La demande des particuliers pour la climatisation reste forte en 2026, portée par les vagues de chaleur et par une activité décrite comme sous tension par plusieurs installateurs et médias régionaux. Des articles récents signalent des carnets de commandes pleins sur plusieurs mois, avec des hausses de commandes rapportées jusqu à +250 % ou +300 % dans certains secteurs touchés par les canicules. Les aides publiques restent moins favorables à la climatisation seule, mais la baisse de TVA sur certaines climatisations réversibles fixes depuis le 18 juillet 2026 soutient encore l intérêt des particuliers.",
    "chantiersDemandes": [
      "Installation de climatisation réversible mono split",
      "Installation de climatisation réversible multi split",
      "Remplacement ou ajout de pompe à chaleur air air",
      "Entretien et dépannage de climatisation"
    ],
    "saisonnalite": "La demande est la plus forte pendant les épisodes de forte chaleur, surtout du printemps à la fin de l été. Elle baisse nettement en période froide, même si les demandes d entretien, de dépannage et de devis continuent hors saison.",
    "conseils": [
      "Répondez très vite aux demandes, idéalement le jour même, car les particuliers contactent souvent plusieurs artisans en parallèle.",
      "Publiez des photos nettes de chantiers terminés, avant et après, pour rassurer sur la qualité et la propreté de pose.",
      "Rendez les devis clairs et complets, avec modèle, puissance, délais, garantie et entretien, pour faire plus facilement choisir votre entreprise."
    ],
    "sources": [
      "https://entreprendre.service-public.gouv.fr/vosdroits/F39053?lang=en",
      "https://www.proclimo.com/fr/blog/2026/07/24/marche-climatisation-france-2026-chiffres",
      "https://www.ouest-france.fr/meteo/canicule/les-chauffagistes-croulent-sous-les-demandes-dinstallation-de-clim-dans-lorne-tout-le-reste-est-en-attente-cc5fd034-9262-11f1-836e-318a0522cae2",
      "https://www.primesenergie.fr/guide-energie/climatisation-reversible-aide-renovation-energetique",
      "https://www.estrepublicain.fr/economie/2026/08/25/vagues-de-canicules-quels-impacts-sur-les-logements"
    ],
    "retrievedAt": "2026-09-01"
  },
  "couvreur": {
    "marche": "La demande des particuliers reste portée par le marché résidentiel, surtout les maisons individuelles et les immeubles de logements, avec une activité décrite comme stable mais sans vrai rebond en 2026. Les sources pro signalent une demande prudente, des disparités régionales, et dans plusieurs cas un recul des sollicitations ou des devis, ce qui traduit un marché encore tendu pour capter des chantiers.",
    "chantiersDemandes": [
      "Réparation de fuite et reprise d’étanchéité de toiture",
      "Rénovation de couverture, tuiles, ardoises ou zinc",
      "Remplacement partiel ou complet de toiture ancienne",
      "Entretien de toiture, nettoyage, démoussage et contrôle après intempéries"
    ],
    "saisonnalite": "La demande se renforce souvent au printemps et à l’automne, quand la météo permet de programmer les travaux et que les particuliers anticipent l’hiver ou les fortes chaleurs. Les périodes de grands froids, de fortes pluies ou de chaleur marquée sont plus faibles pour les chantiers planifiés, même si les urgences après intempéries restent présentes.",
    "conseils": [
      "Répondez vite aux demandes, avec un rappel le jour même et un créneau de visite court.",
      "Montrez des photos avant après de chantiers similaires, cela rassure et aide à vendre votre savoir faire.",
      "Donnez un devis clair et détaillé, avec délais, matériaux, garanties et assurance visibles dès le premier échange."
    ],
    "sources": [
      "https://entreprendre.service-public.gouv.fr/vosdroits/F39034",
      "https://www.xerfi.com/presentationetude/le-marche-des-travaux-de-couverture_bat14",
      "https://toiture-expertise.fr/",
      "https://annuaire-couvreur-france.fr/",
      "https://candidat.francetravail.fr/offres/recherche/detail/210RKTN"
    ],
    "retrievedAt": "2026-09-01"
  },
  "cuisiniste": {
    "marche": "Le marché de la cuisine reste solide en France. Une étude récente estime que les professionnels vendent plus de 1 000 000 de cuisines complètes par an, dans un contexte où la cuisine est devenue une pièce centrale de l’habitat. La demande repart aussi avec la baisse des taux d’intérêt et le rebond des transactions immobilières, ce qui soutient les projets des particuliers en 2026.",
    "chantiersDemandes": [
      "Pose et remplacement de cuisine complète",
      "Rénovation de cuisine existante",
      "Cuisine sur mesure avec optimisation des rangements",
      "Installation d’équipements et d’éléments de cuisine, comme plans de travail, meubles, crédences et électroménager intégré"
    ],
    "saisonnalite": "La demande suit souvent le rythme des projets immobiliers et des travaux de rénovation, avec une activité plus forte au printemps et à la rentrée. Les périodes plus calmes sont en général l’hiver, hors urgences et chantiers liés à un emménagement rapide.",
    "conseils": [
      "Répondez vite aux demandes. Un rappel rapide augmente vos chances de transformer un contact en rendez-vous.",
      "Montrez vos réalisations avec des photos nettes avant et après. Le particulier veut voir un résultat concret et propre.",
      "Demandez et affichez des avis clients récents. Ajoutez aussi un devis clair, détaillé et lisible pour rassurer et faire gagner du temps au client."
    ],
    "sources": [
      "https://epsimas.com/etude-de-marche-des-cuisinistes-en-france/",
      "https://candidat.francetravail.fr/offres/recherche/detail/212LPFS",
      "https://www.vocaneo.com/metiers/cuisinier-cuisiniere-de-collectivite",
      "https://servicesartisans.fr/services/cuisiniste",
      "https://www.travaux.com/professionnel/inscription/cuisiniste"
    ],
    "retrievedAt": "2026-09-01"
  },
  "decorateur-interieur": {
    "marche": "La demande des particuliers reste portée par la rénovation et par l’envie d’améliorer le confort du logement. Le métier n’est pas saturé, mais il reste sélectif, avec une concurrence réelle et une demande visible côté particuliers comme côté rénovation énergétique. Les chiffres disponibles montrent aussi un volume d’activité concret autour du métier, avec 4020 demandeurs d’emploi ayant recherché ce métier sur 12 mois et 570 offres déposées sur la même période.",
    "chantiersDemandes": [
      "visite conseil et diagnostic déco pour appartement ou maison",
      "relooking complet de pièce de vie, salon, séjour, chambre",
      "optimisation d’espace et aménagement intérieur pour petits logements",
      "accompagnement déco sur rénovation légère, peinture, revêtements, mobilier et ambiance"
    ],
    "saisonnalite": "La demande monte souvent au printemps et à la rentrée, quand les particuliers lancent leurs projets après les périodes de congés. Elle est en général plus faible pendant les grandes vacances et autour des fêtes, quand les décisions et les chantiers ralentissent.",
    "conseils": [
      "Répondez très vite aux demandes, avec un premier retour clair et un créneau de rappel rapide, car la réactivité fait souvent la différence.",
      "Montrez des photos avant après très lisibles, avec des projets proches du besoin du client, car cela rassure et aide à se projeter.",
      "Demandez un avis après chaque chantier et utilisez-le dans vos devis et vos messages, car la preuve sociale augmente le taux de transformation."
    ],
    "sources": [
      "https://www.ffbatiment.fr/actualites-batiment/actualite/maprimernov-reouverture-du-guichet-de-demande-imminente",
      "https://www.ffbatiment.fr/actualites-batiment/Agenda/fd19-dispositif-aides-financieres-fevrier2026",
      "https://www.edai.fr/top-7-des-debouches-apres-une-formation-en-decoration-d-interieur-2026",
      "https://www.ffbatiment.fr/",
      "https://www.edaa.fr/Actualite/marche-decoration-interieur-325.html"
    ],
    "retrievedAt": "2026-09-01"
  },
  "diagnostic-immobilier": {
    "marche": "La demande des particuliers reste portée par les ventes et les locations, car les diagnostics obligatoires s’imposent à chaque mise en marché d’un logement, avec un DPE et un ERP systématiquement attendus, puis d’autres contrôles selon l’âge et la situation du bien. Le marché du diagnostic immobilier est estimé à près de 1,5 milliard d’euros, avec environ 5 800 entreprises et près de 16 000 professionnels, ce qui traduit une activité installée mais concurrentielle. En 2026, la demande reste soutenue par les changements réglementaires, dont la réforme du DPE, qui entretiennent un besoin récurrent de diagnostics à jour.",
    "chantiersDemandes": [
      "DPE pour une vente ou une location",
      "Dossier de diagnostic technique complet pour une vente",
      "Diagnostics avant mise en location, dont DPE, ERP, gaz et électricité selon le bien",
      "Diagnostics liés aux biens anciens, notamment amiante, plomb et, selon les cas, termites"
    ],
    "saisonnalite": "La demande monte quand les ventes et les mises en location reprennent, surtout au printemps et à la rentrée, car les propriétaires veulent boucler leurs dossiers avant la signature. Elle ralentit plus souvent pendant les périodes creuses du marché immobilier, mais reste alimentée toute l’année par les obligations légales de mise à jour des diagnostics.",
    "conseils": [
      "Répondez très vite aux demandes, avec un rappel sous la journée et un créneau proposé immédiatement, car les particuliers retiennent le premier professionnel disponible.",
      "Montrez des preuves de sérieux, avec avis clients récents, photos de chantiers, certifications visibles et exemples de rapports clairs.",
      "Envoyez un devis simple et lisible, puis relancez poliment sous 24 à 48 heures avec une date d’intervention, un délai de remise et la liste précise des diagnostics compris."
    ],
    "sources": [
      "https://www.service-public.gouv.fr/particuliers/vosdroits/F17376",
      "https://www.service-public.gouv.fr/particuliers/vosdroits/N20591",
      "https://www.mysweetimmo.com/guide/diagnostics-immobiliers-location-vente/combien-coute-un-diagnostic-immobilier/",
      "https://www.service-public.gouv.fr/particuliers/vosdroits/F10798",
      "https://propulsebyca.fr/idees-business/diagnostic-immobilier/etude-marche"
    ],
    "retrievedAt": "2026-09-01"
  },
  "elagueur": {
    "marche": "La demande des particuliers pour l’elagage reste soutenue, car ces travaux concernent a la fois la securite, la regularisation des haies et l’entretien courant des arbres dans les jardins. Le marche est toutefois saisonnier, avec un pic de besoins en automne et en hiver, puis un ralentissement au printemps, quand les tailles plus lourdes sont deconseillees pendant la nidification et le debourrement. Les sources professionnelles indiquent aussi que certaines tailles d’entretien restent possibles toute l’annee, ce qui entretient un flux de demandes hors saison haute.",
    "chantiersDemandes": [
      "Taille de securite et mise a distance des branches dangereuses",
      "Taille d’entretien et de formation des arbres d’ornement",
      "Taille des haies et remise en forme des limites de propriete",
      "Abattage ou reduction de sujets trop grands, mal places ou malades"
    ],
    "saisonnalite": "La forte demande se concentre surtout de l’automne a la fin de l’hiver, avec une fenetre souvent favorable entre octobre et fevrier. La demande baisse au printemps et au debut de l’ete, periode ou les particuliers evitent davantage les tailles lourdes a cause de la vegetation active et de la protection des oiseaux.",
    "conseils": [
      "Repondre tres vite aux demandes, puis proposer un rappel ou un devis sous peu, car la reactivite rassure et fait signer plus de chantiers.",
      "Montrer des photos avant, pendant et apres chantier, avec des resultats nets et propres, pour prouver la qualite du travail.",
      "Demander un avis client apres chaque chantier termine, puis les mettre en avant sur les supports de presentation et dans le devis."
    ],
    "sources": [
      "https://www.travaux.com/jardin-et-exterieur/guide-des-prix/prix-de-lelagage-arbres",
      "https://dechampsavin.fr/index.php/saisonnalite-taille-arbres/",
      "https://www.serpe.fr/fiches-techniques/elagage/les-differents-types-de-taille",
      "https://www.lpo.fr/lpo-locales/la-lpo-en-nouvelle-aquitaine/lpo-aquitaine/actus-aquitaine/actu-2022-aquitaine/taille-et-elagage-quelle-periode",
      "https://www.lesentreprisesdupaysage.fr/taille-des-haies-et-elagage-1-francais-sur-3-ne-connait-pas-la-reglementation/"
    ],
    "retrievedAt": "2026-09-01"
  },
  "electricien": {
    "marche": "La demande des particuliers pour les travaux d’électricité reste soutenue en 2026, portée par la rénovation du logement, l’électrification des usages et les mises en conformité. Le marché est tendu sur les chantiers d’urgence et de rénovation, avec des besoins récurrents en dépannage, sécurité et adaptation des installations aux nouveaux usages. Les signaux récents montrent aussi un intérêt renforcé pour l’électrification des logements et une hausse du coût de l’électricité qui pousse certains ménages à engager des travaux d’optimisation.",
    "chantiersDemandes": [
      "Mise aux normes et rénovation complète d’installation électrique",
      "Dépannage urgent, panne, court-circuit, tableau électrique",
      "Installation de bornes de recharge pour véhicule électrique",
      "Remplacement ou modernisation du tableau, prises, éclairage et protections"
    ],
    "saisonnalite": "La demande est généralement plus forte à l’automne et en hiver, surtout pour le chauffage, la sécurité et les urgences. L’été est souvent plus calme pour les particuliers, mais c’est un bon moment pour planifier des rénovations avant la reprise de la saison forte.",
    "conseils": [
      "Répondez très vite aux demandes, surtout sur les urgences, car la réactivité fait souvent la différence sur un chantier de particulier.",
      "Demandez systématiquement un avis après chaque intervention, puis mettez ces avis en avant avec quelques photos nettes de réalisations récentes.",
      "Présentez des devis clairs, rapides et détaillés, avec les points de sécurité, les délais et les options possibles pour rassurer le client."
    ],
    "sources": [
      "https://fr.indeed.com/q-electricien-particulier-emplois.html",
      "https://marches-publics.nukema.com/seo/consultation/view/2918708/seo",
      "https://entreprendre.service-public.gouv.fr/vosdroits/F38552?lang=en",
      "https://webtensor.fr/blog/trouver-clients-electricien",
      "https://www.service-public.gouv.fr/particuliers/actualites/A18776"
    ],
    "retrievedAt": "2026-09-01"
  },
  "facadier": {
    "marche": "La demande des particuliers pour les travaux de façade reste portée par l’entretien du bâti, la remise en état avant vente ou location, et les projets liés à l’isolation extérieure. Les aides publiques continuent aussi à soutenir une partie des dossiers, mais l’accès est plus cadré et impose souvent un parcours administratif préalable. La demande est donc réelle, mais plus sélective, avec une forte attente sur le conseil, le chiffrage rapide et la capacité à monter un dossier propre.",
    "chantiersDemandes": [
      "Ravalement complet de façade",
      "Réparation de fissures et reprise d’enduit",
      "Peinture ou remise en peinture de façade",
      "Isolation thermique par l’extérieur avec ravalement"
    ],
    "saisonnalite": "La demande et la faisabilité des chantiers montent surtout au printemps et au début de l’automne, quand les températures et l’humidité sont plus favorables aux enduits et aux peintures. L’hiver est la période la plus faible, car le froid, la pluie et le gel compliquent les travaux extérieurs.",
    "conseils": [
      "Répondez très vite aux demandes, avec un premier retour clair le jour même si possible.",
      "Montrez des photos avant après de chantiers similaires, cela rassure et aide à vendre le résultat.",
      "Envoyez un devis lisible et rapide, avec les étapes, les matériaux, les délais, et les points de vigilance sur la façade."
    ],
    "sources": [
      "https://www.habitatpresto.com/mag/maconnerie/aides-ravalement-facade",
      "https://www.service-public.gouv.fr/particuliers/vosdroits/F35083?lang=en",
      "https://www.fonds-publics.fr/aides/aide-renovation-facades",
      "https://www.service-public.gouv.fr/particuliers/vosdroits/F31473",
      "https://rairies-facade.fr/quelle-saison-ravalement-facade/"
    ],
    "retrievedAt": "2026-09-01"
  },
  "macon": {
    "marche": "La demande des particuliers reste soutenue en 2026, car le secteur de la construction prévoit près de 140000 recrutements et plus de 14320 postes de maçons recherchés, ce qui traduit une tension nette sur le métier. Cette tension se voit aussi dans les délais plus longs pour trouver un artisan, avec des chantiers à réserver plusieurs mois à l’avance dans de nombreuses zones.",
    "chantiersDemandes": [
      "construction de murs et de maçonnerie générale pour maison individuelle ou extension",
      "ouverture ou modification de mur porteur",
      "dalle béton, chape, fondations et petites structures en béton",
      "rénovation, reprise et réparation de maçonnerie, y compris travaux extérieurs et façade"
    ],
    "saisonnalite": "La demande est plus forte du printemps au début de l’automne, avec un pic entre avril et juillet puis une bonne activité en septembre et octobre. L’hiver est plus creux pour les travaux extérieurs, surtout quand le froid, le gel ou l’humidité limitent les chantiers.",
    "conseils": [
      "Répondez très vite aux demandes, avec un rappel le jour même et un créneau de visite rapide, car la réactivité fait souvent la différence quand le client compare plusieurs artisans.",
      "Montrez des photos avant et après de chantiers similaires, bien cadrées et récentes, pour rassurer sur la qualité et sur la propreté du travail.",
      "Envoyez un devis clair, détaillé et rapide, avec des lignes lisibles, des délais annoncés et des conditions précises, puis demandez un avis client après chaque chantier terminé."
    ],
    "sources": [
      "https://entreprendre.service-public.gouv.fr/vosdroits/F39037",
      "https://www.metiers-btp.fr/actualites/projets-recrutement-bmo-2026/",
      "https://devixo.fr/glossaire/saisonnalite-btp",
      "https://artisan.guide/blog/tendances-macon/",
      "https://fr.organilog.com/39242-business-plan-macon/"
    ],
    "retrievedAt": "2026-09-01"
  },
  "menuisier": {
    "marche": "En 2026, la demande des particuliers pour la menuiserie reste soutenue, avec un léger rebond attendu de l’activité du bâtiment porté par le logement neuf, tandis que la rénovation recule encore légèrement. La demande est donc réelle mais plus sélective, avec une tension surtout forte sur les travaux qui améliorent le confort, l’isolation et la sécurité.",
    "chantiersDemandes": [
      "Remplacement de fenêtres et menuiseries extérieures",
      "Pose ou remplacement de portes d’entrée et portes intérieures",
      "Volets, persiennes et autres fermetures",
      "Aménagements sur mesure, comme placards, dressings, escaliers et mobilier d’agencement"
    ],
    "saisonnalite": "",
    "conseils": [
      "Répondez vite aux demandes, avec un premier contact clair le jour même si possible, car la réactivité fait gagner des chantiers.",
      "Montrez des photos récentes de chantiers finis, avant et après, pour rassurer sur la qualité et le style.",
      "Faites des devis précis, lisibles et rapides, avec délais, matériaux et options clairement séparés, pour faciliter la décision du client."
    ],
    "sources": [
      "https://www.elcia.com/ressources/marche-menuiserie/",
      "https://epsimas.com/etude-de-marche-de-la-menuiserie/",
      "https://www.tbcinnovation.fr/parcours-dachats-des-particuliers-pour-des-menuiseries-en-france/",
      "https://servicesartisans.fr/tarifs/menuisier",
      "https://www.e-marchespublics.com/appel-offre/menuiserie"
    ],
    "retrievedAt": "2026-09-01"
  },
  "paysagiste": {
    "marche": "La demande des particuliers reste le moteur principal du secteur, avec 49 % du chiffre d’affaires de la profession, soit plus de 4,0 Md€ en 2024. Les carnets de commandes restent élevés au premier semestre 2026, ce qui traduit une tension encore forte sur les chantiers et une activité soutenue. Les clients particuliers portent aussi la dynamique récente, avec une hausse de 6 % signalée au second semestre 2025.",
    "chantiersDemandes": [
      "Entretien de jardin, tonte, taille de haies, ramassage de feuilles",
      "Création de jardin, engazonnement, plantation",
      "Terrasses et aménagements d’agrément",
      "Arrosage automatique, paillage, solutions d’ombrage"
    ],
    "saisonnalite": "La demande est la plus forte au printemps et à l’automne, périodes citées comme saisonnières pour les plantations, les semis, la tonte, la taille de haies et le ramassage de feuilles. L’été reste actif sur l’entretien courant et les besoins liés à la chaleur, tandis que l’hiver est plus calme, avec davantage de préparation, de devis et d’élagage hors gel.",
    "conseils": [
      "Répondez très vite aux demandes, surtout en haute saison, car les devis sont comparés rapidement.",
      "Montrez des photos avant après de chantiers réels, avec des résultats nets et lisibles.",
      "Demandez systématiquement un avis client après chaque chantier, puis réutilisez ces retours dans vos devis et vos supports commerciaux."
    ],
    "sources": [
      "https://www.legifrance.gouv.fr/conv_coll/id/KALIARTI000020477166?idConteneur=KALICONT000005635325",
      "https://www.lefigaro.fr/jardin/paysagistes-le-manque-de-bras-est-criant-malgre-la-forte-demande-des-particuliers-20251113",
      "https://www.batiweb.com/actualites/conjoncture/une-croissance-de-4-5-au-s2-2025-pour-les-entreprises-du-paysage-48280",
      "https://www.lesentreprisesdupaysage.fr/le-secteur-du-paysage-poursuit-son-essor/",
      "https://www.toute-la-franchise.com/article-franchise-paysagisme"
    ],
    "retrievedAt": "2026-09-01"
  },
  "peintre": {
    "marche": "La demande des particuliers pour la peinture reste soutenue, avec une activité portée par les travaux de rénovation, d’entretien et d’amélioration du logement. Le marché est très concurrentiel, avec une offre artisanale abondante et de nombreuses demandes de devis, ce qui maintient une pression sur les délais de réponse et la qualité de présentation de l’offre.",
    "chantiersDemandes": [
      "Peinture intérieure complète des pièces de vie, murs et plafonds",
      "Remise en état après déménagement, état des lieux ou sinistre léger",
      "Peinture des boiseries, portes, encadrements et escaliers",
      "Ravalement et peinture extérieure, façades, volets et murets"
    ],
    "saisonnalite": "La demande est généralement plus forte au printemps et en été, surtout pour les chantiers extérieurs et les rénovations avant emménagement. Elle baisse souvent en hiver pour l’extérieur, tandis que les travaux intérieurs restent plus réguliers toute l’année.",
    "conseils": [
      "Répondez très vite aux demandes, avec un premier retour clair sur le délai, le périmètre et la disponibilité, car les particuliers comparent plusieurs artisans.",
      "Mettez en avant des photos avant après, nettes et récentes, pour rassurer sur la qualité, la propreté du chantier et le niveau de finition.",
      "Donnez un devis lisible et détaillé, avec supports, préparation, nombre de couches, fournitures et délai d’intervention, pour limiter les hésitations et accélérer la signature."
    ],
    "sources": [
      "https://entreprendre.service-public.gouv.fr/vosdroits/F39038?lang=fr",
      "https://lecoinrenov.fr/trouver/peintre",
      "https://www.artisans-de-confiance.fr/artisans/specialite/peintre",
      "https://yoojo.fr/bricolage/guides/tarif-peintre-prix-exemples-127",
      "https://www.kelyseo.com/blog/tarif-peintre-batiment-2026"
    ],
    "retrievedAt": "2026-09-01"
  },
  "pisciniste": {
    "marche": "La demande des particuliers repart à la hausse, avec un premier trimestre 2026 en progression de 12 % sur les piscines vendues, 6 % sur les devis, et 2,5 % sur les livraisons par rapport à l’an dernier. Le marché confirme une reprise après plusieurs saisons plus calmes, avec un parc français estimé à 3,7 millions de piscines familiales et 90 600 nouveaux foyers équipés en 2025.",
    "chantiersDemandes": [
      "Construction de piscine familiale neuve",
      "Rénovation de bassin existant",
      "Modernisation technique, filtration, traitement, automatisation",
      "Équipements et aménagements, couverture, sécurité, confort, étanchéité"
    ],
    "saisonnalite": "La demande est la plus forte au printemps et en début d’été, quand les particuliers lancent leurs projets et demandent des devis. L’activité ralentit en hiver, avec un net creux sur les chantiers extérieurs, même si les demandes de préparation et de rénovation restent présentes.",
    "conseils": [
      "Répondez très vite aux demandes, surtout sur les premiers contacts et les rappels de devis, car les particuliers comparent plusieurs entreprises.",
      "Montrez des photos avant et après, des chantiers terminés et des détails techniques clairs, cela rassure et aide à vendre la qualité du travail.",
      "Demandez systématiquement un avis client après la réception du chantier, puis utilisez ces avis dans vos devis et vos supports commerciaux pour augmenter la confiance."
    ],
    "sources": [
      "https://www.propiscines.fr/marche/marche-les-francais-confirment-leurs-envies-de-piscines-familiales/",
      "https://www.leprogres.fr/economie/2026/05/18/piscines-privees-le-marche-bouillonne-les-professionnels-surnagent",
      "https://www.guide-piscine.fr/pro/marche-de-la-piscine/etudes-de-marche-piscine-et-bain/marche-de-la-piscine-4362_A",
      "https://www.eurospapoolnews.com/actualites_piscines_spas-fr/89535-piscines,familiales,collectives,derniers,chiffres,fpp,nouveaux,potentiels,marche.htm",
      "https://www.idees-piscine.com/marche-de-la-piscine-lhiver-2026-confirme-le-redressement-du-secteur/"
    ],
    "retrievedAt": "2026-09-01"
  },
  "plaquiste": {
    "marche": "La demande des particuliers reste porteuse pour un plaquiste, avec un marché soutenu par la rénovation et des besoins réguliers en cloisons, doublage et plafonds. Les sources disponibles décrivent un marché tendu, avec peu de candidats et une demande encore active, surtout portée par la rénovation intérieure et l’isolation. Aucun chiffre fiable récent n’a été retenu ici sans source solide, donc il vaut mieux parler d’un volume stable à soutenu et d’une concurrence artisanale favorable au bon réactif.",
    "chantiersDemandes": [
      "Création ou modification de cloisons intérieures pour redistribuer les pièces",
      "Doublage de murs et isolation thermique ou acoustique",
      "Pose de faux plafonds et habillage de plafonds",
      "Aménagement de pièces humides avec plaques adaptées, comme salle de bain ou cuisine"
    ],
    "saisonnalite": "La demande reste assez étalée sur l’année, car la plâtrerie concerne des travaux intérieurs peu dépendants de la météo. Les périodes les plus chargées se voient souvent à la sortie de l’été et en fin d’année, quand les particuliers relancent leurs projets de rénovation, tandis que le cœur de l’été peut être plus irrégulier selon les congés.",
    "conseils": [
      "Répondre très vite aux demandes, idéalement dans la journée, car un particulier compare rarement longtemps et choisit souvent le premier artisan clair et disponible.",
      "Montrer des photos de chantiers avant après, avec des détails nets sur les cloisons, plafonds et finitions, pour rassurer sur la qualité du travail.",
      "Donner un devis simple, précis et rapide, avec délais, matériaux et étapes bien lisibles, puis demander un avis client dès la fin du chantier pour renforcer la confiance sur les prochaines demandes."
    ],
    "sources": [
      "https://entreprendre.service-public.gouv.fr/vosdroits/F39048",
      "https://travaux.obat.fr/guides/tarif-plaquiste/",
      "https://candidat.francetravail.fr/offres/recherche/detail/203VMDW",
      "https://www.carlesenduits66.com/post/tendances-2026-ce-qui-va-changer-pour-les-plaquistes-jointeurs-dans-les-pyr%C3%A9n%C3%A9es-orientales-66",
      "https://www.xerfi.com/presentationetude/le-marche-de-la-platrerie-et-de-la-plaquisterie_bat09"
    ],
    "retrievedAt": "2026-09-01"
  },
  "plombier": {
    "marche": "Le marché reste porté par une demande structurelle régulière, surtout en rénovation et en remplacement d’équipements, avec une activité décrite comme résiliente en 2026. Les particuliers cherchent en priorité des interventions rapides pour des problèmes du quotidien, ce qui soutient une tension durable sur les artisans disponibles. Une étude récente indique aussi un parc important, avec 72 480 établissements actifs en février 2026, signe d’un secteur dense mais très sollicité.",
    "chantiersDemandes": [
      "Recherche et réparation de fuite d’eau",
      "Débouchage et dégorgement de canalisations",
      "Remplacement et installation de chauffe-eau",
      "Pose et remplacement de sanitaires, robinetterie, WC et lavabo"
    ],
    "saisonnalite": "La demande monte souvent en période de froid, avec les fuites, pannes de chauffe-eau et problèmes de chauffage. La demande baisse généralement un peu hors pics de froid et hors périodes de rénovation, mais les urgences restent présentes toute l’année.",
    "conseils": [
      "Répondez très vite aux demandes, surtout sur les urgences, car les particuliers choisissent souvent le premier artisan joignable.",
      "Soignez vos avis clients et demandez systématiquement un retour après chaque chantier, car la confiance pèse fortement dans le choix d’un plombier.",
      "Montrez des photos nettes avant et après chantier, avec un devis clair et court, pour rassurer vite et faire accepter plus facilement la mission."
    ],
    "sources": [
      "https://entreprisemoreau.fr/",
      "https://oliveira-artisan.fr/",
      "https://atce-idf.com/index.php/plomberie/",
      "https://www.travaux-comparateur.com/annuaire-artisans/plombier",
      "https://yoojo.fr/bricolage/plombier"
    ],
    "retrievedAt": "2026-09-01"
  },
  "ramoneur": {
    "marche": "La demande des particuliers reste portée par une obligation légale régulière, avec un ramonage au moins une fois par an, et souvent deux fois pour les combustibles solides ou liquides selon les cas. Le marché reste tendu en période de chauffe, car les ramoneurs sont souvent débordés à l’automne, tandis que les périodes plus calmes offrent davantage de disponibilités. Une source d’étude de marché évoque un secteur valorisé à près de 200 millions d’euros en 2021, avec une croissance annuelle attendue de 3 à 5 %, ce qui va dans le sens d’une demande structurellement stable à haussière.",
    "chantiersDemandes": [
      "Ramonage de cheminée chez les particuliers, avec attestation d’intervention",
      "Ramonage de poêle à bois ou à granulés, très lié aux obligations d’entretien",
      "Ramonage d’insert ou de conduit raccordé à un appareil de chauffage",
      "Ramonage de chaudière ou d’installation gaz, selon la fréquence imposée par la réglementation et la commune"
    ],
    "saisonnalite": "La forte demande se concentre surtout avant et pendant la saison de chauffe, avec un pic fréquent en septembre, octobre et novembre. La demande est plus faible au printemps et en été, ce qui laisse plus de marge pour obtenir des rendez-vous rapides.",
    "conseils": [
      "Répondez vite aux demandes, surtout en automne, car le délai de réponse influence directement la prise de rendez-vous.",
      "Montrez des photos nettes de vos chantiers, avant et après intervention, avec un résultat propre et lisible pour rassurer les particuliers.",
      "Demandez des avis clients après chaque intervention et mettez en avant vos devis clairs, votre attestation et vos délais de passage, car cela renforce la confiance et fait la différence."
    ],
    "sources": [
      "https://www.macif.fr/assurance/particuliers/assurance-habitation-et-vie-quotidienne/assurance-ramonage",
      "https://www.rankflux.fr/blog/48",
      "https://pmarketresearch.com/fr/rapports/rapport-detude-de-marche-sur-les-services-de-ramonage-de-cheminees-dans-le-monde-et-en-france/",
      "https://www.francetvinfo.fr/economie/energie/energie-entre-forte-demande-et-manque-de-main-doeuvre-les-ramoneurs-debordes_5441239.html",
      "https://lacompagniedesramoneurs.fr/expertise/ramonage-cheminee-obligation-legale-frequence-2025"
    ],
    "retrievedAt": "2026-09-01"
  },
  "serrurier": {
    "marche": "La demande des particuliers pour la serrurerie reste portée par le dépannage d’urgence, la sécurisation du logement et le remplacement de serrures après incident ou vétusté. En revanche, le marché lié au neuf est en retrait, car l’activité du secteur dépend fortement de la construction de logements neufs et celle-ci baisse. Le volume global reste donc sous tension, avec une activité soutenue sur l’urgence et la sécurité, mais un contexte général plus fragile qu’en période de reprise du bâtiment.",
    "chantiersDemandes": [
      "Ouverture de porte claquée ou verrouillée",
      "Remplacement de serrure standard ou multipoints",
      "Installation de serrure haute sécurité ou certifiée",
      "Renforcement de la sécurité du logement, comme blindage ou pose de porte blindée"
    ],
    "saisonnalite": "La demande monte lors des périodes de dépannage urgent, notamment quand les retours à domicile et les absences prolongées augmentent les incidents de porte et de clé. La demande est plus faible quand les chantiers de rénovation ralentissent et hors périodes de tension liée aux cambriolages ou aux vacances.",
    "conseils": [
      "Répondez très vite aux appels et annoncez un délai clair, car la réactivité est décisive sur les dépannages urgents.",
      "Publiez des photos nettes de chantiers réels, avant et après, pour rassurer sur la qualité du travail et la propreté de l’intervention.",
      "Faites un devis simple et précis dès le premier contact, avec le détail de la prestation, du déplacement et des majorations éventuelles, afin de lever les freins à la commande"
    ],
    "sources": [
      "https://epsimas.com/etude-de-marche-des-serruriers-en-france/",
      "https://propulsebyca.fr/idees-business/travaux-serrurerie/etude-marche",
      "https://www.artisan-verifie.fr/serrurier",
      "https://www.boamp.fr/telechargements/FILES/PDF/2026/03/26-21551.pdf",
      "https://prozissimo.com/guide/prix-serrurier-2026"
    ],
    "retrievedAt": "2026-09-01"
  },
  "terrassier": {
    "marche": "La demande des particuliers pour les travaux de terrassement reste présente, portée par les projets de maison individuelle, de piscine et d’aménagement extérieur. Les sources trouvées montrent aussi que les particuliers restent un moteur important de l’activité dans les métiers d’extérieur, avec une dynamique soutenue sur les devis et les chantiers privés. La tension demeure forte dans certaines zones, car les entreprises reçoivent des demandes régulières et les délais peuvent s’allonger en période chargée.",
    "chantiersDemandes": [
      "Terrassement pour maison individuelle, préparation de plateforme et fondations",
      "Terrassement pour piscine, fouille et mise à niveau du terrain",
      "Création ou reprise d’allées, accès et chemins carrossables",
      "Viabilisation de terrain et raccordements, avec tranchées pour réseaux"
    ],
    "saisonnalite": "La demande est plus forte au printemps et en début d’été, quand les particuliers lancent les travaux extérieurs et que les délais se tendent. Les périodes plus calmes se situent plutôt en hiver et en fin d’automne, avec davantage de disponibilités pour planifier et signer.",
    "conseils": [
      "Répondez très vite aux demandes, idéalement dans l’heure, car la réactivité fait gagner des chantiers.",
      "Montrez des photos nettes de chantiers avant, pendant et après, pour rassurer sur la qualité et le sérieux.",
      "Demandez des avis clients après chaque chantier, puis mettez-les en avant avec un devis clair et rapide."
    ],
    "sources": [
      "https://vitrinedubtp.fr/blog/comment-trouver-des-clients-terrassier-guide-pratique-2026",
      "https://www.habitatpresto.com/mag/jardin/terrassier-autour-de-moi",
      "https://candidat.francetravail.fr/offres/recherche/detail/212CXVM",
      "https://servicesartisans.fr/tarifs/terrassier",
      "https://www.mdeg-terrassement.fr/prix-terrassement-au-m---en-2026---7-facteurs-qui-font-varier-le-devis_ad32.html"
    ],
    "retrievedAt": "2026-09-01"
  },
  "videosurveillance-installateur": {
    "marche": "La demande des particuliers pour la vidéosurveillance en France reste en hausse, avec un marché national estimé à 1,69 milliard USD en 2025 et une croissance attendue jusqu’en 2030. Les études disponibles décrivent un marché résidentiel encore peu équipé, avec des taux de croissance élevés et un fort potentiel de développement.",
    "chantiersDemandes": [
      "Installation de caméras extérieures pour maison ou pavillon",
      "Pose de caméras intérieures pour surveiller les accès et pièces de vie",
      "Création d’un système complet avec enregistreur, application mobile et alertes",
      "Remplacement ou modernisation d’une installation existante avec meilleure qualité d’image et vision de nuit"
    ],
    "saisonnalite": "La demande monte souvent avant les départs en vacances et lors des périodes de cambriolages médiatisés, car les particuliers veulent sécuriser leur logement rapidement. Elle est plus faible hors pics de vacances et en périodes de budget contraint, quand les projets de confort ou de sécurité sont reportés.",
    "conseils": [
      "Répondez très vite aux demandes, avec un rappel sous peu et un créneau de visite clair, car la réactivité fait souvent la différence sur les petits chantiers.",
      "Montrez des photos avant après de chantiers réels, avec des cas de maisons, portails et allées, pour rassurer sur la qualité du travail.",
      "Faites des devis lisibles et détaillés, avec options simples, matériel, pose, garantie et maintenance, afin de lever les freins à la décision et éviter les abandons."
    ],
    "sources": [
      "https://www.mordorintelligence.com/fr/industry-reports/france-video-surveillance-market",
      "https://www.msi-reports.com/boutique/securite/marche-de-la-videosurveillance-en-france/",
      "https://www.acti-com.net/marche-de-la-videoprotection-et-de-la-videosurveillance-2025/",
      "https://www.service-public.gouv.fr/particuliers/vosdroits/F2517",
      "https://www.bati-today.com/www.bati-today.com/w/pdf/communiquedepressemsireportstelesurveillance20okok.pdf?VersionId=1756124614.112038"
    ],
    "retrievedAt": "2026-09-01"
  },
  "vitrier": {
    "marche": "La demande des particuliers pour la vitrerie reste présente en France, avec une activité soutenue sur les remplacements rapides, les dépannages et les travaux de rénovation. Les sources consultées montrent aussi une couverture nationale importante, avec des réseaux d’agences et de pros présents dans de nombreuses villes, ce qui traduit un marché large et concurrentiel. Les éléments trouvés confirment une tension surtout sur les interventions urgentes et les remplacements de vitres cassées, avec des offres et consultations régulières en 2026.",
    "chantiersDemandes": [
      "remplacement de vitre cassée",
      "dépannage urgent de vitrerie",
      "pose de vitrage sur fenêtre ou baie vitrée",
      "travaux de miroiterie et vitrines sur mesure"
    ],
    "saisonnalite": "La demande est généralement plus forte pendant les périodes de casse, de sinistres et de travaux de rénovation, donc plutôt quand les particuliers veulent une intervention rapide. Elle est souvent plus calme sur les périodes creuses des chantiers extérieurs, avec une activité plus régulière sur les dépannages que sur les poses planifiées.",
    "conseils": [
      "Répondez très vite aux demandes, surtout sur les urgences, car la vitesse de rappel fait souvent la différence sur un besoin de vitrerie.",
      "Montrez des photos avant et après de chantiers propres et nets, cela rassure immédiatement sur la qualité du travail.",
      "Rédigez des devis clairs et rapides, avec un délai d’intervention visible, une description simple des travaux et un point de contact direct."
    ],
    "sources": [
      "https://miroiteriedefrance.fr/",
      "https://www.verre-solutions.fr/notre-reseau-dagence/",
      "https://www.francevitre.com/",
      "https://www.marches-publics.gouv.fr/app.php/entreprise/consultation/2968423?orgAcronyme=f5j",
      "https://dossiersgagnants.fr/entreprise/752359232-vitres-et-verre"
    ],
    "retrievedAt": "2026-09-01"
  }
};
