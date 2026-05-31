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
        "range": "99 € à 160 €"
      },
      {
        "label": "Recherche de fuite non destructive",
        "range": "120 € à 220 €"
      },
      {
        "label": "Remplacement de chauffe-eau électrique",
        "range": "1 100 € à 2 000 €"
      },
      {
        "label": "Rénovation complète de salle de bain",
        "range": "7 000 € à 15 000 €"
      },
      {
        "label": "Débouchage de canalisation",
        "range": "100 € à 220 €"
      }
    ],
    "sources": [
      "https://www.ootravaux.fr/installation-entretien/plomberie/tarifs-plomberie.html",
      "https://yoojo.fr/bricolage/guides/tarif-plombier-41",
      "https://www.mesdepanneurs.fr/blog/tarifs-moyens-plombier",
      "https://www.artisandubatiment.fr/devenir-artisan/tarif/tarifs-plomberie/"
    ],
    "retrievedAt": "2026-05-31"
  },
  "electricien": {
    "ranges": [
      {
        "label": "Diagnostic et dépannage simple",
        "range": "120 € à 250 €"
      },
      {
        "label": "Remplacement d'un disjoncteur",
        "range": "100 € à 180 €"
      },
      {
        "label": "Pose de prise (par unité)",
        "range": "90 € à 150 €"
      },
      {
        "label": "Mise aux normes NF C 15-100 (100 m²)",
        "range": "10 000 € à 20 000 €"
      },
      {
        "label": "Tableau électrique complet",
        "range": "800 € à 1 500 €"
      }
    ],
    "sources": [
      "https://patatoutfaire06.com/electricite/prix-a-lheure-dun-electricien/",
      "https://www.mesdepanneurs.fr/blog/tarifs-moyens-electricien",
      "https://www.chronoserve.fr/prix-electricien/",
      "https://www.depanneo.com/prix/electricien/"
    ],
    "retrievedAt": "2026-05-31"
  },
  "macon": {
    "ranges": [
      {
        "label": "Terrasse béton (par m²)",
        "range": "55 € à 90 €"
      },
      {
        "label": "Ouverture mur porteur",
        "range": "2 300 € à 8 300 €"
      },
      {
        "label": "Ravalement de façade (par m²)",
        "range": "40 € à 150 €"
      },
      {
        "label": "Extension maison (par m²)",
        "range": "1 200 € à 1 800 €"
      },
      {
        "label": "Pose de parpaings (par m²)",
        "range": "40 € à 100 €"
      }
    ],
    "sources": [
      "https://metiers-artisans.com/prix-travaux-maconnerie-combien-coute-macon/",
      "https://www.artisandubatiment.fr/devenir-artisan/tarif/guide-tarifs-maconnerie/",
      "https://www.visitelyon.fr/actualites/prix-travaux-maconnerie-2025-lyon/",
      "https://www.prix-pose.com/ouverture-mur-porteur"
    ],
    "retrievedAt": "2026-05-31"
  },
  "peintre": {
    "ranges": [
      {
        "label": "Peinture mur (par m²)",
        "range": "20 € à 45 €"
      },
      {
        "label": "Peinture plafond (par m²)",
        "range": "30 € à 60 €"
      },
      {
        "label": "Pièce complète (10-15 m²)",
        "range": "500 € à 1 100 €"
      },
      {
        "label": "Ravalement façade (par m²)",
        "range": "50 € à 90 €"
      },
      {
        "label": "Pose papier peint (par m²)",
        "range": "25 € à 50 €"
      }
    ],
    "sources": [
      "https://yoojo.fr/bricolage/guides/tarif-peintre-prix-exemples-127",
      "https://www.mesdepanneurs.fr/blog/prix-travaux-peinture",
      "https://www.tafsquare.com/fr/guides-de-prix/prix-peintre-en-batiment/",
      "https://www.lamaisonsaintgobain.fr/guides-travaux/amenagement-interieur/prix-peinture-au-m2"
    ],
    "retrievedAt": "2026-05-31"
  },
  "carreleur": {
    "ranges": [
      {
        "label": "Pose de carrelage au sol (par m²)",
        "range": "80 € à 150 €"
      },
      {
        "label": "Faïence murale (par m²)",
        "range": "70 € à 140 €"
      },
      {
        "label": "Carrelage grand format (par m²)",
        "range": "100 € à 180 €"
      },
      {
        "label": "Douche à l'italienne complète",
        "range": "3 500 € à 7 500 €"
      },
      {
        "label": "Carrelage extérieur (par m²)",
        "range": "100 € à 135 €"
      }
    ],
    "sources": [
      "https://www.rubi.com/fr/blog/prix-du-carrelage-au-m2/",
      "https://www.avenir-renovations.fr/guide/renovation-interieure/prix-pour-la-pose-de-carrelage-au-m/",
      "https://www.parquet-carrelage.com/blog/quel-prix-au-m2-pour-la-pose-d-un-carrelage--n111",
      "https://www.lamaisonsaintgobain.fr/guides-travaux/amenagement-interieur/prix-carrelage"
    ],
    "retrievedAt": "2026-05-31"
  },
  "menuisier": {
    "ranges": [
      {
        "label": "Pose de fenêtre (par fenêtre)",
        "range": "500 € à 1 300 €"
      },
      {
        "label": "Escalier sur mesure",
        "range": "4 000 € à 15 000 €"
      },
      {
        "label": "Pose de parquet (par m²)",
        "range": "20 € à 40 €"
      },
      {
        "label": "Placard sur mesure",
        "range": "1 200 € à 4 500 €"
      },
      {
        "label": "Porte intérieure pose comprise",
        "range": "250 € à 900 €"
      }
    ],
    "sources": [
      "https://travaux.obat.fr/guides/tarif-horaire-menuisier/",
      "https://www.ootravaux.fr/construction-renovation/menuiserie/fenetres/pros-tarifs/tarif-horaire-menuisier.html",
      "https://www.devis-menuisiers.com/tarif-menuisier.html",
      "https://terresdefenetre.fr/nos-conseils/prix-dune-fenetre-en-2025"
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
        "range": "150 € à 600 €"
      },
      {
        "label": "Pose de gouttières (par mètre linéaire)",
        "range": "50 € à 150 €"
      },
      {
        "label": "Pose de Velux",
        "range": "900 € à 2 500 €"
      },
      {
        "label": "Démoussage de toiture (par m²)",
        "range": "6 € à 20 €"
      }
    ],
    "sources": [
      "https://www.ootravaux.fr/construction-renovation/toiture/couverture/travaux-toiture/tarif-couvreur.html",
      "https://blog.birdia.fr/post/combien-co%C3%BBte-un-couvreur-selon-les-types-de-travaux",
      "https://montpellier-ouest.lamaisondestravaux.com/travaux-exterieurs/renovation-toiture/info-conseils/cout-pour-refaire-sa-toiture-de-maison-en-2025-prix-au-m-et-exemples",
      "https://www.couvreurartisan.fr/blog/2687842_quel-devis-pour-refaire-une-toiture-complete-en-2025"
    ],
    "retrievedAt": "2026-05-31"
  },
  "chauffagiste": {
    "ranges": [
      {
        "label": "Entretien annuel de chaudière",
        "range": "100 € à 190 €"
      },
      {
        "label": "Installation de chaudière gaz",
        "range": "2 500 € à 5 000 €"
      },
      {
        "label": "Pompe à chaleur air/eau",
        "range": "10 000 € à 18 000 €"
      },
      {
        "label": "Remplacement de chauffe-eau",
        "range": "600 € à 1 100 €"
      },
      {
        "label": "Désembouage du circuit",
        "range": "400 € à 800 €"
      }
    ],
    "sources": [
      "https://www.mesdepanneurs.fr/blog/tarifs-moyens-chauffagiste",
      "https://particuliers.engie.fr/economies-energie/conseils-equipements-chauffage/conseils-chaudiere/prix-entretien-chaudiere.html",
      "https://www.hellowatt.fr/chaudiere/entretien-chaudiere/prix-entretien-chaudiere",
      "https://www.fournisseurs-electricite.com/renovation-energetique/chauffage/chaudiere/entretien/gaz/prix"
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
        "range": "5 € à 12 €"
      },
      {
        "label": "Élagage d'arbre",
        "range": "80 € à 500 €"
      },
      {
        "label": "Entretien régulier (forfait mensuel)",
        "range": "50 € à 130 €"
      },
      {
        "label": "Création de massif",
        "range": "40 € à 120 €"
      }
    ],
    "sources": [
      "https://yoojo.fr/jardinage/guides/prix-d-une-tonte-de-pelouse-exemples-et-guide-55",
      "https://www.travaux.com/jardin-et-exterieur/guide-des-prix/prix-de-tonte-de-la-pelouse",
      "https://www.needhelp.com/content/article/tonte-pelouse-prix",
      "https://www.ootravaux.fr/amenagement-exterieur/jardin/entretien/prix-tonte-pelouse.html"
    ],
    "retrievedAt": "2026-05-31"
  },
  "menage": {
    "ranges": [
      {
        "label": "Ménage régulier à domicile (par heure)",
        "range": "20 € à 35 €"
      },
      {
        "label": "Nettoyage complet de printemps",
        "range": "300 € à 500 €"
      },
      {
        "label": "Ménage après travaux",
        "range": "120 € à 200 €"
      },
      {
        "label": "Lavage de vitres (par m²)",
        "range": "3 € à 5 €"
      },
      {
        "label": "Repassage à domicile (par heure)",
        "range": "20 € à 35 €"
      }
    ],
    "sources": [
      "https://www.taskrabbit.fr/blog/tarifs-des-services-de-menage/",
      "https://bienvivreenlauragais.fr/tarif-menage-a-domicile-2025-ce-que-vous-devez-vraiment-savoir-avant-de-vous-engager/",
      "https://2adpmultiservices.com/tarif-aide-menagere-domicile/",
      "https://nobo.life/tarif-femme-de-menage/"
    ],
    "retrievedAt": "2026-05-31"
  },
  "soutien-scolaire": {
    "ranges": [
      {
        "label": "Cours particulier primaire (par heure)",
        "range": "22 € à 38 €"
      },
      {
        "label": "Cours particulier collège (par heure)",
        "range": "25 € à 40 €"
      },
      {
        "label": "Cours particulier lycée (par heure)",
        "range": "30 € à 50 €"
      },
      {
        "label": "Préparation au brevet ou baccalauréat",
        "range": "35 € à 55 €"
      },
      {
        "label": "Stage intensif vacances (semaine)",
        "range": "122,50 € à 250 €"
      }
    ],
    "sources": [
      "https://www.tutoreo.fr/guides/tarifs-cours-particuliers",
      "https://www.superprof.fr/blog/prix-cours-particuliers/",
      "https://etudiant.lefigaro.fr/vos-etudes/magazine/41024-prof-particulier/",
      "https://www.acces-sap.com/particuliers/tarifs/soutien-scolaire-cours-particuliers-domicile/"
    ],
    "retrievedAt": "2026-05-31"
  },
  "garde-enfants": {
    "ranges": [
      {
        "label": "Garde à domicile (par heure)",
        "range": "10 € à 13 €"
      },
      {
        "label": "Sortie d'école + goûter (par jour)",
        "range": "25 € à 40 €"
      },
      {
        "label": "Babysitting soirée",
        "range": "30 € à 55 €"
      },
      {
        "label": "Garde partagée (par famille)",
        "range": "8 € à 11 €"
      },
      {
        "label": "Garde de nuit ou week-end",
        "range": "50 € à 90 €"
      }
    ],
    "sources": [
      "https://www.familyplus.fr/garde-temps-partiel-prix/",
      "https://demarchesadministratives.fr/actualites/garde-enfants-combien-coute-une-nounou-ou-une-assistante-maternelle-en-2025",
      "https://www.lemonde.fr/argent/article/2025/07/15/assistante-maternelle-nounou-a-domicile-le-cout-de-la-garde-d-enfant-individuelle-par-departement_6621231_1657007.html",
      "https://www.babysittor.com/blog/tarif-horaire-nounou-domicile"
    ],
    "retrievedAt": "2026-05-31"
  },
  "aide-seniors": {
    "ranges": [
      {
        "label": "Aide à domicile (par heure)",
        "range": "22 € à 35 €"
      },
      {
        "label": "Aide à la toilette",
        "range": "25 € à 40 €"
      },
      {
        "label": "Accompagnement RDV médical",
        "range": "30 € à 45 €"
      },
      {
        "label": "Garde de jour ponctuelle",
        "range": "120 € à 220 €"
      },
      {
        "label": "Forfait mensuel régulier",
        "range": "600 € à 2 500 €"
      }
    ],
    "sources": [
      "https://www.capretraite.fr/aide-a-domicile/perte-dautonomie/aide-a-domicile-tarif-et-aides-financieres-pour-les-personnes-agees/",
      "https://www.o2.fr/aide-aux-personnes-agees/tarif-auxiliaire-de-vie",
      "https://www.trouver-maison-de-retraite.fr/aides-et-subventions/tarifs-aide-a-domicile-prix-par-heure-de-quoi-depend-le-cout-et-combien-il-reste-a-payer/",
      "https://apadom.com/cout-aide-a-domicile/"
    ],
    "retrievedAt": "2026-05-31"
  }
};
