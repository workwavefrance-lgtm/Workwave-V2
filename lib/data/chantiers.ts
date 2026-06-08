// Données + schémas partagés des pages "trouver des chantiers" (hub +
// programmatique métier/département). Source unique de vérité : un ajustement
// ici se propage sur les ~60 pages.

const BASE_URL = "https://workwave.fr";

export type FaqItem = { q: string; a: string };

// FAQ générique (sur le MODÈLE, pas sur le métier → valable partout). Répond
// pile aux objections que les concurrents laissent en suspens (prix, abonnement,
// commission, revente). Sert l'affichage ET le FAQPage schema.
export const CHANTIERS_FAQ: FaqItem[] = [
  {
    q: "Combien coûte un chantier sur Workwave ?",
    a: "9,90 € pour débloquer les coordonnées d'un projet qui vous intéresse. C'est tout. Pas d'abonnement mensuel, pas de frais de mise en service, pas de commission sur vos chantiers. Vous voyez le détail de la demande (type de travaux, zone, budget) AVANT de décider de payer.",
  },
  {
    q: "Y a-t-il un abonnement ou un engagement ?",
    a: "Non. Contrairement aux plateformes à abonnement (souvent 100 à 250 € par mois), Workwave ne vous engage à rien. Vous créez votre fiche gratuitement et vous payez uniquement les contacts que vous décidez de débloquer, à l'unité.",
  },
  {
    q: "Workwave prend-il une commission sur mes chantiers ?",
    a: "Jamais. Certaines plateformes prennent un pourcentage du montant du chantier (par ex. 5 %, soit 1 000 € sur un chantier à 20 000 €). Chez Workwave, vous gardez 100 % de votre chiffre d'affaires : un contact = 9,90 €, quel que soit le montant du chantier.",
  },
  {
    q: "Comment recevoir des demandes de chantiers ?",
    a: "Votre fiche existe peut-être déjà : Workwave référence plus d'1,7 million d'artisans à partir du registre officiel Sirene. Retrouvez-la avec votre SIRET et réclamez-la gratuitement en 2 minutes. Si elle n'existe pas encore, vous pouvez la créer. Vous recevez ensuite les demandes des particuliers de votre zone et de votre métier.",
  },
  {
    q: "Quand est-ce que je paie ?",
    a: "Uniquement au moment où vous débloquez les coordonnées d'un projet. Vous consultez d'abord la demande (métier, ville, budget estimé, urgence) ; si elle vous intéresse, vous payez 9,90 € pour obtenir le contact direct du particulier. Aucun paiement à l'aveugle.",
  },
  {
    q: "Mes données ou celles des clients sont-elles revendues ?",
    a: "Non. Workwave n'est pas un revendeur de fichiers. Vous gérez votre fiche, vous recevez des demandes réelles de particuliers, et les coordonnées ne servent qu'à la mise en relation que vous avez choisie.",
  },
  {
    q: "Dans quelles zones Workwave trouve-t-il des chantiers ?",
    a: "Workwave couvre 34 046 communes dans toute la France (101 départements, métropole et outre-mer).",
  },
];

export const CHANTIERS_COMPARISON: {
  feature: string;
  others: string;
  workwave: string;
}[] = [
  {
    feature: "Prix",
    others: "Abonnement 100–250 €/mois ou 1–90 €/contact (opaque)",
    workwave: "9,90 € le lead — affiché, fixe",
  },
  {
    feature: "Engagement",
    others: "Abonnement, frais de mise en service",
    workwave: "Aucun, zéro engagement",
  },
  {
    feature: "Commission sur vos chantiers",
    others: "Jusqu'à 5 % du montant du chantier",
    workwave: "0 % — vous gardez tout",
  },
  {
    feature: "Vous voyez le projet avant de payer",
    others: "Souvent non (lead acheté à l'aveugle)",
    workwave: "Oui — détail visible avant",
  },
  {
    feature: "Commercial à rappeler",
    others: "Oui (prix sur devis)",
    workwave: "Non — tout en ligne",
  },
];

export function getChantiersFaqSchema(faq: FaqItem[] = CHANTIERS_FAQ) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function getChantiersServiceSchema(opts?: {
  name?: string;
  areaServed?: string;
  description?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts?.name ?? "Apport de chantiers pour artisans — Workwave",
    serviceType: "Mise en relation artisans / particuliers",
    provider: { "@type": "Organization", name: "Workwave", url: BASE_URL },
    areaServed: opts?.areaServed ?? "France",
    description:
      opts?.description ??
      "Service d'apport de chantiers pour les artisans du bâtiment et des services. Recevez les demandes de votre zone et payez 9,90 € par contact débloqué, sans abonnement.",
    offers: {
      "@type": "Offer",
      price: "9.90",
      priceCurrency: "EUR",
      description: "9,90 € par lead débloqué, sans abonnement ni engagement.",
    },
  };
}
