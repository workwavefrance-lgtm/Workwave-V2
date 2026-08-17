// Prix sourcés via Perplexity API (recherche web + citations) · généré le 2026-07-26.
// NE PAS éditer à la main : relancer `npx tsx scripts/fetch-sourced-prices.ts`.
// Respecte « zéro chiffre inventé » : chiffres issus de sources web réelles, citées.

export type SourcedPrice = { label: string; range: string };
export type SourcedPriceEntry = { ranges: SourcedPrice[]; sources: string[]; retrievedAt: string };

export const SOURCED_PRICES: Record<string, SourcedPriceEntry> = {
  "plombier": {
    "ranges": [
      {
        "label": "Intervention de dépannage simple",
        "range": "80 € à 180 €"
      },
      {
        "label": "Recherche de fuite non destructive",
        "range": "150 € à 600 €"
      },
      {
        "label": "Remplacement de chauffe-eau électrique",
        "range": "500 € à 1 200 €"
      },
      {
        "label": "Rénovation complète de salle de bain",
        "range": "5 000 € à 15 000 €"
      },
      {
        "label": "Débouchage de canalisation",
        "range": "100 € à 220 €"
      }
    ],
    "sources": [
      "https://travaux.obat.fr/guides/tarif-plombier/",
      "https://lecoinrenov.fr/guide-prix/prix-plombier",
      "https://www.tolteck.com/fr-fr/combien-coute-une-main-doeuvre-de-plombier-en-2026/",
      "https://www.ootravaux.fr/installation-entretien/plomberie/tarifs-plomberie.html"
    ],
    "retrievedAt": "2026-05-31"
  },
  "electricien": {
    "ranges": [
      {
        "label": "Diagnostic et dépannage simple",
        "range": "100 € à 300 €"
      },
      {
        "label": "Remplacement d'un disjoncteur",
        "range": "100 € à 180 €"
      },
      {
        "label": "Pose de prise (par unité)",
        "range": "60 € à 150 €"
      },
      {
        "label": "Mise aux normes NF C 15-100 (100 m²)",
        "range": "5 000 € à 12 000 €"
      },
      {
        "label": "Tableau électrique complet",
        "range": "1 000 € à 2 000 €"
      }
    ],
    "sources": [
      "https://izi-by-edf.fr/blog/tarif-horaire-electricien/",
      "https://www.travaux.com/electricite/guide-des-prix/prix-dun-electricien",
      "https://travaux.obat.fr/guides/prix-electricien/",
      "https://newelec13.fr/blog/prix-electricien-2026-tarifs-devis"
    ],
    "retrievedAt": "2026-05-31"
  },
  "macon": {
    "ranges": [
      {
        "label": "Terrasse béton (par m²)",
        "range": "70 € à 150 €"
      },
      {
        "label": "Ouverture mur porteur",
        "range": "1 500 € à 8 000 €"
      },
      {
        "label": "Ravalement de façade (par m²)",
        "range": "40 € à 150 €"
      },
      {
        "label": "Extension maison (par m²)",
        "range": "1 200 € à 2 500 €"
      },
      {
        "label": "Pose de parpaings (par m²)",
        "range": "50 € à 120 €"
      }
    ],
    "sources": [
      "https://www.prix-pose.com/ouverture-mur-porteur",
      "https://www.tactidevis.fr/bareme-prix-artisan-btp-2026",
      "https://www.ootravaux.fr/construction-renovation/maconnerie-fondations/maconnerie/maconnerie-prix.html",
      "https://www.obat.fr/blog/tarifs-btp/"
    ],
    "retrievedAt": "2026-05-31"
  },
  "peintre": {
    "ranges": [
      {
        "label": "Peinture mur (par m²)",
        "range": "20 € à 30 €"
      },
      {
        "label": "Peinture plafond (par m²)",
        "range": "30 € à 40 €"
      },
      {
        "label": "Pièce complète (10-15 m²)",
        "range": "1 200 € à 1 900 €"
      },
      {
        "label": "Ravalement façade (par m²)",
        "range": "35 € à 70 €"
      },
      {
        "label": "Pose papier peint (par m²)",
        "range": "20 € à 40 €"
      }
    ],
    "sources": [
      "https://www.helloartisan.com/guide-prix-travaux/tarifs-peintres-professionnels",
      "https://www.monsieurpeinture.com/blog-prix-travaux-de-peinture/",
      "https://chantierflow.com/blog/modele-devis-peinture-batiment",
      "https://facadecolorizer.com/blog/artisan-peintre-pricing-strategie-grille-2026"
    ],
    "retrievedAt": "2026-05-31"
  },
  "carreleur": {
    "ranges": [
      {
        "label": "Pose de carrelage au sol (par m²)",
        "range": "60 € à 120 €"
      },
      {
        "label": "Faïence murale (par m²)",
        "range": "70 € à 140 €"
      },
      {
        "label": "Carrelage grand format (par m²)",
        "range": "90 € à 170 €"
      },
      {
        "label": "Douche à l'italienne complète",
        "range": "2 500 € à 6 000 €"
      },
      {
        "label": "Carrelage extérieur (par m²)",
        "range": "55 € à 120 €"
      }
    ],
    "sources": [
      "https://workwave.fr/blog/prix-pose-carrelage-au-m2-en-2026-sol-mur-salle-de-bain-toutes-fourchettes",
      "https://www.travauxbtp.fr/blog/tarif-carreleur",
      "https://www.habitatpresto.com/mag/revetement/sol/prix-pose-carrelage-sol-m2",
      "https://travaux.obat.fr/guides/tarif-carreleur-m2/"
    ],
    "retrievedAt": "2026-05-31"
  },
  "menuisier": {
    "ranges": [
      {
        "label": "Pose de fenêtre (par fenêtre)",
        "range": "250 € à 800 €"
      },
      {
        "label": "Escalier sur mesure",
        "range": "1 500 € à 7 000 €"
      },
      {
        "label": "Pose de parquet (par m²)",
        "range": "20 € à 40 €"
      },
      {
        "label": "Placard sur mesure",
        "range": "800 € à 2 000 €"
      },
      {
        "label": "Porte intérieure pose comprise",
        "range": "150 € à 350 €"
      }
    ],
    "sources": [
      "https://www.meilleursartisans.com/tarif-menuisier-2/",
      "https://batisigne.com/blog/devis-menuisier",
      "https://www.ootravaux.fr/construction-renovation/menuiserie/fenetres/pros-tarifs/tarif-horaire-menuisier.html",
      "https://www.prix-pose.com/fenetre"
    ],
    "retrievedAt": "2026-05-31"
  },
  "couvreur": {
    "ranges": [
      {
        "label": "Réfection complète de toiture (par m²)",
        "range": "130 € à 260 €"
      },
      {
        "label": "Réparation de tuiles",
        "range": "30 € à 70 €"
      },
      {
        "label": "Pose de gouttières (par mètre linéaire)",
        "range": "50 € à 120 €"
      },
      {
        "label": "Pose de Velux",
        "range": "700 € à 1 500 €"
      },
      {
        "label": "Démoussage de toiture (par m²)",
        "range": "6 € à 20 €"
      }
    ],
    "sources": [
      "https://www.helloartisan.com/guide-prix-travaux/tarif-toiture-m2",
      "https://travaux.obat.fr/guides/prix-couvreur/",
      "https://www.ootravaux.fr/construction-renovation/toiture/couverture/travaux-toiture/tarif-couvreur.html",
      "https://www.ed-ouest.fr/blog/quel-prix-pour-refaire-une-toiture-de-100-m%C2%B2-en-2026-guide-complet/"
    ],
    "retrievedAt": "2026-05-31"
  },
  "chauffagiste": {
    "ranges": [
      {
        "label": "Entretien annuel de chaudière",
        "range": "90 € à 200 €"
      },
      {
        "label": "Installation de chaudière gaz",
        "range": "800 € à 2 200 €"
      },
      {
        "label": "Pompe à chaleur air/eau",
        "range": "8 000 € à 16 000 €"
      },
      {
        "label": "Remplacement de chauffe-eau",
        "range": "150 € à 500 €"
      },
      {
        "label": "Désembouage du circuit",
        "range": "280 € à 800 €"
      }
    ],
    "sources": [
      "https://travaux.obat.fr/guides/tarif-chauffagiste/",
      "https://www.hellowatt.fr/chaudiere/entretien-chaudiere/prix-entretien-chaudiere",
      "https://www.laprimeenergie.fr/les-travaux/la-chaudiere/lentretien-annuel",
      "https://www.travaux.com/chauffage/guide-des-prix/combien-coute-lentretien-dune-chaudiere"
    ],
    "retrievedAt": "2026-05-31"
  },
  "jardinage": {
    "ranges": [
      {
        "label": "Tonte de pelouse (par heure)",
        "range": "25 € à 45 €"
      },
      {
        "label": "Taille de haie (par mètre linéaire)",
        "range": "5 € à 15 €"
      },
      {
        "label": "Élagage d'arbre",
        "range": "75 € à 500 €"
      },
      {
        "label": "Entretien régulier (forfait mensuel)",
        "range": "35 € à 125 €"
      },
      {
        "label": "Création de massif",
        "range": "150 € à 600 €"
      }
    ],
    "sources": [
      "https://travaux.obat.fr/guides/prix-entretien-jardin/",
      "https://www.travaux.com/jardin-et-exterieur/guide-des-prix/prix-de-tonte-de-la-pelouse",
      "https://www.elagage.com/tarif-jardinier/",
      "https://www.ootravaux.fr/amenagement-exterieur/jardin/entretien/prix-tonte-pelouse.html"
    ],
    "retrievedAt": "2026-05-31"
  },
  "menage": {
    "ranges": [
      {
        "label": "Ménage régulier à domicile (par heure)",
        "range": "25 € à 35 €"
      },
      {
        "label": "Nettoyage complet de printemps",
        "range": "35 € à 55 €"
      },
      {
        "label": "Ménage après travaux",
        "range": "45 € à 70 €"
      },
      {
        "label": "Lavage de vitres (par m²)",
        "range": "5 € à 10 €"
      },
      {
        "label": "Repassage à domicile (par heure)",
        "range": "20 € à 30 €"
      }
    ],
    "sources": [
      "https://www.ozzeo.fr/menage-a-domicile-guide-complet/",
      "https://www.business-entreprises.fr/prix-menage-domicile-france/",
      "https://www.wecasa.fr/femme-menage-domicile/articles/tarifs-prix",
      "https://akad-domateam.net/formation-professionnelle/tarif-aide-menagere-a-domicile/"
    ],
    "retrievedAt": "2026-05-31"
  },
  "soutien-scolaire": {
    "ranges": [
      {
        "label": "Cours particulier primaire (par heure)",
        "range": "15 € à 25 €"
      },
      {
        "label": "Cours particulier collège (par heure)",
        "range": "20 € à 30 €"
      },
      {
        "label": "Cours particulier lycée (par heure)",
        "range": "25 € à 40 €"
      },
      {
        "label": "Préparation au brevet ou baccalauréat",
        "range": "31 € à 57 €"
      },
      {
        "label": "Stage intensif vacances (semaine)",
        "range": "350 € à 700 €"
      }
    ],
    "sources": [
      "https://cours-legendre.fr/tarif-cours-particuliers/",
      "https://www.superprof.fr/blog/prix-cours-particuliers/",
      "https://www.tutoreo.fr/guides/tarifs-cours-particuliers",
      "https://www.acces-sap.com/particuliers/tarifs/soutien-scolaire-cours-particuliers-domicile/"
    ],
    "retrievedAt": "2026-05-31"
  },
  "garde-enfants": {
    "ranges": [
      {
        "label": "Garde à domicile (par heure)",
        "range": "12,89 € à 17,00 €"
      },
      {
        "label": "Sortie d'école + goûter (par jour)",
        "range": "28 € à 52 €"
      },
      {
        "label": "Babysitting soirée",
        "range": "15 € à 25 €"
      },
      {
        "label": "Garde partagée (par famille)",
        "range": "8 € à 12 €"
      },
      {
        "label": "Garde de nuit ou week-end",
        "range": "18 € à 30 €"
      }
    ],
    "sources": [
      "https://mmfuturemaman.fr/taux-horaire-garde-enfants-2026.php",
      "https://petite-enfance50.fr/wp-content/uploads/2026/03/Tarifs-et-indemnites-au-1-avril-2026.pdf",
      "https://parent-employeur-zen.com/actualites/garde-a-domicile-les-changements-de-2026/",
      "https://www.urssaf.fr/accueil/actualites/particuliers-evolutions-minimas.html"
    ],
    "retrievedAt": "2026-05-31"
  },
  "aide-seniors": {
    "ranges": [
      {
        "label": "Aide à domicile (par heure)",
        "range": "25 € à 35 €"
      },
      {
        "label": "Aide à la toilette",
        "range": "30 € à 45 €"
      },
      {
        "label": "Accompagnement RDV médical",
        "range": "35 € à 55 €"
      },
      {
        "label": "Garde de jour ponctuelle",
        "range": "120 € à 220 €"
      },
      {
        "label": "Forfait mensuel régulier",
        "range": "900 € à 2 300 €"
      }
    ],
    "sources": [
      "https://www.capretraite.fr/aide-a-domicile/perte-dautonomie/aide-a-domicile-tarif-et-aides-financieres-pour-les-personnes-agees/",
      "https://carezy.fr/blog/aide-a-domicile-tarif-2026",
      "https://www.trouver-maison-de-retraite.fr/aides-et-subventions/tarifs-aide-a-domicile-prix-par-heure-de-quoi-depend-le-cout-et-combien-il-reste-a-payer/",
      "https://www.bonjoursenior.fr/guides/tarif-aide-domicile"
    ],
    "retrievedAt": "2026-05-31"
  },
  "architecte": {
    "ranges": [
      {
        "label": "Dépôt de permis de construire",
        "range": "1 500 € à 4 500 € TTC"
      },
      {
        "label": "Mission complète de maîtrise d'œuvre (% du coût des travaux)",
        "range": "8 % à 15 % du coût total HT des travaux"
      },
      {
        "label": "Plans d'avant-projet (esquisse)",
        "range": "25 € à 70 € / m²"
      },
      {
        "label": "Étude de faisabilité",
        "range": "500 € à 1 200 € TTC"
      },
      {
        "label": "Suivi de chantier (honoraires)",
        "range": "3 % à 7 % du montant HT des travaux"
      }
    ],
    "sources": [
      "https://architecteo.com/prix-architecte.html",
      "https://www.plans-projets-immo.fr/prix-permis-de-construire-tarif-dossier",
      "https://demande-de-permis.fr/blog/prix-architecte-permis-construire",
      "https://www.permisdeconstruire-archi.fr/post/quel-est-le-prix-d-un-architecte-pour-un-permis-de-construire"
    ],
    "retrievedAt": "2026-07-26"
  },
  "ascensoriste": {
    "ranges": [
      {
        "label": "Contrat d'entretien annuel d'ascenseur",
        "range": "1 500 € à 3 000 €"
      },
      {
        "label": "Dépannage d'ascenseur en urgence",
        "range": "250 € à 700 €"
      },
      {
        "label": "Remplacement de câbles",
        "range": "2 000 € à 5 000 €"
      },
      {
        "label": "Modernisation d'ascenseur",
        "range": "10 000 € à 30 000 €"
      },
      {
        "label": "Installation d'un monte-escalier",
        "range": "3 500 € à 8 000 €"
      }
    ],
    "sources": [
      "https://fiche-paie.fr/metier/technicien-de-maintenance-ascenseurs",
      "https://workwave.fr/guide-des-prix/prix-maintenance-ascenseur",
      "https://www.travaux.com/ascenseurs/guide-des-prix/prix-maintenance-ascenseur",
      "https://servicesartisans.fr/tarifs/ascensoriste"
    ],
    "retrievedAt": "2026-07-26"
  },
  "charpentier": {
    "ranges": [
      {
        "label": "Charpente traditionnelle (par m²)",
        "range": "150 € à 250 €"
      },
      {
        "label": "Charpente fermette industrielle (par m²)",
        "range": "80 € à 120 €"
      },
      {
        "label": "Réparation de charpente",
        "range": "100 € à 300 €"
      },
      {
        "label": "Traitement des bois de charpente (par m²)",
        "range": "25 € à 50 €"
      },
      {
        "label": "Ossature bois (par m²)",
        "range": "180 € à 280 €"
      }
    ],
    "sources": [
      "https://www.prix-pose.com/charpente",
      "https://travaux.obat.fr/guides/prix-charpente-m2/",
      "https://rairies-facade.fr/charpente-prix-au-m2/",
      "https://abctravaux.org/prix-charpente/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "climaticien": {
    "ranges": [
      {
        "label": "Installation d'un climatiseur mono-split",
        "range": "1 500 € à 3 500 €"
      },
      {
        "label": "Installation d'une climatisation multi-split",
        "range": "4 500 € à 9 000 €"
      },
      {
        "label": "Entretien annuel de climatisation",
        "range": "100 € à 180 €"
      },
      {
        "label": "Recharge de fluide frigorigène",
        "range": "150 € à 350 €"
      },
      {
        "label": "Dépannage de climatisation",
        "range": "100 € à 250 €"
      }
    ],
    "sources": [
      "https://meilleur-devis.fr/blog/article/devis-climatisation-combien-ca-coute",
      "https://www.lesinstallateurs.fr/blog/prix-climatisation-maison-2026",
      "https://www.lamaisonsaintgobain.fr/guides-travaux/tout-savoir-sur-le-chauffage-et-la-ventilation/prix-pose-climatisation",
      "https://ifaitchaud.com/prix/installation-climatisation/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "cuisiniste": {
    "ranges": [
      {
        "label": "Cuisine équipée sur mesure (entrée de gamme)",
        "range": "7 000 € à 12 000 €"
      },
      {
        "label": "Cuisine équipée haut de gamme",
        "range": "12 000 € à 25 000 €"
      },
      {
        "label": "Pose de cuisine seule (main d'œuvre)",
        "range": "500 € à 3 000 €"
      },
      {
        "label": "Plan de travail sur mesure (par mètre linéaire)",
        "range": "300 € à 900 €"
      },
      {
        "label": "Rénovation complète de cuisine",
        "range": "18 000 € à 35 000 €"
      }
    ],
    "sources": [
      "https://travaux.obat.fr/guides/prix-cuisine-equipee/",
      "https://www.prix-travaux.fr/prix-cuisine/",
      "https://www.brickrenovation.com/post/prix-cuisine-equipee-2026",
      "https://www.lejustepro.com/guides/cout-cuisine-equipee"
    ],
    "retrievedAt": "2026-07-26"
  },
  "decorateur-interieur": {
    "ranges": [
      {
        "label": "Consultation de décoration (par heure)",
        "range": "80 € à 150 €"
      },
      {
        "label": "Projet déco d'une pièce",
        "range": "500 € à 1 500 €"
      },
      {
        "label": "Aménagement complet d'un logement",
        "range": "2 000 € à 10 000 €"
      },
      {
        "label": "Planche tendance / moodboard",
        "range": "150 € à 500 €"
      },
      {
        "label": "Home staging avant vente",
        "range": "500 € à 3 000 €"
      }
    ],
    "sources": [
      "https://www.travaux.com/construction-renovation-maison/guide-des-prix/prix-decorateur",
      "https://www.studiokova.fr/blog/prix-decorateur-interieur",
      "https://travaux.obat.fr/guides/tarif-decorateur-interieur/",
      "https://www.decomalice.fr/combien-coute-un-decorateur-dinterieur-en-france/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "diagnostic-immobilier": {
    "ranges": [
      {
        "label": "Diagnostic de performance énergétique (DPE)",
        "range": "100 € à 250 €"
      },
      {
        "label": "Pack diagnostics complet pour une vente",
        "range": "300 € à 600 €"
      },
      {
        "label": "Diagnostic amiante",
        "range": "80 € à 150 €"
      },
      {
        "label": "Diagnostic plomb (CREP)",
        "range": "100 € à 200 €"
      },
      {
        "label": "Diagnostic termites",
        "range": "100 € à 180 €"
      }
    ],
    "sources": [
      "https://sgl-immo.com/actualites/combien-coute-dpe-2026/",
      "https://servicesartisans.fr/devis/diagnostiqueur",
      "https://www.hellowatt.fr/renovation/diagnostic-performance-energetique/prix",
      "https://www.ootravaux.fr/guide-construction/demarches-et-formalites/diagnostics-immobiliers/prix-dpe.html"
    ],
    "retrievedAt": "2026-07-26"
  },
  "elagueur": {
    "ranges": [
      {
        "label": "Élagage d'un arbre (selon la hauteur)",
        "range": "80 € à 1 800 €"
      },
      {
        "label": "Abattage d'un arbre",
        "range": "200 € à 3 000 €"
      },
      {
        "label": "Taille de haie (par mètre linéaire)",
        "range": "5 € à 20 €"
      },
      {
        "label": "Rognage de souche",
        "range": "100 € à 500 €"
      },
      {
        "label": "Évacuation des déchets verts",
        "range": "100 € à 300 €"
      }
    ],
    "sources": [
      "https://blog.pro-jardins-services.fr/devis-elagage-arbre-en-2026/",
      "https://mon-elagueur.fr/budget-devis/prix-elagage-tarifs-astuces-economiser/",
      "https://www.prix-pose.com/elagage",
      "https://france-elagage.fr/prix-elagage-arbre-en-france"
    ],
    "retrievedAt": "2026-07-26"
  },
  "facadier": {
    "ranges": [
      {
        "label": "Ravalement de façade (par m²)",
        "range": "30 € à 100 €"
      },
      {
        "label": "Ravalement avec isolation extérieure ITE (par m²)",
        "range": "120 € à 220 €"
      },
      {
        "label": "Nettoyage de façade (par m²)",
        "range": "10 € à 35 €"
      },
      {
        "label": "Application d'un enduit de façade (par m²)",
        "range": "30 € à 80 €"
      },
      {
        "label": "Traitement hydrofuge anti-mousse (par m²)",
        "range": "15 € à 30 €"
      }
    ],
    "sources": [
      "https://facadecolorizer.com/blog/prix-ravalement-facade-2026",
      "https://nettoyage-entreprise-paris.com/renovation/prix-ravalement-de-facade/",
      "https://www.travaux.com/construction-renovation-maison/articles/combien-coute-un-ravalement-de-facade",
      "https://www.travauxchezmoi.fr/nos-conseils-pour-vos-projets/prix-ravalement-de-facade"
    ],
    "retrievedAt": "2026-07-26"
  },
  "videosurveillance-installateur": {
    "ranges": [
      {
        "label": "Installation d'une caméra de surveillance",
        "range": "180 € à 450 €"
      },
      {
        "label": "Kit de vidéosurveillance 4 caméras posé",
        "range": "850 € à 1 900 €"
      },
      {
        "label": "Système d'alarme complet posé",
        "range": "900 € à 2 400 €"
      },
      {
        "label": "Pose d'un visiophone / interphone",
        "range": "350 € à 900 €"
      },
      {
        "label": "Contrat de maintenance annuel",
        "range": "120 € à 300 €"
      }
    ],
    "sources": [
      "https://www.prix-travaux-m2.com/prix-installation-videosurveillance.php",
      "https://www.meilleur-artisan.com/prix/alarme/",
      "https://prix-devis-travaux.fr/blog/prix-installation-alarme-securite-2026",
      "https://www.habitatpresto.com/mag/electricite/alarme-domotique/installateur-camera-surveillance"
    ],
    "retrievedAt": "2026-07-26"
  },
  "paysagiste": {
    "ranges": [
      {
        "label": "Création de jardin paysager (par m²)",
        "range": "50 € à 150 €"
      },
      {
        "label": "Pose de gazon en rouleau (par m²)",
        "range": "15 € à 30 €"
      },
      {
        "label": "Entretien de jardin (par heure)",
        "range": "35 € à 55 €"
      },
      {
        "label": "Taille de haie (par mètre linéaire)",
        "range": "4 € à 9 €"
      },
      {
        "label": "Aménagement de terrasse ou d'allée",
        "range": "35 € à 90 € / m²"
      }
    ],
    "sources": [
      "https://travaux.obat.fr/guides/tarif-paysagiste/",
      "https://pch-78.fr/travaux-batiment/tarif-paysagiste/",
      "https://servicesartisans.fr/blog/prix-jardinier-paysagiste-2026",
      "https://www.travauxbtp.fr/blog/devis-paysagiste-gratuit"
    ],
    "retrievedAt": "2026-07-26"
  },
  "pisciniste": {
    "ranges": [
      {
        "label": "Construction de piscine enterrée en béton",
        "range": "35 000 € à 60 000 €"
      },
      {
        "label": "Piscine coque polyester posée",
        "range": "18 000 € à 30 000 €"
      },
      {
        "label": "Rénovation de piscine / changement de liner",
        "range": "2 000 € à 5 000 €"
      },
      {
        "label": "Installation du local technique",
        "range": "1 500 € à 4 000 €"
      },
      {
        "label": "Entretien annuel de piscine",
        "range": "800 € à 2 500 €"
      }
    ],
    "sources": [
      "https://www.meilleur-artisan.com/prix/piscine/",
      "https://travaux.obat.fr/guides/tarif-pisciniste/",
      "https://www.afficheservices.fr/tarif/pisciniste",
      "https://servicesartisans.fr/tarifs/pisciniste"
    ],
    "retrievedAt": "2026-07-26"
  },
  "plaquiste": {
    "ranges": [
      {
        "label": "Pose de cloison en placo (par m²)",
        "range": "45 € à 70 €"
      },
      {
        "label": "Pose d'un faux plafond (par m²)",
        "range": "40 € à 70 €"
      },
      {
        "label": "Doublage isolant des murs (par m²)",
        "range": "45 € à 75 €"
      },
      {
        "label": "Réalisation d'un placard ou d'une niche",
        "range": "300 € à 900 €"
      },
      {
        "label": "Bandes et enduits de finition (par m²)",
        "range": "5 € à 12 €"
      }
    ],
    "sources": [
      "https://batisigne.com/blog/devis-plaquiste",
      "https://www.ootravaux.fr/construction-renovation/finitions/revetements-muraux-et-plafonds/cloison-placo/prix-plaquiste.html",
      "https://www.habitatpresto.com/mag/renovation/cloison-placo/tarif-plaquiste",
      "https://www.renovation-dany.fr/prix-dun-plaquiste-pour-poser-une-cloison-en/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "ramoneur": {
    "ranges": [
      {
        "label": "Ramonage de cheminée / conduit",
        "range": "60 € à 120 €"
      },
      {
        "label": "Ramonage de poêle à granulés",
        "range": "80 € à 150 €"
      },
      {
        "label": "Ramonage de chaudière",
        "range": "50 € à 90 €"
      },
      {
        "label": "Débistrage de conduit",
        "range": "200 € à 400 €"
      },
      {
        "label": "Certificat de ramonage",
        "range": "10 € à 30 €"
      }
    ],
    "sources": [
      "https://www.travaux.com/nettoyage/guide-des-prix/prix-dun-ramonage-dune-cheminee",
      "https://www.groupama.fr/assurance-habitation/conseils/prix-ramonage/",
      "https://www.habitatpresto.com/mag/chauffage/prix-ramonage-cheminee",
      "https://travaux.obat.fr/guides/prix-ramonage-cheminee/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "serrurier": {
    "ranges": [
      {
        "label": "Ouverture de porte claquée",
        "range": "90 € à 120 €"
      },
      {
        "label": "Ouverture de porte verrouillée",
        "range": "120 € à 200 €"
      },
      {
        "label": "Remplacement d'une serrure",
        "range": "130 € à 300 €"
      },
      {
        "label": "Installation d'une porte blindée",
        "range": "1 000 € à 1 500 €"
      },
      {
        "label": "Pose d'une serrure multipoints",
        "range": "300 € à 600 €"
      }
    ],
    "sources": [
      "https://travaux.obat.fr/guides/prix-serrurier/",
      "https://devis-gratuit-serrurier.fr/prix-serrurier-2026",
      "https://www.serrurerie-gadenne.com/blog/faq/prix-du-serrurier/",
      "https://www.meilleur-artisan.com/prix/serrurier/prix-ouverture-de-porte.814.html"
    ],
    "retrievedAt": "2026-07-26"
  },
  "terrassier": {
    "ranges": [
      {
        "label": "Terrassement (par m³)",
        "range": "30 € à 70 €"
      },
      {
        "label": "Location de mini-pelle avec chauffeur (par jour)",
        "range": "450 € à 550 €"
      },
      {
        "label": "Nivellement de terrain (par m²)",
        "range": "3 € à 6 €"
      },
      {
        "label": "Création d'une tranchée (par mètre linéaire)",
        "range": "15 € à 40 €"
      },
      {
        "label": "Évacuation de terre et gravats (par m³)",
        "range": "15 € à 30 €"
      }
    ],
    "sources": [
      "https://travaux.obat.fr/guides/prix-terrassier/",
      "https://www.mdeg-terrassement.fr/prix-terrassement-au-m---en-2026---7-facteurs-qui-font-varier-le-devis_ad32.html",
      "https://www.prix-travaux.fr/prix-terrassement/",
      "https://mft-tp.fr/prix-terrassement-m3"
    ],
    "retrievedAt": "2026-07-26"
  },
  "vitrier": {
    "ranges": [
      {
        "label": "Remplacement d'une vitre simple",
        "range": "120 € à 250 €"
      },
      {
        "label": "Remplacement d'un double vitrage",
        "range": "200 € à 500 €"
      },
      {
        "label": "Vitrage sur mesure",
        "range": "300 € à 800 €"
      },
      {
        "label": "Dépannage vitrerie en urgence",
        "range": "150 € à 300 €"
      },
      {
        "label": "Pose d'un miroir sur mesure",
        "range": "150 € à 300 €"
      }
    ],
    "sources": [
      "https://workwave.fr/guide-des-prix/prix-remplacement-vitrage",
      "https://www.travaux.com/fenetre-porte/guide-des-prix/prix-de-remplacement-dun-vitrage",
      "https://travaux.obat.fr/guides/prix-vitrier/",
      "https://servicesartisans.fr/blog/prix-vitrier-2026-remplacement-vitrage"
    ],
    "retrievedAt": "2026-07-26"
  },
  "assistance-informatique": {
    "ranges": [
      {
        "label": "Dépannage informatique à domicile (par heure)",
        "range": "60 € à 90 €"
      },
      {
        "label": "Installation et configuration d'un ordinateur",
        "range": "100 € à 150 €"
      },
      {
        "label": "Suppression de virus",
        "range": "60 € à 120 €"
      },
      {
        "label": "Installation d'une box et réseau wifi",
        "range": "80 € à 130 €"
      },
      {
        "label": "Cours d'initiation informatique (par heure)",
        "range": "30 € à 50 €"
      }
    ],
    "sources": [
      "https://www.monpro.fr/prix/informatique/prix-assistance-et-depannage-informatique-a-domicile.805.html",
      "https://andrejuncker67.com/solutions-numeriques/assistance-informatique-particuliers/",
      "https://maformatic.fr/informatique/tarif-depannage-informatique-domicile/",
      "https://yoojo.fr/informatique/guides/tarif-depannage-informatique-37"
    ],
    "retrievedAt": "2026-07-26"
  },
  "couture-retouches": {
    "ranges": [
      {
        "label": "Ourlet de pantalon",
        "range": "12 € à 22 €"
      },
      {
        "label": "Retouche d'une robe ou d'une veste",
        "range": "20 € à 40 €"
      },
      {
        "label": "Remplacement d'une fermeture éclair",
        "range": "20 € à 35 €"
      },
      {
        "label": "Cintrage / reprise d'un vêtement",
        "range": "18 € à 36 €"
      },
      {
        "label": "Retouche de robe de mariée",
        "range": "80 € à 200 €"
      }
    ],
    "sources": [
      "https://www.zonecouture.fr/blog/501-tarifs-moyens-des-retouches-en-couture-guide-complet-2026/",
      "https://yoojo.fr/aide-a-domicile/guides/prix-couturiere-tarif-prestation-678",
      "https://swakky.com/blog/guides-pratiques/couturiere-autour-de-moi-guide-2026",
      "https://renee-fashion.fr/couture-tarif-retouche-en-2026-tendances-de-prix-et-conseils-deconomies/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "debarras": {
    "ranges": [
      {
        "label": "Débarras d'appartement complet",
        "range": "600 € à 1 800 €"
      },
      {
        "label": "Débarras de cave ou de grenier",
        "range": "250 € à 700 €"
      },
      {
        "label": "Débarras de maison après succession",
        "range": "1 500 € à 3 000 €"
      },
      {
        "label": "Enlèvement d'encombrants (par m³)",
        "range": "20 € à 80 € par m³"
      },
      {
        "label": "Débarras avec nettoyage inclus",
        "range": "2 000 € à 5 000 €"
      }
    ],
    "sources": [
      "https://www.lescompagnonsdebarrasseurs.com/entreprise-de-debarras-prix-tarifs.html",
      "https://oceane-nettoyage.com/tarif-debarras/",
      "https://www.sos-nettoyage-extreme.fr/blog/prix-debarras-appartement-t3-2026",
      "https://www.mondebarrasseur.fr/etat-debarras-2026"
    ],
    "retrievedAt": "2026-07-26"
  },
  "demenagement": {
    "ranges": [
      {
        "label": "Déménagement d'un studio / T1",
        "range": "400 € à 800 €"
      },
      {
        "label": "Déménagement d'un T2 à T3",
        "range": "850 € à 1 700 €"
      },
      {
        "label": "Déménagement d'une maison (gros volume)",
        "range": "2 300 € à 5 500 €"
      },
      {
        "label": "Formule économique (par heure + camion)",
        "range": "15 € à 30 € de l'heure + 80 € à 180 €"
      },
      {
        "label": "Garde-meuble (par mois)",
        "range": "50 € à 150 €"
      }
    ],
    "sources": [
      "https://www.travaux.com/demenagement/guide-des-prix/prix-demenagement-france",
      "https://www.allodemenageur.fr/devis-demenagement/prix-demenagement-par-des-professionnels/",
      "https://zenmoov.fr/blog/prix-demenagement",
      "https://www.travizio.fr/blog/demenagement-prix"
    ],
    "retrievedAt": "2026-07-26"
  },
  "depannage-electromenager": {
    "ranges": [
      {
        "label": "Diagnostic et déplacement",
        "range": "80 € à 120 €"
      },
      {
        "label": "Réparation d'un lave-linge",
        "range": "120 € à 220 €"
      },
      {
        "label": "Réparation d'un lave-vaisselle",
        "range": "130 € à 250 €"
      },
      {
        "label": "Réparation d'un réfrigérateur",
        "range": "90 € à 170 €"
      },
      {
        "label": "Réparation d'un four ou d'une plaque",
        "range": "140 € à 240 €"
      }
    ],
    "sources": [
      "https://www.travaux.com/cuisine/guide-des-prix/prix-de-reparation-dun-appareil-electromenager",
      "https://www.adamdepannage.fr/depannage-electromenager-sur-bordeaux-cub-gironde",
      "https://www.kelyseo.com/blog/prix-travaux-electricien-2026",
      "https://www.jesuisreparateur.fr/actu/995/combien-coute-une-reparation-d-electromenager-a-domicile"
    ],
    "retrievedAt": "2026-07-26"
  },
  "nettoyage-pro": {
    "ranges": [
      {
        "label": "Nettoyage de bureaux (par m²)",
        "range": "1,50 € à 4,00 € / m²"
      },
      {
        "label": "Nettoyage de fin de chantier (par m²)",
        "range": "4,00 € à 10,00 € / m²"
      },
      {
        "label": "Nettoyage de copropriété (forfait mensuel)",
        "range": "150 € à 600 € / mois"
      },
      {
        "label": "Nettoyage de vitres professionnel",
        "range": "80 € à 250 €"
      },
      {
        "label": "Remise en état après sinistre",
        "range": "10 € à 30 € / m²"
      }
    ],
    "sources": [
      "https://www.meilleur-artisan.com/prix/nettoyage/",
      "https://groupe-france-clean.fr/expertise/prix-du-nettoyage-professionnel-au-m-en-2026-reperes-et-exemples/",
      "https://travaux.obat.fr/guides/tarif-nettoyage-m2/",
      "https://www.kelyseo.com/blog/facture-nettoyage-entreprise-locaux-tva"
    ],
    "retrievedAt": "2026-07-26"
  },
  "livraison-de-courses": {
    "ranges": [
      {
        "label": "Livraison de courses (par course)",
        "range": "24 € à 37 €"
      },
      {
        "label": "Abonnement livraison hebdomadaire",
        "range": "12 € à 20 € par mois"
      },
      {
        "label": "Courses et portage à domicile pour senior",
        "range": "18 € à 35 €"
      },
      {
        "label": "Livraison express",
        "range": "8 € à 15 €"
      },
      {
        "label": "Forfait courses + pharmacie",
        "range": "30 € à 55 €"
      }
    ],
    "sources": [
      "https://yoojo.fr/aide-a-domicile/guides/prix-livraison-courses-a-domicile-cocreb2-616",
      "https://rmc.bfmtv.com/conso/conseils-d-achat/mieux-consommer/livraison-de-courses-a-domicile-que-proposent-les-enseignes-et-quelles-sont-les-plus-avantageuses_AN-202404100629.html",
      "https://willyantigaspi.fr/blogs/infos/livraison-courses-moins-cher",
      "https://fr.accio.com/biz-cheap/livraison-courses-pas-cher"
    ],
    "retrievedAt": "2026-07-26"
  },
  "manutention": {
    "ranges": [
      {
        "label": "Aide au chargement / déchargement (par heure)",
        "range": "60 € à 90 €"
      },
      {
        "label": "Portage de meubles lourds",
        "range": "100 € à 180 €"
      },
      {
        "label": "Manutention à deux personnes (par heure)",
        "range": "120 € à 180 €"
      },
      {
        "label": "Débarras avec manutention",
        "range": "250 € à 600 €"
      },
      {
        "label": "Location de main d'œuvre à la journée",
        "range": "450 € à 900 €"
      }
    ],
    "sources": [
      "https://les-artisans.fr/prix-dun-artisan-en-2026/",
      "https://www.plus-que-pro.fr/professionnels/manutentionnaire/devis/",
      "https://innovia-transport.com/grille-tarifaire-transport-palette",
      "https://servicesartisans.fr/tarifs"
    ],
    "retrievedAt": "2026-07-26"
  },
  "montage-meubles": {
    "ranges": [
      {
        "label": "Montage d'un meuble (par meuble)",
        "range": "30 € à 80 €"
      },
      {
        "label": "Montage d'une cuisine en kit",
        "range": "300 € à 600 €"
      },
      {
        "label": "Montage d'une armoire ou d'un dressing",
        "range": "80 € à 300 €"
      },
      {
        "label": "Fixation murale (TV, étagères)",
        "range": "25 € à 60 €"
      },
      {
        "label": "Montage de mobilier de jardin",
        "range": "50 € à 150 €"
      }
    ],
    "sources": [
      "https://swakky.com/blog/guides-pratiques/montage-meuble-prix-astuces-guide-1765115702",
      "https://monte-facile.fr/prix-monte-meuble.html",
      "https://www.taskrabbit.fr/guides-des-couts/montage-meubles",
      "https://www.needhelp.com/content/montage-meuble"
    ],
    "retrievedAt": "2026-07-26"
  },
  "multiservice": {
    "ranges": [
      {
        "label": "Intervention homme toutes mains (par heure)",
        "range": "25 € à 45 € TTC"
      },
      {
        "label": "Petits travaux de plomberie",
        "range": "100 € à 250 € TTC"
      },
      {
        "label": "Petits travaux d'électricité",
        "range": "80 € à 200 € TTC"
      },
      {
        "label": "Retouches de peinture",
        "range": "150 € à 350 € TTC"
      },
      {
        "label": "Forfait demi-journée",
        "range": "140 € à 220 € TTC"
      }
    ],
    "sources": [
      "https://avis-services.fr/blog/homme-toutes-mains-tarifs/",
      "https://servicesartisans.fr/tarifs",
      "https://www.hellomybusiness.fr/article/tarif-horaire-artisan-multiservice-prix-moyens-conseils-auto-entrepreneurs",
      "https://www.obat.fr/blog/tarifs-btp/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "nettoyage-vitres": {
    "ranges": [
      {
        "label": "Nettoyage de vitres (par m²)",
        "range": "4 € à 8 € par m²"
      },
      {
        "label": "Vitres et volets roulants",
        "range": "80 € à 160 €"
      },
      {
        "label": "Nettoyage de baie vitrée ou véranda",
        "range": "100 € à 200 €"
      },
      {
        "label": "Vitrerie en hauteur (à la perche)",
        "range": "7 € à 12 € par m²"
      },
      {
        "label": "Forfait maison complète",
        "range": "150 € à 300 €"
      }
    ],
    "sources": [
      "https://abby.fr/guide/micro-entreprise/tarif-laveur-vitres-auto-entrepreneur",
      "https://megd.fr/prix-dun-nettoyage-de-vitres-professionnel/",
      "https://galognese.fr/guide/laveur-de-vitres",
      "https://www.vitrissimo.fr/prix-tarif-nettoyage-vitre/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "petit-bricolage": {
    "ranges": [
      {
        "label": "Intervention de bricolage (par heure)",
        "range": "35 € à 60 €"
      },
      {
        "label": "Pose d'étagères ou de tringles",
        "range": "60 € à 120 €"
      },
      {
        "label": "Petits travaux de plomberie",
        "range": "90 € à 160 €"
      },
      {
        "label": "Changement d'un luminaire",
        "range": "70 € à 130 €"
      },
      {
        "label": "Forfait demi-journée",
        "range": "180 € à 300 €"
      }
    ],
    "sources": [
      "https://www.needhelp.com/content/article/petits-travaux",
      "https://akad-domateam.net/formation-professionnelle/petits-travaux-a-domicile-remunere/",
      "https://akad-domateam.net/formation-professionnelle/bricolage-a-domicile-tarif/",
      "https://servicesartisans.fr/tarifs"
    ],
    "retrievedAt": "2026-07-26"
  },
  "repassage": {
    "ranges": [
      {
        "label": "Repassage à domicile (par heure)",
        "range": "15 € à 35 €"
      },
      {
        "label": "Panier de repassage (forfait)",
        "range": "25 € à 60 €"
      },
      {
        "label": "Repassage et pliage",
        "range": "20 € à 45 €"
      },
      {
        "label": "Abonnement mensuel de repassage",
        "range": "80 € à 250 €"
      },
      {
        "label": "Repassage de linge délicat",
        "range": "18 € à 40 €"
      }
    ],
    "sources": [
      "https://www.kareca.fr/repassage-domicile-tarif-combien-ca-coute/",
      "https://www.travaux.com/nettoyage/guide-des-prix/prix-dune-femme-de-menage",
      "https://www.bonjoursenior.fr/repassage-a-domicile",
      "https://yoojo.fr/menage/guides/tarif-repassage-12"
    ],
    "retrievedAt": "2026-07-26"
  },
  "traitement-nuisibles": {
    "ranges": [
      {
        "label": "Traitement anti-cafards / blattes",
        "range": "180 € à 300 €"
      },
      {
        "label": "Désinsectisation punaises de lit",
        "range": "500 € à 800 €"
      },
      {
        "label": "Dératisation",
        "range": "150 € à 500 €"
      },
      {
        "label": "Destruction de nid de guêpes ou frelons",
        "range": "100 € à 250 €"
      },
      {
        "label": "Traitement anti-termites",
        "range": "2 500 € à 5 000 €"
      }
    ],
    "sources": [
      "https://www.travaux.com/traitement-des-nuisibles/guide-des-prix/prix-deratisation",
      "https://solution-nuisible.fr/guides-conseils/rat/prix-deratisation/",
      "https://www.prix-pose.com/deratisation",
      "https://www.deratiseur.com/prix-deratisation"
    ],
    "retrievedAt": "2026-07-26"
  },
  "accompagnement-handicap": {
    "ranges": [
      {
        "label": "Aide à domicile handicap (par heure)",
        "range": "22 € à 30 €"
      },
      {
        "label": "Accompagnement aux sorties",
        "range": "30 € à 50 €"
      },
      {
        "label": "Aide à la toilette et à l'habillage",
        "range": "25 € à 35 €"
      },
      {
        "label": "Garde de jour",
        "range": "120 € à 220 €"
      },
      {
        "label": "Forfait mensuel régulier",
        "range": "300 € à 2 500 €"
      }
    ],
    "sources": [
      "https://akad-domateam.net/formation-professionnelle/societe-aide-a-domicile/",
      "https://www.elite-handicap.fr/nos-tarifs",
      "https://servicesartisans.fr/tarifs",
      "https://exosept.fr/aide-accompagnement-et-services-autonomie-a-domicile-quels-prix-pour-2026/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "aide-administrative": {
    "ranges": [
      {
        "label": "Aide aux démarches administratives (par heure)",
        "range": "35 € à 55 €"
      },
      {
        "label": "Rédaction de courriers",
        "range": "25 € à 45 €"
      },
      {
        "label": "Aide à la déclaration d'impôts",
        "range": "60 € à 120 €"
      },
      {
        "label": "Classement et gestion de dossiers",
        "range": "30 € à 50 €"
      },
      {
        "label": "Forfait mensuel",
        "range": "300 € à 1 500 €"
      }
    ],
    "sources": [
      "https://ereia.fr/blog/assistante-administrative-independante-tarifs-2026/",
      "https://keltirage.com/societe/quel-est-le-tarif-dun-assistant-administratif-externalise.php",
      "https://officeopro.com/tarifs-prestation-services-administratifs/",
      "https://www.3h18.fr/blog/prestation-service-administratif"
    ],
    "retrievedAt": "2026-07-26"
  },
  "coach-sportif": {
    "ranges": [
      {
        "label": "Séance de coaching individuel",
        "range": "40 € à 80 €"
      },
      {
        "label": "Pack de 10 séances",
        "range": "350 € à 700 €"
      },
      {
        "label": "Coaching à domicile",
        "range": "65 € à 100 €"
      },
      {
        "label": "Coaching en visio",
        "range": "30 € à 60 €"
      },
      {
        "label": "Programme personnalisé mensuel",
        "range": "50 € à 150 €"
      }
    ],
    "sources": [
      "https://www.homefitness-coaching.com/blog/combien-coute-coach-sportif-france-2026",
      "https://briostudios.io/blog/tarifs-coach-sportif-independant-la-grille-complete-2026-et-comment-fixer-vos-prix",
      "https://www.stridecoach.fr/blog/tarifs-coaching-sportif-france-2026",
      "https://coach-de-sport.com/tarifs-coach-sportif/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "coiffure-domicile": {
    "ranges": [
      {
        "label": "Coupe femme à domicile",
        "range": "30 € à 50 €"
      },
      {
        "label": "Coupe homme à domicile",
        "range": "18 € à 25 €"
      },
      {
        "label": "Couleur ou mèches",
        "range": "55 € à 95 €"
      },
      {
        "label": "Coupe et brushing",
        "range": "35 € à 65 €"
      },
      {
        "label": "Chignon / coiffure de mariage",
        "range": "90 € à 120 €"
      }
    ],
    "sources": [
      "https://sloxo.app/blog/tarifs/tarif-coiffeuse-a-domicile",
      "https://avis-services.fr/blog/meilleur-service-coiffure-domicile/",
      "https://hkcoiffure.com/metier-salon/coiffeur-a-domicile-a-proximite/",
      "https://www.wecasa.fr/coiffure-domicile/articles/prix-coupe-cheveux"
    ],
    "retrievedAt": "2026-07-26"
  },
  "cours-musique": {
    "ranges": [
      {
        "label": "Cours de piano (par heure)",
        "range": "30 € à 50 €"
      },
      {
        "label": "Cours de guitare (par heure)",
        "range": "30 € à 45 €"
      },
      {
        "label": "Cours de chant (par heure)",
        "range": "35 € à 60 €"
      },
      {
        "label": "Cours de solfège",
        "range": "25 € à 40 €"
      },
      {
        "label": "Forfait mensuel (4 cours)",
        "range": "120 € à 220 €"
      }
    ],
    "sources": [
      "https://www.solfeo.fr/guides/donner-cours-de-musique",
      "https://www.voscours.fr/blog/statistiques-prix-cours-particuliers-france",
      "https://yoojo.fr/cours-particuliers/guides/cours-particuliers-musique-education-musicale-tarif-cocrmpg5-727",
      "https://www.superprof.fr/cours/musique/france/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "cours-particuliers": {
    "ranges": [
      {
        "label": "Cours particulier niveau primaire (par heure)",
        "range": "25 € à 35 €"
      },
      {
        "label": "Cours particulier niveau collège (par heure)",
        "range": "30 € à 40 €"
      },
      {
        "label": "Cours particulier niveau lycée (par heure)",
        "range": "35 € à 50 €"
      },
      {
        "label": "Cours de langue (par heure)",
        "range": "30 € à 45 €"
      },
      {
        "label": "Stage intensif (semaine)",
        "range": "250 € à 500 €"
      }
    ],
    "sources": [
      "https://www.tutoreo.fr/guides/tarifs-cours-particuliers",
      "https://mon-prof.fr/blog/prix-cours-particuliers-combien-coute/",
      "https://cours-legendre.fr/tarif-cours-particuliers/",
      "https://www.eduboost.ai/fr/blog/prix-cours-particulier-france-2026"
    ],
    "retrievedAt": "2026-07-26"
  },
  "esthetique-domicile": {
    "ranges": [
      {
        "label": "Épilation à domicile",
        "range": "15 € à 35 €"
      },
      {
        "label": "Soin du visage",
        "range": "50 € à 75 €"
      },
      {
        "label": "Manucure / pose de vernis",
        "range": "20 € à 40 €"
      },
      {
        "label": "Maquillage (événement ou mariage)",
        "range": "45 € à 90 €"
      },
      {
        "label": "Forfait beauté complet",
        "range": "50 € à 70 €"
      }
    ],
    "sources": [
      "https://caroline-estheticienne.fr/beaute/estheticienne-a-domicile-pres-de-chez-moi/",
      "https://jardindelabeaute-institut.fr/beaute/soins-esthetiques-a-domicile/",
      "https://gestea-senior.fr/tarif-estheticienne-a-domicile-prix-reels-en-2026/",
      "https://caroline-estheticienne.fr/beaute/esthetique-domicile-tarifs-conseils-estheticienne/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "garde-animaux": {
    "ranges": [
      {
        "label": "Garde d'animaux à domicile (par jour)",
        "range": "25 € à 45 €"
      },
      {
        "label": "Pension pour chien (par nuit)",
        "range": "30 € à 50 €"
      },
      {
        "label": "Visite à domicile (par visite)",
        "range": "12 € à 20 €"
      },
      {
        "label": "Garde de chat pendant les vacances",
        "range": "105 € à 175 €"
      },
      {
        "label": "Pet-sitting longue durée (forfait semaine)",
        "range": "200 € à 350 €"
      }
    ],
    "sources": [
      "https://travaux.mondevis.com/gardiennage/guide/",
      "https://fifi-capucine.com/sante/garde-animaux-a-domicile-tarif/",
      "https://www.servicespouranimaux.com/blog/actualites/tarifs-pet-sitter-2026.html",
      "https://pilepoilpetsitter.com/tarifs-pet-sitting-2026-nos-exemples-de-prix-pour-faire-garder-votre-chien-ou-votre-chat/"
    ],
    "retrievedAt": "2026-07-26"
  },
  "promenade-animaux": {
    "ranges": [
      {
        "label": "Promenade de chien (par balade)",
        "range": "12 € à 20 €"
      },
      {
        "label": "Forfait hebdomadaire de promenades",
        "range": "50 € à 90 €"
      },
      {
        "label": "Promenade collective",
        "range": "10 € à 18 €"
      },
      {
        "label": "Promenade et visite à domicile",
        "range": "15 € à 25 €"
      },
      {
        "label": "Garde et promenade à la journée",
        "range": "30 € à 50 €"
      }
    ],
    "sources": [
      "https://www.tobalgo.com/blog/tarifs-pet-sitter-france-2026",
      "https://pilepoilpetsitter.com/tarifs-pet-sitting-2026-nos-exemples-de-prix-pour-faire-garder-votre-chien-ou-votre-chat/",
      "https://annuaire.woufipedia.com/les-tarifs-moyens-pour-un-service-de-promenade-canine",
      "https://www.zoolo.fr/blog/combien-coute-un-pet-sitter-en-france-en-2026-le-guide-complet-des-prix"
    ],
    "retrievedAt": "2026-07-26"
  }
};
