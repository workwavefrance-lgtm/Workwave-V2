/**
 * Helpers pour le flow code email Workwave AI /ai/connexion :
 *   - sendSigninCode(email, ip) : genere code 6 chiffres + temp_password
 *                                  + envoie email + insert ai_signin_attempts
 *   - verifySigninCode(email, code) : valide le code, retourne temp_password
 *                                      pour permettre signInWithPassword.
 *
 * Pattern strictement identique a /pro/reclamer/[slug] (BTP). On ne stocke
 * jamais le code en clair (hash SHA-256), temp_password nullify apres usage.
 *
 * Rate limiting : max 3 attempts / 15 min / email (anti-spam).
 *                 Max 3 verifications / attempt (anti-bruteforce).
 *                 Expiry 15 min (anti-replay).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "crypto";
import { Resend } from "resend";

const SIGNIN_CODE_TTL_MIN = 15;
const MAX_ATTEMPTS_PER_EMAIL_15MIN = 3;
const MAX_CODE_VERIFY_TRIES = 3;

function getServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getResendClient(): Resend {
  return new Resend(process.env.RESEND_API_KEY);
}

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function generate6DigitCode(): string {
  // Cryptographically secure, range 100000-999999
  const buf = randomBytes(4);
  const num = buf.readUInt32BE(0) % 900000;
  return String(num + 100000);
}

function generateStrongPassword(): string {
  return randomBytes(32).toString("base64url");
}

export type SendSigninCodeResult =
  | { ok: true; attemptId: number }
  | { ok: false; reason: "no_account" | "rate_limited" | "email_send_failed" | "user_update_failed" };

/**
 * Envoie un code de connexion au freelance.
 * Verifie que l'email est lie a un pro tech actif avec claimed_by_user_id.
 */
export async function sendSigninCode(
  email: string,
  ip?: string,
  userAgent?: string
): Promise<SendSigninCodeResult> {
  const sb = getServiceClient();
  const cleanEmail = email.trim().toLowerCase();

  // 1) Rate limiting : max 3 attempts / 15 min / email
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count: recentCount } = await sb
    .from("ai_signin_attempts")
    .select("id", { count: "exact", head: true })
    .eq("email", cleanEmail)
    .gte("created_at", fifteenMinAgo);

  if (recentCount && recentCount >= MAX_ATTEMPTS_PER_EMAIL_15MIN) {
    return { ok: false, reason: "rate_limited" };
  }

  // 2) Verifier que l'email correspond a un pro tech actif claimed
  // (le user doit exister en auth Supabase + avoir une fiche pros tech)
  const { data: pro } = await sb
    .from("pros")
    .select("id, claimed_by_user_id, category_id, first_name:name")
    .eq("email", cleanEmail)
    .in("category_id", [43, 44, 45, 46, 47, 48])
    .eq("is_active", true)
    .is("deleted_at", null)
    .not("claimed_by_user_id", "is", null)
    .maybeSingle();

  if (!pro) {
    // On ne reveal pas si l'email existe pour eviter user enumeration.
    // L'user va recevoir un message generique cote UI.
    return { ok: false, reason: "no_account" };
  }

  // 3) Lookup auth user
  const userId = pro.claimed_by_user_id as string;
  if (!userId) return { ok: false, reason: "no_account" };

  // 4) Generer code 6 chiffres + temp_password
  const code = generate6DigitCode();
  const codeHash = hashCode(code);
  const tempPassword = generateStrongPassword();
  const expiresAt = new Date(Date.now() + SIGNIN_CODE_TTL_MIN * 60 * 1000).toISOString();

  // 5) Update auth user password = temp_password (transparent pour le user)
  const { error: updateUserError } = await sb.auth.admin.updateUserById(userId, {
    password: tempPassword,
  });

  if (updateUserError) {
    console.error("[sendSigninCode] auth update failed:", updateUserError.message);
    return { ok: false, reason: "user_update_failed" };
  }

  // 6) Insert ai_signin_attempts
  const { data: attempt, error: insertError } = await sb
    .from("ai_signin_attempts")
    .insert({
      email: cleanEmail,
      verification_code_hash: codeHash,
      temp_password: tempPassword,
      expires_at: expiresAt,
      status: "pending",
      ip: ip || null,
      user_agent: userAgent || null,
    })
    .select("id")
    .single();

  if (insertError || !attempt) {
    console.error("[sendSigninCode] insert failed:", insertError);
    return { ok: false, reason: "user_update_failed" };
  }

  // 7) Envoyer email avec le code
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";
  const subject = `Workwave AI — Code de connexion : ${code}`;
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#F7F7F7;margin:0;padding:24px;color:#0A0A0A;">
  <div style="max-width:560px;margin:0 auto;background:white;border:1px solid #E5E5E5;border-radius:16px;padding:32px;">
    <p style="font-family:'SF Mono',Menlo,monospace;font-size:11px;color:#999;letter-spacing:0.2em;margin:0 0 20px 0;">[ WORKWAVE AI · CONNEXION ]</p>

    <h1 style="font-size:22px;color:#0A0A0A;margin:0 0 12px 0;font-weight:800;letter-spacing:-0.02em;">Votre code de connexion</h1>
    <p style="font-size:14px;color:#525252;line-height:1.6;margin:0 0 24px 0;">Voici votre code a usage unique pour vous connecter a votre espace freelance Workwave AI :</p>

    <div style="background:#FAFAFA;border:1px solid #E5E5E5;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px 0;">
      <p style="font-family:'SF Mono',Menlo,monospace;font-size:32px;font-weight:800;letter-spacing:0.3em;color:#FF6803;margin:0;">${code}</p>
    </div>

    <p style="font-size:13px;color:#525252;line-height:1.6;margin:0 0 16px 0;">
      Saisissez ce code sur la page de verification. Il est valide ${SIGNIN_CODE_TTL_MIN} minutes.
    </p>

    <p style="font-size:13px;color:#999;line-height:1.6;margin:24px 0 0 0;">
      Vous n'avez pas demande ce code ? Ignorez ce message, votre compte est en securite.
    </p>

    <hr style="border:none;border-top:1px solid #E5E5E5;margin:32px 0 16px 0;">
    <p style="font-size:11px;color:#999;text-align:center;">
      Workwave AI · <a href="${baseUrl}/ai" style="color:#999;">workwave.fr/ai</a>
    </p>
  </div>
</body></html>`;

  try {
    const r = await getResendClient().emails.send({
      from: "Workwave AI <contact@workwave.fr>",
      to: [cleanEmail],
      subject,
      html,
    });
    if (r.error) {
      console.error("[sendSigninCode] Resend error:", r.error);
      // Nullify temp_password si email failed pour eviter compromise
      await sb
        .from("ai_signin_attempts")
        .update({ temp_password: null, status: "expired", error_reason: "email_send_failed" })
        .eq("id", attempt.id);
      return { ok: false, reason: "email_send_failed" };
    }
  } catch (e) {
    console.error("[sendSigninCode] exception:", e);
    await sb
      .from("ai_signin_attempts")
      .update({ temp_password: null, status: "expired", error_reason: "email_send_exception" })
      .eq("id", attempt.id);
    return { ok: false, reason: "email_send_failed" };
  }

  return { ok: true, attemptId: attempt.id };
}

export type VerifySigninCodeResult =
  | { ok: true; tempPassword: string; email: string }
  | { ok: false; reason: "invalid_code" | "expired" | "blocked" | "no_attempt" };

/**
 * Verifie le code saisi par le freelance.
 * Si OK, retourne le temp_password pour signInWithPassword.
 * Le caller doit ensuite nullify temp_password en BDD (apres signin).
 */
export async function verifySigninCode(
  email: string,
  code: string
): Promise<VerifySigninCodeResult> {
  const sb = getServiceClient();
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();

  // 1) Recuperer la derniere attempt pending pour cet email
  const { data: attempt } = await sb
    .from("ai_signin_attempts")
    .select("id, verification_code_hash, temp_password, expires_at, attempts, status")
    .eq("email", cleanEmail)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!attempt) return { ok: false, reason: "no_attempt" };

  // 2) Check expiry
  if (new Date(attempt.expires_at) < new Date()) {
    await sb
      .from("ai_signin_attempts")
      .update({ status: "expired", temp_password: null })
      .eq("id", attempt.id);
    return { ok: false, reason: "expired" };
  }

  // 3) Check max tries
  if (attempt.attempts >= MAX_CODE_VERIFY_TRIES) {
    await sb
      .from("ai_signin_attempts")
      .update({ status: "blocked", temp_password: null })
      .eq("id", attempt.id);
    return { ok: false, reason: "blocked" };
  }

  // 4) Verifier le hash
  const submittedHash = hashCode(cleanCode);
  if (submittedHash !== attempt.verification_code_hash) {
    const newAttempts = attempt.attempts + 1;
    const updates: Record<string, unknown> = { attempts: newAttempts };
    if (newAttempts >= MAX_CODE_VERIFY_TRIES) {
      updates.status = "blocked";
      updates.temp_password = null;
    }
    await sb.from("ai_signin_attempts").update(updates).eq("id", attempt.id);
    return { ok: false, reason: "invalid_code" };
  }

  // 5) Code OK
  if (!attempt.temp_password) {
    return { ok: false, reason: "no_attempt" };
  }

  return {
    ok: true,
    tempPassword: attempt.temp_password,
    email: cleanEmail,
  };
}

/**
 * Nullify temp_password apres signin reussi (a appeler par le caller).
 */
export async function markSigninAttemptComplete(email: string): Promise<void> {
  const sb = getServiceClient();
  await sb
    .from("ai_signin_attempts")
    .update({
      status: "verified",
      success: true,
      verification_code_hash: null,
      temp_password: null,
    })
    .eq("email", email.trim().toLowerCase())
    .eq("status", "pending");
}
