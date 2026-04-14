import { createHmac } from "crypto";

/**
 * Genere un token HMAC pour la desinscription d'une campagne specifique.
 * Pas d'expiration : un lien de desinscription doit toujours fonctionner.
 */
export function generateUnsubscribeToken(proId: number): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const payload = `cold-email-unsubscribe:${proId}`;
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyUnsubscribeToken(
  proId: number,
  token: string
): boolean {
  const expected = generateUnsubscribeToken(proId);
  return token === expected;
}

/**
 * Genere un token HMAC pour la blacklist globale (ne plus jamais recontacter).
 * Scope different du token campagne pour eviter les collisions.
 */
export function generateGlobalUnsubscribeToken(proId: number): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const payload = `cold-email-global-blacklist:${proId}`;
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyGlobalUnsubscribeToken(
  proId: number,
  token: string
): boolean {
  const expected = generateGlobalUnsubscribeToken(proId);
  return token === expected;
}
