"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { sendSigninCode } from "@/lib/ai/auth/signin-code";

/**
 * Server Action /ai/connexion (Phase 8) :
 *   1. Valide email
 *   2. sendSigninCode() :
 *      - Verifie que email = pro tech actif claimed (sinon no_account)
 *      - Genere code 6 chiffres + temp_password aleatoire
 *      - Update auth user password = temp_password (transparent)
 *      - Insert ai_signin_attempts (hash code, temp_password, expiry 15min)
 *      - Envoie email avec le code
 *   3. Redirect vers /ai/connexion/verifier?email=... pour saisie code
 *
 * Si l'email n'existe pas (no_account) : message generique cote UI pour
 * eviter user enumeration. On affiche la meme page succes que si OK.
 *
 * Rate limit : max 3 attempts / 15 min / email (cf signin-code.ts).
 */

export async function submitConnexion(formData: FormData): Promise<void> {
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    redirect("/ai/connexion?error=invalid_email");
  }

  // Recuperer IP + User-Agent pour rate limit + audit
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0].trim() ||
    hdrs.get("x-real-ip") ||
    null;
  const userAgent = hdrs.get("user-agent") || null;

  const result = await sendSigninCode(email, ip || undefined, userAgent || undefined);

  if (result.ok) {
    // Code envoye -> page saisie code
    redirect(`/ai/connexion/verifier?email=${encodeURIComponent(email)}`);
  }

  // Sinon : on redirige avec message generique. Pas de detail pour eviter
  // user enumeration. Le user voit "Si un compte existe, code envoye".
  if (result.reason === "rate_limited") {
    redirect("/ai/connexion?error=rate_limited");
  }
  if (result.reason === "no_account") {
    // SAME redirect que success : pas de user enumeration leak
    redirect(`/ai/connexion/verifier?email=${encodeURIComponent(email)}&maybe=1`);
  }

  // Erreurs techniques (email_send_failed, user_update_failed) : on indique
  // un probleme technique sans details specifiques.
  console.error("[submitConnexion] technical error:", result.reason);
  redirect("/ai/connexion?error=technical");
}
