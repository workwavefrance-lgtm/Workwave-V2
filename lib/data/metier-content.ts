// Contenu éditorial SOURCÉ par métier (Perplexity sonar, recherche web + citations).
// Généré le 2026-07-26 — NE PAS éditer à la main.
// « zéro invention » : intro/certifs/conseils issus de sources web réelles, citées.

export type MetierFaq = { q: string; a: string };
export type MetierContentEntry = {
  intro: string;
  certifications: string[];
  choisir: string[];
  facteursPrix: string[];
  faq: MetierFaq[];
  sources: string[];
  retrievedAt: string;
};

export const METIER_CONTENT: Record<string, MetierContentEntry> = {
  "accompagnement-handicap": {
    "intro": "En France, un professionnel de l’accompagnement handicap intervient pour aider une personne en situation de handicap à gagner ou maintenir de l’autonomie dans sa vie quotidienne, scolaire, sociale ou professionnelle. Ses interventions les plus courantes consistent à aider dans les actes de la vie quotidienne, à soutenir les déplacements, à faciliter l’accès aux droits et aux démarches, et à participer au suivi d’un projet individualisé. Dans le champ scolaire, l’AESH favorise l’autonomie de l’élève au sein de la classe, de l’école ou de l’établissement. Un particulier y fait appel lorsqu’il faut un soutien régulier, personnalisé et coordonné, à domicile, à l’école ou pour l’insertion dans l’emploi.",
    "certifications": [
      "DEAES (Diplôme d’État d’Accompagnant Éducatif et Social)",
      "DEAVS (Diplôme d’État d’Auxiliaire de Vie Sociale)",
      "DEAMP (Diplôme d’État d’Aide Médico-Psychologique)",
      "Qualification professionnelle reconnue pour le recrutement d’AESH",
      "VAE pour l’obtention du DEAES"
    ],
    "choisir": [
      "Vérifier que le professionnel a l’expérience du type de handicap concerné, car l’accompagnement n’est pas le même selon qu’il s’agit d’un handicap moteur, sensoriel, intellectuel, psychique ou d’un trouble du neurodéveloppement.",
      "Demander s’il sait travailler à partir d’un projet individualisé et en lien avec les autres intervenants (famille, école, médecin, service social, employeur), car la coordination fait partie du métier.",
      "Contrôler le cadre d’intervention exact : aide à domicile, accompagnement scolaire, insertion professionnelle ou emploi accompagné, car chaque dispositif n’obéit pas aux mêmes règles ni aux mêmes financeurs.",
      "Demander la preuve des diplômes ou du statut requis selon le cas : DEAES pour l’aide humaine et sociale, ou recrutement AESH par l’Éducation nationale sur critères de qualification.",
      "Vérifier l’existence d’une assurance responsabilité civile professionnelle si l’intervention est indépendante, et demander quelles tâches sont incluses ou exclues avant de signer, surtout pour les actes du quotidien et les déplacements."
    ],
    "facteursPrix": [
      "Le niveau de qualification du professionnel et le cadre d’exercice, car un AESH, un AES ou un intervenant à domicile n’ont pas les mêmes coûts salariaux ou tarifaires.",
      "Le nombre d’heures nécessaires et la fréquence des interventions, notamment si l’accompagnement est quotidien, ponctuel ou étendu sur de longues plages horaires.",
      "La nature des tâches demandées : aide aux actes essentiels, accompagnement aux sorties, soutien administratif, ou coordination avec d’autres professionnels.",
      "Le lieu d’intervention et les contraintes de déplacement, par exemple domicile, école, établissement spécialisé ou milieu de travail."
    ],
    "faq": [
      {
        "q": "Quelle est la différence entre un AESH et un accompagnant à domicile ?",
        "a": "L’AESH intervient en milieu scolaire pour favoriser l’autonomie de l’élève, tandis qu’un accompagnant à domicile aide davantage dans les actes de la vie quotidienne et le maintien de l’autonomie."
      },
      {
        "q": "Un accompagnement handicap peut-il inclure les démarches administratives ?",
        "a": "Oui, l’aide aux démarches et à l’accès aux droits fait partie des missions décrites pour l’AES et d’autres professionnels de l’accompagnement."
      },
      {
        "q": "Existe-t-il un dispositif d’accompagnement pour garder un emploi en milieu ordinaire ?",
        "a": "Oui, l’emploi accompagné est un dispositif médico-social et professionnel sans limite de durée, avec un référent unique, pour aider à obtenir et conserver un emploi."
      },
      {
        "q": "Faut-il un diplôme précis pour être accompagnant handicap ?",
        "a": "Selon le poste, oui : l’AES est accessible avec le DEAES, le DEAVS ou le DEAMP, et les AESH sont recrutés sur critères de qualification professionnelle."
      }
    ],
    "sources": [
      "https://www.education.gouv.fr/etre-accompagnant-des-eleves-en-situation-de-handicap-aesh-12188",
      "https://candidat.francetravail.fr/metierscope/fiche-metier/K1306/accompagnant-educatif-et-social-aes-accompagnante-educative-et-sociale-aes",
      "https://prendresoin.francetravail.fr/domaine-activite/secteur-handicap",
      "https://infos.emploipublic.fr/article/devenir-charge-de-mission-et-de-projets-autonomie-handicap-fiche-metier-eea-12282"
    ],
    "retrievedAt": "2026-07-26"
  },
  "aide-administrative": {
    "intro": "En France, un aide administrative aide concrètement une personne à trier son courrier, remplir des formulaires, constituer des dossiers et suivre des démarches auprès d’organismes comme la CAF, la CPAM, la MDPH, les caisses de retraite ou les impôts. Il intervient aussi sur des tâches de base comme la prise de rendez-vous, la rédaction de courriers simples, le classement et la gestion de documents papier ou numériques. Un particulier y fait appel lorsqu’il a des difficultés à comprendre une procédure, à utiliser des services en ligne, à rassembler les pièces demandées ou à respecter un délai administratif. Ce besoin concerne aussi bien des seniors que des personnes en situation de handicap ou tout usager confronté à des démarches complexes.",
    "certifications": [],
    "choisir": [
      "Vérifier si la personne intervient à domicile ou seulement à distance, car le contenu de la prestation n’est pas le même pour du tri de courrier, de la saisie en ligne ou du suivi de dossiers papier.",
      "Demander clairement si elle aide à traiter des démarches personnelles seulement, ou aussi des démarches liées à l’emploi, au logement, à la santé ou au handicap, afin d’éviter un malentendu sur le périmètre.",
      "Exiger une précision sur la confidentialité et la manipulation des pièces sensibles : carte d’identité, avis d’imposition, relevés bancaires, notifications CAF ou MDPH.",
      "Pour une intervention facturée, demander un devis détaillé avec le temps estimé, le nombre de dossiers traités et ce qui est inclus ou non, car le prix varie surtout selon la complexité et la durée.",
      "Si l’aide est proposée dans le cadre d’un service à la personne, vérifier l’éligibilité au crédit d’impôt et demander si l’intervenant ou la structure peut fournir les justificatifs nécessaires pour l’administration fiscale."
    ],
    "facteursPrix": [
      "Le temps passé : simple classement de documents, ou accompagnement complet avec recherche d’informations, préparation des pièces et suivi.",
      "La complexité de la démarche : une réclamation simple n’a pas le même coût qu’un dossier MDPH, retraite, logement social ou CAF avec plusieurs justificatifs.",
      "Le mode d’intervention : à domicile, par téléphone, à distance ou en présence physique pour accompagner à un rendez-vous.",
      "Le statut du prestataire : indépendant, association, ou structure de services à la personne, avec des tarifs et des modalités de facturation différents."
    ],
    "faq": [
      {
        "q": "Quelles tâches fait concrètement un aide administrative ?",
        "a": "Il trie et classe les documents, remplit des formulaires, rédige des courriers simples et suit des dossiers administratifs."
      },
      {
        "q": "Un aide administrative peut-il traiter des dossiers CAF, CPAM ou MDPH ?",
        "a": "Oui, s’il s’agit d’aider à préparer, comprendre et suivre les démarches, sans se substituer à l’organisme qui instruit le dossier."
      },
      {
        "q": "Existe-t-il une certification obligatoire spécifique pour ce métier ?",
        "a": "Aucune certification nationale spécifique n’est indiquée pour le métier d’aide administrative dans les sources consultées ; la vérification porte surtout sur l’expérience, la discrétion et la maîtrise des démarches."
      },
      {
        "q": "Peut-on obtenir une aide administrative gratuite ?",
        "a": "Oui, selon la situation, via des dispositifs comme France Services, certaines structures d’action sociale, ou des points d’accueil publics dédiés."
      }
    ],
    "sources": [
      "https://candidat.francetravail.fr/metierscope/fiche-metier/M1607/assistant-administratif-assistante-administrative",
      "https://fr.indeed.com/conseils-carrieres/developpement-personnel/competences-assistant-administratif",
      "https://officeopro.com/nos-metiers/assistante-administrative/",
      "https://www.emploi-territorial.fr/fichemetier/C10513"
    ],
    "retrievedAt": "2026-07-26"
  },
  "aide-seniors": {
    "intro": "Un Aide aux seniors accompagne à domicile une personne âgée dans les gestes de la vie quotidienne : aide au lever et au coucher, toilette simple, repas, courses, entretien du logement, accompagnement aux rendez-vous et soutien dans les déplacements. Le métier recouvre aussi une présence relationnelle régulière, avec surveillance de l’état général et repérage de situations à risque dans le quotidien. Un particulier y fait appel quand la personne perd en autonomie, sort difficilement seule, a besoin d’aide pour les tâches courantes ou nécessite un relais ponctuel pour maintenir son maintien à domicile. Le ministère du Travail indique que ce métier peut être exercé avec plusieurs formations qualifiantes, et qu’une formation préalable est conseillée.",
    "certifications": [
      "Diplôme d’État d’accompagnant éducatif et social (DEAES)",
      "Titre Professionnel Assistant de Vie aux Familles (ADVF)",
      "CAP Agent accompagnant au grand âge",
      "CAP agricole Services aux personnes et vente en espace rural",
      "Certificat de spécialisation aide à domicile",
      "Bac pro accompagnement, soins et services à la personne (ASSP)"
    ],
    "choisir": [
      "Vérifier que la personne sait intervenir auprès d’une personne âgée dépendante ou semi-dépendante, avec des références précises sur l’aide au lever, à la toilette non médicalisée, aux repas et aux transferts simples.",
      "Demander quelle formation elle possède, car le ministère cite notamment le DEAES, l’ADVF, le CAP agent accompagnant au grand âge et d’autres diplômes adaptés aux missions d’aide à domicile.",
      "Contrôler l’organisation des horaires et des remplacements : ce métier implique souvent des passages tôt le matin, le soir, le week-end ou les jours fériés, avec une forte contrainte de présence régulière.",
      "Vérifier l’existence d’une assurance responsabilité civile professionnelle si la prestation est exercée en indépendant, et confirmer qui couvre les dommages au domicile ou lors d’un déplacement accompagné.",
      "Poser des questions concrètes sur le périmètre exact : aide au repas, entretien du linge, courses, accompagnement extérieur, préparation des médicaments sans acte médical, et signalement en cas de chute ou de confusion."
    ],
    "facteursPrix": [
      "Le niveau d’autonomie de la personne âgée : une aide ponctuelle pour les repas coûte moins qu’une présence longue avec aide au lever, à la toilette et aux transferts.",
      "La durée et la fréquence des interventions : une intervention quotidienne ou plusieurs passages par jour augmente le coût total.",
      "Les horaires demandés : les missions le dimanche, les jours fériés ou en soirée sont souvent majorées.",
      "Le mode d’emploi du professionnel : salarié à domicile, prestataire ou indépendant, avec des tarifs différents selon les charges incluses et les remplacements."
    ],
    "faq": [
      {
        "q": "L’Aide aux seniors peut-il faire la toilette complète ?",
        "a": "Oui pour une toilette d’aide à la vie quotidienne, mais pas pour des soins infirmiers ; les actes médicaux relèvent d’un professionnel de santé."
      },
      {
        "q": "Faut-il un diplôme pour exercer ?",
        "a": "Le métier peut être accessible sans qualification initiale, mais le ministère recommande une formation préalable et cite plusieurs diplômes et titres adaptés."
      },
      {
        "q": "Ce métier comprend-il l’accompagnement aux courses et aux rendez-vous ?",
        "a": "Oui, l’accompagnement extérieur fait partie des missions courantes quand il est prévu au contrat et compatible avec l’état de la personne."
      },
      {
        "q": "Quelles situations doivent alerter chez un professionnel ?",
        "a": "L’absence de référence sur l’aide aux personnes âgées, l’incapacité à décrire ses limites entre aide quotidienne et soin médical, ou un flou sur les horaires, remplacements et déplacements."
      }
    ],
    "sources": [
      "https://sante.gouv.fr/metiers-et-concours/les-metiers-de-la-sante/le-repertoire-des-metiers-de-la-sante-et-de-l-autonomie-fonction-publique/social-educatif-psychologie-et-culturel/sousfamille/assistance-a-la-mise-en-oeuvre-des-projets-socio-educatifs/metier/auxiliaire-de-vie-sociale",
      "https://www.energyseniors.com/metiers-service-personne-particulierement-adaptes-seniors-reconversion-france.html",
      "https://prendresoin.francetravail.fr/actualites/auxiliaire-de-vie-personnes-agees",
      "https://ecole-soin.com/job/aide-a-domicile/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "architecte": {
    "intro": "L’architecte conçoit un projet de bâtiment, traduit les besoins du client en plans, puis suit sa réalisation jusqu’à la livraison. En pratique, il intervient souvent pour la conception d’une maison neuve, une extension, une rénovation lourde, une transformation de bâtiment ou le dépôt de permis de construire. Un particulier fait appel à lui quand le projet exige une conception sur mesure, une forte contrainte réglementaire, ou une surface de plancher supérieure au seuil légal nécessitant le recours à un architecte. En France, l’exercice est réglementé et l’architecte doit être inscrit à l’Ordre pour exercer légalement.",
    "certifications": [
      "HMONP (habilitation à la maîtrise d’œuvre en son nom propre)",
      "Inscription au Tableau de l’Ordre des architectes",
      "Assurance responsabilité civile professionnelle (RC Pro)",
      "Assurance décennale"
    ],
    "choisir": [
      "Vérifier l’inscription de l’architecte au Tableau de l’Ordre des architectes et demander son numéro d’inscription.",
      "Demander si le professionnel est habilité HMONP, surtout si vous voulez qu’il porte la maîtrise d’œuvre et signe les actes en son nom propre.",
      "Exiger une copie de son assurance RC Pro et de son assurance décennale avant de signer.",
      "Demander des exemples de projets comparables au vôtre : maison neuve, extension, rénovation, changement de destination, permis de construire.",
      "Faire préciser par écrit le périmètre exact de la mission : esquisse, avant-projet, dossier administratif, consultation des entreprises, suivi de chantier et réception."
    ],
    "facteursPrix": [
      "La nature et la complexité du projet : maison neuve, extension, rénovation lourde, patrimoine, ou bâtiment soumis à des contraintes techniques particulières.",
      "L’étendue de la mission : simple conception, dépôt du permis, ou mission complète avec consultation des entreprises et suivi de chantier.",
      "La surface et le montant des travaux, qui augmentent le temps d’étude, de coordination et de suivi.",
      "Le niveau de personnalisation et les contraintes réglementaires : urbanisme, sécurité incendie, accessibilité, performance énergétique, site protégé."
    ],
    "faq": [
      {
        "q": "Quand un particulier doit-il obligatoirement faire appel à un architecte ?",
        "a": "Lorsque la réglementation impose le recours à un architecte, notamment pour certains projets de construction ou d’extension dépassant le seuil légal de surface."
      },
      {
        "q": "Un architecte peut-il signer lui-même les permis et dossiers administratifs ?",
        "a": "Oui, dans le cadre de sa mission, il peut préparer et déposer les pièces nécessaires au permis de construire ou aux autorisations d’urbanisme."
      },
      {
        "q": "Quelle est la différence entre un architecte et un maître d’œuvre ?",
        "a": "L’architecte est une profession réglementée inscrite à l’Ordre, alors que le maître d’œuvre n’est pas nécessairement architecte et n’a pas le même cadre légal."
      },
      {
        "q": "Pourquoi demander l’HMONP ?",
        "a": "Parce qu’elle permet à l’architecte d’exercer la maîtrise d’œuvre en son nom propre et de porter certaines missions en autonomie."
      }
    ],
    "sources": [
      "https://www.onisep.fr/ressources/univers-metier/metiers/architecte",
      "https://architect-mc.fr/fiche-metier-architecte-tout-savoir-sur-ce-profession-en-2026/",
      "https://www.france-carrieres.fr/guides/devenir-architecte",
      "https://www.obat.fr/blog/metier-architecte/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "ascensoriste": {
    "intro": "L’ascensoriste installe, entretient, dépanne et modernise des ascenseurs, mais aussi des monte-charges, escaliers mécaniques et trottoirs roulants sur des bâtiments d’habitation, des immeubles de bureaux ou des établissements recevant du public. Les interventions les plus courantes sont la maintenance préventive, la remise en service après panne, le remplacement de pièces d’usure et la modernisation d’installations anciennes pour les rendre plus sûres ou plus accessibles. Un particulier fait appel à lui surtout pour une panne d’ascenseur dans une copropriété, un dysfonctionnement récurrent, un bruit anormal, un problème de porte ou une mise en conformité d’un équipement existant. Le métier s’exerce dans un cadre très réglementé, avec des règles de sécurité strictes et une habilitation électrique requise pour certains travaux.",
    "certifications": [
      "Habilitations électriques (travaux hors tension)",
      "Habilitations électriques (travaux sous tension)",
      "Bac professionnel MELEC",
      "Bac professionnel MSPC",
      "BTS Maintenance des systèmes, option ascenseurs et élévateurs",
      "Mention complémentaire Technicien ascensoriste (service et modernisation)"
    ],
    "choisir": [
      "Vérifiez que l’ascensoriste a l’expérience du type d’équipement concerné : ascenseur privatif, collectif, monte-charge, escalier mécanique ou trottoir roulant, car les pannes et réglages ne sont pas les mêmes.",
      "Demandez s’il intervient sur la marque et l’âge de votre installation, surtout pour une modernisation ou une réparation sur un matériel ancien, afin d’éviter un sous-dimensionnement des pièces ou des délais liés à l’approvisionnement.",
      "Exigez une habilitation électrique adaptée si l’intervention implique des opérations électriques, puisque cette compétence est explicitement requise pour le métier.",
      "Avant d’accepter un devis, demandez ce qui est inclus : déplacement, diagnostic, main-d’œuvre, pièces, remise en service, et délai d’intervention en cas de panne bloquante.",
      "Pour une copropriété, demandez une preuve de maintenance suivie et la traçabilité des interventions précédentes, car un historique incomplet complique le diagnostic des pannes récurrentes."
    ],
    "facteursPrix": [
      "Le type d’intervention : simple dépannage, entretien périodique, remplacement de pièces, ou modernisation complète n’ont pas le même coût.",
      "Le type d’équipement : un ascenseur, un monte-charge ou un escalier mécanique n’impliquent pas la même technicité ni les mêmes pièces.",
      "L’urgence et l’horaire d’intervention : une panne avec dépannage immédiat, de nuit, le week-end ou en astreinte augmente généralement le prix.",
      "L’accessibilité et l’état de l’installation : gaine difficile d’accès, matériel ancien, pièces rares ou diagnostic complexe font monter la facture."
    ],
    "faq": [
      {
        "q": "Un ascensoriste peut-il intervenir sur un ascenseur bloqué entre deux étages ?",
        "a": "Oui, c’est une intervention courante de dépannage, avec mise en sécurité puis remise en service si la panne est réparable sur place."
      },
      {
        "q": "L’ascensoriste fait-il aussi la maintenance préventive ?",
        "a": "Oui, il réalise l’entretien régulier, les réglages, les contrôles de sécurité et le remplacement des pièces d’usure."
      },
      {
        "q": "Faut-il une formation spécifique pour exercer ce métier en France ?",
        "a": "Oui, les parcours cités incluent notamment le bac pro, le BTS maintenance des systèmes, la mention complémentaire technicien ascensoriste et des habilitations électriques selon les tâches."
      },
      {
        "q": "Ce métier concerne-t-il seulement les ascenseurs d’immeuble ?",
        "a": "Non, il couvre aussi les monte-charges, escaliers mécaniques et trottoirs roulants."
      }
    ],
    "sources": [
      "https://www.onisep.fr/ressources/univers-metier/metiers/ascensoriste",
      "https://candidat.francetravail.fr/metierscope/fiche-metier/I1301/ascensoriste",
      "https://afim.asso.fr/media/1080/ascensoriste.pdf",
      "https://www.objectif-emploi-orientation.fr/decouverte-metiers/ascensoriste/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "assistance-informatique": {
    "intro": "L’assistance informatique en France consiste à diagnostiquer et résoudre des incidents sur un poste, un périphérique ou un accès réseau, puis à remettre l’utilisateur en état de travailler. Les interventions courantes sont l’installation d’un PC ou d’une imprimante, la configuration d’une messagerie, la suppression de virus, la récupération de fichiers et le dépannage d’une connexion Internet ou Wi‑Fi. Chez un particulier, on fait appel à ce métier pour un ordinateur qui ne démarre plus, une imprimante qui ne s’installe pas, une boîte mail bloquée ou un problème de partage de connexion. Dans le cadre des services à la personne, l’intervention peut aussi inclure l’initiation à l’usage de base de l’ordinateur et des logiciels courants.",
    "certifications": [
      "Titre professionnel Technicien d’Assistance en Informatique (TAI), enregistré au RNCP.",
      "Titre professionnel Technicien Supérieur Systèmes et Réseaux (TSSR), enregistré au RNCP, pour des interventions plus avancées en support et administration.",
      "CompTIA A+, certification internationale souvent citée pour le support de proximité et le dépannage micro-informatique.",
      "Cisco Certified Network Associate (CCNA), utile si l’activité couvre aussi le réseau et les équipements de connectivité."
    ],
    "choisir": [
      "Vérifier que le prestataire décrit clairement le périmètre exact : poste Windows ou Mac, imprimante, box, Wi‑Fi, sauvegarde, messagerie, récupération de données, et demander ce qui est exclu.",
      "Demander un diagnostic préalable chiffré ou un tarif de déplacement séparé, puis un devis avant toute intervention longue ou remplacement de matériel.",
      "Contrôler les preuves de compétence sur les outils que vous avez réellement : version de Windows ou macOS, modèle d’imprimante, type de box, sauvegarde cloud ou locale.",
      "Si l’intervention se fait à domicile, vérifier l’existence d’une responsabilité civile professionnelle et, si le service est vendu comme dépannage à domicile auprès d’un particulier, demander dans quel cadre juridique il est réalisé.",
      "Poser la question de la confidentialité des données : accès à la session utilisateur, manipulation de photos, documents, mots de passe, et modalités de sauvegarde avant toute réinitialisation."
    ],
    "facteursPrix": [
      "La nature de la panne : simple configuration logicielle, suppression de malware, ou diagnostic plus long avec réinstallation complète du système.",
      "Le lieu d’intervention : déplacement à domicile, intervention en atelier, ou téléassistance, avec des frais de déplacement parfois distincts.",
      "Le matériel et le logiciel concernés : PC fixe, portable, imprimante multifonction, box Internet, réseau Wi‑Fi, ou récupération de données sur disque endommagé.",
      "Le temps passé et le niveau d’urgence : intervention planifiée, soirée/week-end, ou dépannage rapide sous contrainte de remise en service immédiate."
    ],
    "faq": [
      {
        "q": "Un assistant informatique peut-il réinstaller Windows ou macOS chez un particulier ?",
        "a": "Oui, si la prestation comprend l’installation logicielle ; il effectue alors sauvegarde, réinstallation, réactivation et remise en place des comptes et logiciels usuels."
      },
      {
        "q": "Peut-il intervenir sur une imprimante qui n’imprime plus en Wi‑Fi ?",
        "a": "Oui, c’est une panne typique : appairage réseau, pilotes, adresse IP, file d’attente d’impression et configuration de la box ou du routeur."
      },
      {
        "q": "Faut-il un diplôme obligatoire pour exercer ?",
        "a": "Non, le métier peut être exercé sans diplôme spécifique exigé par tous les employeurs, mais des formations de type Bac à BTS ou des titres professionnels sont courants."
      },
      {
        "q": "L’assistance informatique à domicile inclut-elle la formation de l’utilisateur ?",
        "a": "Oui, dans le cadre des services à la personne, elle peut inclure l’initiation aux fonctions de base de l’ordinateur et de certains logiciels."
      }
    ],
    "sources": [
      "https://www.benjaminduplaa.com/blog/pourquoi-devenir-technicien-informatique-2026",
      "https://www.jobijoba.com/fr/emploi/Assistant+informatique",
      "https://informatique-et-libertes-formation.fr/titre-pro-technicien-assistance-informatique/",
      "https://www.fesp.fr/fiche-metier-assistant-assistante-informatique-et-internet/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "carreleur": {
    "intro": "Le carreleur pose des revêtements en carreaux sur les sols, les murs, les douches, les crédences et parfois les escaliers, après avoir préparé le support et réalisé les découpes nécessaires. En pratique, il intervient souvent sur des chantiers de rénovation de salle de bains, de cuisine, de terrasse ou de sol intérieur, avec des contraintes de planéité, d’étanchéité et de calepinage. Un particulier fait appel à lui quand il veut remplacer un ancien carrelage, carreler une douche à l’italienne, poser un grand format, ou traiter un support qui nécessite une mise à niveau avant pose. Le métier est classé comme activité artisanale réglementée, avec des conditions d’accès précises en France.",
    "certifications": [
      "CAP carreleur mosaïste",
      "BP carrelage mosaïque",
      "Titre professionnel carreleur",
      "Habilitation électrique (si le salarié intervient au contact des installations électriques ou dans leur voisinage)"
    ],
    "choisir": [
      "Vérifiez que le professionnel peut justifier d’une qualification reconnue pour exercer le métier en France, ou d’une expérience de 3 ans si l’entreprise est sans diplôme, car c’est une condition d’accès à l’activité artisanale.",
      "Demandez si le devis inclut la préparation du support, car la pose sur un support non plan, fissuré ou mal adhérent augmente fortement le risque de désordre et change le prix final.",
      "Posez des questions précises sur la méthode de pose adaptée à votre chantier : formats de carreaux, joints, sens de calepinage, gestion des pentes en douche ou sur terrasse, et type de colle utilisé.",
      "Exigez une preuve d’assurance responsabilité civile professionnelle et demandez comment sont traités les éventuels défauts d’exécution, surtout pour les pièces d’eau et les zones extérieures.",
      "Comparez plusieurs devis détaillés ligne par ligne, en vérifiant séparément la dépose de l’existant, les fournitures, les découpes spéciales, la finition des joints et les seuils ou profilés de finition."
    ],
    "facteursPrix": [
      "L’état du support à carreler : ragréage, reprise de planéité, dépose d’un ancien revêtement ou traitement d’un support humide font varier le coût.",
      "Le format et la complexité de pose : carreaux grand format, mosaïque, coupes nombreuses, motifs spécifiques ou pose en diagonale demandent plus de temps.",
      "La surface et la configuration du chantier : petite salle de bains, douche à l’italienne, terrasse, escaliers ou pièces avec nombreux angles augmentent la main-d’œuvre.",
      "Le choix des matériaux et des finitions : type de carrelage, joints, plinthes, profilés, pièces de finition et traitement d’étanchéité influencent le prix."
    ],
    "faq": [
      {
        "q": "Le carreleur peut-il intervenir sur une douche à l’italienne ?",
        "a": "Oui, s’il réalise aussi la préparation du support et le traitement d’étanchéité adaptés à une zone humide."
      },
      {
        "q": "Faut-il un diplôme pour exercer comme carreleur en France ?",
        "a": "Oui, en principe un CAP carreleur mosaïste, un BP carrelage mosaïque ou un titre professionnel carreleur ; à défaut, 3 ans d’expérience professionnelle peuvent être exigés pour s’installer."
      },
      {
        "q": "Un carreleur travaille-t-il uniquement à l’intérieur ?",
        "a": "Non, il intervient aussi en extérieur, par exemple sur des terrasses ou des balcons, avec des contraintes de pente, d’adhérence et de résistance aux intempéries."
      },
      {
        "q": "Pourquoi la préparation du support est-elle importante avant la pose ?",
        "a": "Parce qu’un support irrégulier ou mal préparé peut provoquer des carreaux décollés, des joints fissurés ou des défauts de planéité."
      }
    ],
    "sources": [
      "https://formation.atelierdeschefs.fr/formations/batiment/cap-carreleur-mosaiste/inscription-candidat-libre/",
      "https://www.inpi.fr/annuaire-activites-et-professions/carreleur",
      "https://angelino-carrelages.com/pose-et-technique/devenir-carreleur-formation-emploi/",
      "https://propulsebyca.fr/idees-business/carreleur"
    ],
    "retrievedAt": "2026-07-26"
  },
  "charpentier": {
    "intro": "Le charpentier conçoit, taille, assemble et pose des structures en bois, principalement les charpentes de toiture, mais aussi des ossatures bois, des planchers et des éléments de renfort ou de reprise de structure. En atelier puis sur chantier, il prépare les pièces, réalise les assemblages et monte l’ouvrage, y compris sur des bâtiments neufs, en rénovation ou en restauration du patrimoine bâti. Un particulier fait appel à lui pour une charpente à créer ou à remplacer, une extension en ossature bois, une reprise après sinistre, ou des travaux sur une toiture ancienne nécessitant des pièces de charpente réparées ou remplacées. Le métier relève des activités du bâtiment et s’exerce avec des qualifications spécifiques, notamment en charpente bois et construction bois.",
    "certifications": [
      "CAP Charpentier bois",
      "BP Charpentier bois",
      "Bac pro interventions sur le patrimoine bâti option B charpente",
      "Bac pro technicien constructeur bois",
      "Titre professionnel Charpentier bois",
      "Qualibat"
    ],
    "choisir": [
      "Vérifier que l’entreprise peut justifier d’une qualification réelle en charpente bois ou construction bois, avec un diplôme ou titre adapté au métier.",
      "Demander un devis qui distingue clairement la conception, la taille en atelier, le levage, la pose, la fourniture du bois et des connecteurs, ainsi que les éventuels traitements ou reprises de maçonnerie associés.",
      "Contrôler l’assurance responsabilité civile professionnelle et la garantie décennale, car les travaux de charpente touchent à la structure porteuse du bâtiment.",
      "Poser des questions sur l’essence de bois, la classe de service, le traitement éventuel, les assemblages prévus et la prise en compte des charges de toiture, surtout en rénovation.",
      "Pour un chantier en hauteur ou avec engins, vérifier que le charpentier ou son équipe possède les autorisations et formations de sécurité nécessaires, notamment si l’utilisation de nacelles, chariots ou engins de levage est prévue."
    ],
    "facteursPrix": [
      "La surface et la complexité de la charpente, notamment si la géométrie du toit comporte des pentes multiples, des lucarnes, des noues ou des reprises de charge.",
      "Le type d’intervention: création neuve, remplacement complet, réparation localisée, renforcement structural ou restauration de patrimoine ancien.",
      "Le coût des matériaux: essence de bois, bois massif ou lamellé-collé, connecteurs métalliques, traitement fongicide/insecticide et pièces sur mesure.",
      "Les contraintes de chantier: accès difficile, hauteur, besoin de levage, durée d’intervention, dépose de l’existant et coordination avec couvreur, maçon ou bureau d’études."
    ],
    "faq": [
      {
        "q": "Un charpentier intervient-il seulement sur les toitures ?",
        "a": "Non, il travaille aussi sur des ossatures bois, planchers, renforts structurels et certains ouvrages de rénovation ou de restauration."
      },
      {
        "q": "Faut-il un diplôme pour exercer comme charpentier en France ?",
        "a": "Oui, l’exercice est encadré et repose sur un diplôme, un titre reconnu ou une expérience professionnelle justifiable auprès de la CMA."
      },
      {
        "q": "Le charpentier peut-il travailler sur une maison ancienne ?",
        "a": "Oui, il peut réaliser des reprises, réparations et restaurations de charpentes anciennes en préservant la structure du bâtiment."
      },
      {
        "q": "Quel diplôme est le plus directement lié au métier ?",
        "a": "Le CAP Charpentier bois est le diplôme de base le plus directement associé aux activités de fabrication et de pose de charpentes traditionnelles en bois."
      }
    ],
    "sources": [
      "https://candidat.francetravail.fr/metierscope/fiche-metier/F1503/charpentier-charpentiere",
      "https://entreprendre.service-public.gouv.fr/vosdroits/F39044",
      "https://www.capeb.fr/www/capeb/media/national/guide-metiers-2025-a5-vf.pdf",
      "https://www.francecompetences.fr/recherche/rncp/466/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "chauffagiste": {
    "intro": "Un chauffagiste installe, entretient et dépanne des équipements de chauffage comme les chaudières gaz ou fioul, les pompes à chaleur, les radiateurs hydrauliques et les circuits d’eau chaude sanitaire. Il intervient aussi sur des pannes concrètes : absence de chauffe, radiateurs froids, pression anormale, fuite sur un circuit, mise en service ou remplacement d’un générateur. Un particulier fait généralement appel à lui pour une panne de chauffage, un entretien annuel, une rénovation de chaudière, l’installation d’une pompe à chaleur ou une amélioration du confort thermique. Si l’intervention touche au gaz, aux fluides frigorigènes ou à l’électricité de commande, le professionnel doit disposer des habilitations ou attestations adaptées au chantier concerné.",
    "certifications": [
      "RGE",
      "Qualibat",
      "QualiPAC",
      "Qualigaz",
      "attestation de capacité pour les fluides frigorigènes",
      "habilitation électrique"
    ],
    "choisir": [
      "Vérifier que l’entreprise a bien la qualification adaptée au type de travaux: gaz, pompe à chaleur, climatisation ou rénovation énergétique, car une mention RGE ou QualiPAC ne couvre pas automatiquement tous les équipements.",
      "Demander l’attestation ou la qualification liée au gaz si l’intervention concerne une chaudière gaz, un raccordement ou une mise en service gaz; le dossier ne doit pas être présenté comme “généraliste” sans preuve écrite.",
      "Pour une PAC ou une climatisation, exiger l’attestation de capacité pour les fluides frigorigènes avant toute manipulation du circuit frigorifique, car elle est obligatoire pour la charge, la récupération et la mise en service frigorifique.",
      "Vérifier les assurances professionnelles: responsabilité civile professionnelle et garantie décennale si les travaux relèvent du gros ouvrage ou de l’installation durable, surtout pour un remplacement complet de chaudière, de réseau ou de PAC.",
      "Avant d’accepter le devis, poser des questions précises sur ce qui est inclus: déplacement, désembouage, purge, mise en service, réglage de combustion, fourniture des pièces et délai d’intervention, car ce sont des postes qui modifient fortement le montant final."
    ],
    "facteursPrix": [
      "Le type d’équipement à traiter: dépannage d’une chaudière gaz, entretien annuel, remplacement d’une PAC ou intervention sur un circuit frigorifique n’impliquent pas le même niveau de technicité ni les mêmes consommables.",
      "L’accessibilité du chantier: chaudière en cave, unité extérieure en toiture, réseau encastré ou intervention en logement occupé augmentent souvent le temps de main-d’œuvre.",
      "Le besoin de qualifications spécifiques: gaz, fluides frigorigènes, électricité ou RGE peuvent influencer le coût de main-d’œuvre et le prix du déplacement si l’entreprise est spécialisée.",
      "Les pièces à remplacer et la marque de l’appareil: carte électronique, circulateur, vanne trois voies, thermostat ou capteur peuvent faire varier fortement le devis selon la disponibilité des pièces."
    ],
    "faq": [
      {
        "q": "Un chauffagiste peut-il intervenir sur une chaudière gaz sans qualification particulière ?",
        "a": "Non, dès que l’intervention touche au gaz, il faut une qualification ou habilitation adaptée à l’activité et au chantier, notamment pour la sécurité et la conformité."
      },
      {
        "q": "Le RGE est-il obligatoire pour qu’un chauffagiste exerce ?",
        "a": "Non, le RGE n’est pas obligatoire pour exercer, mais il est nécessaire pour que certains clients obtiennent des aides sur des travaux de rénovation énergétique éligibles."
      },
      {
        "q": "Faut-il une attestation spéciale pour manipuler le fluide d’une pompe à chaleur ?",
        "a": "Oui, l’attestation de capacité pour les fluides frigorigènes est obligatoire pour manipuler, charger ou récupérer un fluide frigorigène sur une PAC ou une climatisation."
      },
      {
        "q": "Quelles assurances demander à un chauffagiste ?",
        "a": "Au minimum, il faut demander une responsabilité civile professionnelle; pour certains travaux d’installation durable, la garantie décennale est aussi un point de contrôle important."
      }
    ],
    "sources": [
      "https://declarpro.fr/blog/certifications-obligatoires-chauffagiste-2026",
      "https://entreprendre.service-public.gouv.fr/vosdroits/F39033",
      "https://www.kelyseo.com/blog/obtenir-label-rge-chauffagiste-2026",
      "https://www.l-expert-comptable.com/a/7210-devenir-plombier-chauffagiste.html"
    ],
    "retrievedAt": "2026-07-26"
  },
  "climaticien": {
    "intro": "Un climaticien installe, met en service, règle et entretient des systèmes de climatisation, de conditionnement d’air et de ventilation dans des logements, commerces ou bâtiments tertiaires. Il contrôle aussi des paramètres techniques comme les débits d’air, l’humidité et le bon fonctionnement thermique des équipements. Un particulier fait appel à lui pour poser une climatisation, diagnostiquer une panne, effectuer l’entretien, ou intervenir sur une installation qui souffle mal, refroidit insuffisamment, fuit ou consomme anormalement.",
    "certifications": [
      "Attestation d'aptitude à la manipulation des fluides frigorigènes",
      "Attestation de capacité pour les entreprises manipulant des fluides frigorigènes",
      "RGE",
      "Qualibat",
      "QualiPAC"
    ],
    "choisir": [
      "Vérifier que l’entreprise dispose de l’attestation de capacité pour les fluides frigorigènes si elle intervient sur une climatisation ou une pompe à chaleur, et que le technicien lui-même a l’attestation d’aptitude quand la manipulation de fluide est prévue.",
      "Demander une assurance responsabilité civile décennale lorsque les travaux concernent une installation indissociable du bâtiment, par exemple une climatisation fixée dans le bâti ou une pompe à chaleur.",
      "Exiger un devis détaillant la puissance de l’équipement, les longueurs de liaisons frigorifiques, les percements, la reprise des condensats et la mise en service, car ces postes font varier fortement le coût et la qualité de l’installation.",
      "Vérifier que le climaticien précise les opérations incluses dans l’entretien: contrôle d’étanchéité, nettoyage des filtres, vérification des pressions, des condensats et du bon écoulement de l’eau.",
      "Poser la question de la qualification sur le type d’équipement exact: monosplit, multisplit, PAC air/air ou système de ventilation, car un climaticien ne couvre pas toujours tous les systèmes avec le même niveau de pratique."
    ],
    "facteursPrix": [
      "La puissance et le type d’appareil à installer ou dépanner, notamment monosplit, multisplit, pompe à chaleur air/air ou réseau de ventilation.",
      "La complexité du chantier: longueur des liaisons, accessibilité, nombre d’unités intérieures, perçages et reprise des condensats.",
      "Le niveau d’intervention: simple entretien, mise en service, recherche de fuite, recharge en fluide frigorigène ou remplacement complet d’un équipement.",
      "La zone géographique et les contraintes de chantier, comme un accès difficile, des horaires spécifiques ou une intervention en urgence."
    ],
    "faq": [
      {
        "q": "Un climaticien peut-il intervenir sur une pompe à chaleur air/air ?",
        "a": "Oui, s’il travaille sur des équipements de conditionnement d’air et possède les habilitations requises pour la manipulation des fluides frigorigènes."
      },
      {
        "q": "Faut-il une attestation spéciale pour manipuler le fluide frigorigène ?",
        "a": "Oui: le professionnel doit avoir une attestation d’aptitude, et l’entreprise une attestation de capacité pour pouvoir manipuler les fluides frigorigènes."
      },
      {
        "q": "La garantie décennale est-elle utile pour une climatisation ?",
        "a": "Oui lorsque l’installation est intégrée au bâtiment ou indissociable de l’ouvrage, car le climaticien a alors l’obligation de souscrire une assurance décennale."
      },
      {
        "q": "Un climaticien fait-il seulement de l’installation ?",
        "a": "Non: il réalise aussi la mise en service, la maintenance, le contrôle des débits d’air, la vérification de l’humidité et le dépannage."
      }
    ],
    "sources": [
      "https://www.cciformation49.fr/tout-savoir-sur-le-metier-de-climaticien/",
      "https://entreprendre.service-public.gouv.fr/vosdroits/F39053",
      "https://www.alfa-interim.fr/climaticien-climaticienne/",
      "https://www.hellowork.com/fr-fr/metiers/climaticien.html"
    ],
    "retrievedAt": "2026-07-26"
  },
  "coach-sportif": {
    "intro": "Un coach sportif en France encadre des séances d’activité physique adaptées à un objectif précis : remise en forme, perte de masse grasse, gain de force, reprise après arrêt, préparation d’une échéance sportive. Il corrige l’exécution des exercices, organise la progression des charges ou des intensités et adapte les séances à l’état de forme, aux contraintes articulaires et au niveau du pratiquant. Les interventions les plus courantes sont le coaching individuel, les séances en petit groupe, le suivi en salle de sport, à domicile ou en entreprise. Un particulier fait appel à lui quand il veut un cadre structuré, un programme personnalisé, un contrôle technique ou un accompagnement pour reprendre le sport sans improviser.",
    "certifications": [
      "BPJEPS Activités de la Forme",
      "CQP Instructeur Fitness",
      "DEJEPS",
      "Licence STAPS",
      "carte professionnelle d'éducateur sportif"
    ],
    "choisir": [
      "Vérifiez que le coach possède un diplôme reconnu pour encadrer contre rémunération et qu’il peut présenter une carte professionnelle d’éducateur sportif en cours de validité.",
      "Demandez quel type de publics il encadre réellement : débutants, reprise après blessure, musculation, perte de poids, préparation physique. Le contenu doit correspondre à votre objectif.",
      "Interrogez-le sur sa façon d’évaluer le point de départ : antécédents, mobilité, fréquence d’entraînement, niveau de douleur, et critères de progression. Un bon coach ne vend pas une séance standardisée.",
      "Demandez s’il dispose d’une assurance de responsabilité civile professionnelle couvrant l’encadrement sportif, surtout pour des séances à domicile, en extérieur ou en petit groupe.",
      "Exigez un cadre clair sur la prestation : durée des séances, fréquence, modalités d’annulation, lieu d’intervention et suivi entre les séances."
    ],
    "facteursPrix": [
      "Le niveau de qualification et l’expérience du coach influencent le tarif, notamment s’il intervient sur des publics spécifiques ou des objectifs techniques précis.",
      "Le format de la prestation fait varier le prix : séance individuelle, duo, petit groupe, coaching à domicile, en salle ou à distance.",
      "La localisation géographique joue sur les tarifs, avec des prix généralement plus élevés dans les grandes villes et les zones à forte demande.",
      "La durée et l’intensité du suivi changent le coût : séance ponctuelle, forfait mensuel, bilan initial, plan d’entraînement et corrections régulières."
    ],
    "faq": [
      {
        "q": "Un coach sportif peut-il exercer sans diplôme en France ?",
        "a": "Non, s’il est rémunéré pour encadrer une activité physique, il doit détenir une qualification reconnue et une carte professionnelle."
      },
      {
        "q": "Quelle est la qualification la plus courante pour devenir coach sportif ?",
        "a": "Le BPJEPS Activités de la Forme est l’un des diplômes les plus utilisés pour encadrer des séances de fitness, musculation et cours collectifs."
      },
      {
        "q": "Faut-il une carte professionnelle pour coach sportif ?",
        "a": "Oui, l’encadrement sportif rémunéré nécessite une carte professionnelle d’éducateur sportif délivrée après déclaration de l’activité."
      },
      {
        "q": "Un coach sportif fait-il des programmes personnalisés ?",
        "a": "Oui, son travail consiste généralement à adapter les exercices, la charge et la progression au niveau, aux objectifs et aux contraintes du client."
      }
    ],
    "sources": [
      "https://www.legalstart.fr/fiches-pratiques/devenir-travailleur-independant/devenir-coach-sportif/",
      "https://lecoledescoachs.fr/comment-devenir-coach-sportif-france-2026-guide-complet",
      "https://magazine-audace.fr/devenir-coach-sportif/",
      "https://fceblique.com/coaching/devenir-coach-sportif-parcours-certifications/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "coiffure-domicile": {
    "intro": "Le coiffeur à domicile se déplace chez le client pour réaliser des prestations de coiffure sans disposer d’un salon fixe ni d’un équipement lourd et permanent. Il intervient surtout pour les coupes, les brushings, les colorations, les mèches et les mises en forme, souvent directement au domicile du particulier. Un client fait appel à lui quand il veut éviter un déplacement, gagner du temps, ou recevoir une prestation dans un cadre plus pratique, notamment pour des personnes âgées, à mobilité réduite ou avec un emploi du temps contraint. En France, l’activité de coiffure à domicile est réglementée et suppose une qualification professionnelle ou une expérience reconnue.",
    "certifications": [],
    "choisir": [
      "Vérifier que le professionnel peut justifier d’un CAP Métiers de la coiffure ou d’une expérience professionnelle de 3 ans reconnue dans le métier, car c’est une condition d’exercice en France pour la coiffure à domicile.",
      "Demander si les tarifs incluent le déplacement, car le prix peut varier selon la distance, le temps de trajet et la zone desservie.",
      "Demander quels services sont réellement réalisables à domicile avec le matériel transporté, car le coiffeur à domicile exerce sans installation fixe lourde et certains services complexes peuvent nécessiter des conditions particulières.",
      "Vérifier que le professionnel est bien immatriculé et qu’il exerce dans un cadre déclaré, afin d’éviter un prestataire non déclaré.",
      "Demander si une assurance responsabilité civile professionnelle est souscrite, surtout pour les prestations techniques comme les colorations ou les permanentes, où un incident peut toucher les cheveux ou le logement du client."
    ],
    "facteursPrix": [
      "La prestation demandée : une coupe simple, une coloration, des mèches ou un brushing n’impliquent pas le même temps ni le même coût de produits.",
      "La longueur et l’épaisseur des cheveux : plus la chevelure est longue ou dense, plus la prestation prend du temps et consomme de produits.",
      "La distance de déplacement : le coût peut augmenter si le client est éloigné ou difficile d’accès.",
      "Le niveau de technicité : un travail de coloration, de correction de couleur ou de mise en forme technique est généralement plus cher qu’une coupe d’entretien."
    ],
    "faq": [
      {
        "q": "Un coiffeur à domicile peut-il exercer sans diplôme ?",
        "a": "Non, il doit justifier d’un diplôme de coiffure ou d’au moins 3 ans d’expérience professionnelle reconnue dans le métier."
      },
      {
        "q": "Quelles sont les prestations les plus courantes à domicile ?",
        "a": "Les plus courantes sont la coupe, le brushing, la coloration, les mèches et l’entretien courant des cheveux."
      },
      {
        "q": "Le prix est-il différent de celui d’un salon ?",
        "a": "Oui, il est souvent plus élevé à domicile car il inclut le déplacement, le temps de trajet et la personnalisation de la prestation."
      },
      {
        "q": "Un coiffeur à domicile doit-il avoir une assurance ?",
        "a": "Oui, une assurance responsabilité civile professionnelle est fortement pertinente pour couvrir les dommages liés à la prestation ou au déplacement."
      }
    ],
    "sources": [
      "https://entreprendre.service-public.gouv.fr/vosdroits/F36829",
      "https://www.inpi.fr/annuaire-activites-et-professions/coiffeur-domicile",
      "https://coiffure-actu.fr/coiffure-domicile-2026-statut-juridique-revenus/",
      "https://formation.atelierdeschefs.fr/formations/beaute-bien-etre/cap-metiers-de-la-coiffure/auto-entrepreneur/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "cours-musique": {
    "intro": "Un cours de musique consiste à enseigner concrètement un instrument, le chant, le solfège, la lecture de partition, le rythme et parfois l’improvisation, en cours individuels ou collectifs. En France, cette activité est généralement exercée en cours particuliers, en école de musique, en conservatoire, en association ou à domicile, selon le niveau de l’élève et le cadre d’emploi du professeur. Les particuliers font appel à un cours de musique pour débuter un instrument, reprendre après une pause, préparer une audition ou un examen, corriger une technique instrumentale ou vocale, ou structurer une pratique régulière.",
    "certifications": [
      "Diplôme d’État de professeur de musique (DE)",
      "Certificat d’aptitude aux fonctions de professeur de musique (CA)",
      "CAPES d’éducation musicale et de chant choral",
      "CAFEP d’éducation musicale et de chant choral"
    ],
    "choisir": [
      "Vérifier le cadre d’exercice exact : cours à domicile, en studio, en école associative, en conservatoire ou en visioconférence, car le contenu, le rythme et le prix ne sont pas les mêmes.",
      "Demander sur quel niveau le professeur travaille réellement : débutant, intermédiaire, préparation d’examen, concours, chant, instrument précis ou rééducation technique après arrêt.",
      "Faire préciser la méthode pédagogique : lecture, travail à l’oreille, solfège intégré, improvisation, préparation de morceaux, suivi des devoirs entre deux séances.",
      "Contrôler le statut professionnel et les éléments administratifs si le cours est déclaré à domicile : SIRET, facture, et, si c’est pertinent, déclaration au service à la personne ou fonctionnement sous CESU.",
      "Vérifier la couverture d’assurance du professeur, en particulier une responsabilité civile professionnelle si le cours se déroule chez l’élève ou si du matériel de valeur est utilisé."
    ],
    "facteursPrix": [
      "Le niveau d’expérience du professeur et sa spécialisation sur un instrument, le chant, le jazz, la préparation aux concours ou l’accompagnement d’élèves avancés.",
      "La durée et la fréquence des cours : séance isolée, forfait mensuel, cours hebdomadaire ou stages intensifs.",
      "Le lieu de la prestation : chez l’élève, chez le professeur, en école, ou à distance, car les déplacements et le temps de préparation peuvent être facturés.",
      "Le public visé et l’objectif : initiation, suivi régulier, préparation d’examen, accompagnement d’audition, ou coaching vocal/instrumental spécialisé."
    ],
    "faq": [
      {
        "q": "Un professeur de musique particulier doit-il avoir un diplôme obligatoire en France ?",
        "a": "Non pour les cours particuliers, car l’enseignement privé de la musique n’est pas réglementé; en revanche, certains diplômes sont exigés pour enseigner en conservatoire ou dans l’Éducation nationale."
      },
      {
        "q": "Quels diplômes sont réellement utilisés pour enseigner la musique dans le public ?",
        "a": "Le Diplôme d’État et le Certificat d’aptitude concernent l’enseignement artistique, tandis que le CAPES ou le CAFEP concernent l’enseignement de l’éducation musicale au collège ou au lycée."
      },
      {
        "q": "Faut-il une assurance pour donner des cours de musique à domicile ?",
        "a": "Ce n’est pas présenté comme une obligation légale générale pour le cours particulier, mais une responsabilité civile professionnelle est recommandée pour couvrir un dommage chez l’élève ou pendant la séance."
      },
      {
        "q": "Le prix d’un cours particulier de musique dépend-il surtout de l’instrument ?",
        "a": "Oui, mais aussi du niveau de l’élève, du déplacement, de la durée du cours et de la spécialisation du professeur; les cours particuliers sont souvent annoncés dans une fourchette de 25 à 60 € de l’heure."
      }
    ],
    "sources": [
      "https://www.onisep.fr/ressources/univers-metier/metiers/professeur-professeure-de-musique-ou-de-danse",
      "https://www.solfeo.fr/guides/donner-cours-de-musique",
      "https://www.solfeo.fr/guides/statut-professeur-musique-independant",
      "https://www.prof-galaxy.com/2026/02/21/comment-vivre-de-la-musique-en-2026-le-guide-complet-pour-professeurs-et-musiciens/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "cours-particuliers": {
    "intro": "Un cours particulier consiste à accompagner un élève de façon individualisée sur une matière précise, souvent à domicile ou en visioconférence. Les demandes les plus courantes concernent l’aide aux devoirs, la remise à niveau, la préparation d’un contrôle, du bac ou d’un concours, et l’approfondissement dans des matières comme les maths, le français ou les langues. Les familles y ont recours quand l’élève a des difficultés durables, un objectif d’examen à court terme, ou besoin d’un suivi plus personnalisé que celui proposé en classe. Les tarifs dépendent fortement du niveau scolaire, de la matière, de l’expérience du professeur et de la zone géographique.",
    "certifications": [],
    "choisir": [
      "Vérifier le niveau réel dans la matière concernée : un bon cours particulier en maths, en physique-chimie ou pour une préparation au bac doit s’appuyer sur des explications adaptées au programme exact de l’élève.",
      "Demander l’expérience avec le niveau visé : primaire, collège, lycée ou supérieur n’impliquent pas les mêmes méthodes ni les mêmes exigences de contenu.",
      "Contrôler le statut et le cadre administratif si la prestation est déclarée : cela permet de savoir qui facture, quelles heures sont couvertes, et si des justificatifs sont fournis.",
      "Exiger des informations précises sur la méthode de travail : diagnostic du niveau, objectifs par séance, exercices corrigés, suivi des progrès et support entre les séances si prévu.",
      "Vérifier les conditions de déplacement ou de cours en ligne : durée des séances, frais éventuels, matériel utilisé, et modalités d’annulation ou de report."
    ],
    "facteursPrix": [
      "Le niveau de l’élève : les cours de primaire sont généralement moins chers que ceux du lycée ou du supérieur.",
      "La matière : les matières techniques ou très demandées, comme les maths ou la physique-chimie, coûtent souvent plus cher.",
      "L’expérience et le diplôme du professeur : un étudiant, un professeur certifié ou un agrégé ne facturent généralement pas au même niveau.",
      "Le format et la localisation : un cours à domicile en Île-de-France ou une préparation spécifique peut coûter davantage qu’un cours en ligne ou dans une zone moins chère."
    ],
    "faq": [
      {
        "q": "Quel est le tarif horaire habituel d’un cours particulier en France ?",
        "a": "En pratique, les tarifs observés varient souvent d’environ 15 à 40 € de l’heure selon le niveau, avec des montants plus élevés dans le supérieur."
      },
      {
        "q": "Quelles matières sont les plus souvent demandées ?",
        "a": "Les demandes portent surtout sur les maths, le français, l’anglais, la physique-chimie et la préparation aux examens."
      },
      {
        "q": "Faut-il un diplôme obligatoire pour donner des cours particuliers ?",
        "a": "Aucun label spécifique n’est imposé pour exercer en cours particuliers, mais le diplôme, l’expérience et la maîtrise du programme sont des critères déterminants pour les familles."
      },
      {
        "q": "Le prix change-t-il selon le niveau scolaire ?",
        "a": "Oui : le primaire est généralement le moins cher, puis le collège, le lycée, et enfin le supérieur, où les tarifs sont les plus élevés."
      }
    ],
    "sources": [
      "https://fr.jooble.org/salary/donner-cours-particuliers",
      "https://cours-legendre.fr/tarif-cours-particuliers/",
      "https://lesmartsitting.fr/job-etudiant-paris-du-babysitting-paye-15e-h/",
      "https://www.swapn.fr/blog/devenir-prof-particulier"
    ],
    "retrievedAt": "2026-07-26"
  },
  "couture-retouches": {
    "intro": "Un couturier-retoucheur ajuste, reprend et transforme des vêtements déjà portés ou achetés, et peut aussi réaliser des pièces sur mesure, surtout en vêtement féminin selon le titre professionnel RNCP35228. Les interventions les plus courantes sont l’ourlet, la reprise de taille, l’ajustement des manches, la pose ou le remplacement de fermetures, et la transformation d’un vêtement pour améliorer l’aisance ou la coupe. Un particulier fait appel à lui quand un vêtement est trop long, trop large, mal ajusté après un achat, abîmé sur une fermeture ou quand une pièce doit être adaptée à une morphologie précise. Le métier s’exerce en atelier de retouche, dans le commerce de l’habillement, dans la location/entretien de vêtements ou en indépendant.",
    "certifications": [
      "CAP Métiers de la mode – vêtement flou",
      "CAP Couture tailleur",
      "Brevet professionnel vêtement sur mesure",
      "Brevet professionnel métiers de la mode et industries connexes",
      "Titre professionnel Couturier retoucheur (niveau 4, RNCP35228)",
      "Titre professionnel Couturier retoucheur réparateur (RNCP41914)"
    ],
    "choisir": [
      "Vérifier que l’atelier annonce clairement les types de retouches qu’il sait faire : ourlets simples, reprises de taille, transformations, doublures, fermetures, vêtements délicats ou pièces structurées.",
      "Demander si la personne a une formation reconnue dans la mode/couture, par exemple un CAP Métiers de la mode, un CAP Couture tailleur ou un titre professionnel de couturier-retoucheur.",
      "Faire préciser le délai de réalisation avant dépôt du vêtement, surtout pour un costume, une robe de cérémonie ou une retouche urgente.",
      "Demander comment seront gérés les essayages intermédiaires et si un second ajustement est inclus quand la transformation est importante.",
      "Faire confirmer le prix total avant travaux, car une retouche varie selon le temps de main-d’œuvre, la complexité du tissu et le nombre d’essayages nécessaires."
    ],
    "facteursPrix": [
      "La complexité de la retouche : un ourlet simple coûte en général moins qu’une reprise de veste, une transformation de robe ou une adaptation de manteau.",
      "Le type de tissu : un tissu fin, glissant, extensible, épais ou fragile demande plus de temps et de précaution qu’un coton standard.",
      "Le nombre d’interventions : une simple reprise n’a pas le même coût qu’une retouche qui combine raccourcissement, cintrage et changement de fermeture.",
      "Le temps de main-d’œuvre et les essayages : plus la pièce demande de mesures, d’ajustages et de reprises, plus le tarif augmente."
    ],
    "faq": [
      {
        "q": "Un couturier-retoucheur peut-il refaire complètement la coupe d’un vêtement ?",
        "a": "Oui, mais seulement si la matière et la structure du vêtement le permettent ; sur une pièce très technique, la transformation peut être limitée."
      },
      {
        "q": "Faut-il fournir le vêtement déjà porté pour une retouche ?",
        "a": "Oui, surtout pour les reprises de taille ou de longueur, car la retouche doit être faite sur la morphologie réelle et avec les chaussures ou sous-vêtements prévus si besoin."
      },
      {
        "q": "Une retouche de pantalon comprend-elle toujours l’ourlet ?",
        "a": "Non, l’ourlet est une opération distincte ; il peut être facturé séparément d’une reprise de taille ou d’un ajustement de jambe."
      },
      {
        "q": "Le métier peut-il s’exercer sans diplôme ?",
        "a": "Oui en pratique, mais les formations reconnues comme le CAP ou le titre professionnel restent les références les plus lisibles pour exercer et rassurer la clientèle."
      }
    ],
    "sources": [
      "https://www.francecompetences.fr/recherche/rncp/35228/",
      "https://candidat.francetravail.fr/metierscope/fiche-metier/D1207/retoucheur-retoucheuse-en-habillement",
      "https://candidat.francetravail.fr/offres/recherche/detail/209XZWX",
      "https://www.artesane.com/le-journal/arts-du-fil/comment-devenir-couturier-ou-couturiere/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "couvreur": {
    "intro": "Le couvreur réalise, entretient et répare les toitures des maisons, immeubles et bâtiments professionnels, en intervenant après la charpente pour assurer l’étanchéité de la couverture. Ses chantiers les plus courants sont la pose ou la reprise de tuiles, d’ardoises ou de matériaux métalliques, la réparation de fuites, le remplacement d’éléments abîmés et la réfection partielle ou totale d’une toiture. Un particulier fait appel à lui en cas d’infiltration d’eau, de tuiles cassées, de toiture vieillissante, de faîtage à reprendre, de noue ou d’abergement défectueux, ou encore pour un entretien de toiture après intempéries. En France, l’activité est artisanale réglementée et l’exercice nécessite une qualification professionnelle ou une expérience reconnue.",
    "certifications": [
      "CAP Couvreur",
      "BP Couvreur",
      "Bac pro interventions sur le patrimoine bâti (maçonnerie, charpente, couverture)",
      "BTS charpente couverture",
      "Brevet de maîtrise couvreur-zingueur",
      "Titre professionnel de couvreur-zingueur"
    ],
    "choisir": [
      "Vérifier que l’entreprise peut justifier d’une qualification reconnue dans le métier, par exemple CAP Couvreur, BP Couvreur ou titre professionnel de couvreur-zingueur.",
      "Demander une attestation d’assurance décennale couvrant bien les travaux de couverture et de zinguerie prévus, car une fuite liée à une mauvaise exécution peut engager cette garantie.",
      "Exiger un devis qui détaille la nature exacte des travaux: remplacement partiel ou réfection complète, type de tuiles ou ardoises, traitement des points singuliers, évacuation des gravats et échafaudage.",
      "Poser la question des raccords d’étanchéité: noues, rives, faîtage, solins, abergements de cheminée, fenêtres de toit et évacuations d’eau pluviale, car ce sont des points sensibles sur une toiture.",
      "Si des aides publiques sont recherchées, vérifier que l’entreprise dispose de la qualification RGE adaptée au type de travaux concerné, car tous les travaux de couverture n’ouvrent pas automatiquement droit aux aides."
    ],
    "facteursPrix": [
      "La surface à traiter et le niveau d’accès au toit, notamment la pente, la hauteur du bâtiment et la nécessité d’un échafaudage ou d’une protection spécifique.",
      "Le matériau de couverture à poser ou réparer: tuile, ardoise, zinc, bac acier, chaume ou éléments de zinguerie, car les temps de pose et les techniques ne sont pas les mêmes.",
      "L’étendue du chantier: simple réparation localisée, reprise de zinguerie, ou réfection partielle/totale de toiture avec dépose de l’ancien revêtement.",
      "L’état des supports et des points singuliers: voliges, écran sous-toiture, liteaux, solins, noues, faîtage et abergements, qui peuvent nécessiter des travaux complémentaires."
    ],
    "faq": [
      {
        "q": "Le couvreur intervient-il avant ou après le charpentier ?",
        "a": "Après le charpentier: il pose ou répare la couverture sur la structure porteuse déjà en place."
      },
      {
        "q": "Un couvreur peut-il réparer une fuite de toit sans refaire toute la toiture ?",
        "a": "Oui, s’il s’agit d’un problème localisé comme une tuile cassée, un solin défectueux, un faîtage abîmé ou une noue endommagée."
      },
      {
        "q": "Quelle qualification minimale est la plus pertinente pour un couvreur ?",
        "a": "Le CAP Couvreur est la qualification de base la plus directement liée au métier; le BP Couvreur et le titre professionnel de couvreur-zingueur correspondent à des niveaux de qualification plus avancés."
      },
      {
        "q": "Le label RGE est-il obligatoire pour tous les travaux de couverture ?",
        "a": "Non, il n’est pas obligatoire pour tous les chantiers; il est surtout pertinent lorsque les travaux sont associés à des dispositifs d’aides à la rénovation énergétique."
      }
    ],
    "sources": [
      "https://entreprendre.service-public.gouv.fr/vosdroits/F39034",
      "https://www.artisanfacture.fr/blog/certification-qualification-couvreur-guide",
      "https://www.intercariforef.org/formations/certification-111453.html",
      "https://www.francecompetences.fr/recherche/rncp/889/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "cuisiniste": {
    "intro": "Le cuisiniste conçoit, vend et fait poser des cuisines aménagées ou sur mesure, en prenant les mesures, en dessinant l’implantation, en choisissant les meubles, les plans de travail et certains équipements. Il intervient souvent pour un remplacement complet de cuisine, une rénovation avec adaptation aux contraintes existantes, ou l’intégration d’éléments techniques comme l’électroménager, l’éclairage et la plomberie de raccordement. Un particulier fait appel à lui quand il veut une cuisine adaptée à une pièce précise, avec optimisation des rangements, de la circulation et des raccordements. Le métier combine la conception, le conseil technique, la coordination de pose et le suivi du chantier.",
    "certifications": [],
    "choisir": [
      "Demandez un relevé précis des cotes sur site avant tout devis : une cuisine se décide sur les dimensions réelles, les angles, les écarts de niveau et l’emplacement des arrivées d’eau, des évacuations et des prises.",
      "Vérifiez qui fait la pose : le cuisiniste peut sous-traiter ou internaliser l’installation, et il faut savoir qui est responsable en cas de défaut d’alignement, de plan de travail mal découpé ou de meuble mal fixé.",
      "Exigez un devis détaillé séparant meubles, plan de travail, électroménager, crédence, main-d’œuvre, dépose de l’ancienne cuisine et reprises techniques, afin d’identifier ce qui est réellement inclus.",
      "Demandez les garanties et assurances adaptées aux travaux : assurance responsabilité civile professionnelle et, si des travaux relevant du bâtiment sont engagés, garantie décennale pour les dommages couverts par ce régime.",
      "Posez des questions sur les contraintes techniques avant signature : épaisseur et matière du plan de travail, compatibilité des appareils encastrables, ventilation, ouverture des portes, accès pour la livraison et délai réel de pose."
    ],
    "facteursPrix": [
      "Le niveau de sur-mesure : cuisine standard, semi-mesure ou fabrication entièrement adaptée aux dimensions et aux contraintes de la pièce.",
      "Les matériaux choisis pour les façades, caissons, plans de travail et finitions, qui font fortement varier le coût total.",
      "Le nombre d’éléments techniques à intégrer : électroménager encastrable, hotte, évier, robinetterie, éclairage et modifications de plomberie ou d’électricité.",
      "Le volume de main-d’œuvre : dépose de l’ancienne cuisine, préparation des murs et sols, livraison difficile, découpe sur place et pose complexe."
    ],
    "faq": [
      {
        "q": "Le cuisiniste fournit-il seulement les meubles ?",
        "a": "Non, il peut aussi concevoir l’implantation, fournir le plan de travail, gérer l’électroménager et organiser la pose."
      },
      {
        "q": "Faut-il refaire la plomberie ou l’électricité avant la pose ?",
        "a": "Pas toujours, mais le cuisiniste doit vérifier la compatibilité de l’existant avec le nouvel agencement avant de valider le projet."
      },
      {
        "q": "Quelle différence entre un cuisiniste et un poseur de cuisine ?",
        "a": "Le cuisiniste conçoit et vend la cuisine ; le poseur réalise l’installation sur place, parfois pour le compte du cuisiniste."
      },
      {
        "q": "Un cuisiniste doit-il avoir une assurance spécifique ?",
        "a": "Oui, il doit au minimum disposer d’une assurance responsabilité civile professionnelle, et d’une garantie décennale si les travaux relèvent du champ de cette garantie."
      }
    ],
    "sources": [
      "https://candidat.francetravail.fr/metierscope/fiche-metier/G1609/cuisinier-cuisiniere",
      "https://www.francecompetences.fr/recherche/rncp/1891/",
      "https://www.cned.fr/metiers/devenir-cuisinier-metier-formation-salaire",
      "https://www.moncompteformation.gouv.fr/espace-public/devenir-cuisinier-cuisiniere"
    ],
    "retrievedAt": "2026-07-26"
  },
  "debarras": {
    "intro": "Le débarras consiste à vider un logement, une cave, un grenier, un garage ou des locaux après tri des objets, enlèvement des encombrants et évacuation vers les filières adaptées. En pratique, les interventions les plus courantes sont les vide-maisons après succession, les départs en maison de retraite, les logements très encombrés, et les caves ou garages à désencombrer. Un particulier y fait appel quand il faut libérer rapidement un bien, préparer une vente ou une location, ou faire enlever des objets trop lourds ou trop volumineux pour être transportés seul. L’activité de débarras ne nécessite pas de diplôme officiel obligatoire en France, mais relève souvent de la collecte de déchets non dangereux ou d’activités de nettoyage selon la prestation réalisée.",
    "certifications": [
      "Aucune certification nationale spécifique au métier de débarras n’est obligatoire en France.",
      "CAP \"Agent des services de gestion et de valorisation des déchets\".",
      "CQP \"Trieur\".",
      "\"Agent technique de réception et de valorisation de déchets\" (titre/formation AFPA)."
    ],
    "choisir": [
      "Demander un devis sur visite et pas uniquement par téléphone, car le prix dépend du volume réel, de l’accessibilité et du tri à faire.",
      "Vérifier le SIRET/SIRENE de l’entreprise et demander une attestation d’assurance responsabilité civile professionnelle en cours de validité.",
      "Exiger que le devis précise la destination des objets et déchets : réemploi, recyclage, déchetterie, filières spécifiques pour meubles, DEEE ou gravats si présents.",
      "Poser la question de la valorisation : quels objets peuvent être revendus ou déduits du prix, et sur quelle base cela est calculé.",
      "Comparer les devis en vérifiant si le prix inclut le transport, la main-d’œuvre, le tri, le chargement, l’évacuation et le nettoyage léger après enlèvement."
    ],
    "facteursPrix": [
      "Le volume à enlever et le niveau d’encombrement du logement ou du local.",
      "L’accessibilité : étage sans ascenseur, distance de stationnement, escaliers étroits, accès cour ou cave.",
      "Le type d’objets à traiter : meubles démontés, électroménager, déchets diffus, gravats, objets dangereux ou insalubres.",
      "La valeur de revente des objets récupérables, qui peut faire baisser le coût final si la valorisation est réelle."
    ],
    "faq": [
      {
        "q": "Le débarras peut-il être gratuit ?",
        "a": "Oui, si la valeur des objets récupérables couvre tout ou partie du coût de l’intervention; sinon, la prestation reste payante."
      },
      {
        "q": "Faut-il une autorisation pour faire intervenir un débarras chez soi ?",
        "a": "Non pour un particulier; en revanche, le professionnel doit gérer l’évacuation des déchets selon les règles applicables."
      },
      {
        "q": "Un débarras enlève-t-il aussi les déchets dangereux ?",
        "a": "Pas systématiquement; cela doit être annoncé à l’avance, car certains déchets nécessitent des filières de traitement spécifiques."
      },
      {
        "q": "Que doit contenir un devis de débarras sérieux ?",
        "a": "Le volume estimé, ce qui est inclus, les éventuelles déductions liées à la valorisation, et les conditions d’évacuation ou de recyclage."
      }
    ],
    "sources": [
      "https://www.intercariforef.org/formations/certification-83180.html",
      "https://www.afpa.fr/formation-qualifiante/agent-technique-de-reception-et-de-valorisation-de-dechets",
      "https://www.mondebarrasseur.fr/etat-debarras-2026",
      "https://debarrasse-maison.com/guide-debarras-maison-2026/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "decorateur-interieur": {
    "intro": "Le décorateur intérieur conçoit l’ambiance, le style et l’aménagement d’un intérieur déjà existant, sans modifier la structure du bâtiment ni déposer des murs ou des cloisons. Il intervient le plus souvent sur le choix des couleurs, des matériaux, du mobilier, de l’éclairage, des textiles et de l’agencement des pièces. Un particulier fait appel à lui pour refaire un salon, harmoniser un logement avant une vente ou un achat, optimiser un petit espace, ou cadrer un projet de rénovation avec un budget précis. Le métier n’est pas réglementé en France et aucun diplôme d’État n’est obligatoire pour l’exercer.",
    "certifications": [],
    "choisir": [
      "Demander un exemple de dossier de conception déjà livré : planches d’ambiance, plans d’aménagement, liste d’achats et estimatif, afin de vérifier qu’il remet bien des éléments exploitables et pas seulement des idées.",
      "Vérifier s’il précise clairement son périmètre : simple conseil déco, shopping-list, plans 2D/3D, ou suivi de chantier. Cette distinction est importante car un décorateur intérieur n’a pas vocation à modifier la structure du bâti.",
      "Demander comment il travaille avec les artisans et qui coordonne quoi, car la coordination avec les corps de métier du bâtiment fait partie des compétences mobilisées sur ce type de projet.",
      "Vérifier qu’il possède une assurance responsabilité civile professionnelle adaptée à son activité et, s’il propose du suivi de travaux, lui demander les justificatifs d’assurance couvrant les prestations concernées.",
      "Comparer plusieurs devis en regardant le mode de facturation : forfait par pièce, tarif horaire ou pourcentage du montant des achats/travaux, et demander ce qui est inclus exactement pour éviter les prestations partiellement facturées."
    ],
    "facteursPrix": [
      "La surface et le nombre de pièces à traiter, car un studio, un appartement familial ou une maison n’impliquent pas le même volume d’étude.",
      "Le niveau de prestation demandé : simple conseil couleur, planche d’ambiance, plans techniques, modélisation 3D, ou suivi de sélection du mobilier et des achats.",
      "Le besoin de coordination avec des artisans ou de suivi de chantier, qui ajoute du temps de préparation, de contrôle et d’échanges.",
      "Le budget d’achats et le positionnement des produits choisis, car une sélection sur-mesure, du mobilier haut de gamme ou des finitions spécifiques augmente le temps de sourcing."
    ],
    "faq": [
      {
        "q": "Un décorateur intérieur peut-il modifier des murs ou des cloisons ?",
        "a": "Non, il intervient sur l’aménagement et l’esthétique d’un espace existant, sans modifier la structure du bâtiment."
      },
      {
        "q": "Faut-il un diplôme obligatoire pour exercer ce métier en France ?",
        "a": "Non, le métier n’est pas réglementé et aucun diplôme d’État n’est obligatoire, même si une formation en décoration, design ou agencement est fréquente."
      },
      {
        "q": "Quel est le niveau d’études le plus souvent associé au métier ?",
        "a": "Les sources métier citent le plus souvent un niveau bac+2 à bac+5 selon les écoles et les postes visés."
      },
      {
        "q": "Dans quels cas un particulier a intérêt à faire appel à un décorateur intérieur ?",
        "a": "Pour optimiser une pièce difficile à aménager, harmoniser un logement entier, choisir les matériaux et couleurs, ou préparer un bien à la vente avec une présentation cohérente."
      }
    ],
    "sources": [
      "https://www.edai.fr/comment-se-reconvertir-en-decorateur-d-interieur-guide-complet-2026",
      "https://www.onisep.fr/ressources/univers-metier/metiers/decorateur-decoratrice-d-interieur",
      "https://candidat.francetravail.fr/metierscope/fiche-metier/F1102/architecte-interieur",
      "https://www.hellowork.com/fr-fr/metiers/decorateur-d-interieur.html"
    ],
    "retrievedAt": "2026-07-26"
  },
  "demenagement": {
    "intro": "Le déménagement professionnel consiste à emballer, protéger, démonter si besoin, charger, transporter et livrer des meubles, cartons et objets vers un nouveau logement ou local. En France, il intervient surtout pour des changements de domicile, des déménagements vers l’outre-mer ou l’international, et parfois pour des transferts de bureaux ou de matériel professionnel. Un particulier y fait appel quand il veut sécuriser le transport, gagner du temps, ou confier des biens lourds, volumineux ou fragiles à une entreprise équipée. Avant de signer, il faut vérifier l’inscription de l’entreprise au registre des transporteurs, sa RC professionnelle, et le contenu précis du devis.",
    "certifications": [
      "NF Service déménagement",
      "Attestation de capacité professionnelle en transport routier léger de marchandises (si l’activité est exercée avec des véhicules jusqu’à 3,5 t)",
      "Attestation de capacité professionnelle en transport routier de marchandises de plus de 3,5 t (si l’activité l’exige)"
    ],
    "choisir": [
      "Vérifier que l’entreprise est bien inscrite au registre des transporteurs et qu’elle peut le justifier sur demande.",
      "Demander un devis détaillé avec la visite technique préalable si elle est proposée, puis comparer plusieurs offres.",
      "Contrôler l’existence d’une assurance responsabilité civile professionnelle valide et demander ce qu’elle couvre exactement en cas de casse ou de perte.",
      "Vérifier si le professionnel est certifié NF Service déménagement et, si oui, confirmer la validité de la certification dans l’annuaire officiel.",
      "Poser des questions précises sur les prestations incluses : emballage, démontage/remontage, protection des meubles, manutention d’objets lourds, stockage éventuel, et délais."
    ],
    "facteursPrix": [
      "Le volume à déménager, généralement calculé en m³, qui influence le temps de manutention et la taille du véhicule.",
      "La distance entre l’adresse de départ et l’adresse d’arrivée, qui pèse sur le temps de trajet et les coûts de transport.",
      "Le niveau de service choisi : simple transport, emballage, démontage/remontage, protection renforcée ou stockage.",
      "Les contraintes d’accès : étage sans ascenseur, escalier étroit, stationnement difficile, portage long ou nécessité d’un monte-meubles."
    ],
    "faq": [
      {
        "q": "Le déménageur doit-il fournir un devis écrit ?",
        "a": "Oui, le devis doit être écrit et détaillé avant la prestation, avec les éléments essentiels de l’intervention."
      },
      {
        "q": "La certification NF Service déménagement est-elle obligatoire ?",
        "a": "Non, elle n’est pas obligatoire, mais c’est une certification réelle et vérifiable utile pour comparer les entreprises."
      },
      {
        "q": "Quelles assurances faut-il vérifier avant de réserver ?",
        "a": "Il faut vérifier au minimum la responsabilité civile professionnelle de l’entreprise et les conditions d’indemnisation prévues au contrat."
      },
      {
        "q": "Une entreprise de déménagement peut-elle transporter des biens sans inscription particulière ?",
        "a": "Non, elle doit être régulièrement déclarée et inscrite au registre des transporteurs pour exercer le transport de biens pour des tiers."
      }
    ],
    "sources": [
      "https://transports-chuffart.com/entreprise-logistique/liste-demenageurs-agrees/",
      "https://candidat.francetravail.fr/metierscope/fiche-metier/N1102/demenageur-demenageuse",
      "https://bpifrance-creation.fr/activites-reglementees/demenageur",
      "https://propulsebyca.fr/idees-business/demenageur/reglementation-demenageur"
    ],
    "retrievedAt": "2026-07-26"
  },
  "depannage-electromenager": {
    "intro": "Le dépanneur électroménager diagnostique et répare les appareils « blancs » comme les lave-linge, lave-vaisselle, réfrigérateurs, fours, sèche-linge et plaques de cuisson, le plus souvent au domicile du client ou en atelier. Il réalise des mesures, des tests électriques et mécaniques, identifie la pièce en cause, puis remplace le composant défectueux ou remet l’appareil en état de fonctionnement. Un particulier fait appel à lui quand un appareil ne démarre plus, fuit, chauffe mal, fait disjoncter l’installation, affiche un code erreur ou présente un bruit anormal. Le métier concerne aussi la maintenance d’équipements dans des structures comme des hébergements, restaurants ou établissements de santé.",
    "certifications": [
      "Attestation d’aptitude à la manipulation des fluides frigorigènes",
      "Habilitation électrique (par exemple BR)",
      "Titre professionnel Technicien(ne) de maintenance en appareils électroménagers",
      "CQP Technicien SAV électroménager",
      "Bac pro Cybersécurité, informatique et réseaux, électronique",
      "BTS Électrotechnique"
    ],
    "choisir": [
      "Vérifier que le technicien sait intervenir sur la famille d’appareil concernée : froid, lavage, cuisson ou encastrable, car le diagnostic et les pièces ne sont pas les mêmes.",
      "Demander si le déplacement, le diagnostic et la main-d’œuvre sont facturés séparément, afin de comparer des devis sur une base identique.",
      "Vérifier qu’une intervention sur un appareil de froid implique bien une attestation d’aptitude aux fluides frigorigènes, si le technicien doit ouvrir le circuit frigorifique.",
      "Demander quelle garantie est appliquée sur la pièce remplacée et sur la réparation, et si elle couvre uniquement la pièce ou aussi la main-d’œuvre.",
      "Contrôler que l’entreprise dispose d’une assurance responsabilité civile professionnelle et qu’elle remet un devis avant intervention lorsque le montant est significatif."
    ],
    "facteursPrix": [
      "Le type d’appareil et la complexité de la panne : une résistance de four, un module électronique de lave-linge ou un compresseur de réfrigérateur n’impliquent pas le même coût.",
      "Le prix et la disponibilité des pièces détachées, notamment pour les cartes électroniques, pompes, moteurs ou joints spécifiques.",
      "Le déplacement et la zone géographique, surtout si l’intervention est à domicile ou en zone éloignée.",
      "Le temps de main-d’œuvre nécessaire, qui augmente quand le diagnostic demande plusieurs démontages ou des tests complémentaires."
    ],
    "faq": [
      {
        "q": "Le dépanneur électroménager répare-t-il sur place ou emporte-t-il l’appareil ?",
        "a": "Les deux existent : les pannes simples sont souvent réparées sur place, sinon l’appareil peut être pris en atelier si le diagnostic ou la réparation l’exige."
      },
      {
        "q": "Quels appareils sont les plus souvent concernés ?",
        "a": "Les interventions portent surtout sur le gros électroménager : lave-linge, lave-vaisselle, réfrigérateur, congélateur, four, sèche-linge et plaques de cuisson."
      },
      {
        "q": "Faut-il une qualification particulière pour intervenir sur un réfrigérateur ?",
        "a": "Oui, si l’intervention touche le circuit frigorifique, l’attestation d’aptitude à la manipulation des fluides frigorigènes est pertinente, et une habilitation électrique peut aussi être requise selon l’intervention."
      },
      {
        "q": "Quand faut-il remplacer l’appareil plutôt que le réparer ?",
        "a": "Quand la pièce défectueuse est introuvable, trop coûteuse par rapport à la valeur de l’appareil, ou que la carte électronique ou le compresseur rend la réparation non rentable."
      }
    ],
    "sources": [
      "https://candidat.francetravail.fr/metierscope/fiche-metier/I1402/technicien-technicienne-de-maintenance-en-appareils-electromenagers",
      "https://www.onisep.fr/ressources/univers-metier/metiers/depanneur-depanneuse-en-electromenager",
      "https://foxup.school/fr/metier/depanneur-en-electromenager",
      "https://www.touchepasamonartisan.fr/depanneur-electromenager-salaire-formation-metier"
    ],
    "retrievedAt": "2026-07-26"
  },
  "diagnostic-immobilier": {
    "intro": "Le diagnostiqueur immobilier réalise les contrôles techniques obligatoires avant une vente ou une location, puis rédige le Dossier de Diagnostic Technique (DDT) remis au futur acquéreur ou locataire. En pratique, il intervient surtout pour le DPE, l’amiante, le plomb, l’électricité, le gaz, l’ERP, les termites et, selon les cas, l’audit énergétique ou l’assainissement non collectif. Un particulier fait appel à lui avant de vendre un logement, de louer un bien, ou lorsqu’un bien ancien, énergivore ou situé dans une zone à risque impose des diagnostics précis. Certains diagnostics doivent aussi figurer dès l’annonce, notamment le DPE à la vente.",
    "certifications": [
      "Certification de diagnostiqueur immobilier délivrée par un organisme accrédité COFRAC, obligatoire pour exercer sur les domaines réglementés comme le DPE, l’amiante, le plomb, l’électricité, le gaz et les termites.",
      "Aucune certification de type RGE, Qualibat, Qualifelec, Qualigaz ou QualiPAC n’est présentée comme le standard obligatoire du métier de diagnostiqueur immobilier dans les sources fournies ; la référence réglementaire est la certification du diagnostiqueur par un organisme accrédité."
    ],
    "choisir": [
      "Vérifier que le professionnel possède une certification en cours de validité pour les diagnostics qu’il doit réaliser, car la certification est exigée pour exercer sur les domaines réglementés.",
      "Demander si l’entreprise dispose d’une assurance responsabilité civile professionnelle couvrant les erreurs de diagnostic, car une erreur ou une omission peut avoir des conséquences juridiques lors de la vente.",
      "Contrôler que le diagnostiqueur connaît exactement les règles applicables à votre bien : année de construction, présence d’amiante ou de plomb, type d’installation gaz/électricité, zone termites, ERP et éventuel audit énergétique.",
      "Comparer un devis détaillé en vérifiant quels diagnostics sont inclus et leurs durées de validité respectives, afin d’éviter de payer deux fois un diagnostic arrivé à expiration avant la signature.",
      "Lui demander à quel moment il peut remettre le rapport et s’il s’engage à fournir un DDT complet conforme au type de transaction, car l’absence d’un document obligatoire peut bloquer ou fragiliser la vente."
    ],
    "facteursPrix": [
      "Le nombre de diagnostics nécessaires varie selon l’âge du bien, sa localisation et son usage, ce qui fait fortement varier le prix total du dossier.",
      "La surface du logement et la complexité du bien influencent le temps de contrôle et donc le tarif, un DDT complet étant généralement plus cher sur une grande maison que sur un petit appartement.",
      "La présence d’installations ou de risques spécifiques (gaz, électricité ancienne, termites, amiante, plomb, assainissement non collectif, audit énergétique) ajoute des contrôles et peut augmenter le coût.",
      "Le prix dépend aussi de la combinaison vente/location et du niveau d’urgence demandé, un dossier complet étant souvent facturé plus cher qu’un diagnostic unique."
    ],
    "faq": [
      {
        "q": "Quels diagnostics sont le plus souvent demandés pour vendre un logement ?",
        "a": "Le plus souvent, il s’agit du DPE, de l’amiante, du plomb selon l’année de construction, de l’électricité, du gaz, de l’ERP, et parfois des termites ou de l’audit énergétique selon le bien."
      },
      {
        "q": "Qui paie les diagnostics immobiliers lors d’une vente ?",
        "a": "Ils sont à la charge du vendeur, qui doit constituer et remettre le DDT à l’acheteur."
      },
      {
        "q": "Le DPE est-il obligatoire avant de mettre un bien en vente ?",
        "a": "Oui, le DPE doit figurer dès l’annonce de vente et faire partie du dossier remis à l’acheteur."
      },
      {
        "q": "Que se passe-t-il si un diagnostic obligatoire manque ?",
        "a": "L’acheteur peut demander l’annulation de la vente, une réduction de prix ou des dommages et intérêts si les diagnostics obligatoires n’ont pas été fournis."
      }
    ],
    "sources": [
      "https://osez-viager.fr/diagnostics-obligatoires/",
      "https://www.srat.fr/diagnostics-immobiliers-obligatoires-vente-2026-liste/",
      "https://maisonimmo.com/diagnostics-immobiliers-2026/",
      "https://diagadom.com/blog/diagnostics-immobiliers-2026-toutes-les-obligations-a-connaitre/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "elagueur": {
    "intro": "L’élagueur intervient sur les arbres pour supprimer des branches dangereuses, mortes, mal orientées ou trop proches d’un bâtiment, d’une ligne ou d’une voie d’accès. Il réalise le plus souvent des tailles de réduction, des coupe de sécurisation et, selon le cas, de l’abattage quand l’arbre ne peut plus être conservé. Un particulier fait appel à lui après une tempête, quand des branches surplombent une toiture ou un voisinage, ou lorsque l’arbre devient trop haut, trop dense ou présente un risque de chute de branches. Le métier nécessite en pratique des compétences en grimpe, en travail en hauteur et en diagnostic visuel de l’état sanitaire de l’arbre.",
    "certifications": [
      "Certificat de Spécialisation (CS) Taille et Soin aux Arbres / Arboriste élagueur",
      "CAP agricole dans les métiers de l’agriculture, du paysage ou des travaux forestiers",
      "Bac professionnel Aménagements Paysagers",
      "CACES pour la conduite d’engins ou l’utilisation de nacelles élévatrices lorsque le chantier l’exige"
    ],
    "choisir": [
      "Demandez le CS Taille et Soin aux Arbres ou un diplôme équivalent dans le paysage, l’agriculture ou les travaux forestiers, car c’est la spécialisation la plus directement liée à l’élagage.",
      "Exigez une attestation d’assurance responsabilité civile professionnelle en cours de validité, avec la mention explicite des activités d’élagage et de travaux en hauteur.",
      "Vérifiez si l’entreprise précise la méthode d’intervention prévue : grimpe, nacelle, taille de réduction, démontage de branches, ou abattage, car le risque et le coût changent selon l’accès et la hauteur.",
      "Demandez un devis détaillé distinguant main-d’œuvre, évacuation des rémanents, broyage sur place, location de nacelle éventuelle et frais de déplacement.",
      "Posez une question simple sur la gestion des déchets verts : évacuation, broyage ou dépôt sur place, car cette prestation influence fortement le prix final et l’organisation du chantier."
    ],
    "facteursPrix": [
      "La hauteur de l’arbre et le volume de branches à traiter, qui augmentent le temps de grimpe, la logistique et le niveau de risque.",
      "L’accessibilité du site : jardin enclavé, présence d’obstacles, impossibilité de faire passer une nacelle, ou besoin de protéger une toiture, une clôture ou une terrasse.",
      "Le type d’intervention : simple taille d’entretien, réduction de couronne, démontage par sections, ou abattage complet si l’arbre est trop dangereux.",
      "L’évacuation des déchets verts et le broyage sur place, qui peuvent ajouter du temps, du matériel et un coût de transport."
    ],
    "faq": [
      {
        "q": "Un élagueur peut-il aussi abattre un arbre ?",
        "a": "Oui, mais l’abattage n’est pas toujours la première option : il est choisi quand l’arbre est trop dangereux, trop malade ou trop contraint par son environnement."
      },
      {
        "q": "Faut-il un diplôme spécifique pour exercer comme élagueur ?",
        "a": "En pratique, le métier s’appuie sur des diplômes du paysage, de l’agriculture ou des travaux forestiers, complétés idéalement par le CS Taille et Soin aux Arbres."
      },
      {
        "q": "Le prix dépend-il surtout de la taille de l’arbre ?",
        "a": "Oui, mais aussi de l’accès au chantier, de la méthode utilisée, du besoin de nacelle et de l’évacuation des déchets verts."
      },
      {
        "q": "Quand faut-il faire intervenir un élagueur après une tempête ?",
        "a": "Dès qu’une branche menace de tomber, qu’un tronc est fissuré ou qu’un arbre a basculé partiellement, afin de sécuriser la zone avant toute autre intervention."
      }
    ],
    "sources": [
      "https://www.obat.fr/blog/comment-devenir-elagueur/",
      "https://www.je-change-de-metier.com/fiche-metier-elagueur-grimpeur",
      "https://candidat.francetravail.fr/metierscope/fiche-metier/A1209/elagueur-elagueuse",
      "https://fr.indeed.com/conseils-carrieres/trouver-un-emploi/guide-formation-elagueur"
    ],
    "retrievedAt": "2026-07-26"
  },
  "electricien": {
    "intro": "Un électricien installe, met en service, dépanne et met en conformité des circuits et équipements électriques dans les logements, commerces et petits locaux tertiaires. Il intervient souvent sur un tableau électrique, des prises, un éclairage, une mise à la terre, un remplacement de disjoncteur ou la recherche d’une panne. Un particulier le sollicite généralement pour une rénovation électrique, l’ajout d’un circuit dédié (plaques, four, borne, VMC), une mise aux normes ou un problème de coupure répétée. En chantier, l’intervention doit se faire avec une habilitation électrique adaptée aux tâches réalisées, selon la norme NF C 18-510.",
    "certifications": [
      "Qualifelec",
      "Qualibat",
      "RGE"
    ],
    "choisir": [
      "Vérifiez que l’entreprise peut décrire précisément le type d’intervention : dépannage, rénovation complète, tableau électrique, mise à la terre ou mise en conformité, car le devis doit correspondre à une prestation technique claire.",
      "Demandez l’attestation d’assurance responsabilité civile professionnelle et, si des travaux touchent au bâti, la garantie décennale lorsque le chantier entre dans son champ d’application.",
      "Exigez un devis détaillé avec le nombre de points à reprendre, le matériel prévu, le coût de la main-d’œuvre, le déplacement et la durée estimée du chantier.",
      "Vérifiez que l’électricien sait travailler selon la norme NF C 15-100 pour les installations neuves ou rénovées en logement, et demandez comment il traite la protection différentielle, la mise à la terre et le repérage du tableau.",
      "Pour un dépannage, demandez s’il facture le diagnostic, le déplacement et le forfait de première heure séparément, afin d’éviter les écarts de prix au moment de la facture."
    ],
    "facteursPrix": [
      "Le type d’intervention : simple dépannage, remplacement d’appareillage, rénovation partielle ou reprise complète d’installation.",
      "L’accessibilité du chantier : tableau difficile d’accès, saignées à réaliser, faux plafond, combles, logement occupé ou non.",
      "Le niveau de matériel à fournir : tableau, disjoncteurs, différentiels, câbles, prises, luminaires, appareillage décoratif.",
      "Le temps passé au diagnostic et à la recherche de panne, qui peut fortement augmenter le coût d’une intervention urgente."
    ],
    "faq": [
      {
        "q": "Un électricien peut-il intervenir sans diplôme ?",
        "a": "Comme salarié, un diplôme n’est pas toujours obligatoire, mais une formation et une habilitation électrique sont nécessaires pour travailler sur les installations."
      },
      {
        "q": "Quelle norme encadre une installation électrique de logement en France ?",
        "a": "La référence de conception et de vérification la plus utilisée en logement est la NF C 15-100."
      },
      {
        "q": "Pourquoi demander une habilitation électrique ?",
        "a": "Parce qu’elle autorise formellement la personne à intervenir sur ou à proximité d’ouvrages électriques, avec un niveau adapté à la tâche."
      },
      {
        "q": "Quand faut-il refaire un tableau électrique ?",
        "a": "Quand il est ancien, sous-dimensionné, sans protections différentielles adaptées, ou si des disjonctions répétées montrent que l’installation n’est plus adaptée aux usages actuels."
      }
    ],
    "sources": [
      "https://www.france-carrieres.fr/guides/devenir-electricien",
      "https://www.gpi2d.greta.fr/fichesformation/cap-electricien/",
      "https://formation.atelierdeschefs.fr/formations/batiment/cap-electricien/inscription-candidat-libre/",
      "https://www.afpa.fr/formation-qualifiante/electricien-d-equipement-du-batiment"
    ],
    "retrievedAt": "2026-07-26"
  },
  "esthetique-domicile": {
    "intro": "Un esthétique à domicile se déplace chez le client pour réaliser des soins de beauté non médicaux, avec des prestations comme les soins du visage, l’épilation, la manucure/pédicure esthétique, le maquillage et certains soins du corps. Il intervient surtout quand le client veut éviter un déplacement en institut, manque de temps, ou a besoin d’un soin à domicile pour des raisons pratiques ou de confort. En France, l’activité est réglementée et l’exercice des soins esthétiques à la personne requiert une qualification professionnelle, généralement un CAP esthétique-cosmétique-parfumerie ou un diplôme équivalent, ou 3 ans d’expérience professionnelle dans l’UE/EEE. Le professionnel travaille souvent avec un matériel transportable et adapte la prestation à l’espace disponible chez le client.",
    "certifications": [
      "CAP Esthétique-Cosmétique-Parfumerie",
      "Bac professionnel Esthétique-Cosmétique-Parfumerie",
      "Brevet Professionnel Esthétique-Cosmétique-Parfumerie",
      "BTS Métiers de l’Esthétique-Cosmétique-Parfumerie"
    ],
    "choisir": [
      "Vérifier la qualification professionnelle: demander le diplôme d’esthétique (ou un titre équivalent) et s’assurer que la prestataire peut légalement réaliser les soins demandés, notamment l’épilation et les soins du visage/corps.",
      "Contrôler le statut déclaratif: demander un numéro SIRET et vérifier que l’activité est bien déclarée, car une activité à domicile doit être exercée dans un cadre professionnel déclaré.",
      "Poser des questions sur l’hygiène du matériel: désinfection des instruments, linge propre, consommables à usage unique pour les prestations qui le nécessitent, et gestion des déchets.",
      "Demander si la prestataire dispose d’une assurance responsabilité civile professionnelle couvrant les dommages corporels ou matériels pendant la prestation à domicile.",
      "Vérifier les contraintes pratiques: durée d’installation, besoin d’un point d’eau, d’une table, d’une prise électrique ou d’un espace suffisant pour certains soins, afin d’éviter une prestation inadaptée au domicile."
    ],
    "facteursPrix": [
      "Le type de prestation: une épilation simple, un soin du visage, une manucure ou un modelage esthétique n’impliquent pas le même temps ni le même niveau de technicité.",
      "La durée et la complexité du soin: les soins plus longs ou combinés coûtent davantage qu’une prestation courte.",
      "Le déplacement: la distance parcourue, la zone géographique et parfois les frais de route influencent le prix final.",
      "Le matériel et les consommables utilisés: produits spécifiques, matériel jetable, appareils transportés ou soins nécessitant davantage de préparation peuvent faire varier le tarif."
    ],
    "faq": [
      {
        "q": "Quels soins un esthétique à domicile réalise le plus souvent ?",
        "a": "Les prestations les plus courantes sont les soins du visage, l’épilation, la manucure/pédicure esthétique, le maquillage et certains soins du corps non médicaux."
      },
      {
        "q": "Faut-il un diplôme pour exercer à domicile ?",
        "a": "Oui, pour les soins esthétiques professionnels, il faut en principe un CAP esthétique-cosmétique-parfumerie, un diplôme équivalent, ou justifier de 3 ans d’expérience professionnelle dans l’UE/EEE."
      },
      {
        "q": "Une assurance est-elle utile pour une prestation à domicile ?",
        "a": "Oui, une responsabilité civile professionnelle est pertinente pour couvrir un dommage causé chez le client pendant la prestation."
      },
      {
        "q": "Le prix est-il le même qu’en institut ?",
        "a": "Non, il peut être différent car le tarif intègre souvent le déplacement, le temps d’installation et la zone géographique."
      }
    ],
    "sources": [
      "https://www.portail-autoentrepreneur.fr/academie/fiches-metiers/sante-bien-etre/estheticienne-a-domicile",
      "https://wisestart.fr/guides/juridique/estheticienne-a-domicile-statut/",
      "https://formation-sante-bienetre.fr/blog/formation-esthetique-domicile-client",
      "https://formation-sante-bienetre.fr/blog/exercer-esthetique-domicile-reglementation"
    ],
    "retrievedAt": "2026-07-26"
  },
  "facadier": {
    "intro": "Le façadier intervient sur l’enveloppe extérieure des bâtiments pour préparer les supports, appliquer des enduits ou revêtements, traiter les fissures et participer à l’imperméabilisation et à l’isolation thermique par l’extérieur. Il travaille souvent sur échafaudage et peut intervenir en rénovation comme sur des façades neuves, avec des opérations de finition extérieure, de reprise de surface et de pose d’ITE. Un particulier fait appel à lui quand la façade se fissure, se dégrade, présente des traces d’humidité, nécessite un ravalement, ou quand il veut refaire l’aspect extérieur et améliorer les performances thermiques du bâti.",
    "certifications": [
      "RGE (Reconnu Garant de l’Environnement) pour les travaux d’isolation thermique par l’extérieur éligibles aux aides publiques, lorsqu’ils sont réalisés dans le cadre et les conditions prévues par le dispositif.",
      "Qualibat, notamment les qualifications liées au ravalement, à l’enduit de façade et à l’isolation thermique par l’extérieur, selon la nature précise des travaux.",
      "TP Façadier-peintre (titre professionnel RNCP406).",
      "Certificat de spécialisation Façadier itéiste, créé en 2026 pour la filière ITE en rénovation.",
      "CQP Enduiseur façadier."
    ],
    "choisir": [
      "Vérifier que le devis précise le traitement prévu pour le support existant : nettoyage, réparation des fissures, reprise des joints, enduit, peinture ou ITE, car un simple ravalement ne couvre pas les mêmes travaux qu’une isolation par l’extérieur.",
      "Demander sur quel système le façadier travaille et si les produits sont compatibles avec le support du bâtiment, surtout en cas de façade ancienne, fissurée, humide ou déjà peinte.",
      "Contrôler l’assurance décennale de l’entreprise pour les travaux qui relèvent de la solidité de l’ouvrage ou de l’étanchéité de la façade, et l’assurance responsabilité civile professionnelle.",
      "Exiger les détails sur l’échafaudage, la protection des abords, la gestion des ouvertures et des menuiseries, car ce métier implique souvent des interventions en hauteur sur façade complète.",
      "Comparer plusieurs devis en vérifiant la surface réellement traitée, l’épaisseur d’enduit, les finitions prévues, la main-d’œuvre et les éventuels postes annexes comme la préparation du support ou la location d’échafaudage."
    ],
    "facteursPrix": [
      "L’état initial de la façade : fissures, décollements, humidité, ancien revêtement à déposer ou support à reprendre augmentent fortement le coût.",
      "La nature de la prestation : simple ravalement, enduit, peinture de façade ou isolation thermique par l’extérieur n’impliquent ni le même temps ni les mêmes matériaux.",
      "La surface et la complexité du chantier : hauteur du bâtiment, accès difficile, présence d’échafaudage, angles, balcons, ouvertures et découpes multiplient les heures de main-d’œuvre.",
      "Le niveau de finition et les matériaux choisis : type d’enduit, système d’ITE, finitions décoratives et protections complémentaires font varier le prix au m²."
    ],
    "faq": [
      {
        "q": "Le façadier fait-il seulement du ravalement de façade ?",
        "a": "Non, il peut aussi préparer les supports, réparer des fissures, appliquer des enduits, poser des revêtements extérieurs et intervenir sur l’isolation thermique par l’extérieur."
      },
      {
        "q": "Faut-il un échafaudage pour les travaux de façadier ?",
        "a": "Très souvent oui, car le façadier travaille fréquemment en hauteur sur des échafaudages fixes ou roulants."
      },
      {
        "q": "Quel diplôme est directement lié au métier de façadier ?",
        "a": "Le titre professionnel Façadier-peintre est un diplôme enregistré au RNCP, et le certificat de spécialisation Façadier itéiste a été créé en 2026 pour l’ITE en rénovation."
      },
      {
        "q": "Un façadier peut-il réaliser une isolation thermique par l’extérieur ?",
        "a": "Oui, si l’entreprise maîtrise le système posé et dispose des qualifications adaptées au chantier, car l’ITE fait partie des interventions courantes du métier."
      }
    ],
    "sources": [
      "https://www.afpa.fr/formation-qualifiante/facadier-peintre",
      "https://www.ffbatiment.fr/actualites-batiment/actualite-bam/certificat-specialisation-facadier-iteiste-reponse-besoins-entreprises",
      "https://www.onisep.fr/ressources/univers-metier/metiers/facadier-facadiere",
      "https://www.cidj.com/s-orienter/metiers/facadier-facadiere"
    ],
    "retrievedAt": "2026-07-26"
  },
  "garde-animaux": {
    "intro": "Le garde animaux en France consiste à prendre en charge un animal de compagnie en l’absence de son propriétaire, le plus souvent au domicile du client, au domicile du gardien ou lors de visites/promenades planifiées. Les interventions courantes sont l’alimentation, le renouvellement de l’eau, les sorties pour chiens, le nettoyage de litière, l’administration de soins simples déjà prescrits et la surveillance du comportement de l’animal. Un particulier y fait appel pendant les vacances, des absences professionnelles, une hospitalisation ou lorsque l’animal ne peut pas être laissé seul plusieurs heures. L’activité de garde d’animaux de compagnie contre rémunération relève du code APE 9609Z et nécessite l’ACACED pour exercer légalement avec chiens, chats et, selon les cas, autres espèces domestiques.",
    "certifications": [
      "ACACED (Attestation de Connaissances pour les Animaux de Compagnie d’Espèces Domestiques) — obligatoire pour garder des animaux de compagnie contre rémunération en France.",
      "Certificat de capacité pour la faune sauvage captive — uniquement si la garde concerne des animaux sauvages, l’ACACED ne suffit pas."
    ],
    "choisir": [
      "Vérifier que le garde animaux détient bien l’ACACED en cours de validité et qu’elle couvre les espèces réellement confiées, surtout si vous avez un chien, un chat ou des NAC.",
      "Demander précisément où l’animal sera gardé : chez vous, chez le professionnel ou en visites à domicile, car les obligations de présence, de transport et de sécurité ne sont pas les mêmes.",
      "Exiger une description écrite des gestes de routine prévus : horaires de sortie, quantité de nourriture, nettoyage de litière, administration d’un traitement déjà prescrit, contact en cas d’urgence.",
      "Contrôler l’assurance responsabilité civile professionnelle du prestataire et vérifier qu’elle couvre les dommages causés à l’animal, au logement ou à des tiers pendant la garde.",
      "Poser des questions sur la gestion des urgences : vétérinaire habituel, autorisation de soins, personne à contacter, et procédure si l’animal refuse de s’alimenter ou tombe malade."
    ],
    "facteursPrix": [
      "La durée de la prestation : visite courte, promenade d’une heure, garde à la journée ou garde de nuit n’ont pas le même tarif.",
      "Le type d’animal et ses besoins : un chat, un chien, ou un NAC ne demandent pas le même niveau de surveillance ni le même temps de prise en charge.",
      "La localisation : les tarifs sont généralement plus élevés dans les grandes villes, notamment en zone urbaine dense.",
      "Les contraintes supplémentaires : plusieurs passages par jour, administration de soins simples, promenades longues, ou garde pendant les jours fériés peuvent augmenter le prix."
    ],
    "faq": [
      {
        "q": "L’ACACED est-elle obligatoire pour garder un animal contre rémunération ?",
        "a": "Oui, pour les animaux de compagnie concernés par la réglementation, l’ACACED est requise pour exercer légalement contre rémunération."
      },
      {
        "q": "Un garde animaux peut-il donner un traitement à l’animal ?",
        "a": "Oui, s’il s’agit d’un soin simple explicitement demandé par le propriétaire et compatible avec les instructions données, mais il ne remplace pas un vétérinaire en cas d’urgence."
      },
      {
        "q": "Quelle différence entre visite à domicile et garde chez le pet-sitter ?",
        "a": "La visite à domicile consiste à passer chez le client pour nourrir, sortir ou vérifier l’animal, tandis que la garde chez le pet-sitter implique que l’animal séjourne chez le gardien."
      },
      {
        "q": "Faut-il une autorisation spéciale pour garder un animal sauvage ?",
        "a": "Oui, l’ACACED ne suffit pas ; il faut un certificat de capacité adapté à la faune sauvage captive."
      }
    ],
    "sources": [
      "https://creation.superindep.fr/guides-pratiques/metiers/garde-animaux-pet-sitter-auto-entreprise/",
      "https://www.tobalgo.com/blog/comment-devenir-pet-sitter",
      "https://www.jobijoba.com/fr/emploi/Garde+animaux",
      "https://www.leparisien.fr/etudiant/orientation/guide-metiers/metier-gardien-danimaux-pet-sitter/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "garde-enfants": {
    "intro": "La garde d’enfants à domicile consiste à surveiller un ou plusieurs enfants au domicile des parents, à assurer leur sécurité, et à prendre en charge les moments du quotidien comme les jeux, les repas, la toilette, la mise au lit ou les trajets école-domicile. Elle est sollicitée pour des gardes régulières après l’école, des sorties de crèche, des gardes ponctuelles en soirée, le mercredi, pendant les vacances ou en cas d’horaires de travail atypiques. Dans le cadre d’une garde à domicile salariée chez les parents, le métier est encadré par une convention collective avec un salaire minimum conventionnel à respecter en 2026.",
    "certifications": [
      "CAP Accompagnant éducatif petite enfance (CAP AEPE)",
      "Titre professionnel Assistant maternel / Garde d'enfants",
      "Titre professionnel Assistant de vie aux familles (ADVF)",
      "Premiers secours pédiatriques / PSC1"
    ],
    "choisir": [
      "Vérifier le mode d’emploi exact : garde à domicile chez les parents, garde partagée, ou assistante maternelle agréée, car les règles, les horaires et la rémunération ne sont pas les mêmes.",
      "Demander quelles tranches d’âge l’intervenant a déjà gardées, en particulier pour un nourrisson, un enfant de moins de 3 ans ou plusieurs fratries en même temps.",
      "Contrôler les références vérifiables et l’expérience sur des tâches concrètes : bain, repas, coucher, trajets école, gestion d’une urgence simple, aide aux devoirs.",
      "Vérifier la présence d’une assurance responsabilité civile professionnelle si la personne est indépendante ou d’une couverture équivalente via l’employeur si elle est salariée à domicile.",
      "Poser des questions précises sur les consignes de sécurité : allergie, autorisations de sortie, procédure en cas de fièvre, médicaments interdits ou autorisés, et contact d’urgence."
    ],
    "facteursPrix": [
      "Le nombre d’enfants gardés simultanément fait varier le prix, surtout en garde à domicile ou en baby-sitting.",
      "L’horaire influence fortement le tarif : soirée, nuit, week-end, jours fériés et vacances scolaires sont généralement plus chers.",
      "L’expérience et les qualifications du professionnel, notamment avec les tout-petits ou les enfants en situation particulière, augmentent souvent le coût.",
      "La zone géographique pèse sur le tarif, avec des prix plus élevés dans les grandes villes et en Île-de-France."
    ],
    "faq": [
      {
        "q": "Quelle différence entre garde d’enfants à domicile et assistante maternelle ?",
        "a": "La garde à domicile se fait chez les parents ; l’assistante maternelle accueille l’enfant à son propre domicile, avec un cadre d’agrément spécifique."
      },
      {
        "q": "Quel diplôme est le plus pertinent pour travailler en garde d’enfants ?",
        "a": "Le CAP AEPE est le diplôme de référence le plus courant pour la petite enfance ; le titre professionnel Assistant maternel / Garde d’enfants est aussi directement مرتبط au métier."
      },
      {
        "q": "Faut-il vérifier une assurance avant d’embaucher une garde d’enfants ?",
        "a": "Oui : il faut vérifier la responsabilité civile professionnelle si la personne travaille à son compte, ou la couverture du contrat si elle est salariée."
      },
      {
        "q": "Le salaire d’une garde d’enfants à domicile est-il encadré ?",
        "a": "Oui : en 2026, le salaire horaire minimum conventionnel des assistants parentaux est fixé à partir de 12,89 € brut pour le niveau A et 13,08 € brut pour le niveau B."
      }
    ],
    "sources": [
      "https://fr.trabajo.org/salaire-garde-enfant",
      "https://fr.trabajo.org/salaire-garde-d-enfants",
      "https://fiche-paie.fr/metier/garde-enfants-domicile",
      "https://wageindicator.org/fr-fr/travail-en-france/emplois-et-salaires/france-gardes-d2019enfants"
    ],
    "retrievedAt": "2026-07-26"
  },
  "livraison-de-courses": {
    "intro": "Un livreur de courses récupère des commandes dans un supermarché, un drive ou un entrepôt partenaire, puis les remet au domicile du client en respectant un créneau horaire précis. Il transporte souvent plusieurs sacs, parfois lourds, et peut devoir monter des étages, ce qui distingue ce métier de la simple livraison de repas. Il passe aussi du temps à vérifier la commande, gérer l’itinéraire, prévenir le client en cas de retard et effectuer la remise en main propre. Les particuliers font appel à lui pour des courses alimentaires à domicile, notamment quand ils ne peuvent pas se déplacer, manquent de temps ou ont besoin d’une livraison planifiée en soirée ou le samedi.",
    "certifications": [
      "Aucune certification métier spécifique et universelle n’existe pour la livraison de courses à domicile en France ; le métier est accessible sans diplôme particulier.",
      "Pour exercer en véhicule motorisé en transport léger de marchandises pour compte d’autrui, l’attestation de capacité professionnelle en transport léger est la référence réglementaire pertinente.",
      "Le permis AM est nécessaire pour conduire un cyclomoteur de 50 cm³ ou moins, et le permis B est requis pour conduire un véhicule léger utilisé dans l’activité de livraison."
    ],
    "choisir": [
      "Vérifiez le mode d’exercice : salarié, auto-entrepreneur ou sous-traitant, car cela change qui porte la responsabilité de l’assurance, du véhicule et des délais de livraison.",
      "Demandez si le livreur utilise un véhicule adapté aux courses alimentaires : coffre propre, capacité de charge suffisante, et possibilité de transporter des sacs multiples sans écrasement des produits.",
      "Contrôlez la ponctualité sur les créneaux annoncés, surtout en soirée et le samedi, qui sont les périodes les plus demandées et les plus sensibles aux retards.",
      "Si la prestation inclut des produits frais ou surgelés, demandez quelles précautions de conservation sont prévues pendant le trajet et au moment de la remise.",
      "Exigez une assurance adaptée au transport de marchandises pour compte d’autrui si le prestataire travaille en indépendant avec véhicule motorisé, et vérifiez qu’il est bien autorisé à exercer dans ce cadre."
    ],
    "facteursPrix": [
      "La distance entre le point de retrait et le domicile du client, qui augmente le temps de trajet et le coût carburant ou véhicule.",
      "Le volume et le poids des courses, car des sacs nombreux ou lourds demandent plus de manutention et peuvent rallonger la livraison.",
      "Le créneau horaire demandé, notamment le soir et le samedi, quand la demande est plus forte et les disponibilités plus tendues.",
      "Le mode de transport utilisé, qui modifie les charges d’exploitation : vélo, scooter, voiture ou véhicule utilitaire n’impliquent pas les mêmes coûts."
    ],
    "faq": [
      {
        "q": "Un livreur de courses doit-il avoir un diplôme ?",
        "a": "Non, le métier est accessible sans diplôme particulier."
      },
      {
        "q": "Faut-il un permis pour livrer des courses ?",
        "a": "Oui si la livraison se fait en véhicule motorisé : le permis AM couvre un cyclomoteur de 50 cm³ ou moins, et le permis B est requis pour un véhicule léger."
      },
      {
        "q": "Le livreur de courses transporte-t-il seulement des sacs alimentaires ?",
        "a": "Non, il transporte surtout des courses alimentaires, mais aussi parfois plusieurs sacs lourds et des produits frais ou fragiles qui exigent de la précaution."
      },
      {
        "q": "Quels créneaux sont les plus demandés ?",
        "a": "Les créneaux les plus demandés se situent entre 18 h et 21 h en semaine, ainsi que toute la journée du samedi."
      }
    ],
    "sources": [
      "https://adeaformation.fr/devenir-livreur-courses-domicile-etapes-choix-salaires/",
      "https://propulsebyca.fr/idees-business/coursier/livreur-courses",
      "https://candidat.francetravail.fr/metierscope/fiche-metier/N4104",
      "https://www.swapn.fr/blog/devenir-livreur"
    ],
    "retrievedAt": "2026-07-26"
  },
  "macon": {
    "intro": "Le maçon réalise les ouvrages de gros œuvre et de structure : fondations, murs porteurs, cloisons, planchers, seuils, appuis et parfois petits ouvrages en béton ou en pierre. Il intervient aussi en rénovation pour reprendre une maçonnerie fissurée, ouvrir une baie, monter un mur, couler une dalle ou réparer un soubassement. Un particulier fait appel à lui pour une extension, une ouverture dans un mur porteur, un ravalement de maçonnerie, une terrasse, un muret, une reprise de fondations ou une démolition partielle. En France, le métier s’exerce en général avec un CAP ou une expérience professionnelle de 3 ans, et il est encadré par des obligations d’assurance et de sécurité selon l’activité exercée.",
    "certifications": [
      "CAP Maçon",
      "BP Maçon",
      "Bac pro interventions sur le patrimoine bâti, option maçonnerie",
      "Titre professionnel Maçon",
      "Attestation de qualification professionnelle délivrée par la CMA si 3 ans d'expérience professionnelle sont justifiés",
      "AIPR si le chantier se déroule à proximité de réseaux aériens ou souterrains"
    ],
    "choisir": [
      "Vérifier que le maçon peut présenter une assurance responsabilité civile professionnelle et, si les travaux touchent à la structure, une assurance décennale en cours de validité.",
      "Demander un devis détaillé avec la nature exacte des travaux, les matériaux prévus, les quantités, les délais et ce qui est exclu, surtout pour une dalle, un mur porteur ou une ouverture.",
      "Contrôler que l’entreprise est bien immatriculée et que la personne qui signe le devis est celle qui réalise ou pilote réellement le chantier.",
      "Pour une ouverture dans un mur porteur, une reprise en sous-œuvre ou des fondations, demander quelles études ou validations techniques sont prévues avant le chantier.",
      "Si le chantier implique des fouilles, des réseaux ou des terrassements, demander si l’intervenant possède l’AIPR lorsque c’est requis."
    ],
    "facteursPrix": [
      "La nature de l’ouvrage : simple mur de clôture, dalle, escalier béton, ouverture dans un mur porteur ou reprise de fondations n’impliquent pas le même niveau de technicité.",
      "Les dimensions et la quantité de matériaux : surface de dalle, longueur de mur, volume de béton, nombre de blocs ou de briques.",
      "L’accès au chantier et les contraintes de site : terrain en pente, sous-sol, accès difficile, évacuation des gravats, travail en milieu occupé.",
      "Le niveau de préparation nécessaire : démolition préalable, terrassement, coffrage, ferraillage, étaiement, ou traitement d’un support fissuré avant reprise."
    ],
    "faq": [
      {
        "q": "Le maçon peut-il ouvrir un mur porteur ?",
        "a": "Oui, mais l’ouverture d’un mur porteur nécessite un diagnostic technique préalable et un étaiement adapté pendant les travaux."
      },
      {
        "q": "Quelle assurance faut-il demander à un maçon ?",
        "a": "Pour des travaux de structure, il faut vérifier la responsabilité civile professionnelle et l’assurance décennale couvrant les ouvrages concernés."
      },
      {
        "q": "Le maçon travaille-t-il seulement en construction neuve ?",
        "a": "Non, il intervient aussi en rénovation, réparation de fissures, reprise de maçonnerie, création d’ouvertures et petits ouvrages extérieurs."
      },
      {
        "q": "L’AIPR est-elle utile pour un maçon ?",
        "a": "Oui, si le chantier se déroule à proximité de réseaux aériens ou enterrés, l’AIPR est obligatoire pour les personnes concernées."
      }
    ],
    "sources": [
      "https://www.afpa.fr/formation-qualifiante/macon",
      "https://propulsebyca.fr/idees-business/travaux-maconnerie/reglementation-travaux-maconnerie",
      "https://formation.atelierdeschefs.fr/formations/batiment/cap-macon/adulte/",
      "https://entreprendre.service-public.gouv.fr/vosdroits/F39037"
    ],
    "retrievedAt": "2026-07-26"
  },
  "manutention": {
    "intro": "Un manutentionnaire réalise concrètement des opérations de chargement, déchargement, déplacement, tri et stockage de marchandises, produits ou objets, parfois à l’aide de matériel de manutention. Il intervient surtout en entrepôt, en zone de fret, en plateforme logistique, en usine ou en grande distribution, pour préparer des flux, alimenter une ligne ou mettre des palettes à disposition. Un particulier y fait appel surtout pour un déménagement, le déplacement d’objets lourds, le déchargement d’un camion ou la manipulation ponctuelle de mobilier et de matériel. Le métier peut se faire sans diplôme, mais certaines entreprises demandent des formations ou habilitations adaptées aux engins utilisés.",
    "certifications": [
      "CACES R489",
      "CACES R490",
      "CACES R485",
      "CQP logistique",
      "CAP logistique",
      "Bac pro logistique"
    ],
    "choisir": [
      "Vérifier si l’intervention porte sur de la manutention simple ou sur l’utilisation d’un engin ; si un chariot, une nacelle ou un gerbeur est prévu, demander l’habilitation correspondante avant la mission.",
      "Demander si le prestataire connaît la charge maximale, les accès, les escaliers, les contraintes de stationnement et la présence éventuelle d’objets fragiles ou volumineux, car ces points changent directement le temps et le risque d’intervention.",
      "Exiger une preuve d’assurance responsabilité civile professionnelle si la prestation se fait chez un particulier ou dans un local occupé, surtout en cas de casse, de chute ou de dommage au bâti.",
      "Faire préciser à l’avance ce qui est inclus : portage seul, déballage, mise en place, démontage/remontage simple, évacuation des déchets ou non, pour éviter les surcoûts liés à des tâches non prévues.",
      "Poser une question concrète sur l’équipe mobilisée : nombre de personnes, matériel apporté (diable, sangles, couvertures, transpalette), et durée estimée selon le volume réel à déplacer."
    ],
    "facteursPrix": [
      "Le volume et le poids des objets à manutentionner, car déplacer quelques cartons ne se facture pas comme porter des meubles lourds ou des palettes.",
      "L’accessibilité du site : étage sans ascenseur, couloir étroit, distance de portage, quai de déchargement absent ou stationnement difficile.",
      "Le recours à du matériel spécifique ou à des engins de manutention, qui augmente le coût par rapport à une manutention manuelle.",
      "L’horaire et l’urgence de l’intervention, avec des écarts de prix fréquents pour la nuit, le week-end ou une demande de dernière minute."
    ],
    "faq": [
      {
        "q": "Un manutentionnaire peut-il conduire un chariot élévateur ?",
        "a": "Oui, mais seulement s’il dispose de l’autorisation de conduite délivrée par l’employeur et de la formation adaptée, souvent liée au CACES correspondant."
      },
      {
        "q": "Faut-il un diplôme pour travailler en manutention ?",
        "a": "Non, le métier est accessible sans diplôme ; un CAP ou un titre en logistique peut toutefois aider à l’embauche."
      },
      {
        "q": "Quels sont les risques principaux de ce métier ?",
        "a": "Les principaux risques sont les TMS et les accidents liés au port de charges, aux chutes d’objets et aux mouvements répétitifs."
      },
      {
        "q": "Dans quels cas un particulier fait appel à un manutentionnaire ?",
        "a": "Pour porter des objets lourds, déplacer du mobilier, charger ou décharger un véhicule, ou aider lors d’un déménagement ou d’un réaménagement."
      }
    ],
    "sources": [
      "https://candidat.francetravail.fr/metierscope/fiche-metier/N1105/manutentionnaire",
      "https://www.jobijoba.com/fr/emploi/Manutentionnaire",
      "https://www.fmppresanse.fr/fiches-metier/fiche-detaillee/229",
      "https://supply-chain.net/decouvrez-le-metier-de-manutentionnaire-definition-mission-et-salaire/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "menage": {
    "intro": "Un ménage en France intervient pour l’entretien courant des logements: dépoussiérage, aspiration, lavage des sols, nettoyage des sanitaires, de la cuisine et parfois du linge ou des vitres selon le contrat. Il peut travailler chez un particulier en emploi direct, via un prestataire, ou en intervention ponctuelle après un déménagement, une remise en état ou un grand nettoyage. Les particuliers font appel à lui quand ils manquent de temps, après une absence prolongée, avant un état des lieux, ou pour maintenir un logement propre de façon régulière. Le terme recouvre souvent un poste d’agent d’entretien à domicile plutôt qu’un métier réglementé avec diplôme obligatoire.",
    "certifications": [],
    "choisir": [
      "Vérifier le statut exact: emploi direct, auto-entrepreneur ou société de services, car cela change la facturation, la responsabilité et les obligations déclaratives.",
      "Demander ce que comprend précisément la prestation: sols, sanitaires, cuisine, vitres, repassage, lavage des plinthes, rangement léger, pour éviter les malentendus.",
      "Contrôler l’assurance responsabilité civile professionnelle si la personne intervient comme indépendante ou via une entreprise, surtout pour les dégâts matériels ou la casse.",
      "Exiger une tarification claire: à l’heure, au forfait, majoration pour déplacement, produits fournis ou non, et conditions en cas d’annulation ou de retard.",
      "Poser des questions sur l’expérience des tâches spécifiques: entretien de logements occupés par enfants, animaux, surfaces fragiles, ou nettoyage après travaux, car toutes les prestations de ménage ne se valent pas."
    ],
    "facteursPrix": [
      "La surface et le niveau d’encrassement du logement: un studio entretenu régulièrement ne demande pas le même temps qu’une maison très sale ou après travaux.",
      "La fréquence d’intervention: une prestation hebdomadaire coûte souvent moins cher à l’heure qu’un gros nettoyage ponctuel.",
      "Le type de tâches demandées: ménage courant, repassage, vitres, remise en état, nettoyage de four, frigo ou après déménagement.",
      "Le mode d’intervention: emploi direct, indépendante ou entreprise, avec des écarts liés aux charges, aux frais de déplacement et aux garanties incluses."
    ],
    "faq": [
      {
        "q": "Le ménage doit-il apporter ses produits et son matériel ?",
        "a": "Ce n’est pas automatique: cela dépend du contrat. Il faut le préciser avant la première intervention."
      },
      {
        "q": "Un ménage peut-il faire du repassage en plus du nettoyage ?",
        "a": "Oui, mais seulement si c’est convenu à l’avance, car le repassage modifie le temps de prestation et donc le prix."
      },
      {
        "q": "Faut-il une qualification obligatoire pour faire du ménage à domicile ?",
        "a": "Non, il n’existe pas de diplôme obligatoire spécifique pour l’entretien courant chez un particulier."
      },
      {
        "q": "Comment savoir si le tarif est cohérent ?",
        "a": "Il faut comparer le périmètre exact: fréquence, surface, tâches incluses, fourniture des produits, déplacement et assurance."
      }
    ],
    "sources": [
      "https://institut-icfp.org/salaire-femme-menage-2026/",
      "https://lebonsalaire.com/femme-de-menage-salaire/",
      "https://www.mondevisfacile.fr/blog/salaire-femme-de-menage-combien-gagner-selon-votre-activite",
      "https://fr.jooble.org/salary/m%C3%A9nage"
    ],
    "retrievedAt": "2026-07-26"
  },
  "menuisier": {
    "intro": "Le menuisier conçoit, fabrique et pose des ouvrages en bois et, selon les chantiers, en aluminium ou en matériaux de synthèse : fenêtres, portes, volets, parquets, escaliers, placards ou agencements sur mesure. En pratique, il prend des cotes, trace, débite, usinage, assemble et ajuste les pièces avant installation sur site. Un particulier fait appel à lui pour remplacer une fenêtre ou une porte, créer un dressing, poser un parquet, réparer un élément de mobilier fixe ou réaliser un aménagement intérieur sur mesure. Le métier couvre à la fois la fabrication en atelier et la pose sur chantier, avec une forte part d’ajustement au cas par cas.",
    "certifications": [
      "CAP Menuisier fabricant",
      "CAP Menuisier installateur",
      "Brevet professionnel (BP) Menuisier",
      "Titre professionnel Menuisier installateur (RNCP)",
      "Qualification RGE uniquement si l'entreprise réalise des travaux éligibles à l'amélioration énergétique et souhaite faire bénéficier le client d'aides associées"
    ],
    "choisir": [
      "Vérifiez si le menuisier fait bien la pose lui-même ou s’il sous-traite, car la qualité finale dépend souvent des relevés de cotes, de la prise de niveaux et des réglages sur chantier.",
      "Demandez un devis détaillé distinguant la fabrication, la dépose, la pose, les finitions et les fournitures, afin d’identifier ce qui est réellement inclus.",
      "Contrôlez l’assurance responsabilité civile professionnelle et, pour des travaux sur l’existant touchant au bâti, la garantie décennale si l’ouvrage entre dans son champ d’application.",
      "Exigez des précisions sur les essences, les essences de bois, les ferrures, les quincailleries, les finitions et la résistance à l’humidité ou aux UV selon l’emplacement.",
      "Demandez à voir des références comparables à votre besoin : une cuisine, une baie vitrée, un escalier ou un dressing n’impliquent pas les mêmes contraintes techniques ni les mêmes tolérances de pose."
    ],
    "facteursPrix": [
      "Le type d’ouvrage : un escalier, une baie vitrée, un dressing sur mesure ou une porte intérieure n’impliquent ni le même temps de fabrication ni la même difficulté de pose.",
      "Les matériaux et composants choisis : bois massif, contreplaqué, MDF, aluminium, vitrages, quincaillerie et finitions font varier fortement le coût.",
      "Les contraintes de chantier : accès difficile, murs non d’équerre, reprise de support, dépose d’un ancien ouvrage ou travail en rénovation augmentent le temps passé.",
      "Le niveau de sur-mesure : plus l’ouvrage est adapté à une cote spécifique ou à un design complexe, plus la part de conception, d’usinage et de réglage est élevée."
    ],
    "faq": [
      {
        "q": "Un menuisier pose-t-il uniquement du bois ?",
        "a": "Non. Le menuisier travaille le bois mais aussi, selon les ouvrages, l’aluminium et des matériaux de synthèse pour fabriquer et poser fenêtres, portes ou agencements."
      },
      {
        "q": "Faut-il un diplôme pour exercer comme menuisier en France ?",
        "a": "Oui, l’exercice du métier est lié à un CAP, un BP ou à un diplôme ou titre de niveau égal ou supérieur enregistré au RNCP attestant une qualification en menuiserie."
      },
      {
        "q": "Quelle est la différence entre menuisier fabricant et menuisier installateur ?",
        "a": "Le menuisier fabricant travaille surtout en atelier sur la fabrication des pièces, tandis que le menuisier installateur intervient davantage sur la pose et l’ajustement sur chantier."
      },
      {
        "q": "Quand demander une assurance décennale à un menuisier ?",
        "a": "Lorsqu’il intervient sur des travaux relevant de la garantie décennale, par exemple sur des éléments pouvant compromettre la solidité de l’ouvrage ou le rendre impropre à sa destination."
      }
    ],
    "sources": [
      "https://makeici.org/comment-se-reconvertir-dans-la-menuiserie-en-2026/",
      "https://formation.atelierdeschefs.fr/nos-conseils/batiment/adulte-menuisierie/",
      "https://formation.atelierdeschefs.fr/nos-conseils/batiment/menuiserie-diplomes/",
      "https://bpmenuisier.fr/blog/epreuves-bp-menuisier-guide-complet"
    ],
    "retrievedAt": "2026-07-26"
  },
  "montage-meubles": {
    "intro": "Le monteur de meubles assemble des éléments de mobilier à partir d’un plan de montage, puis ajuste et fixe les pièces pour obtenir un meuble utilisable et stable. Dans un cadre professionnel, il peut aussi poser des éléments d’agencement, contrôler l’alignement, la quincaillerie et le respect des consignes de sécurité et de qualité. Un particulier fait surtout appel à lui pour des meubles en kit, des meubles volumineux, des aménagements sur mesure, ou quand le montage nécessite outillage, précision ou manutention. Dans certains contextes, le métier inclut aussi l’installation en agencement et peut exiger une formation technique de base, sans diplôme spécifique systématique.",
    "certifications": [],
    "choisir": [
      "Vérifier qu’il sait monter le type de meuble concerné: cuisine, dressing, meuble en kit, meuble suspendu, lit escamotable ou mobilier d’agencement n’impliquent pas les mêmes gestes ni les mêmes contraintes de fixation.",
      "Demander s’il apporte ses propres outils et vérifier qu’il dispose des outils adaptés au montage précis: visseuse réglée, embouts, niveau, serre-joints, détection de réseaux si perçage mural.",
      "Faire préciser si la prestation inclut uniquement l’assemblage ou aussi la fixation murale, les réglages de portes et tiroirs, la découpe d’ajustement et l’évacuation des emballages.",
      "Contrôler qu’il peut expliquer les limites de la pose en sécurité, notamment pour un meuble lourd ou suspendu: nature du mur, type de chevilles, charge admissible et besoin éventuel d’une fixation renforcée.",
      "Demander la preuve d’une assurance responsabilité civile professionnelle si la prestation comprend des dommages possibles chez le client, et vérifier si une garantie sur le montage est proposée par écrit."
    ],
    "facteursPrix": [
      "Le volume de montage: un petit meuble simple prend beaucoup moins de temps qu’un ensemble complet de dressing, cuisine ou bibliothèque.",
      "La complexité du mobilier: nombre de pièces, présence de portes, coulissants, charnières à réglage fin, éclairage intégré ou éléments sur mesure.",
      "La manutention et l’installation: accès difficile, étage sans ascenseur, meuble lourd, besoin d’être porté à deux, ou fixation murale.",
      "Les travaux annexes: perçage, découpe d’ajustement, pose de quincaillerie supplémentaire, reprise d’un montage partiellement déjà commencé."
    ],
    "faq": [
      {
        "q": "Un monteur de meubles doit-il avoir un diplôme spécifique ?",
        "a": "Non, il n’existe pas de diplôme unique obligatoire pour ce métier; des bases en menuiserie, agencement ou ébénisterie sont simplement un atout selon les postes."
      },
      {
        "q": "Le montage de meubles comprend-il toujours la fixation au mur ?",
        "a": "Non, la fixation murale dépend de la prestation: elle doit être annoncée clairement, car elle suppose de vérifier le support, les chevilles et la charge admissible."
      },
      {
        "q": "Faut-il prévoir un mur particulier pour un meuble suspendu ?",
        "a": "Oui, le support doit être adapté au poids du meuble et de son contenu; un mur creux, friable ou mal repéré peut nécessiter une fixation spécifique."
      },
      {
        "q": "Quelle est la différence entre montage de meubles et agencement ?",
        "a": "Le montage de meubles concerne surtout l’assemblage du mobilier, tandis que l’agencement inclut plus souvent l’installation sur site, les ajustements et parfois des adaptations au lieu."
      }
    ],
    "sources": [
      "https://www.orientation-pour-tous.fr/metier/monteurse-assembleurse-de-meubles,10956.html",
      "https://candidat.francetravail.fr/metierscope/fiche-metier/F1625/monteur-monteuse-en-agencement",
      "https://candidat.francetravail.fr/offres/recherche/detail/196WSTV",
      "https://francecarriere.fr/metier/monteur-monteuse-de-meubles"
    ],
    "retrievedAt": "2026-07-26"
  },
  "multiservice": {
    "intro": "En France, un multiservice désigne le plus souvent un intervenant de petits travaux à domicile qui réalise des prestations ponctuelles de bricolage léger, de montage, d’entretien courant ou de remise en état simple chez des particuliers. Les interventions les plus courantes sont, selon les cas, le montage de meubles, la fixation d’éléments muraux, de petites réparations, des travaux de peinture légère, du jardinage simple ou de l’entretien courant du logement. Un particulier fait appel à ce type de professionnel lorsqu’il a une liste de petites tâches à exécuter sans engager un artisan spécialisé pour chaque intervention. Cette activité est souvent exercée sous le régime micro-entrepreneur, avec des activités qui doivent rester compatibles avec les règles applicables aux services à la personne et aux activités réglementées.",
    "certifications": [
      "Aucune certification nationale spécifique et universelle n’est propre au métier de multiservice en tant que tel ; les qualifications dépendront des tâches réellement réalisées.",
      "Certificat relatif aux activités de services à la personne (déclaration ou agrément/autorisation selon le cas) pour les activités relevant du cadre SAP, lorsque le professionnel intervient dans ce périmètre.",
      "Qualibat pour des travaux du bâtiment lorsqu’une activité de multiservice inclut des travaux relevant de corps d’état couverts par cette qualification.",
      "RGE uniquement si le professionnel réalise des travaux éligibles aux aides à la rénovation énergétique et remplit les conditions correspondantes.",
      "Qualifelec pour des interventions électriques lorsqu’elles relèvent de l’électricité du bâtiment et que l’entreprise cherche une qualification adaptée.",
      "Qualigaz pour des interventions gaz lorsqu’elles concernent des installations gaz et que le professionnel est dans le champ de cette qualification."
    ],
    "choisir": [
      "Vérifier que le devis décrit précisément chaque tâche, avec la main-d’œuvre, les fournitures, les déplacements et les limites de la prestation ; un multiservice facture souvent des interventions très hétérogènes.",
      "Demander si l’activité relève du bâtiment, du service à la personne ou d’une activité réglementée, car cela détermine les assurances et les qualifications nécessaires.",
      "Contrôler l’assurance responsabilité civile professionnelle, et demander une décennale si des travaux touchent un ouvrage du bâtiment soumis à cette garantie.",
      "Demander des exemples de prestations similaires déjà réalisées, surtout pour les petits travaux techniques comme la fixation sur support fragile, l’électricité simple ou la plomberie légère.",
      "Vérifier le statut exact de l’entreprise, son SIRET et la cohérence entre l’activité déclarée et les travaux proposés, pour éviter qu’un professionnel intervienne hors de son champ déclaré."
    ],
    "facteursPrix": [
      "La nature de la tâche : un simple montage ou une fixation standard coûte moins qu’une réparation avec diagnostic, démontage ou reprise de support.",
      "La durée réelle d’intervention, car beaucoup de prestations multiservices sont facturées au forfait ou à l’heure avec un minimum de déplacement.",
      "Les consommables et fournitures à remplacer, comme visserie, joints, petits raccords, peinture ou pièces de rechange.",
      "Le niveau de technicité et le risque de reprise, par exemple si l’intervention exige des compétences en électricité, plomberie, fixation lourde ou travail en hauteur."
    ],
    "faq": [
      {
        "q": "Un multiservice peut-il faire tous les petits travaux chez moi ?",
        "a": "Non. Il peut réaliser des petits travaux courants, mais pas les activités réglementées qui exigent un diplôme, une qualification ou une assurance spécifique selon le domaine."
      },
      {
        "q": "Faut-il une décennale pour un multiservice ?",
        "a": "Seulement si les travaux réalisés relèvent de la garantie décennale dans le bâtiment. Pour de simples tâches d’entretien ou de bricolage non structurelles, elle n’est en général pas concernée."
      },
      {
        "q": "Le multiservice peut-il intervenir en tant que service à la personne ?",
        "a": "Oui, pour certaines prestations de petits travaux de bricolage ou de jardinage entrant dans le cadre des services à la personne, sous réserve de respecter les règles applicables."
      },
      {
        "q": "Comment savoir si le prix est cohérent ?",
        "a": "Le devis doit distinguer le temps passé, les fournitures, le déplacement et les éventuels frais liés à la difficulté technique ; sans ces éléments, la comparaison est peu fiable."
      }
    ],
    "sources": [
      "https://www.youtube.com/watch?v=qZ0r5rot_cw",
      "https://candidat.francetravail.fr/offres/recherche/detail/209LRTB",
      "https://www.legalstart.fr/fiches-pratiques/auto-entrepreneur/auto-entrepreneur-multiservice/",
      "https://www.legalplace.fr/guides/auto-entrepreneur-multiservice/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "nettoyage-pro": {
    "intro": "Une entreprise de nettoyage intervient sur des prestations d’entretien courant ou ponctuel : bureaux, parties communes d’immeubles, vitres, remises en état après travaux, désinfection ciblée ou nettoyage de locaux professionnels. Dans le résidentiel, un particulier y fait appel pour un grand ménage, un état des lieux, un nettoyage de vitres, un décapage de sols ou une remise en état après un déménagement ou des travaux. Les prestations sont généralement organisées avec un cahier des charges, une fréquence d’intervention et des contrôles de qualité. Les tarifs dépendent surtout du temps de main-d’œuvre, de la complexité du site et du niveau de technicité demandé.",
    "certifications": [
      "ISO 9001",
      "NF Services Propreté – AFNOR Certification",
      "Qualibat"
    ],
    "choisir": [
      "Vérifier l’assurance responsabilité civile professionnelle et demander si les dommages causés chez le client sont couverts pendant l’intervention.",
      "Demander un devis détaillé qui distingue main-d’œuvre, consommables, matériel spécifique et fréquence de passage, afin d’identifier les prestations réellement incluses.",
      "Contrôler l’expérience sur le type de site concerné : logement, bureaux, vitrerie, fin de chantier, ou locaux à contraintes particulières.",
      "Exiger un mode de suivi clair : interlocuteur dédié, fiche de passage, compte rendu d’intervention ou traçabilité des prestations réalisées.",
      "Comparer les offres sur la base du temps estimé d’intervention et des tâches exactes demandées, car une offre anormalement basse cache souvent un sous-dimensionnement du chantier."
    ],
    "facteursPrix": [
      "La surface à traiter et la fréquence des passages, qui font varier le coût global et le coût au m².",
      "Le type de prestation : entretien courant, vitrerie, remise en état après travaux, ou désinfection ponctuelle.",
      "Le niveau de technicité du site : accès difficiles, horaires décalés, locaux sensibles, ou besoin de matériel spécialisé.",
      "Le coût de la main-d’œuvre, qui représente l’essentiel du prix dans ce secteur."
    ],
    "faq": [
      {
        "q": "Une entreprise de nettoyage peut-elle intervenir chez un particulier ?",
        "a": "Oui, pour un ménage ponctuel, un grand nettoyage, des vitres, une remise en état après travaux ou un état des lieux."
      },
      {
        "q": "Faut-il un diplôme obligatoire pour exercer ?",
        "a": "Pour le nettoyage courant, aucun diplôme spécifique n’est exigé."
      },
      {
        "q": "Quel document demander avant de signer ?",
        "a": "Un devis écrit et détaillé, avec la nature exacte des tâches, la fréquence, le matériel inclus et les conditions d’intervention."
      },
      {
        "q": "Quels sont les types de prestations les plus courants ?",
        "a": "L’entretien de bureaux, le nettoyage des parties communes, le lavage de vitres, la remise en état après chantier et le nettoyage ponctuel de logements."
      }
    ],
    "sources": [
      "https://poeticwall.fr/choisir-leader-nettoyage-2026/",
      "https://www.companeo.com/nettoyage-de-locaux/guide/nettoyage-de-locaux-:-les-chiffres-cles",
      "https://avis-services.fr/blog/meilleure-entreprise-nettoyage-2026/",
      "https://pei-nettoyage.fr/maison/entreprise-de-nettoyage-qui-recrute/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "nettoyage-vitres": {
    "intro": "Le laveur de vitres nettoie des surfaces vitrées en intérieur et en extérieur : fenêtres, baies vitrées, vitrines, verrières et parfois miroirs, avec des techniques manuelles ou du matériel spécifique. Les interventions les plus courantes concernent l’entretien de vitres à hauteur d’homme, le nettoyage de vitrines de commerces, et le lavage de vitrages plus hauts avec nacelle ou moyens d’accès adaptés. Un particulier fait le plus souvent appel à lui pour des baies vitrées difficiles d’accès, des grandes surfaces vitrées, un entretien ponctuel après travaux, ou un nettoyage régulier quand l’accès nécessite du matériel professionnel. Le métier peut s’exercer sans diplôme, mais il existe des formations et un CQP dédiés au lavage de vitres.",
    "certifications": [
      "CQP Laveur de vitres",
      "CQP Laveur de vitres spécialisé travaux en hauteur",
      "CQP Laveur de vitres (travaux de faible hauteur)",
      "CACES R486 pour l’utilisation de nacelles lorsque l’intervention l’exige"
    ],
    "choisir": [
      "Vérifier si le prestataire intervient à hauteur d’homme uniquement ou s’il est aussi habilité pour le travail en hauteur avec nacelle, car ce n’est pas le même niveau de compétence ni le même matériel.",
      "Demander quelle méthode est utilisée sur vos vitrages : raclette, perche télescopique, eau pure, nacelle, et si les joints, encadrements et rails sont inclus ou facturés à part.",
      "Contrôler l’assurance responsabilité civile professionnelle, surtout si l’intervention a lieu sur des vitrages en hauteur, au-dessus d’une terrasse, ou près d’éléments fragiles.",
      "Préciser à l’avance l’accessibilité du chantier : hauteur des fenêtres, présence de garde-corps, stationnement possible, accès aux façades, car ces éléments conditionnent le temps passé et le coût.",
      "Demander si le devis inclut le déplacement, le nombre de faces vitrées, le lavage intérieur/extérieur, et les éventuelles majorations pour salissures importantes ou vitres très hautes."
    ],
    "facteursPrix": [
      "La surface totale à nettoyer et le nombre de faces vitrées à traiter, car le tarif dépend souvent du volume réel de vitres.",
      "La difficulté d’accès, notamment les fenêtres en étage, les verrières, les vitrages au-dessus d’une cage d’escalier ou les façades nécessitant une nacelle.",
      "Le type d’intervention : entretien courant, nettoyage après travaux, vitrines très encrassées ou remise en état après intempéries.",
      "La fréquence de passage, car un contrat régulier est généralement moins coûteux qu’une intervention ponctuelle."
    ],
    "faq": [
      {
        "q": "Le nettoyage des vitres d’un particulier peut-il être fait sans diplôme ?",
        "a": "Oui, ce métier est accessible sans diplôme, même si des formations spécifiques existent."
      },
      {
        "q": "Faut-il une certification pour nettoyer des vitres en hauteur ?",
        "a": "Oui, selon le matériel utilisé, un CQP spécialisé et/ou un CACES adapté à la nacelle peuvent être nécessaires."
      },
      {
        "q": "Le laveur de vitres nettoie-t-il aussi les encadrements ?",
        "a": "Pas systématiquement : cela dépend du devis. Les encadrements, joints et rails doivent être explicitement prévus."
      },
      {
        "q": "Pourquoi le prix varie-t-il autant d’une prestation à l’autre ?",
        "a": "Le prix change surtout avec la hauteur d’accès, la surface vitrée, l’état de salissure et la fréquence d’entretien."
      }
    ],
    "sources": [
      "https://www.francecompetences.fr/recherche/rncp/41326/",
      "https://www.inhni.com/formations/formation-continue/cqp-laveur-vitres-faible-hauteur",
      "https://www.cidj.com/s-orienter/metiers/laveur-de-vitres",
      "https://www.intercariforef.org/formations/certification-117405.html"
    ],
    "retrievedAt": "2026-07-26"
  },
  "paysagiste": {
    "intro": "Le paysagiste conçoit, organise ou réalise des aménagements extérieurs : jardins privés, cours, terrasses, allées, massifs, gazons, haies, arrosage et petits ouvrages paysagers. Selon son niveau d’intervention, il peut aussi assurer l’entretien courant, la plantation, la taille, la tonte, le désherbage et le remplacement de végétaux. Un particulier fait appel à lui pour créer un jardin, reprendre un terrain difficile, structurer un espace, ou confier un entretien régulier quand les travaux demandent du matériel, du temps ou une compétence technique spécifique. Dans le métier, les profils vont du technicien d’exécution au concepteur diplômé d’État, avec des formations allant du CAP agricole au diplôme d’État de paysagiste.",
    "certifications": [
      "CAP agricole Jardinier paysagiste",
      "Bac professionnel Aménagements paysagers",
      "BTS Aménagements paysagers",
      "Diplôme d’État de paysagiste",
      "Certificat individuel (Certiphyto) pour l’usage professionnel des produits phytopharmaceutiques",
      "QualiPaysage"
    ],
    "choisir": [
      "Vérifier que le devis distingue clairement la conception, la main-d’œuvre, les fournitures, l’évacuation des déchets verts et l’entretien éventuel, car ces postes font varier fortement le coût.",
      "Demander des photos de chantiers comparables au vôtre : terrassement, plantations, engazonnement, pose de bordures, arrosage, maçonnerie paysagère ou création de massif.",
      "Contrôler l’assurance responsabilité civile professionnelle et, si l’entreprise réalise des ouvrages pouvant relever de la construction, l’assurance décennale couvrant ces travaux.",
      "Poser des questions précises sur les végétaux proposés : calibre, période de plantation, garantie de reprise éventuelle, origine des plants et besoins d’arrosage la première année.",
      "Comparer la méthode d’intervention : simple entretien, conception, ou réalisation complète avec suivi après chantier, car le niveau de prestation n’est pas le même selon le paysagiste."
    ],
    "facteursPrix": [
      "La surface à traiter et la complexité du terrain : pente, accès difficile, sol très compacté, présence de souches ou besoin de décaissement.",
      "Le type de prestation : entretien ponctuel, création complète, plantation d’arbres, engazonnement, arrosage automatique ou maçonnerie paysagère.",
      "Le niveau de fourniture : végétaux jeunes ou déjà développés, matériaux décoratifs, terre végétale, paillage, bordures, éclairage ou arrosage.",
      "Le temps de main-d’œuvre et le matériel mobilisé : minipelle, camion-benne, broyages, évacuation de déchets verts, coupe de précision ou taille spécialisée."
    ],
    "faq": [
      {
        "q": "Un paysagiste peut-il faire uniquement l’entretien d’un jardin ?",
        "a": "Oui. Beaucoup d’entreprises du paysage réalisent aussi la tonte, la taille, le désherbage, le ramassage des déchets verts et le suivi des plantations."
      },
      {
        "q": "Le métier de paysagiste est-il le même qu’architecte-paysagiste ?",
        "a": "Non. Le paysagiste d’exécution réalise et entretient les aménagements, tandis que le paysagiste concepteur ou architecte-paysagiste intervient surtout sur la conception et le projet d’ensemble."
      },
      {
        "q": "Faut-il un certificat pour utiliser des produits phytosanitaires ?",
        "a": "Oui, l’usage professionnel de produits phytopharmaceutiques nécessite un certificat individuel adapté, appelé Certiphyto."
      },
      {
        "q": "Quels travaux peuvent faire varier le plus le devis ?",
        "a": "Les terrassements, la pose d’arrosage, les plantations de gros sujets, l’engazonnement, les clôtures, les bordures et les petits ouvrages maçonnés font souvent monter le prix."
      }
    ],
    "sources": [
      "https://www.culture.gouv.fr/thematiques/architecture/formations-recherche-et-metiers/les-formations-d-architecte-et-de-paysagiste/la-formation-de-paysagiste",
      "https://www.lesentreprisesdupaysage.fr/orientation-formation-emploi/formation-initiale-et-apprentissage/",
      "https://www.afpa.fr/formation-qualifiante/ouvrier-du-paysage-1",
      "https://www.ecoledubreuil.fr/formations/capa-jardinier-paysagiste-formation-pour-adultes-cours-du-soir/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "peintre": {
    "intro": "Le peintre en bâtiment prépare les supports, rebouche les défauts, ponce, applique sous-couches, peintures et parfois revêtements muraux sur murs, plafonds, boiseries ou façades. Il intervient en neuf comme en rénovation, et peut aussi réaliser des travaux d’apprêt avant finition ou des remplacements simples de vitrages selon les chantiers. Un particulier fait appel à lui pour refaire une pièce, traiter un support abîmé, changer une ambiance décorative ou remettre en état un logement avant relocation ou vente. En France, l’exercice du métier est possible avec 3 années d’expérience professionnelle effective dans le métier, en France, dans l’UE ou l’EEE, si l’on ne possède pas le diplôme requis.",
    "certifications": [
      "CAP Peintre applicateur de revêtements",
      "Bac pro Aménagement et finition du bâtiment",
      "BP Peintre applicateur de revêtements",
      "Qualibat",
      "RGE"
    ],
    "choisir": [
      "Demandez un devis détaillé ligne par ligne avec la préparation des supports, le nombre de couches, les fournitures et la surface réellement mesurée, car le prix dépend fortement de l’état initial du support.",
      "Vérifiez qu’il précise la marque et la gamme des peintures, surtout pour une pièce humide, une cuisine ou un support très sollicité, afin d’éviter une finition inadaptée.",
      "Contrôlez son assurance de responsabilité civile professionnelle et, si des travaux touchent à l’étanchéité, à l’isolation ou à une façade, demandez aussi les assurances obligatoires liées au chantier.",
      "Posez la question du traitement des fissures, de l’humidité, des reprises d’enduit et du ponçage, car une bonne peinture dépend d’abord de la préparation du support.",
      "Demandez des références de chantiers comparables au vôtre, par exemple appartement occupé, cage d’escalier, façade ou rénovation après dégât des eaux, car la technicité n’est pas la même."
    ],
    "facteursPrix": [
      "L’état du support : murs fissurés, ancienne peinture écaillée, humidité ou reprises d’enduit augmentent le temps de préparation.",
      "La surface et la hauteur d’intervention : plafond, cage d’escalier ou façade coûtent plus cher qu’un mur simple.",
      "Le type de finition et de peinture : mat, satiné, lessivable, pièces humides, peinture technique ou décorative font varier le prix.",
      "L’accessibilité et la protection du chantier : mobilier à déplacer, bâchage, échafaudage ou travail en site occupé alourdissent la facture."
    ],
    "faq": [
      {
        "q": "Un peintre en bâtiment fait-il seulement de la peinture ?",
        "a": "Non, il prépare aussi les supports, réalise des reprises d’enduit, ponce, protège les surfaces et pose parfois des revêtements muraux."
      },
      {
        "q": "Faut-il une qualification pour exercer comme peintre en bâtiment ?",
        "a": "Oui, il faut soit un diplôme adapté, soit justifier de 3 années d’expérience professionnelle effective dans le métier pour l’exercice artisanal."
      },
      {
        "q": "Qu’est-ce qui est le plus important avant de peindre un mur abîmé ?",
        "a": "La préparation du support : rebouchage, ponçage, dépoussiérage et traitement d’un éventuel problème d’humidité."
      },
      {
        "q": "Pourquoi deux devis de peinture peuvent-ils être très différents ?",
        "a": "Parce que le prix dépend surtout de la préparation nécessaire, de la surface, du type de peinture et des contraintes d’accès au chantier."
      }
    ],
    "sources": [
      "https://entreprendre.service-public.gouv.fr/vosdroits/F39038",
      "https://candidat.francetravail.fr/metierscope/fiche-metier/F1606/peintre-en-batiment",
      "https://www.onisep.fr/ressources/univers-metier/metiers/peintre-en-batiment",
      "https://parcoursmetier.com/metier/peintre-en-batiment/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "petit-bricolage": {
    "intro": "Un professionnel du petit bricolage intervient chez des particuliers pour des tâches manuelles simples, ponctuelles et de courte durée, comme le montage de meubles, la fixation d’étagères, la pose de tringles ou le remplacement de petits éléments de quincaillerie. En France, ce type de prestation est encadré comme une activité de services à la personne lorsqu’elle reste occasionnelle, élémentaire et limitée à deux heures maximum par intervention. Un particulier y fait appel quand il a besoin d’un coup de main pour des travaux du quotidien qui ne relèvent pas d’un métier réglementé ni d’un chantier technique. Les prestations plus dangereuses ou nécessitant une qualification spécifique, comme l’électricité ou la plomberie complexes, sortent de ce cadre.",
    "certifications": [],
    "choisir": [
      "Vérifiez que le prestataire reste bien sur des interventions de petit bricolage au sens des services à la personne : prestations simples, occasionnelles et d’une durée maximale de deux heures.",
      "Demandez s’il est couvert par une assurance responsabilité civile professionnelle ; aucune assurance n’est obligatoire pour créer une activité de petit bricolage, mais elle reste utile en cas de dommage chez le client.",
      "Posez des questions précises sur les tâches réellement prises en charge : montage, fixation, remplacement de joints ou de poignées, et demandez un refus clair des travaux électriques, de plomberie ou de gros œuvre s’ils sortent du périmètre.",
      "Exigez un devis détaillant le temps estimé, le déplacement, le coût horaire ou forfaitaire et les fournitures éventuelles, car le prix dépend fortement de la durée, de la difficulté et des consommables.",
      "Si vous souhaitez un avantage fiscal, vérifiez que la prestation entre bien dans le champ du service à la personne et que les conditions applicables au petit bricolage sont respectées, notamment la limite de deux heures."
    ],
    "facteursPrix": [
      "La durée de l’intervention : plus la prestation est courte mais technique à préparer, plus le prix horaire effectif peut augmenter.",
      "La nature de la tâche : monter un meuble, poser une tringle ou fixer un élément simple ne demande pas le même temps ni le même outillage.",
      "Les déplacements et contraintes d’accès : étage sans ascenseur, stationnement difficile ou besoin de venir avec du matériel spécifique peuvent augmenter la facture.",
      "Les fournitures et consommables : visserie, chevilles, joints, pièces de remplacement ou petits accessoires peuvent s’ajouter au prix de la main-d’œuvre."
    ],
    "faq": [
      {
        "q": "Un petit bricoleur peut-il faire une intervention de plus de deux heures ?",
        "a": "Dans le cadre du petit bricolage en services à la personne, la prestation doit rester limitée à deux heures maximum."
      },
      {
        "q": "Faut-il un diplôme pour exercer le petit bricolage ?",
        "a": "Non, cette activité n’est pas réglementée et ne nécessite pas de diplôme spécifique tant qu’on reste sur des tâches simples et non techniques."
      },
      {
        "q": "Quels travaux sont généralement exclus du petit bricolage ?",
        "a": "Les travaux de gros œuvre, la maçonnerie, la démolition et les interventions d’électricité ou de plomberie qui exigent une qualification spécifique sont exclus."
      },
      {
        "q": "Quel est le tarif horaire habituel d’un petit bricoleur ?",
        "a": "Les sources consultées donnent le plus souvent une fourchette d’environ 20 à 40 € de l’heure, avec des variations selon la ville, la difficulté et les frais de déplacement."
      }
    ],
    "sources": [
      "https://www.join-jump.com/guide/auto-entrepreneur-petit-travaux-de-bricolage",
      "https://onparlebuziness.fr/business/auto-entreprise-bricolage-2026/",
      "https://www.parcours-entrepreneur.net/academie/fiche-metier/petites-reparations-domestiques-petit-bricolage.html",
      "https://www.mon-autoentreprise.fr/auto-entrepreneur-petit-travaux-bricolage/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "pisciniste": {
    "intro": "Un pisciniste conçoit, installe, rénove ou entretient des piscines et des spas, pour un usage privé ou collectif. Ses interventions courantes concernent le terrassement, la pose du bassin, la filtration, le traitement de l’eau, la mise en service, le dépannage et la rénovation d’équipements. Un particulier fait appel à lui pour créer une piscine, corriger un problème de filtration ou d’étanchéité, moderniser un système existant, ou assurer l’entretien technique saisonnier. Le métier est explicitement couvert par le BP Métiers de la piscine et par le titre professionnel de technicien d'installation et de maintenance de piscines.",
    "certifications": [
      "BP Métiers de la piscine",
      "Titre professionnel de technicien d'installation et de maintenance de piscines",
      "Qualibat",
      "Propiscines"
    ],
    "choisir": [
      "Vérifier que l’entreprise est bien assurée en responsabilité civile professionnelle et, pour les travaux de construction ou de rénovation lourde, qu’elle dispose d’une assurance décennale couvrant les ouvrages réalisés.",
      "Demander un devis détaillé séparant clairement terrassement, fourniture du bassin, filtration, local technique, mise en service, traitement de l’eau et options, car ces postes peuvent être confiés à des sous-traitants différents.",
      "Contrôler l’expérience du pisciniste sur le type de projet concerné : piscine enterrée maçonnée, coque polyester, rénovation d’un local technique, remplacement d’un liner, ou pose d’un volet ou d’une pompe à chaleur.",
      "Poser des questions précises sur les normes de sécurité applicables, les délais de chantier, les conditions de mise en eau, et la prise en charge du SAV après réception.",
      "Demander quelles garanties sont fournies sur les équipements posés et sur la main-d’œuvre, ainsi que la procédure prévue en cas de fuite, panne de filtration ou déséquilibre chimique après l’installation."
    ],
    "facteursPrix": [
      "Le type de piscine ou d’intervention : création complète, rénovation, entretien ponctuel, dépannage de filtration ou remplacement d’équipements.",
      "Le niveau de complexité du chantier : accès au terrain, besoin de terrassement, nature du sol, présence d’une nappe phréatique ou d’un enrochement.",
      "Les équipements choisis : pompe, filtre, pompe à chaleur, électrolyseur, volet, bâche, régulation automatique ou nage à contre-courant.",
      "Le volume d’eau et la surface du bassin, qui influencent les dimensions du matériel, le temps de pose et le coût des consommables d’entretien."
    ],
    "faq": [
      {
        "q": "Le pisciniste s’occupe-t-il aussi du traitement de l’eau ?",
        "a": "Oui, il peut dimensionner et installer le système de filtration et de traitement, puis intervenir sur les réglages et les pannes liées à l’eau."
      },
      {
        "q": "Faut-il une assurance décennale pour construire une piscine ?",
        "a": "Oui, dès qu’il s’agit de travaux de construction ou de rénovation relevant de la garantie décennale, l’assurance décennale du professionnel doit être vérifiée."
      },
      {
        "q": "Quelle différence entre entretien courant et rénovation ?",
        "a": "L’entretien courant concerne le nettoyage, les réglages et la maintenance; la rénovation concerne le remplacement ou la reprise d’éléments comme le liner, la filtration, les canalisations ou le revêtement."
      },
      {
        "q": "Quel diplôme est directement lié au métier de pisciniste en France ?",
        "a": "Le BP Métiers de la piscine est le diplôme spécifique de référence, et le titre professionnel de technicien d'installation et de maintenance de piscines est aussi une certification reconnue."
      }
    ],
    "sources": [
      "https://www.francecompetences.fr/recherche/rncp/31214/",
      "https://www.je-change-de-metier.com/fiche-metier-pisciniste",
      "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000046792942",
      "https://www.afpa.fr/formation-qualifiante/technicien-d-installation-et-de-maintenance-de-piscines"
    ],
    "retrievedAt": "2026-07-26"
  },
  "plaquiste": {
    "intro": "Le plaquiste pose et assemble des plaques de plâtre pour créer des cloisons, des doublages de murs et des faux plafonds à l’intérieur des bâtiments. Il réalise aussi l’isolation intégrée derrière ces ouvrages, ainsi que les joints et les finitions avant peinture. Un particulier fait appel à lui pour redistribuer une pièce, améliorer l’isolation thermique ou acoustique, masquer des réseaux, ou reprendre des plafonds et murs irréguliers. En France, l’activité de plaquiste-plâtrier est réglementée et nécessite des qualifications reconnues ; exercer sans les qualifications requises est sanctionné par une amende de 7 500 €.",
    "certifications": [
      "CAP Métiers du plâtre et de l’isolation",
      "CAP Plâtrier-plaquiste",
      "Brevet professionnel Métiers du plâtre et de l’isolation",
      "Bac professionnel Aménagement et finition du bâtiment"
    ],
    "choisir": [
      "Demander la preuve de la qualification professionnelle : diplôme du métier ou justification de 3 ans d’expérience, car c’est exigé pour exercer légalement.",
      "Vérifier l’assurance décennale avant de signer, car les cloisons, doublages et plafonds en plaques de plâtre font partie de l’ouvrage et peuvent relever de cette garantie pendant 10 ans.",
      "Faire préciser si le devis inclut la fourniture des plaques, rails, isolant, bandes et enduits, car le prix change fortement entre pose seule et fourniture + pose.",
      "Contrôler que le devis détaille les performances attendues : type de plaque (standard, hydrofuge, feu), épaisseur de l’isolant, niveau de finition des joints et traitement acoustique éventuel, car ce sont des postes qui font varier le résultat et le coût.",
      "Poser la question de l’accès et de la sécurité du chantier : échafaudage, CACES si nécessaire, et habilitation électrique si des interventions proches de réseaux sont prévues."
    ],
    "facteursPrix": [
      "La surface totale à poser en m² : plus le chantier est grand, plus le prix au m² peut évoluer selon la complexité et la productivité.",
      "Le type d’ouvrage : cloison simple, doublage isolant, faux plafond, habillage technique ou jointoyage seul n’ont pas le même temps de main-d’œuvre.",
      "Les matériaux choisis : plaque standard, hydrofuge, phonique ou coupe-feu, ainsi que l’épaisseur et la nature de l’isolant.",
      "Les contraintes du chantier : hauteur sous plafond, découpes nombreuses, irrégularité des supports, présence de réseaux, accès difficile ou besoin d’échafaudage."
    ],
    "faq": [
      {
        "q": "Le plaquiste fait-il aussi l’isolation ?",
        "a": "Oui, il intègre souvent l’isolant dans les doublages et cloisons, avant la fermeture en plaques de plâtre."
      },
      {
        "q": "Un plaquiste peut-il poser un faux plafond ?",
        "a": "Oui, c’est une intervention courante : plafond suspendu en plaques de plâtre sur ossature métallique."
      },
      {
        "q": "Faut-il une assurance décennale pour un plaquiste ?",
        "a": "Oui, pour les travaux pouvant engager la solidité ou l’étanchéité de l’ouvrage, la décennale est généralement requise."
      },
      {
        "q": "Quelle différence entre plaquiste et plâtrier ?",
        "a": "Le plaquiste travaille surtout les plaques de plâtre et leurs ossatures ; le plâtrier intervient davantage sur les enduits et certains ouvrages en plâtre traditionnel."
      }
    ],
    "sources": [
      "https://entreprendre.service-public.gouv.fr/vosdroits/F39048",
      "https://candidat.francetravail.fr/metierscope/fiche-metier/F1604/plaquiste",
      "https://www.asap.work/ressources/devenir-plaquiste",
      "https://www.inpi.fr/annuaire-activites-et-professions/plaquiste-platrier"
    ],
    "retrievedAt": "2026-07-26"
  },
  "plombier": {
    "intro": "Le plombier installe, répare et entretient les réseaux d’eau dans les logements et bâtiments : arrivées d’eau, évacuations, robinetterie, sanitaires et parfois équipements de chauffage. Il intervient aussi sur des pannes concrètes comme une fuite, un ballon d’eau chaude en dysfonctionnement, un WC bouché, une fuite sous évier ou un remplacement de mitigeur. Selon son activité, il peut travailler sur des installations de chauffage et de gaz, mais les travaux sur gaz exigent une certification spécifique. Un particulier fait appel à lui pour une fuite localisée, un dépannage urgent, une rénovation de salle de bains, le remplacement d’un chauffe-eau ou la mise en conformité d’une installation.",
    "certifications": [
      "CAP Installateur sanitaire",
      "CAP Installateur thermique",
      "TP Plombier chauffagiste",
      "Professionnel du Gaz (PG)",
      "RGE",
      "Qualibat"
    ],
    "choisir": [
      "Vérifier qu’il peut justifier d’une qualification professionnelle adaptée pour exercer légalement la plomberie en France, soit par diplôme, soit par expérience reconnue.",
      "Demander une attestation d’assurance responsabilité civile professionnelle et, pour des travaux pouvant relever de la garantie de bon fonctionnement de l’ouvrage, une assurance décennale.",
      "Si l’intervention concerne le gaz, exiger la certification Professionnel du Gaz (PG), car un plombier ne peut pas intervenir sur une installation gaz sans certification spécifique.",
      "Faire préciser par écrit le détail des postes : déplacement, main-d’œuvre, fournitures, remplacement de pièces, évacuation de l’ancien matériel et taux de TVA appliqué si pertinent.",
      "Comparer des devis sur la base du même diagnostic : une fuite, un débouchage ou un remplacement de chauffe-eau ne se chiffrent pas de la même façon selon l’accès, les pièces à changer et l’urgence."
    ],
    "facteursPrix": [
      "Le type d’intervention : simple dépannage, recherche de fuite, débouchage, remplacement de robinetterie ou pose d’un chauffe-eau n’impliquent pas le même temps ni les mêmes pièces.",
      "L’urgence : une intervention de nuit, le week-end ou en jour férié coûte généralement plus cher qu’un rendez-vous programmé.",
      "L’accessibilité de l’installation : fuite encastrée, WC difficile d’accès, colonne commune ou équipement à démonter augmentent le temps de main-d’œuvre.",
      "Le matériel à remplacer : marque du chauffe-eau, robinetterie, flexible, siphon, tube cuivre ou multicouche modifient fortement le montant final."
    ],
    "faq": [
      {
        "q": "Un plombier peut-il intervenir sur une installation de gaz ?",
        "a": "Oui, mais seulement s’il possède la certification spécifique requise pour le gaz, comme Professionnel du Gaz (PG)."
      },
      {
        "q": "Un plombier doit-il obligatoirement avoir un diplôme ?",
        "a": "Oui, pour exercer en France il doit justifier des qualifications requises, par diplôme ou par expérience reconnue ; sans cela, l’exercice est illégal."
      },
      {
        "q": "Quelle assurance demander à un plombier avant des travaux ?",
        "a": "La RC Pro est indispensable, et l’assurance décennale est à demander si les travaux peuvent engager la responsabilité sur la durée."
      },
      {
        "q": "Que peut réparer un plombier en urgence ?",
        "a": "Une fuite d’eau, un WC bouché, un robinet cassé, un siphon qui fuit ou un ballon d’eau chaude en panne sont des interventions courantes."
      }
    ],
    "sources": [
      "https://entreprendre.service-public.gouv.fr/vosdroits/F39039",
      "https://magazine.plus-que-pro.fr/habitat/plomberie-et-sanitaires/nouvelles-obligations-pour-les-installations-de-plomberie-efficacite-energetique-et-securite/",
      "https://propulsebyca.fr/idees-business/travaux-plomberie/reglementation-travaux-plomberie",
      "https://entreprendre.service-public.fr/vosdroits/F39039?lang=en"
    ],
    "retrievedAt": "2026-07-26"
  },
  "promenade-animaux": {
    "intro": "Le promeneur d’animaux (souvent centré sur le chien) prend en charge la sortie d’un animal au domicile du client ou au point de rendez-vous convenu, avec marche, gestion de la laisse et surveillance pendant la promenade. Les interventions les plus courantes sont la promenade simple, la sortie hygiénique, et parfois la visite à domicile associée à l’abreuvement ou à une vérification rapide de l’état de l’animal. Un particulier fait appel à ce service lorsqu’il est absent longtemps, a un emploi du temps incompatible avec les sorties du chien, ou ne peut pas assurer les promenades pour des raisons physiques ou ponctuelles.",
    "certifications": [
      "ACACED (option chien)",
      "Certificat de capacité des animaux de compagnie d’espèces domestiques",
      "CATPAV (si transport rémunéré d’animaux vivants dans les conditions réglementaires)"
    ],
    "choisir": [
      "Vérifier si le prestataire déclare bien son activité et dispose d’un numéro SIRET lorsqu’il exerce à titre professionnel.",
      "Demander une attestation d’assurance responsabilité civile professionnelle couvrant les dommages causés pendant la promenade.",
      "Exiger une première rencontre avec le chien pour vérifier la tenue en laisse, la gestion des croisements et la réaction à la laisse ou aux congénères.",
      "Poser une question précise sur le nombre de chiens promenés en même temps et sur les règles appliquées en cas de fugue, de blessure ou de chaleur élevée.",
      "Vérifier que le promeneur connaît les contraintes locales: zones où la laisse est obligatoire, ramassage des déjections et règles communales sur le nombre de chiens promenés ensemble."
    ],
    "facteursPrix": [
      "La durée de la promenade, par exemple 20, 30, 45 ou 60 minutes.",
      "Le nombre de chiens pris en charge pendant la même sortie, car la surveillance et la gestion de la laisse sont plus lourdes.",
      "La zone géographique, avec des tarifs souvent plus élevés en grande ville qu’en zone rurale.",
      "Les contraintes spécifiques de l’animal: chien jeune, très énergique, réactif, âgé, ou nécessitant une sortie individuelle."
    ],
    "faq": [
      {
        "q": "Faut-il l’ACACED pour faire uniquement des promenades de chiens ?",
        "a": "Pas systématiquement si l’activité se limite à promener ou visiter des animaux au domicile, mais l’ACACED est souvent requise dès qu’il y a garde professionnelle d’animaux."
      },
      {
        "q": "Le promeneur d’animaux peut-il sortir plusieurs chiens à la fois ?",
        "a": "Oui, mais il doit respecter les règles locales et organiser la sortie de façon à garder le contrôle effectif de chaque chien."
      },
      {
        "q": "Le promeneur doit-il avoir une assurance spécifique ?",
        "a": "Oui, une responsabilité civile professionnelle est généralement demandée pour couvrir les dommages causés pendant la prestation."
      },
      {
        "q": "Quels sont les cas les plus fréquents où l’on fait appel à ce service ?",
        "a": "Absence prolongée, horaires de travail incompatibles avec les sorties du chien, convalescence du propriétaire, ou impossibilité ponctuelle de promener l’animal."
      }
    ],
    "sources": [
      "https://www.mypos.com/fr-fr/blog/guide-entreprise/comment-devenir-promeneur-de-chien-en-france",
      "https://fr.indeed.com/conseils-carrieres/trouver-un-emploi/devenir-pet-sitter-guide",
      "https://www.skillandyou.com/fr/blog/acaced-obligatoire-pet-sitter",
      "https://savage-desk.com/metier-animalier-liste-salaires-formations-2026/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "ramoneur": {
    "intro": "Le ramoneur nettoie et entretient les conduits de fumée et de cheminée, ainsi que certains appareils de chauffage et de ventilation comme les poêles à bois, chaudières et VMC. Son intervention consiste surtout à enlever la suie et les dépôts, puis à vérifier l’état du conduit pour limiter les risques d’incendie et d’intoxication au monoxyde de carbone. Un particulier fait appel à lui pour un ramonage périodique, un conduit qui tire mal, des traces de refoulement, ou avant la remise en service d’un appareil après une longue pause. En France, l’exercice de ce métier est encadré et nécessite des qualifications professionnelles adaptées.",
    "certifications": [
      "CTM Ramoneur-fumiste",
      "Titre professionnel Ramoneur-fumiste (RNCP)",
      "BTM Ramoneur-fumiste",
      "CAP ou diplôme équivalent dans les métiers du bâtiment avec spécialisation/expérience en ramonage",
      "VAE permettant de faire reconnaître l’expérience professionnelle selon le parcours visé"
    ],
    "choisir": [
      "Vérifier que le professionnel peut justifier d’une qualification reconnue pour exercer le métier de ramoneur en France, car l’exercice sans qualifications requises est illégal.",
      "Demander s’il délivre un certificat de ramonage après l’intervention, document attendu après un entretien conforme des conduits.",
      "Contrôler que le devis précise le type de conduit ou d’appareil concerné, car le tarif varie selon qu’il s’agit d’une cheminée, d’un poêle, d’une chaudière, d’une VMC ou d’un conduit plus complexe.",
      "Poser la question des moyens d’accès et de sécurité si le conduit est en toiture ou en hauteur, car une habilitation ou des moyens spécifiques peuvent être nécessaires.",
      "Demander l’assurance professionnelle du ramoneur, en particulier la responsabilité civile professionnelle, car l’intervention touche à la sécurité des biens et des personnes."
    ],
    "facteursPrix": [
      "Le type d’installation à ramoner : cheminée ouverte, poêle à bois, chaudière, conduit gaz, fioul ou VMC, avec un niveau de complexité différent.",
      "L’accessibilité du conduit, notamment si l’intervention impose un travail en hauteur, un accès toiture ou des protections particulières.",
      "Le nombre de conduits ou d’appareils à traiter lors de la même visite.",
      "La zone géographique et les frais de déplacement, qui peuvent être facturés en plus de la prestation."
    ],
    "faq": [
      {
        "q": "Un ramoneur peut-il intervenir sur une chaudière ou une VMC ?",
        "a": "Oui, le ramoneur peut aussi entretenir certains équipements de chauffage et de ventilation, dont des chaudières et des VMC."
      },
      {
        "q": "Le ramonage sert-il seulement à enlever la suie ?",
        "a": "Non, il sert aussi à contrôler l’état du conduit et à réduire les risques d’incendie et d’intoxication au monoxyde de carbone."
      },
      {
        "q": "Peut-on exercer comme ramoneur sans qualification ?",
        "a": "Non, l’exercice sans les qualifications requises est interdit et peut être sanctionné."
      },
      {
        "q": "Le ramoneur doit-il remettre un justificatif après sa prestation ?",
        "a": "Oui, dans la pratique professionnelle, un certificat de ramonage est attendu après un ramonage réalisé conformément aux règles du métier."
      }
    ],
    "sources": [
      "https://entreprendre.service-public.gouv.fr/vosdroits/F39046",
      "https://candidat.francetravail.fr/metierscope/fiche-metier/F1621/ramoneur-ramoneuse",
      "https://www.captaincontrat.com/exercer-un-metier/devenir-ramoneur-le-guide-complet-pour-r%C3%A9ussir-en-2026",
      "https://www.hellowork.com/fr-fr/metiers/ramoneur.html"
    ],
    "retrievedAt": "2026-07-26"
  },
  "repassage": {
    "intro": "Un repasseur ou une repasseuse en France est un professionnel qui donne l’aspect final aux vêtements et au linge en supprimant les plis, en mettant les pièces en forme et en contrôlant la présentation avant remise au client ou expédition. Les interventions les plus courantes sont le repassage de chemises, pantalons, robes, linge de maison et parfois des opérations de finition comme le pliage, l’emballage ou la mise sur cintre. Un particulier y fait appel surtout pour le linge à traiter en volume, les vêtements délicats ou les pièces qui doivent être rendues rapidement et proprement, par exemple via un pressing ou un service à domicile.",
    "certifications": [
      "RNCP39369 - Agent polyvalent de pressing",
      "CAP Métiers de la mode - vêtement flou",
      "CAP Prêt-à-Porter",
      "CAP Couture flou"
    ],
    "choisir": [
      "Vérifiez que la prestation couvre bien le type de textile à confier : chemises, linge de maison, pièces délicates, vêtements de cérémonie ou articles nécessitant une finition particulière.",
      "Demandez comment sont traités les textiles fragiles : température de repassage, vapeur, presse, pattemouille, contrôle des étiquettes d’entretien et gestion des tissus sensibles comme la soie ou la laine.",
      "Confirmez les conditions de remise : délai, pliage ou sur cintre, emballage, possibilité de traitement express et modalités de restitution en cas de pièce mal finie ou abîmée.",
      "Si le repassage est réalisé à domicile, vérifiez l’assurance responsabilité civile professionnelle du prestataire et demandez qui prend en charge un dommage matériel sur un vêtement ou sur votre équipement.",
      "Demandez si le prestataire a une expérience réelle en repassage professionnel, notamment pour les chemises, les costumes, le linge hôtelier ou les articles nécessitant une finition régulière et homogène."
    ],
    "facteursPrix": [
      "Le volume de linge ou le nombre de pièces à traiter, qui influe directement sur le temps de main-d’œuvre.",
      "La nature des textiles, car les tissus délicats, les vêtements de cérémonie ou les pièces très froissées demandent plus de soin.",
      "Le niveau de finition demandé, par exemple simple repassage, pliage, mise sur cintre, emballage ou repassage express.",
      "Le lieu d’intervention, avec des écarts entre dépôt en pressing, service à domicile et déplacement facturé séparément."
    ],
    "faq": [
      {
        "q": "Le métier de repasseur nécessite-t-il un diplôme obligatoire ?",
        "a": "Non, il est souvent accessible sans formation particulière, mais un CAP dans la mode ou l’habillement facilite l’accès au poste."
      },
      {
        "q": "Un repasseur travaille-t-il seulement au fer à repasser ?",
        "a": "Non, il peut aussi utiliser des presses, du repassage mannequin et d’autres équipements de finition selon le type de textile."
      },
      {
        "q": "Le repassage en pressing comprend-il uniquement le défroissage ?",
        "a": "Non, il peut inclure le pliage, la mise sur cintre et l’emballage avant restitution au client."
      },
      {
        "q": "Ce métier existe-t-il en industrie textile ?",
        "a": "Oui, il existe des postes de repassage et finition en industrie textile, où le travail consiste aussi à mettre en forme et finaliser les articles avant expédition."
      }
    ],
    "sources": [
      "https://candidat.francetravail.fr/metierscope/fiche-metier/D1236/repasseur-repasseuse",
      "https://www.jobijoba.com/fr/emploi/Repasseur",
      "https://emploi.ouest-france.fr/metiers/employe-repassage-finition-industrie-textile/",
      "https://fr.jooble.org/emploi-repassage-pressing/Paris"
    ],
    "retrievedAt": "2026-07-26"
  },
  "serrurier": {
    "intro": "Le serrurier intervient sur les serrures, cylindres, clés et systèmes de fermeture d’une habitation ou d’un local commercial, avec une activité de dépannage, de remplacement et d’installation. Il conseille aussi sur la sécurisation d’un accès, par exemple après une clé perdue, une porte claquée, une serrure endommagée ou un besoin de renforcement de fermeture. En pratique, un particulier le sollicite surtout pour une ouverture de porte, un changement de serrure, une mise en sécurité après effraction ou la pose d’équipements de protection comme un blindage ou une serrure de sécurité.",
    "certifications": [
      "RNCP : certification de niveau IV/4 mentionnée pour l’activité de serrurier dépanneur-installateur, avec exigence de qualification professionnelle pour exercer selon les sources consultées.",
      "CAP serrurier-métallier : diplôme de base cité pour accéder au métier et justifier de la capacité technique lors de l’immatriculation.",
      "Bac pro ouvrages du bâtiment : métallerie : diplôme cité comme voie de qualification pour exercer ou s’installer.",
      "Attestation d’expérience de 3 ans validée par la Chambre des métiers : alternative citée au diplôme pour justifier la capacité professionnelle."
    ],
    "choisir": [
      "Vérifier que le serrurier peut justifier de sa qualification : diplôme lié au métier ou expérience professionnelle reconnue, surtout s’il s’agit d’un artisan immatriculé.",
      "Demander un devis avant intervention avec le détail de la main-d’œuvre, du déplacement, de la pièce remplacée et d’éventuels frais de nuit, week-end ou jour férié.",
      "Contrôler la présence d’une assurance responsabilité civile professionnelle et, si les travaux s’inscrivent dans une rénovation plus large, d’une assurance décennale.",
      "Préciser au téléphone la nature exacte du problème : porte claquée, serrure bloquée, cylindre cassé, clé cassée dans le barillet, afin d’éviter une intervention inadaptée et un surcoût lié à une mauvaise estimation.",
      "Demander quelle marque et quel modèle de serrure, cylindre ou verrou seront posés, et si le professionnel fournit les clés et la facture détaillée après remplacement."
    ],
    "facteursPrix": [
      "Le type d’intervention : simple ouverture de porte, remplacement de cylindre, changement complet de serrure, pose de serrure multipoints ou remise en sécurité après effraction.",
      "La complexité technique : porte blindée, serrure de sécurité, cylindre haute sûreté, clé brevetée ou mécanisme endommagé.",
      "Le moment d’intervention : urgence de nuit, week-end, jour férié ou déplacement rapide en dehors des horaires habituels.",
      "Le matériel installé : qualité et niveau de sécurité de la serrure, du cylindre, du protège-cylindre ou du blindage."
    ],
    "faq": [
      {
        "q": "Un serrurier peut-il ouvrir une porte claquée sans casser la serrure ?",
        "a": "Oui, si le mécanisme le permet, l’ouverture peut se faire sans destruction ; sur certaines serrures ou portes blindées, une intervention destructive peut être nécessaire."
      },
      {
        "q": "Faut-il changer tout le mécanisme après une clé perdue ?",
        "a": "Pas forcément : selon le type de serrure, le remplacement du cylindre peut suffire si la serrure elle-même est intacte."
      },
      {
        "q": "Le serrurier intervient-il après une effraction ?",
        "a": "Oui, il peut remettre la fermeture en état, remplacer la serrure ou sécuriser provisoirement la porte après un cambriolage."
      },
      {
        "q": "Quelle différence entre serrurier-dépanneur et serrurier-métallier ?",
        "a": "Le serrurier-dépanneur intervient surtout sur les serrures et dépannages, tandis que le serrurier-métallier travaille davantage le métal et les ouvrages de métallerie."
      }
    ],
    "sources": [
      "https://www.intercariforef.org/formations/certification-108983.html",
      "https://formation-serrurier.com/certifications-serrurier-rncp",
      "https://www.legalplace.fr/guides/devenir-serrurier/",
      "https://propulsebyca.fr/idees-business/travaux-serrurerie/reglementation-travaux-serrurerie"
    ],
    "retrievedAt": "2026-07-26"
  },
  "soutien-scolaire": {
    "intro": "Le soutien scolaire consiste à accompagner un élève en dehors de la classe pour reprendre des notions mal comprises, consolider des bases et travailler une matière précise ou plusieurs disciplines. En pratique, les interventions les plus courantes sont l’aide aux devoirs, la remise à niveau, la préparation d’examens et le travail sur la méthode de travail, le suivi étant souvent adapté au niveau primaire, collège ou lycée. Un particulier y fait appel lorsque les résultats baissent, que les lacunes s’accumulent, qu’un examen approche ou que l’élève a besoin d’un cadre plus individualisé que celui de la classe. En France, ce métier est souvent exercé par des personnes titulaires d’un diplôme de niveau licence, fréquemment dans la matière enseignée.",
    "certifications": [],
    "choisir": [
      "Vérifier que le profil du soutenant correspond bien au niveau scolaire de l’élève et à la matière ciblée, car les besoins ne sont pas les mêmes en primaire, collège et lycée.",
      "Demander comment se fait le diagnostic de départ : un bon accompagnement commence par l’identification des lacunes précises, et non par des cours identiques pour tous.",
      "Contrôler le statut de la prestation si vous voulez bénéficier du crédit d’impôt de 50 % pour les services à la personne : il faut passer par un organisme agréé ou un cadre permettant cet avantage fiscal.",
      "Demander quelles sont les preuves de qualification du professeur : diplôme, expérience dans la matière, et éventuelle expérience d’enseignement ou d’accompagnement d’élèves.",
      "Vérifier les modalités concrètes avant de s’engager : durée des séances, fréquence, objectifs mesurables, et comment le suivi est ajusté si l’élève progresse mal ou très vite."
    ],
    "facteursPrix": [
      "Le niveau de l’élève et la complexité de la matière influencent le tarif, car une aide en primaire ne se facture pas comme une préparation au baccalauréat ou à des épreuves sélectives.",
      "Le statut du intervenant fait varier le prix : cours payés à l’heure en indépendant, ou salaire dans une structure, avec des niveaux de rémunération différents selon les offres.",
      "La localisation et le mode d’intervention comptent : les offres en Île-de-France et dans certaines zones tendues affichent souvent des niveaux horaires différents de ceux observés ailleurs.",
      "Le type d’accompagnement fait aussi varier le coût : aide ponctuelle, suivi hebdomadaire, préparation d’examen, ou accompagnement très individualisé avec bilan initial."
    ],
    "faq": [
      {
        "q": "Le soutien scolaire est-il réservé aux élèves en difficulté ?",
        "a": "Non : il sert aussi à consolider des acquis, préparer un examen ou travailler une méthode de travail, pas seulement à rattraper un retard."
      },
      {
        "q": "Quel niveau est généralement demandé pour devenir professeur de soutien scolaire ?",
        "a": "France Travail indique qu’un diplôme de niveau licence est requis, et que les formations de niveau bac+3 à bac+5 sont courantes."
      },
      {
        "q": "Peut-on bénéficier d’un avantage fiscal pour des cours à domicile ?",
        "a": "Oui, mais seulement si la prestation entre dans le cadre des services à la personne ouvrant droit au crédit d’impôt, avec les conditions applicables à ce dispositif."
      },
      {
        "q": "Le soutien scolaire et le coaching scolaire, est-ce la même chose ?",
        "a": "Non : le soutien scolaire vise d’abord les apprentissages et les matières, tandis que le coaching scolaire est centré sur l’organisation, la motivation et la méthode."
      }
    ],
    "sources": [
      "https://fr.indeed.com/recrutement/description-du-poste/professeur-soutien-scolaire",
      "https://candidat.francetravail.fr/metierscope/fiche-metier/K2129/professeur-professeure-en-soutien-scolaire",
      "https://www.jobijoba.com/fr/emploi/Soutien+scolaire",
      "https://www.hellowork.com/fr-fr/emploi/mot-cle_soutien-scolaire.html"
    ],
    "retrievedAt": "2026-07-26"
  },
  "terrassier": {
    "intro": "Le terrassier prépare physiquement un terrain avant une construction ou un aménagement : il réalise les déblais, remblais, nivellements, fouilles de fondations et tranchées pour les réseaux. Il intervient souvent en amont d’une maison individuelle, d’une extension, d’une piscine, d’une allée, d’un mur de soutènement ou d’un raccordement aux réseaux. Un particulier fait appel à lui quand le terrain doit être décapé, mis à niveau, excavé ou rendu accessible pour des travaux de maçonnerie, d’assainissement ou de voirie. Le métier exige aussi de savoir travailler à proximité de réseaux enterrés et de conduire des engins de chantier selon les besoins du chantier.",
    "certifications": [
      "CACES (notamment les catégories liées aux engins de chantier, comme la recommandation R482)",
      "AIPR (Autorisation d’Intervention à Proximité des Réseaux)",
      "SST (Sauveteur Secouriste du Travail)",
      "CAP Constructeur de routes",
      "CAP Constructeur en canalisation des travaux publics",
      "CAP Constructeur en ouvrages d’art"
    ],
    "choisir": [
      "Demandez si le terrassier est bien habilité à travailler à proximité des réseaux enterrés et s’il dispose d’une AIPR à jour si le chantier comporte eau, gaz, électricité ou télécoms.",
      "Vérifiez qu’il a les CACES adaptés aux engins réellement utilisés sur votre chantier, surtout pour pelle mécanique, mini-pelle ou chargeuse.",
      "Exigez un devis qui détaille le métrage ou le cubage de terre à déplacer, l’évacuation des déblais, le remblaiement, le nivellement et les éventuels apports de matériaux, car ces postes font fortement varier le prix.",
      "Demandez qui gère le repérage des réseaux existants et la responsabilité en cas d’endommagement, car c’est un point critique en terrassement.",
      "Contrôlez son assurance responsabilité civile professionnelle et, si les travaux s’inscrivent dans une opération plus large de construction, vérifiez aussi la couverture décennale quand elle est légalement applicable aux travaux réalisés."
    ],
    "facteursPrix": [
      "Le volume de terre à décaisser ou à déplacer, souvent facturé au mètre cube ou selon la quantité de déblais.",
      "L’accessibilité du terrain : pente, espace de manœuvre réduit, terrain humide ou rocheux, présence d’arbres ou d’obstacles.",
      "La nature des travaux : simple nivellement, fouille de fondations, tranchées pour réseaux, ou évacuation avec chargement en décharge.",
      "La distance d’évacuation des terres et le besoin éventuel d’apport de remblai, de grave ou de tout-venant."
    ],
    "faq": [
      {
        "q": "Un terrassier peut-il creuser une tranchée pour des réseaux enterrés ?",
        "a": "Oui, c’est une mission courante, mais il doit respecter les règles de sécurité liées aux réseaux et disposer de l’AIPR lorsque le chantier l’exige."
      },
      {
        "q": "Faut-il forcément un diplôme pour exercer comme terrassier ?",
        "a": "Non, l’accès au métier peut se faire sans diplôme spécifique, mais les CAP et bac pro du TP facilitent l’embauche et l’évolution."
      },
      {
        "q": "Le prix d’un terrassement est-il toujours facturé à l’heure ?",
        "a": "Non, il est souvent calculé au mètre cube déplacé ou selon la nature des travaux et l’accessibilité du chantier."
      },
      {
        "q": "Quels engins un terrassier doit-il savoir utiliser ?",
        "a": "Selon le chantier, il peut utiliser une mini-pelle, une pelle mécanique, une chargeuse ou du matériel de compactage, avec les CACES adaptés aux engins concernés."
      }
    ],
    "sources": [
      "https://emploi.ouest-france.fr/metiers/terrassier-terrassiere/",
      "https://www.toutpourvostravaux.fr/metier/terrassier/",
      "https://www.missions-interim.fr/profession/metier-terrassier/",
      "https://www.hellowork.com/fr-fr/metiers/terrassier.html"
    ],
    "retrievedAt": "2026-07-26"
  },
  "traitement-nuisibles": {
    "intro": "Un professionnel du traitement nuisibles réalise des diagnostics de présence, identifie l’espèce en cause, puis met en place des traitements ciblés contre les rongeurs, les insectes rampants ou volants, et parfois certains parasites dans les logements, copropriétés, commerces ou locaux alimentaires. Les interventions les plus courantes sont la dératisation, la désinsectisation et la mise en place de dispositifs de prévention ou de suivi, avec rédaction de rapports et recommandations techniques. Un particulier fait surtout appel à ce métier en cas d’infestation visible ou suspectée, de traces de rongeurs, de punaises de lit, de cafards, de frelons/guêpes, ou lorsqu’un traitement durable nécessite des produits biocides professionnels. En pratique, l’usage de produits professionnels impose des compétences réglementées et un cadre d’intervention plus strict qu’un simple traitement domestique.",
    "certifications": [
      "Certibiocide Nuisibles",
      "Certificat individuel biocide \"nuisibles\"",
      "CQP Technicien en maîtrise du risque nuisible"
    ],
    "choisir": [
      "Vérifier que l’intervenant détient bien le Certibiocide Nuisibles s’il manipule des produits biocides professionnels, et demander quel type de produits il est habilité à utiliser.",
      "Demander un diagnostic initial écrit précisant le nuisible, le niveau d’infestation, les causes probables et le plan de traitement proposé, plutôt qu’un devis sans analyse préalable.",
      "Contrôler l’existence d’une RC Pro adaptée à l’activité, car l’entreprise de lutte contre les nuisibles doit être assurée pour les dommages causés pendant l’intervention.",
      "Poser des questions sur le suivi après intervention : visite de contrôle, réapplication éventuelle, délais d’efficacité et modalités de traitement des réinfestations.",
      "Comparer les prestataires sur la méthode employée : piégeage, appâts, gels, pulvérisation, nébulisation ou traitement thermique selon le nuisible, et éviter les offres qui annoncent une solution identique pour tous les cas."
    ],
    "facteursPrix": [
      "Le type de nuisible traité : une intervention contre des rongeurs, des punaises de lit ou des frelons n’implique pas les mêmes produits, le même temps de diagnostic ni le même niveau de technicité.",
      "Le niveau d’infestation : une présence ponctuelle coûte généralement moins cher qu’un traitement de foyer important avec plusieurs passages et contrôles.",
      "La surface et la configuration des lieux : appartement, maison, cave, combles, local commercial ou copropriété influencent le nombre de points de contrôle et de traitement.",
      "Le nombre de visites nécessaires et le besoin de suivi après traitement, souvent déterminants dans le coût final d’une prestation de lutte anti-nuisibles."
    ],
    "faq": [
      {
        "q": "Le Certibiocide Nuisibles est-il obligatoire pour un professionnel du traitement nuisibles en France ?",
        "a": "Oui, dès qu’il manipule ou applique des produits biocides professionnels pour la lutte contre les nuisibles."
      },
      {
        "q": "Un traitement nuisibles couvre-t-il seulement les rats et souris ?",
        "a": "Non, le métier couvre aussi la désinsectisation et parfois des actions de désinfection selon l’activité de l’entreprise."
      },
      {
        "q": "Faut-il toujours plusieurs passages pour un traitement nuisibles ?",
        "a": "Pas toujours, mais c’est fréquent lorsque l’infestation est installée, quand il faut vérifier l’efficacité ou recharger des dispositifs de suivi."
      },
      {
        "q": "Le métier exige-t-il un diplôme d’État spécifique ?",
        "a": "Non, il n’existe pas de diplôme unique obligatoire, mais l’exercice est encadré par la réglementation biocide et la détention du Certibiocide est indispensable pour l’usage professionnel des produits concernés."
      }
    ],
    "sources": [
      "https://bsness.fr/autorisations-ouvrir-desinsectisation/",
      "https://cv-market.fr/blogs/conseils-cv/formation-3d-deratisation",
      "https://fr.indeed.com/conseils-carrieres/trouver-un-emploi/comment-devenir-deratiseur",
      "https://www.ktel.org/la-reforme-certibiocide-2025-transforme-les-interventions-professionnelles-contre-les-punaises-de-lit/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "videosurveillance-installateur": {
    "intro": "Un installateur de vidéosurveillance pose, câble, paramètre et met en service des caméras, un enregistreur et les accès de consultation sur site. Il intervient souvent pour des maisons individuelles, des copropriétés, des commerces, des parkings ou des locaux professionnels afin de sécuriser des accès, des abords, une entrée ou une zone de stockage. Les prestations courantes sont le repérage des points de vue, le passage de câbles, le réglage des enregistrements et de la détection de mouvement, puis les tests de fonctionnement et la remise d’une attestation de conformité quand elle est requise. Un particulier fait appel à lui quand il veut remplacer une alarme seule, couvrir un portail, surveiller une allée, un garage ou un rez-de-chaussée, ou intégrer les caméras à une application mobile ou à un système de sécurité existant.",
    "certifications": [
      "Certificat d’installateur de systèmes de vidéoprotection conforme à l’arrêté du 5 janvier 2011, délivré par un organisme accrédité COFRAC ou équivalent.",
      "Certification NF Service / APSAD pour l’installation de vidéosurveillance (référentiel NF367-I82), mentionnée comme base de l’attestation préalable de conformité dans l’arrêté du 6 mars 2009.",
      "CQP technicien d'installation de système de vidéosurveillance.",
      "TP Technicien en systèmes de sûreté (RNCP35188), remplaçant l’ancien TP Technicien en systèmes de surveillance-intrusion et de vidéoprotection."
    ],
    "choisir": [
      "Vérifier que l’installateur sait traiter la réglementation vidéoprotection selon le lieu du projet, notamment la différence entre installation privée et installation dans un lieu ouvert au public ou un site soumis à autorisation.",
      "Demander s’il fournit, quand c’est nécessaire, l’attestation de conformité liée à l’installation, et quelle certification il détient pour pouvoir la signer.",
      "Vérifier qu’il maîtrise le câblage réel du chantier : alimentation, cheminement des câbles, fixation extérieure, protection contre les intempéries et intégration réseau/PoE si les caméras sont IP.",
      "Exiger un devis détaillant le nombre de caméras, le stockage vidéo, la durée d’archivage, les prestations de paramétrage et de mise en service, car ces éléments changent fortement le résultat technique et le prix.",
      "Demander quelles garanties sont couvertes après pose : fonctionnement, paramétrage à distance, SAV sur l’enregistreur, remplacement de matériel défectueux et délai d’intervention en cas de panne."
    ],
    "facteursPrix": [
      "Le nombre de caméras à poser et la complexité du câblage entre les points de vue, l’enregistreur et la box/réseau.",
      "Le type de matériel choisi : caméras analogiques, IP, dôme, bullet, vision nocturne, stockage local ou hybride.",
      "Les contraintes du site : hauteur de pose, extérieur exposé, traversées de murs, distance de câblage, accès difficile ou besoin de nacelle.",
      "Le niveau de paramétrage demandé : enregistrement continu ou sur détection, accès multi-utilisateurs, notifications smartphone, intégration à un système d’alarme ou à un contrôle d’accès."
    ],
    "faq": [
      {
        "q": "Un installateur de vidéosurveillance doit-il avoir une certification spécifique en France ?",
        "a": "Oui, il existe une certification d’installateur de systèmes de vidéoprotection prévue par l’arrêté du 5 janvier 2011, et l’arrêté du 6 mars 2009 mentionne aussi la certification NF Service / APSAD NF367-I82 pour l’attestation de conformité."
      },
      {
        "q": "Dans quels cas une installation de caméras doit-elle être traitée comme de la vidéoprotection réglementée ?",
        "a": "Quand le système concerne des lieux soumis à la réglementation de la vidéoprotection, notamment certains sites professionnels ou ouverts au public, avec des formalités spécifiques à respecter."
      },
      {
        "q": "Que fait concrètement l’installateur lors de la mise en service ?",
        "a": "Il règle les angles de vue, configure l’enregistrement, teste la détection, vérifie l’accès aux images et s’assure que le système fonctionne sur site et à distance si prévu."
      },
      {
        "q": "Quel document demander après la pose ?",
        "a": "Quand elle est requise, il faut demander l’attestation préalable de conformité du dispositif, établie par un installateur titulaire des certifications prévues par l’arrêté du 6 mars 2009 ou équivalentes."
      }
    ],
    "sources": [
      "https://www.intercariforef.org/formations/certification-96189.html",
      "https://bsness.fr/ouvrir-installation-de-videosurveillance/",
      "https://www.legifrance.gouv.fr/loda/id/LEGITEXT000020372242/2009-03-12/",
      "https://www.francecompetences.fr/recherche/rncp/11467/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "vitrier": {
    "intro": "Le vitrier intervient sur la pose, le remplacement et la réparation de vitrages dans les fenêtres, portes, cloisons, vitrines ou baies, ainsi que sur certains ensembles verriers de menuiserie et d’agencement. En pratique, un particulier fait surtout appel à lui après une vitre cassée, pour un simple vitrage à remplacer, pour une mise en sécurité provisoire après sinistre, ou pour la pose d’un vitrage adapté à une rénovation. Le métier peut aussi recouvrir des travaux de miroiterie et d’agencement verrier, tandis que la restauration de vitraux relève d’un savoir-faire plus spécifique de vitrailliste. Selon les cas, l’intervention se fait en atelier, sur site, ou en urgence sur une ouverture endommagée.",
    "certifications": [
      "CAP arts et techniques du verre option vitrailliste",
      "BMA verrier décorateur",
      "DN MADE mention ornement",
      "CQP vitrail",
      "CQP Technicien vitrage",
      "Qualibat"
    ],
    "choisir": [
      "Vérifier que l’artisan précise s’il fait de la pose de vitrage courant, de la miroiterie, ou de la restauration de vitraux : ce ne sont pas les mêmes compétences ni les mêmes outils.",
      "Demander un devis détaillé avec la nature du verre, les dimensions, l’épaisseur, la dépose/repose, les joints et la main-d’œuvre, car le type de vitrage change fortement le coût final.",
      "Contrôler l’assurance responsabilité civile professionnelle et, si des travaux touchent une menuiserie extérieure ou une fermeture, demander quelles garanties s’appliquent sur la fourniture et la pose.",
      "Pour une réparation après casse, demander si une mise en sécurité provisoire est possible immédiatement avant fabrication du vitrage définitif.",
      "Si le chantier concerne un logement occupé, demander les délais de prise de mesure, de fabrication et de pose, car beaucoup de vitrages ne sont pas posés en standard le jour même."
    ],
    "facteursPrix": [
      "Le type de vitrage demandé : simple vitrage, double vitrage, vitrage feuilleté, vitrage de sécurité ou pièce spéciale sur mesure.",
      "Les dimensions et la forme de la vitre : plus la découpe est grande, épaisse ou non standard, plus le prix monte.",
      "La complexité de pose : accès en hauteur, intervention en urgence, dépose d’un ancien châssis ou reprise d’étanchéité.",
      "La nécessité d’une fabrication en atelier ou d’une restauration spécifique, qui allonge le délai et augmente la main-d’œuvre."
    ],
    "faq": [
      {
        "q": "Un vitrier peut-il remplacer une vitre cassée en urgence ?",
        "a": "Oui, il peut généralement faire une mise en sécurité provisoire puis poser le vitrage définitif après fabrication ou commande."
      },
      {
        "q": "Quelle différence entre vitrier, miroitier et vitrailliste ?",
        "a": "Le vitrier pose et remplace des vitrages, le miroitier travaille aussi des ensembles verriers d’agencement, et le vitrailliste réalise ou restaure des vitraux."
      },
      {
        "q": "Quel diplôme est le plus directement مرتبط au métier de vitrailliste ?",
        "a": "Le diplôme de référence cité pour le vitrailliste est le CAP arts et techniques du verre option vitrailliste."
      },
      {
        "q": "Existe-t-il un label obligatoire pour un vitrier en France ?",
        "a": "Il n’existe pas de label obligatoire unique pour tous les vitriers ; en revanche, des qualifications comme Qualibat ou des certificats de qualification comme le CQP Technicien vitrage peuvent être pertinents selon l’activité."
      }
    ],
    "sources": [
      "https://www.institut-savoirfaire.fr/les-metiers-dart/architecture-et-patrimoine-bati/maitre-verrier-vitrailliste",
      "https://www.francecompetences.fr/recherche/rncp/39214/",
      "https://www.worldskills-france.org/metiers/miroiterie/",
      "https://cerfav.fr/formations/apprentissage/"
    ],
    "retrievedAt": "2026-07-26"
  }
};
