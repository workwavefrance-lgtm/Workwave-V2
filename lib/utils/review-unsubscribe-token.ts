import { createHmac } from "crypto";

/**
 * Token HMAC deterministe pour l'unsub des emails de demande d'avis.
 *
 * Scope dedie ("review-unsubscribe") pour eviter les collisions avec
 * les tokens cold-email pros ou unsubscribe-all (lib/utils/unsubscribe-
 * token.ts). Si jamais quelqu'un essaie d'utiliser un cold-email token
 * sur la route /unsubscribe-review, ca echouera car le payload est
 * different.
 *
 * Pas d'expiration : un lien de desinscription doit toujours marcher,
 * meme un an apres l'envoi du mail (cf. CNIL/RGPD).
 */
export function generateReviewUnsubscribeToken(email: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  // lowercase + trim pour eviter les collisions casing
  const normalizedEmail = email.toLowerCase().trim();
  const payload = `review-unsubscribe:${normalizedEmail}`;
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyReviewUnsubscribeToken(
  email: string,
  token: string
): boolean {
  const expected = generateReviewUnsubscribeToken(email);
  // Comparison constant-time pour eviter le timing attack
  if (token.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < token.length; i++) {
    mismatch |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}
