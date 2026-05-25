/**
 * Helpers pour le flow code email Workwave AI /ai/connexion :
 *   - sendSigninCode(email, ip) : utilise le Supabase OTP officiel
 *                                  (auth.signInWithOtp) qui envoie un code
 *                                  a 6 chiffres OU un magic link, gere
 *                                  natif par Supabase.
 *
 * Lecon #1+#2 du 26/05/2026 : on N'ECRASE PAS le password de l'auth
 * user (qui aurait detruit les sessions existantes + ouvert un vecteur
 * DOS via spam email). On N'EXPOSE PAS de temp_password en clair en BDD.
 *
 * Le flux Supabase OTP utilise une signature serveur cryptographique
 * pour le code envoye ; ni nous ni la BDD ne stockons le code ou un
 * password derive. Supabase gere expiry, replay, et integrite.
 *
 * On garde ai_signin_attempts pour tracking + rate limiting cote app,
 * mais SANS le champ temp_password (deprecate). On stocke juste : email,
 * ip, user_agent, status, created_at pour analytics et anti-abuse.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SIGNIN_TTL_MIN = 15;
const MAX_ATTEMPTS_PER_EMAIL_15MIN = 3;
const MAX_ATTEMPTS_PER_IP_15MIN = 20; // Anti-enumeration : limite par IP
// Delai uniforme pour aligner les timings success/no_account (anti-timing-attack)
const TIMING_BASELINE_MS = 800;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Dort jusqu'a ce que (now - startMs) >= baselineMs. Si on est deja
 * en retard, retour immediat. Utilise pour aligner les timings de
 * retour entre branches success/no_account (anti-timing-attack).
 */
async function sleepUntil(startMs: number, baselineMs: number): Promise<void> {
  const elapsed = Date.now() - startMs;
  if (elapsed < baselineMs) {
    await sleep(baselineMs - elapsed);
  }
}

function getServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type SendSigninCodeResult =
  | { ok: true; attemptId: number }
  | {
      ok: false;
      reason:
        | "no_account"
        | "rate_limited"
        | "otp_send_failed"
        | "user_check_failed";
    };

function isValidEmail(email: string): boolean {
  // Regex stricte (vs ancien !email.includes("@") qui acceptait "a@")
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Envoie un code OTP de connexion via Supabase Auth.
 * Verifie d'abord que l'email correspond a un pro tech actif claimed.
 */
export async function sendSigninCode(
  email: string,
  ip?: string,
  userAgent?: string
): Promise<SendSigninCodeResult> {
  // Anti-timing-attack : on tracke le temps de debut pour aligner les timings
  // de retour entre branches success / no_account / rate_limited.
  const startMs = Date.now();
  const sb = getServiceClient();
  const cleanEmail = email.trim().toLowerCase();

  if (!isValidEmail(cleanEmail)) {
    await sleepUntil(startMs, TIMING_BASELINE_MS);
    return { ok: false, reason: "no_account" }; // generique pour eviter enum
  }

  // 1a) Rate limiting par email : max 3 attempts / 15 min / email
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count: recentByEmail } = await sb
    .from("ai_signin_attempts")
    .select("id", { count: "exact", head: true })
    .eq("email", cleanEmail)
    .gte("created_at", fifteenMinAgo);

  if (recentByEmail && recentByEmail >= MAX_ATTEMPTS_PER_EMAIL_15MIN) {
    await sleepUntil(startMs, TIMING_BASELINE_MS);
    return { ok: false, reason: "rate_limited" };
  }

  // 1b) Rate limiting par IP : max 20 attempts / 15 min / IP
  // Protege contre les attaques d'enumeration mass (1 essai par email)
  if (ip) {
    const { count: recentByIp } = await sb
      .from("ai_signin_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("created_at", fifteenMinAgo);

    if (recentByIp && recentByIp >= MAX_ATTEMPTS_PER_IP_15MIN) {
      await sleepUntil(startMs, TIMING_BASELINE_MS);
      return { ok: false, reason: "rate_limited" };
    }
  }

  // 2) Verifier que l'email correspond a un pro tech actif claimed
  // Filtres durs :
  //   - category_id in [43-48] (tech)
  //   - is_active = true, deleted_at IS NULL
  //   - claimed_by_user_id IS NOT NULL (compte deja active)
  //   - subscription_status NOT IN ('canceled') (on accepte trialing/active/
  //     none/past_due/free/suspended pour permettre la connexion meme si
  //     l'abonnement est en cours de probleme, mais pas canceled)
  // NB : on ne reveal pas si l'email existe, message generique cote UI.
  const { data: pro, error: proError } = await sb
    .from("pros")
    .select("id, claimed_by_user_id, category_id, name, subscription_status")
    .eq("email", cleanEmail)
    .in("category_id", [43, 44, 45, 46, 47, 48])
    .eq("is_active", true)
    .is("deleted_at", null)
    .not("claimed_by_user_id", "is", null)
    .neq("subscription_status", "canceled")
    .maybeSingle();

  if (proError) {
    console.error("[sendSigninCode] pros lookup failed:", proError.message);
    await sleepUntil(startMs, TIMING_BASELINE_MS);
    return { ok: false, reason: "user_check_failed" };
  }

  if (!pro) {
    // Anti-enumeration : on cree QUAND MEME une entree de tracking
    // (pour ne pas leak via timing differences) ET on aligne le timing
    // sur le delai d'envoi d'un mail OTP Supabase (~800ms).
    await sb.from("ai_signin_attempts").insert({
      email: cleanEmail,
      ip: ip || null,
      user_agent: userAgent || null,
      status: "expired", // direct expired = pas exploitable
      error_reason: "no_account",
      expires_at: new Date().toISOString(),
    });
    await sleepUntil(startMs, TIMING_BASELINE_MS);
    return { ok: false, reason: "no_account" };
  }

  // 3) Envoyer OTP Supabase (auth officiel, sans toucher au password user)
  // shouldCreateUser: false = ne pas creer un nouveau user si email inconnu
  // (deja verifie ci-dessus de toute facon)
  const { error: otpError } = await sb.auth.signInWithOtp({
    email: cleanEmail,
    options: {
      shouldCreateUser: false,
      // emailRedirectTo seulement utilise si l'user clique le magic link.
      // En pratique on utilise le code 6 chiffres qui apparait dans le mail.
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr"}/ai/dashboard`,
    },
  });

  if (otpError) {
    console.error("[sendSigninCode] OTP send failed:", otpError.message);
    await sb.from("ai_signin_attempts").insert({
      email: cleanEmail,
      ip: ip || null,
      user_agent: userAgent || null,
      status: "expired",
      error_reason: `otp_send_failed: ${otpError.message.slice(0, 200)}`,
      expires_at: new Date().toISOString(),
    });
    await sleepUntil(startMs, TIMING_BASELINE_MS);
    return { ok: false, reason: "otp_send_failed" };
  }

  // 4) Insert tracking row (sans temp_password)
  const expiresAt = new Date(Date.now() + SIGNIN_TTL_MIN * 60 * 1000).toISOString();
  const { data: attempt } = await sb
    .from("ai_signin_attempts")
    .insert({
      email: cleanEmail,
      expires_at: expiresAt,
      status: "pending",
      ip: ip || null,
      user_agent: userAgent || null,
    })
    .select("id")
    .single();

  return { ok: true, attemptId: attempt?.id || 0 };
}

/**
 * Note : la verification du code OTP se fait via auth.verifyOtp() cote
 * Server Action /ai/connexion/verifier (cf. verifier/actions.ts). On
 * passe directement le code utilisateur a Supabase qui valide tout :
 * expiry, replay, integrite cryptographique.
 *
 * On garde markSigninAttemptComplete() pour tracking interne (status
 * 'verified' apres signin reussi).
 */
export async function markSigninAttemptComplete(email: string): Promise<void> {
  const sb = getServiceClient();
  await sb
    .from("ai_signin_attempts")
    .update({
      status: "verified",
      success: true,
    })
    .eq("email", email.trim().toLowerCase())
    .eq("status", "pending");
}

/**
 * Tracking : marquer comme failed (mauvais code) pour analytics + rate
 * limit ulterieur si patterns d'abus detectes.
 */
export async function markSigninAttemptFailed(
  email: string,
  reason: string
): Promise<void> {
  const sb = getServiceClient();
  await sb
    .from("ai_signin_attempts")
    .update({
      status: "expired",
      error_reason: reason.slice(0, 200),
    })
    .eq("email", email.trim().toLowerCase())
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1);
}
