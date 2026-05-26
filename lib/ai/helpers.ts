/**
 * Helpers communs Workwave AI (Phase 8 fix #15) : centralise la logique
 * "qu'est-ce qu'un pro Premium AI" pour eviter les definitions
 * incoherentes entre dashboard pages.
 */

// 14 categories acceptees sur Workwave AI (multi-vertical freelance services).
//
// Tech (6 macro categories) :
//   43 = intelligence-artificielle
//   44 = developpement-web
//   45 = cloud-devops
//   46 = no-code-automation
//   47 = data-analytics
//   48 = design-produit
//
// Business & creatif (8 macro categories — etendu Phase 13) :
//   79 = marketing-communication
//   80 = design-creation
//   81 = strategie-management
//   82 = finance-comptabilite
//   83 = rh-recrutement
//   85 = juridique-conseil
//   86 = redaction-copywriting
//   87 = audiovisuel-medias
//
// Note : pas de `as const` pour permettre .includes(arbitraire number).
export const AI_CATEGORY_IDS: readonly number[] = [
  43, 44, 45, 46, 47, 48, 79, 80, 81, 82, 83, 85, 86, 87,
];

/**
 * Sub-array : uniquement les 6 categories tech (sans business/creatif).
 * Utile pour les filtres SEO/UI specifiques "vraiment tech" (ex. barometre
 * TJM qui n'a de sens que sur le tech, pas sur le juridique).
 */
export const AI_TECH_CATEGORY_IDS: readonly number[] = [43, 44, 45, 46, 47, 48];

/**
 * Sub-array : uniquement les 8 categories business/creatif (extension Phase 13).
 */
export const AI_BUSINESS_CATEGORY_IDS: readonly number[] = [
  79, 80, 81, 82, 83, 85, 86, 87,
];

/**
 * Verifie si un pro est Premium AI actif (active OU trialing).
 * Doit etre IDENTIQUE dans tous les endroits du code (layout, dashboard,
 * pages, routing) pour eviter les UX incoherentes.
 */
export function isAiPremium(pro: {
  subscription_status?: string | null;
  subscription_product?: string | null;
}): boolean {
  if (pro.subscription_product !== "ai") return false;
  const status = pro.subscription_status;
  return status === "active" || status === "trialing";
}

/**
 * Validation URL stricte pour les champs profil (linkedin, github, etc.)
 * Fix #10 : evite XSS via href="javascript:alert(1)" ou data: URL.
 *
 * Retourne null si invalide ou non-http(s).
 */
export function sanitizeProfileUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Validation email stricte (vs !email.includes("@") qui acceptait "a@").
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Detecte si un pro est en pause active (paused_until > now()).
 */
export function isPaused(pro: { paused_until?: string | null }): boolean {
  if (!pro.paused_until) return false;
  return new Date(pro.paused_until) > new Date();
}
