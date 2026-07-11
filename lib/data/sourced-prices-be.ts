// Prix BELGES sourcés via Perplexity API (recherche web + citations, prix TVAC) — généré le 2026-07-11.
// NE PAS éditer à la main : relancer `npx tsx scripts/fetch-sourced-prices.ts`.
// Respecte « zéro chiffre inventé » : chiffres issus de sources web réelles, citées.

export type SourcedPrice = { label: string; range: string };
export type SourcedPriceEntry = { ranges: SourcedPrice[]; sources: string[]; retrievedAt: string };

export const SOURCED_PRICES_BE: Record<string, SourcedPriceEntry> = {
  "plombier": {
    "ranges": [
      {
        "label": "Intervention de dépannage simple",
        "range": "100 € à 300 €"
      },
      {
        "label": "Recherche de fuite non destructive",
        "range": "150 € à 450 €"
      },
      {
        "label": "Remplacement de chauffe-eau électrique",
        "range": "150 € à 400 €"
      },
      {
        "label": "Rénovation complète de salle de bain",
        "range": "2 500 € à 6 000 €"
      },
      {
        "label": "Débouchage de canalisation",
        "range": "50 € à 220 €"
      }
    ],
    "sources": [
      "https://travaux.obat.fr/guides/tarif-plombier/",
      "https://www.tolteck.com/fr-fr/combien-coute-une-main-doeuvre-de-plombier-en-2026/",
      "https://www.needhelp.com/content/article/grille-tarifaire-plomberie",
      "https://www.ootravaux.fr/installation-entretien/plomberie/tarifs-plomberie.html"
    ],
    "retrievedAt": "2026-07-11"
  },
  "electricien": {
    "ranges": [
      {
        "label": "Diagnostic et dépannage simple",
        "range": "150 € à 350 €"
      },
      {
        "label": "Remplacement d'un disjoncteur",
        "range": "130 € à 300 €"
      },
      {
        "label": "Pose de prise (par unité)",
        "range": "60 € à 120 €"
      },
      {
        "label": "Mise aux normes NF C 15-100 (100 m²)",
        "range": "12 000 € à 20 000 €"
      },
      {
        "label": "Tableau électrique complet",
        "range": "900 € à 3 500 €"
      }
    ],
    "sources": [
      "https://izi-by-edf.fr/blog/tarif-horaire-electricien",
      "https://www.mesdepanneurs.fr/blog/tarifs-moyens-electricien",
      "https://www.travauxbtp.fr/blog/tarif-electricien",
      "https://blog.trustup.be/fr/prix-electricien/"
    ],
    "retrievedAt": "2026-07-11"
  },
  "macon": {
    "ranges": [
      {
        "label": "Terrasse béton (par m²)",
        "range": "50 € à 150 €"
      },
      {
        "label": "Ouverture mur porteur",
        "range": "450 € à 900 €"
      },
      {
        "label": "Ravalement de façade (par m²)",
        "range": "60 € à 110 €"
      },
      {
        "label": "Extension maison (par m²)",
        "range": "1 400 € à 2 200 €"
      },
      {
        "label": "Pose de parpaings (par m²)",
        "range": "45 € à 75 €"
      }
    ],
    "sources": [
      "https://www.prix-pose.com/terrasse-beton",
      "https://blog.trustup.be/fr/prix-terrasse-beton/",
      "https://www.habitatpresto.com/mag/terrasse-et-amenagements/prix-terrasse-beton",
      "https://www.allojardin.com/prix-terrasse/"
    ],
    "retrievedAt": "2026-07-11"
  },
  "peintre": {
    "ranges": [
      {
        "label": "Peinture mur (par m²)",
        "range": "15 € à 45 €"
      },
      {
        "label": "Peinture plafond (par m²)",
        "range": "20 € à 45 €"
      },
      {
        "label": "Pièce complète (10-15 m²)",
        "range": "1 200 € à 2 000 €"
      },
      {
        "label": "Ravalement façade (par m²)",
        "range": "30 € à 50 €"
      },
      {
        "label": "Pose papier peint (par m²)",
        "range": "35 € à 65 €"
      }
    ],
    "sources": [
      "https://www.idtravaux.be/prix-peinture-m2-belgique/",
      "https://www.guide-travaux-peinture.be/prix-peintre-belgique/",
      "https://www.needhelp.com/content/article/prix-peinture-m2",
      "https://sudcouleurpeinture.fr/blog/prix-peinture-m2-tarifs-guide-2026"
    ],
    "retrievedAt": "2026-07-11"
  },
  "carreleur": {
    "ranges": [
      {
        "label": "Pose de carrelage au sol (par m²)",
        "range": "50 € à 130 €"
      },
      {
        "label": "Faïence murale (par m²)",
        "range": "45 € à 115 €"
      },
      {
        "label": "Carrelage grand format (par m²)",
        "range": "80 € à 190 €"
      },
      {
        "label": "Douche à l'italienne complète",
        "range": "2 200 € à 4 500 €"
      },
      {
        "label": "Carrelage extérieur (par m²)",
        "range": "125 € à 175 €"
      }
    ],
    "sources": [
      "https://www.tafsquare.com/fr/guides-de-prix/prix-pour-la-pose-de-carrelage-en-belgique/",
      "https://www.meilleur-artisan.com/prix/carreleur/",
      "https://www.ootravaux.fr/construction-renovation/finitions/revetements-sols/carrelage/quels-tarifs-carreleurs.html",
      "https://travaux.obat.fr/guides/tarif-carreleur-m2/"
    ],
    "retrievedAt": "2026-07-11"
  },
  "menuisier": {
    "ranges": [
      {
        "label": "Pose de fenêtre (par fenêtre)",
        "range": "600 € à 1 200 €"
      },
      {
        "label": "Escalier sur mesure",
        "range": "2 500 € à 6 000 €"
      },
      {
        "label": "Pose de parquet (par m²)",
        "range": "75 € à 165 €"
      },
      {
        "label": "Placard sur mesure",
        "range": "1 800 € à 4 500 €"
      },
      {
        "label": "Porte intérieure pose comprise",
        "range": "300 € à 650 €"
      }
    ],
    "sources": [
      "https://www.primesenergie.fr/guide-energie/prix-pose-fen%C3%AAtre",
      "https://batisigne.com/blog/devis-menuisier",
      "https://www.monsieurpeinture.com/prix-fenetre-fourniture-pose/",
      "https://www.prix-pose.com/fenetre"
    ],
    "retrievedAt": "2026-07-11"
  },
  "couvreur": {
    "ranges": [
      {
        "label": "Réfection complète de toiture (par m²)",
        "range": "140 € à 200 €"
      },
      {
        "label": "Réparation de tuiles",
        "range": "65 € à 90 €"
      },
      {
        "label": "Pose de gouttières (par mètre linéaire)",
        "range": "45 € à 75 €"
      },
      {
        "label": "Pose de Velux",
        "range": "850 € à 1 400 €"
      },
      {
        "label": "Démoussage de toiture (par m²)",
        "range": "12 € à 22 €"
      }
    ],
    "sources": [
      "https://www.bobex.be/fr-be/travaux-de-toiture/prix-renovation-toiture/",
      "https://www.krakenimmo.com/blog/combien-coute-une-renovation",
      "https://toitures.site/prix-toiture/",
      "https://www.guide-travaux-toiture.be/prix-toiture/"
    ],
    "retrievedAt": "2026-07-11"
  },
  "chauffagiste": {
    "ranges": [
      {
        "label": "Entretien annuel de chaudière",
        "range": "110 € à 250 €"
      },
      {
        "label": "Installation de chaudière gaz",
        "range": "2 800 € à 4 500 €"
      },
      {
        "label": "Pompe à chaleur air/eau",
        "range": "12 000 € à 22 000 €"
      },
      {
        "label": "Remplacement de chauffe-eau",
        "range": "600 € à 1 400 €"
      },
      {
        "label": "Désembouage du circuit",
        "range": "250 € à 550 €"
      }
    ],
    "sources": [
      "https://www.tafsquare.com/fr/guides-de-prix/prix-pour-lentretien-dune-chaudiere-en-belgique/",
      "https://callmepower.be/fr/energie/guides/demarches/entretien-chaudiere/prix",
      "https://www.chauffagistesbelgique.be/frais-lies-aux-chaudieres/",
      "https://changement-chaudiere.be/entretien-de-chaudiere/"
    ],
    "retrievedAt": "2026-07-11"
  },
  "jardinage": {
    "ranges": [
      {
        "label": "Tonte de pelouse (par heure)",
        "range": "15 € à 25 €"
      },
      {
        "label": "Taille de haie (par mètre linéaire)",
        "range": "4 € à 8 €"
      },
      {
        "label": "Élagage d'arbre",
        "range": "75 € à 500 €"
      },
      {
        "label": "Entretien régulier (forfait mensuel)",
        "range": "25 € à 100 €"
      },
      {
        "label": "Création de massif",
        "range": "75 € à 200 €"
      }
    ],
    "sources": [
      "https://www.paysagiste.info/prix-dun-entretien-de-jardin/",
      "https://travaux.obat.fr/guides/prix-jardinier/",
      "https://jardiniers.pro/le-prix-dun-jardinier/",
      "https://www.elagage.com/tarif-jardinier/"
    ],
    "retrievedAt": "2026-07-11"
  },
  "menage": {
    "ranges": [
      {
        "label": "Ménage régulier à domicile (par heure)",
        "range": "20 € à 30 €"
      },
      {
        "label": "Nettoyage complet de printemps",
        "range": "120 € à 220 €"
      },
      {
        "label": "Ménage après travaux",
        "range": "150 € à 280 €"
      },
      {
        "label": "Lavage de vitres (par m²)",
        "range": "4 € à 7 €"
      },
      {
        "label": "Repassage à domicile (par heure)",
        "range": "15 € à 25 €"
      }
    ],
    "sources": [
      "https://www.trixxo.be/fr/titres-services/actualites/quel-est-le-prix-dune-aide-menagere/",
      "https://www.wecasa.fr/femme-menage-domicile/articles/tarifs-prix",
      "https://www.facile-a-net.be/combien-coute-reellement-le-repassage-a-domicile-en-belgique--_ad98.html",
      "https://yoojo.fr/menage/guides/prix-femme-de-menage-7"
    ],
    "retrievedAt": "2026-07-11"
  },
  "soutien-scolaire": {
    "ranges": [
      {
        "label": "Cours particulier primaire (par heure)",
        "range": "25 € à 35 €"
      },
      {
        "label": "Cours particulier collège (par heure)",
        "range": "30 € à 40 €"
      },
      {
        "label": "Cours particulier lycée (par heure)",
        "range": "35 € à 50 €"
      },
      {
        "label": "Préparation au brevet ou baccalauréat",
        "range": "40 € à 60 €"
      },
      {
        "label": "Stage intensif vacances (semaine)",
        "range": "350 € à 500 €"
      }
    ],
    "sources": [
      "https://www.voscours.fr/prixs-tarifs/",
      "https://www.superprof.be/cours/soutien-scolaire/bruxelles/",
      "https://www.voscoursparticuliers.be/blog/tarif-cours-particuliers-comment-fixer-prix-juste",
      "https://www.acces-sap.com/particuliers/tarifs/soutien-scolaire-cours-particuliers-domicile/"
    ],
    "retrievedAt": "2026-07-11"
  },
  "garde-enfants": {
    "ranges": [
      {
        "label": "Garde à domicile (par heure)",
        "range": "10 € à 14 €"
      },
      {
        "label": "Sortie d'école + goûter (par jour)",
        "range": "25 € à 35 €"
      },
      {
        "label": "Babysitting soirée",
        "range": "10 € à 13 €"
      },
      {
        "label": "Garde partagée (par famille)",
        "range": "18 € à 24 €"
      },
      {
        "label": "Garde de nuit ou week-end",
        "range": "14 € à 18 €"
      }
    ],
    "sources": [
      "https://yoojo.fr/enfants/guides/tarifs-nounou-france-160",
      "https://pro.guidesocial.be/articles/actualites/garde-d-enfants-en-titres-services-6x-plus-cher",
      "https://www.rtbf.be/article/quel-est-le-tarif-de-base-pour-du-baby-sitting-voici-quelques-chiffres-indicatifs-11483677",
      "https://parent-employeur-zen.com/embauche/salaire-garde-domicile/"
    ],
    "retrievedAt": "2026-07-11"
  },
  "aide-seniors": {
    "ranges": [
      {
        "label": "Aide à domicile (par heure)",
        "range": "20 € à 30 €"
      },
      {
        "label": "Aide à la toilette",
        "range": "25 € à 35 €"
      },
      {
        "label": "Accompagnement RDV médical",
        "range": "22 € à 28 €"
      },
      {
        "label": "Garde de jour ponctuelle",
        "range": "180 € à 260 €"
      },
      {
        "label": "Forfait mensuel régulier",
        "range": "600 € à 1 200 €"
      }
    ],
    "sources": [
      "https://domicilix.be/combien_coute_une_aide_a_domicile_en_belgique",
      "https://jameservices.com/prix-titre-service-wallonie-2026/",
      "https://www.capretraite.fr/aide-a-domicile/perte-dautonomie/aide-a-domicile-tarif-et-aides-financieres-pour-les-personnes-agees/",
      "https://www.aidadomi.fr/aide-a-domicile-comprendre-les-tarifs-les-aides-financieres-et-le-cout-reel-en-2026/"
    ],
    "retrievedAt": "2026-07-11"
  }
};
