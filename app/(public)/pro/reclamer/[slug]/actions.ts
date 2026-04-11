"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createHash, randomInt } from "crypto";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  sendVerificationCode,
  sendClaimAlreadyClaimedAlert,
} from "@/lib/email/send-verification-code";

// ============================================
// Types
// ============================================

export type ClaimFormState = {
  success: boolean;
  errors?: Record<string, string>;
  message?: string;
};

export type VerifyFormState = {
  success: boolean;
  errors?: Record<string, string>;
  message?: string;
  redirectUrl?: string;
};

// ============================================
// Helpers
// ============================================

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function generateCode(): string {
  return randomInt(100000, 999999).toString();
}

async function getServiceClient() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getIp(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown"
  );
}

// ============================================
// Validation
// ============================================

const claimSchema = z
  .object({
    email: z.string().email("Adresse email invalide"),
    siret: z
      .string()
      .regex(/^\d{14}$/, "Le SIRET doit contenir exactement 14 chiffres"),
    managerName: z
      .string()
      .min(2, "Le nom doit contenir au moins 2 caractères"),
    phone: z
      .string()
      .regex(
        /^(?:(?:\+33|0033|0)\s*[1-9])(?:[\s.-]*\d{2}){4}$/,
        "Numéro de téléphone invalide"
      ),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .regex(/\d/, "Le mot de passe doit contenir au moins 1 chiffre"),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["passwordConfirm"],
  });

// ============================================
// submitClaim — Vérification SIRET + envoi code
// ============================================

export async function submitClaim(
  _prevState: ClaimFormState,
  formData: FormData
): Promise<ClaimFormState> {
  const slug = formData.get("slug") as string;
  if (!slug) {
    return { success: false, message: "Fiche introuvable" };
  }

  // Validation Zod
  const raw = {
    email: (formData.get("email") as string)?.trim(),
    siret: (formData.get("siret") as string)?.replace(/\s/g, ""),
    managerName: (formData.get("managerName") as string)?.trim(),
    phone: (formData.get("phone") as string)?.trim(),
    password: formData.get("password") as string,
    passwordConfirm: formData.get("passwordConfirm") as string,
  };

  const result = claimSchema.safeParse(raw);
  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string;
      if (!errors[field]) errors[field] = issue.message;
    }
    return { success: false, errors };
  }

  const data = result.data;
  const ip = await getIp();
  const serviceClient = await getServiceClient();

  // Fetch pro par slug
  const { data: pro, error: proError } = await serviceClient
    .from("pros")
    .select("id, name, siret, claimed_by_user_id")
    .eq("slug", slug)
    .single();

  if (proError || !pro) {
    return { success: false, message: "Fiche introuvable" };
  }

  // Cas SIRET null
  if (!pro.siret) {
    return {
      success: false,
      message:
        "Cette fiche ne peut pas être réclamée automatiquement. Merci de contacter le support à contact@workwave.fr pour la réclamer manuellement.",
    };
  }

  // Fiche déjà réclamée
  if (pro.claimed_by_user_id) {
    sendClaimAlreadyClaimedAlert(
      pro.name,
      slug,
      data.email,
      data.siret,
      ip
    ).catch((err) => console.error("Erreur alerte admin :", err));

    return {
      success: false,
      message:
        "Cette fiche a déjà été réclamée. Si vous pensez qu'il y a une erreur, contactez le support.",
    };
  }

  // Vérification SIRET
  if (data.siret !== pro.siret) {
    await serviceClient.from("claim_attempts").insert({
      siret: data.siret,
      email: data.email,
      ip,
      success: false,
      error_reason: "siret_mismatch",
      status: "expired",
    });

    return {
      success: false,
      errors: {
        siret: "Le SIRET saisi ne correspond pas à cette fiche",
      },
    };
  }

  // Rate limiting : même email + 3+ SIRET différents en 7 jours
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: recentAttempts } = await serviceClient
    .from("claim_attempts")
    .select("siret")
    .eq("email", data.email)
    .gte("created_at", sevenDaysAgo);

  if (recentAttempts) {
    const distinctSirets = new Set(recentAttempts.map((a) => a.siret));
    if (distinctSirets.size >= 3 && !distinctSirets.has(data.siret)) {
      return {
        success: false,
        message:
          "Trop de tentatives de réclamation avec cet email. Veuillez réessayer plus tard ou contacter le support.",
      };
    }
  }

  // Générer et hasher le code
  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // Créer la tentative en base (avec temp_password)
  const { data: attempt, error: attemptError } = await serviceClient
    .from("claim_attempts")
    .insert({
      siret: data.siret,
      email: data.email,
      ip,
      success: false,
      verification_code_hash: codeHash,
      code_expires_at: expiresAt,
      attempts_count: 0,
      status: "pending",
      temp_password: data.password,
    })
    .select("id")
    .single();

  if (attemptError || !attempt) {
    return { success: false, message: "Erreur interne, veuillez réessayer" };
  }

  // Envoyer le code par email
  try {
    await sendVerificationCode(data.email, code, pro.name);
  } catch {
    await serviceClient
      .from("claim_attempts")
      .update({ status: "expired", error_reason: "email_send_failed", temp_password: null })
      .eq("id", attempt.id);

    return {
      success: false,
      message:
        "Impossible d'envoyer l'email de vérification. Vérifiez votre adresse email et réessayez.",
    };
  }

  redirect(`/pro/reclamer/${slug}/verification?attempt=${attempt.id}`);
}

// ============================================
// verifyClaim — Vérification code + création compte avec mot de passe
// ============================================

export async function verifyClaim(
  _prevState: VerifyFormState,
  formData: FormData
): Promise<VerifyFormState> {
  const attemptId = formData.get("attemptId") as string;
  const code = formData.get("code") as string;
  const slug = formData.get("slug") as string;

  if (!attemptId || !code || !slug) {
    return { success: false, message: "Données manquantes" };
  }

  if (!/^\d{6}$/.test(code)) {
    return { success: false, errors: { code: "Le code doit contenir 6 chiffres" } };
  }

  const serviceClient = await getServiceClient();

  // Récupérer la tentative
  const { data: attempt, error: attemptError } = await serviceClient
    .from("claim_attempts")
    .select("*")
    .eq("id", parseInt(attemptId))
    .single();

  if (attemptError || !attempt) {
    return { success: false, message: "Tentative introuvable ou expirée" };
  }

  // Vérifier le statut
  if (attempt.status !== "pending") {
    if (attempt.status === "blocked") {
      return {
        success: false,
        message: "Cette tentative a été bloquée après trop d'essais. Veuillez recommencer le processus.",
      };
    }
    return {
      success: false,
      message: "Ce code n'est plus valide. Veuillez recommencer le processus.",
    };
  }

  // Vérifier l'expiration
  if (new Date(attempt.code_expires_at) < new Date()) {
    await serviceClient
      .from("claim_attempts")
      .update({ status: "expired", temp_password: null })
      .eq("id", attempt.id);

    return {
      success: false,
      message: "Ce code a expiré. Veuillez recommencer le processus.",
    };
  }

  // Vérifier le nombre de tentatives
  if (attempt.attempts_count >= 3) {
    await serviceClient
      .from("claim_attempts")
      .update({ status: "blocked", temp_password: null })
      .eq("id", attempt.id);

    return {
      success: false,
      message:
        "Trop de tentatives échouées. Veuillez recommencer le processus dans 1 heure.",
    };
  }

  // Comparer le hash
  const submittedHash = hashCode(code);
  if (submittedHash !== attempt.verification_code_hash) {
    const newCount = attempt.attempts_count + 1;
    const updates: Record<string, unknown> = {
      attempts_count: newCount,
    };
    if (newCount >= 3) {
      updates.status = "blocked";
      updates.temp_password = null;
    }
    await serviceClient
      .from("claim_attempts")
      .update(updates)
      .eq("id", attempt.id);

    const remaining = 3 - newCount;
    return {
      success: false,
      errors: {
        code:
          remaining > 0
            ? `Code incorrect. ${remaining} tentative${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}.`
            : "Code incorrect. Tentatives épuisées.",
      },
    };
  }

  // Code correct — créer le compte avec mot de passe et connecter

  if (!attempt.temp_password) {
    return { success: false, message: "Erreur interne. Veuillez recommencer le processus." };
  }

  // 1. Créer le user Supabase Auth avec email + mot de passe
  const { data: signUpData, error: signUpError } =
    await serviceClient.auth.admin.createUser({
      email: attempt.email,
      password: attempt.temp_password,
      email_confirm: true,
    });

  // Si l'utilisateur existe déjà, mettre à jour son mot de passe
  if (signUpError && signUpError.message.includes("already")) {
    const { data: listData } = await serviceClient.auth.admin.listUsers();
    const existingUser = listData?.users?.find(
      (u) => u.email === attempt.email
    );
    if (existingUser) {
      await serviceClient.auth.admin.updateUserById(existingUser.id, {
        password: attempt.temp_password,
      });
      // Continue avec l'ID existant
      const userId = existingUser.id;

      // Lier la fiche
      await serviceClient
        .from("pros")
        .update({
          claimed_by_user_id: userId,
          claimed_at: new Date().toISOString(),
          subscription_status: "trialing",
          trial_ends_at: new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000
          ).toISOString(),
        })
        .eq("slug", slug);

      // Nullifier temp_password immédiatement
      await serviceClient
        .from("claim_attempts")
        .update({
          status: "verified",
          success: true,
          verification_code_hash: null,
          temp_password: null,
        })
        .eq("id", attempt.id);

      // Connecter l'utilisateur côté serveur
      await signInAndSetCookies(attempt.email, attempt.temp_password);

      return { success: true, redirectUrl: "/pro/dashboard" };
    }

    return { success: false, message: "Erreur lors de la création du compte" };
  }

  if (signUpError || !signUpData?.user) {
    // Nullifier temp_password en cas d'erreur
    await serviceClient
      .from("claim_attempts")
      .update({ temp_password: null })
      .eq("id", attempt.id);

    return { success: false, message: "Erreur lors de la création du compte" };
  }

  const userId = signUpData.user.id;

  // 2. Lier la fiche au user + activer l'essai gratuit 14 jours
  const { error: updateError } = await serviceClient
    .from("pros")
    .update({
      claimed_by_user_id: userId,
      claimed_at: new Date().toISOString(),
      subscription_status: "trialing",
      trial_ends_at: new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000
      ).toISOString(),
    })
    .eq("slug", slug);

  if (updateError) {
    await serviceClient
      .from("claim_attempts")
      .update({ temp_password: null })
      .eq("id", attempt.id);

    return { success: false, message: "Erreur lors de la réclamation de la fiche" };
  }

  // 3. Nullifier temp_password immédiatement
  await serviceClient
    .from("claim_attempts")
    .update({
      status: "verified",
      success: true,
      verification_code_hash: null,
      temp_password: null,
    })
    .eq("id", attempt.id);

  // 4. Connecter l'utilisateur côté serveur (écrire les cookies de session)
  await signInAndSetCookies(attempt.email, attempt.temp_password);

  return { success: true, redirectUrl: "/pro/dashboard" };
}

// ============================================
// Helper : connecter l'utilisateur et écrire les cookies de session
// ============================================

async function signInAndSetCookies(email: string, password: string) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignoré si appelé depuis un Server Component en lecture seule
          }
        },
      },
    }
  );

  await supabase.auth.signInWithPassword({ email, password });
}
