// Modèles économiques concurrents sourcés via Perplexity API (web + citations).
// Généré le 2026-06-07. NE PAS éditer à la main :
// relancer `npx tsx scripts/fetch-competitor-offers.ts`.
// « zéro chiffre inventé » : données issues de sources web réelles, citées + datées.
// Tout champ null = donnée non confirmée → la page ne l'affiche pas.

export type CompetitorOffer = {
  slug: string;
  name: string;
  site: string;
  model: string | null;
  price_text: string | null;
  commitment: string | null;
  leads_shared: string | null;
  signup_fee: string | null;
  summary: string | null;
  sources: string[];
  retrievedAt: string;
};

export const COMPETITOR_OFFERS: Record<string, CompetitorOffer> = {
  "habitatpresto": {
    "slug": "habitatpresto",
    "name": "Habitatpresto",
    "site": "habitatpresto.com",
    "model": "Abonnement mensuel",
    "price_text": "70 € à 220 € / mois HT",
    "commitment": "6 mois minimum",
    "leads_shared": null,
    "signup_fee": null,
    "summary": "Habitatpresto facture aux pros un abonnement mensuel HT donnant accès à des demandes de travaux, avec tarification selon zone et métier.",
    "sources": [
      "https://ynspir.com/conseils-decoration/renovation/avis-societes-travaux/avis-habitat-presto-2/",
      "https://www.gestan.fr/habitat-presto-gestan/",
      "https://www.marty-app.com/blog/trouver-des-chantiers-artisan",
      "https://www.la-vie-en-couleur.fr/devis-travaux-habitatpresto-trouvez-le-professionnel-ideal-en-2026/"
    ],
    "retrievedAt": "2026-06-07"
  },
  "travaux-com": {
    "slug": "travaux-com",
    "name": "Travaux.com",
    "site": "travaux.com",
    "model": "Achat de leads / crédits",
    "price_text": "1 € à 90 € / contact",
    "commitment": "Sans engagement",
    "leads_shared": "Lead partagé, parfois jusqu'à 10 artisans",
    "signup_fee": null,
    "summary": "Travaux.com facture aux pros l’accès à des leads payants, sans engagement, avec mise en concurrence entre plusieurs artisans sur un même projet.",
    "sources": [
      "https://www.marty-app.com/blog/avis-travaux-com",
      "https://www.artisanat.fr/media/2919/download",
      "https://www.travaux.com",
      "https://negoce.zepros.fr/ma-vie-negociant/conjoncture-chefs-entreprise-artisanale-dubitatifs-2026"
    ],
    "retrievedAt": "2026-06-07"
  },
  "quotatis": {
    "slug": "quotatis",
    "name": "Quotatis",
    "site": "quotatis.fr",
    "model": null,
    "price_text": null,
    "commitment": null,
    "leads_shared": null,
    "signup_fee": null,
    "summary": "Quotatis facture un service de mise en relation aux professionnels du bâtiment, mais les conditions tarifaires publiques vérifiables ne sont pas confirmées ici.",
    "sources": [
      "https://artisansmart.fr/blog/facture-artisan/",
      "https://blog.tiime.fr/facturation-electronique-artisan",
      "https://www.plateya.fr/blog/detail/facturation-electronique-artisan-btp-ce-qui-change-en-2026",
      "https://abby.fr/blog/facturation-electronique-artisans-multi-services/"
    ],
    "retrievedAt": "2026-06-07"
  },
  "hemea": {
    "slug": "hemea",
    "name": "hemea",
    "site": "hemea.com",
    "model": null,
    "price_text": null,
    "commitment": null,
    "leads_shared": null,
    "signup_fee": null,
    "summary": null,
    "sources": [
      "https://artisansmart.fr/blog/facture-artisan/",
      "https://pro.trustup.fr/facturation-electronique-artisans-2026/",
      "https://www.plateya.fr/blog/detail/facturation-electronique-artisan-btp-ce-qui-change-en-2026",
      "https://abby.fr/blog/facturation-electronique-artisans-multi-services/"
    ],
    "retrievedAt": "2026-06-07"
  },
  "allotravaux": {
    "slug": "allotravaux",
    "name": "AlloTravaux",
    "site": "allotravaux.com",
    "model": null,
    "price_text": null,
    "commitment": null,
    "leads_shared": null,
    "signup_fee": null,
    "summary": null,
    "sources": [
      "https://www.artisanat.fr/media/2919/download",
      "https://www.artisansdavenir.fr/blog/quels-modeles-economiques-savoir-faire",
      "https://www.lagazettefrance.fr/article/les-artisans-du-batiment-voient-l-avenir-en-gris",
      "https://navengo.fr/artisanat-batiment-penurie-main-oeuvre/"
    ],
    "retrievedAt": "2026-06-07"
  },
  "starofservice": {
    "slug": "starofservice",
    "name": "StarOfService",
    "site": "starofservice.com",
    "model": "Achat de leads / crédits",
    "price_text": "10 à 60 crédits par devis, avec 1 crédit à 0,20 €",
    "commitment": "Sans engagement",
    "leads_shared": "Lead partagé à plusieurs professionnels",
    "signup_fee": null,
    "summary": "StarOfService facture les pros au crédit pour envoyer un devis sur une demande client, sans autre frais annoncé.",
    "sources": [
      "https://www.jaimelesstartups.fr/starofservice-service-a-la-personne-monde/",
      "https://www.pappers.fr/entreprise/starofservice-751713215",
      "https://www.welcometothejungle.com/fr/companies/starofservice",
      "https://entreprisma.fr/article/creer-son-entreprise-france-guide-complet-2026"
    ],
    "retrievedAt": "2026-06-07"
  }
};
