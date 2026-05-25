/**
 * Helpers communs Workwave AI (Phase 8 fix #15) : centralise la logique
 * "qu'est-ce qu'un pro Premium AI" pour eviter les definitions
 * incoherentes entre dashboard pages.
 */

// Note : pas de `as const` pour permettre .includes(arbitraire number) dans
// les check `if (!AI_CATEGORY_IDS.includes(pro.category_id))`. Sinon TS
// raise "Argument of type 'number' is not assignable to parameter of type
// '43 | 44 | 45 | 46 | 47 | 48'".
export const AI_CATEGORY_IDS: readonly number[] = [43, 44, 45, 46, 47, 48];

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
