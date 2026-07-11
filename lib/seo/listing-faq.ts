/**
 * FAQ programmatique « mots-clés longue traîne » pour les pages listing
 * /[metier]/[location] (cat × ville et cat × dept).
 *
 * Objectif SEO/AEO : capter les requêtes secondaires à forte intention
 * commerciale qui ne sont PAS couvertes par le H1 / les sections
 * programmatiques (prix, urgence, « pas cher », RGE, devis gratuit).
 *
 * RÈGLE STRICTE « zéro chiffre inventé » : la réponse PRIX réutilise les
 * prix SOURCÉS (Perplexity, cf. lib/data/sourced-prices.ts) quand ils
 * existent pour le métier ; sinon réponse générique SANS aucun chiffre.
 *
 * Cette FAQ est volontairement DISTINCTE de celle générée par
 * generateSeoContent() (lib/seo/seo-sections.ts) : elle cible les
 * variantes longue traîne (« pas cher », « en urgence », « RGE »,
 * « devis gratuit ») plutôt que les questions génériques. Elle n'est
 * affichée QUE sur les pages SANS seo.faq_json (pour éviter le doublon).
 */

import { getCategoryListing } from "@/lib/utils/category-grammar";
import { SOURCED_PRICES } from "@/lib/data/sourced-prices";
import { SOURCED_PRICES_BE } from "@/lib/data/sourced-prices-be";

export type ListingFaqItem = { question: string; answer: string };

/**
 * Élision de "de" → "d'" devant une voyelle ou un h muet, pour éviter
 * "devis gratuits de électriciens" / "de entreprises". Couvre les voyelles
 * accentuées (é, è, à…) fréquentes dans nos libellés ("électriciens").
 */
function de(noun: string): string {
  return /^[aàâäeéèêëiîïoôöuùûüyhAÀÂÄEÉÈÊËIÎÏOÔÖUÙÛÜYH]/.test(noun)
    ? `d'${noun}`
    : `de ${noun}`;
}

/**
 * Réutilise exactement la logique de seo-sections.ts (getPriceRanges,
 * non exportée) : prix sourcés Perplexity en priorité, sinon `null`.
 * Pas de fallback de chiffres hardcodés ici — si pas de prix sourcé, la
 * réponse PRIX reste générique (aucun chiffre inventé).
 */
function getSourcedPriceForFaq(
  categorySlug: string,
  isBE = false
): { label: string; range: string } | null {
  const sourced = isBE ? SOURCED_PRICES_BE[categorySlug] : SOURCED_PRICES[categorySlug];
  if (sourced && sourced.ranges.length > 0) {
    return sourced.ranges[0];
  }
  return null;
}

export function buildListingFaq({
  categorySlug,
  categoryName,
  locationName,
  preposition,
  isBtp,
  isBE = false,
}: {
  categorySlug: string;
  categoryName: string;
  locationName: string;
  preposition: string;
  isBtp: boolean;
  isBE?: boolean;
}): ListingFaqItem[] {
  const { plural, singular, article } = getCategoryListing(
    categorySlug,
    categoryName
  );

  const faqs: ListingFaqItem[] = [];

  // 1. PRIX (prix sourcé si dispo, sinon générique SANS chiffre inventé)
  const sourcedPrice = getSourcedPriceForFaq(categorySlug, isBE);
  faqs.push({
    question: `Combien coûte ${article} ${singular} ${preposition} ${locationName} ?`,
    answer: sourcedPrice
      ? `Comptez environ ${sourcedPrice.range} pour ${sourcedPrice.label.toLowerCase()}. Les tarifs varient selon la prestation et l'intervention : demandez plusieurs devis gratuits pour comparer les prix des ${plural} ${preposition} ${locationName}.`
      : `Les tarifs varient selon la prestation et l'intervention. Demandez plusieurs devis gratuits pour comparer les prix des ${plural} ${preposition} ${locationName}.`,
  });

  // 2. URGENCE
  faqs.push({
    question: `Comment trouver ${article} ${singular} en urgence ${preposition} ${locationName} ?`,
    answer: `Plusieurs ${plural} ${preposition} ${locationName} interviennent en urgence. Déposez votre demande en précisant le caractère urgent : les professionnels disponibles vous recontactent rapidement.`,
  });

  // 3. PAS CHER
  faqs.push({
    question: `Comment trouver ${article} ${singular} pas cher ${preposition} ${locationName} ?`,
    answer: `Pour un tarif compétitif, comparez plusieurs devis gratuits ${de(plural)} ${preposition} ${locationName}. Le moins cher n'est pas toujours le meilleur : vérifiez les avis et les certifications avant de choisir.`,
  });

  // 4. RGE (uniquement BTP)
  if (isBtp) {
    faqs.push(
      isBE
        ? {
            question: `Les ${plural} ${preposition} ${locationName} donnent-ils droit aux primes rénovation ?`,
            answer: `Pour certains travaux d'amélioration énergétique, faire appel à un professionnel qualifié ${preposition} ${locationName} peut ouvrir droit aux primes rénovation régionales (Prime Habitation en Wallonie, prime RENOLUTION à Bruxelles). Vérifiez les conditions et l'agréation avant de vous engager.`,
          }
        : {
            question: `Les ${plural} ${preposition} ${locationName} sont-ils certifiés RGE ?`,
            answer: `Certains ${plural} ${preposition} ${locationName} sont certifiés RGE (Reconnu Garant de l'Environnement), ce qui ouvre droit aux aides comme MaPrimeRénov'. La certification est indiquée sur leur fiche.`,
          }
    );
  }

  // 5. DEVIS
  faqs.push({
    question: `Comment obtenir un devis gratuit ${preposition} ${locationName} ?`,
    answer: `Déposez votre projet sur Workwave, c'est gratuit et sans engagement. Vous recevez rapidement plusieurs devis ${de(plural)} ${preposition} ${locationName} pour comparer.`,
  });

  return faqs;
}
