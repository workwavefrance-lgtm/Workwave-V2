// Données + schémas partagés des pages "trouver des clients" (services à domicile
// & aide à la personne : ménage, jardinage, garde d'enfants, soutien scolaire,
// déménagement, petit bricolage…). Pendant services de lib/data/chantiers.ts (BTP).
// Angle identique : prix transparent 9,90 €/contact, zéro abonnement, zéro
// commission — le seul à afficher son prix.

const BASE_URL = "https://workwave.fr";

export type FaqItem = { q: string; a: string };

export const CLIENTS_FAQ: FaqItem[] = [
  {
    q: "Combien coûte une mise en relation sur Workwave ?",
    a: "9,90 € pour débloquer les coordonnées d'un client qui vous intéresse. C'est tout. Pas d'abonnement mensuel, pas de frais de mise en service, pas de commission sur vos prestations. Vous voyez le détail de la demande (type de service, zone, budget) AVANT de décider de payer.",
  },
  {
    q: "Y a-t-il un abonnement ou un engagement ?",
    a: "Non. Contrairement aux plateformes à abonnement, Workwave ne vous engage à rien. Vous créez votre fiche gratuitement et vous payez uniquement les clients que vous décidez de contacter, à l'unité.",
  },
  {
    q: "Workwave prend-il une commission sur mes prestations ?",
    a: "Jamais. Beaucoup de plateformes de services prélèvent un pourcentage sur chaque prestation, qui grignote vos revenus à chaque mission. Chez Workwave, vous gardez 100 % de ce que vous facturez : un contact = 9,90 €, une seule fois.",
  },
  {
    q: "Comment recevoir des demandes de clients ?",
    a: "Créez votre fiche gratuitement en quelques minutes (ou réclamez-la si elle existe déjà). Vous recevez ensuite les demandes des particuliers de votre zone et de votre service, dès qu'un projet correspond à votre activité.",
  },
  {
    q: "Quand est-ce que je paie ?",
    a: "Uniquement au moment où vous débloquez les coordonnées d'un client. Vous consultez d'abord la demande (service recherché, ville, budget, urgence) ; si elle vous intéresse, vous payez 9,90 € pour obtenir le contact direct. Aucun paiement à l'aveugle.",
  },
  {
    q: "Mes données ou celles des clients sont-elles revendues ?",
    a: "Non. Workwave n'est pas un revendeur de fichiers. Vous gérez votre fiche, vous recevez des demandes réelles de particuliers, et les coordonnées ne servent qu'à la mise en relation que vous avez choisie.",
  },
  {
    q: "Quels services puis-je proposer sur Workwave ?",
    a: "Tous les services du quotidien : ménage, repassage, garde d'enfants, soutien scolaire, cours particuliers, aide aux seniors, aide administrative, petit bricolage, déménagement, débarras, nettoyage, garde d'animaux, et bien d'autres. Que vous soyez auto-entrepreneur ou entreprise, vous pouvez recevoir des demandes près de chez vous.",
  },
];

export const CLIENTS_COMPARISON: {
  feature: string;
  others: string;
  workwave: string;
}[] = [
  {
    feature: "Prix",
    others: "Abonnement mensuel ou prix opaque sur devis",
    workwave: "9,90 € le contact — affiché, fixe",
  },
  {
    feature: "Engagement",
    others: "Abonnement, frais d'inscription",
    workwave: "Aucun, zéro engagement",
  },
  {
    feature: "Commission sur vos prestations",
    others: "Un % prélevé sur chaque mission",
    workwave: "0 % — vous gardez tout",
  },
  {
    feature: "Vous voyez le client avant de payer",
    others: "Souvent non (contact acheté à l'aveugle)",
    workwave: "Oui — détail visible avant",
  },
  {
    feature: "Commercial à rappeler",
    others: "Oui (prix sur devis)",
    workwave: "Non — tout en ligne",
  },
];

export function getClientsFaqSchema(faq: FaqItem[] = CLIENTS_FAQ) {
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

export function getClientsServiceSchema(opts?: {
  name?: string;
  areaServed?: string;
  description?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts?.name ?? "Trouver des clients pour les professionnels des services — Workwave",
    serviceType: "Mise en relation professionnels / particuliers",
    provider: { "@type": "Organization", name: "Workwave", url: BASE_URL },
    areaServed: opts?.areaServed ?? "France",
    description:
      opts?.description ??
      "Service de mise en relation pour les professionnels des services à domicile et de l'aide à la personne. Recevez les demandes de votre zone et payez 9,90 € par contact débloqué, sans abonnement.",
    offers: {
      "@type": "Offer",
      price: "9.90",
      priceCurrency: "EUR",
      description: "9,90 € par contact débloqué, sans abonnement ni engagement.",
    },
  };
}
