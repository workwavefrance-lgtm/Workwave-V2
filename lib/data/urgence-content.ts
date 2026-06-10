// Contenu sourcé via Perplexity API (recherche web + citations) — généré le 2026-06-10.
// Régénérer : npx tsx scripts/fetch-urgence-content.ts
// RÈGLE : zéro chiffre inventé — tout chiffre affiché vient des sources listées.

export type UrgenceContent = {
  priceRanges: { label: string; low: number; high: number }[];
  majorations: string;
  legalFacts: string[];
  scamWarnings: string[];
  goodReflexes: string[];
  sources: string[];
  retrievedAt: string;
};

export const URGENCE_CONTENT: Record<string, UrgenceContent> = {
  serrurier: {
    "priceRanges": [
      {
        "label": "Ouverture de porte claquée (jour, semaine)",
        "low": 55,
        "high": 180
      },
      {
        "label": "Ouverture de porte verrouillée/blindée",
        "low": 110,
        "high": 300
      },
      {
        "label": "Remplacement de serrure standard",
        "low": 100,
        "high": 450
      },
      {
        "label": "Remplacement de cylindre",
        "low": 130,
        "high": 300
      }
    ],
    "majorations": "Les sources récentes constatent des majorations d’environ +20 % à +100 % la nuit, le week-end et les jours fériés, avec une moyenne souvent citée autour de +30 %. Certaines grilles évoquent aussi des suppléments de 30 % à 50 % selon la plage horaire et la zone.",
    "legalFacts": [
      "Il n’existe pas de réglementation générale fixant les tarifs des serruriers en France : le prix est librement déterminé par l’entreprise, sous réserve d’information loyale du consommateur.",
      "L’arrêté du 24 janvier 2017 impose, pour les prestations de dépannage à domicile, l’information préalable du consommateur et un devis écrit au-delà de 150 € TTC ; certaines sources résument aussi cette exigence comme un contrat écrit dès le 1er euro.",
      "Le droit de rétractation de 14 jours existe pour les contrats conclus hors établissement, mais il ne s’applique pas lorsque le client demande expressément une intervention immédiate en urgence à domicile pour travaux de réparation ou d’entretien.",
      "En cas de litige ou de pratique trompeuse, le consommateur peut signaler l’entreprise via SignalConso ou saisir la DGCCRF.",
      "Les dépanneurs doivent pouvoir identifier clairement leur entreprise et remettre un document écrit avant intervention, avec les informations essentielles sur l’identité du professionnel et le prix."
    ],
    "scamWarnings": [
      "Prix d’appel très bas annoncé au téléphone puis facture fortement augmentée sur place.",
      "Remplacement de serrure ou de cylindre imposé alors qu’une ouverture simple ou un réglage suffisait.",
      "Absence de devis écrit ou devis incomplet avant intervention.",
      "Matériel facturé à un prix manifestement excessif par rapport au marché.",
      "Démarchage via prospectus ou annonces donnant l’apparence d’un service officiel ou local alors qu’il s’agit d’une entreprise privée."
    ],
    "goodReflexes": [
      "Vérifier le SIRET et l’identité exacte de l’entreprise avant d’accepter l’intervention.",
      "Exiger un devis écrit détaillant déplacement, main-d’œuvre, pièces et TVA avant toute opération.",
      "Demander si la porte est seulement claquée ou réellement verrouillée, car la technique et le coût ne sont pas les mêmes.",
      "Contacter son assurance habitation, car certaines garanties prennent en charge tout ou partie de l’ouverture de porte ou du remplacement après effraction.",
      "Refuser toute intervention sans validation préalable du prix total et des éventuelles pièces à remplacer.",
      "Conserver photos, devis, facture et échanges en cas de contestation ou de signalement."
    ],
    "sources": [
      "https://goodassur.com/assurance-habitation/serrurier",
      "https://www.habitatpresto.com/mag/menuiserie/portail-portillon/prix-serrurier-tarif-intervention",
      "https://www.serrurerie-gadenne.com/blog/faq/prix-du-serrurier/",
      "https://travaux.obat.fr/guides/prix-serrurier/",
      "https://www.mesdepanneurs.fr/blog/prix-serrurier",
      "https://arcane-depannage-serrurerie-vitrerie.fr/blog/serrurier-prix-depannage-2026"
    ],
    "retrievedAt": "2026-06-10"
  },
};
