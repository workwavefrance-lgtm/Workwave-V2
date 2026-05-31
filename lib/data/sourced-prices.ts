// Prix sourcés via Perplexity API (recherche web + citations) — généré le 2026-05-31.
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
  }
};
