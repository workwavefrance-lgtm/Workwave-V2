"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createHash, randomInt } from "crypto";
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

async function getOrigin(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

// ============================================
// Validation
// ============================================

const claimSchema = z.object({
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
});

// ============================================
// submitClaim — Vérification SIRET + envoi code
// ============================================

const initialClaimState: ClaimFormState = { success: false };

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
    // Alerte admin (non bloquante)
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
    // Log la tentative échouée
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

  // Créer la tentative en base
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
    })
    .select("id")
    .single();

  if (attemptError || !attempt) {
    return { success: false, message: "Erreur interne, veuillez réessayer" };
  }

  // Envoyer le code par email (bloquant — si échec, erreur)
  try {
    await sendVerificationCode(data.email, code, pro.name);
  } catch {
    // Marquer la tentative comme expirée si l'email échoue
    await serviceClient
      .from("claim_attempts")
      .update({ status: "expired", error_reason: "email_send_failed" })
      .eq("id", attempt.id);

    return {
      success: false,
      message:
        "Impossible d'envoyer l'email de vérification. Vérifiez votre adresse email et réessayez.",
    };
  }

  // Rediriger vers la page de vérification
  redirect(`/pro/reclamer/${slug}/verification?attempt=${attempt.id}`);
}

// ============================================
// verifyClaim — Vérification code + création compte
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
      .update({ status: "expired" })
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
      .update({ status: "blocked" })
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
    // Incrémenter le compteur
    const newCount = attempt.attempts_count + 1;
    const updates: Record<string, unknown> = {
      attempts_count: newCount,
    };
    if (newCount >= 3) {
      updates.status = "blocked";
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

  // Code correct — créer le compte et lier la fiche

  // 1. Créer le user Supabase Auth (ou récupérer s'il existe)
  const { error: createError } = await serviceClient.auth.admin.createUser({
    email: attempt.email,
    email_confirm: true,
  });

  // Ignorer l'erreur "user already exists"
  if (createError && !createError.message.includes("already")) {
    return { success: false, message: "Erreur lors de la création du compte" };
  }

  // 2. Générer un magic link pour obtenir le user ID et signer l'utilisateur
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (await getOrigin());
  const { data: linkData, error: linkError } =
    await serviceClient.auth.admin.generateLink({
      type: "magiclink",
      email: attempt.email,
      options: {
        redirectTo: `${baseUrl}/auth/callback?next=/pro/reclamer/succes`,
      },
    });

  if (linkError || !linkData?.user) {
    return { success: false, message: "Erreur lors de la création du compte" };
  }

  const userId = linkData.user.id;

  // 3. Lier la fiche au user + activer l'essai gratuit 14 jours
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
    return { success: false, message: "Erreur lors de la réclamation de la fiche" };
  }

  // 4. Marquer la tentative comme vérifiée, supprimer le hash
  await serviceClient
    .from("claim_attempts")
    .update({
      status: "verified",
      success: true,
      verification_code_hash: null,
    })
    .eq("id", attempt.id);

  // 5. Retourner l'URL du magic link pour connexion automatique
  return {
    success: true,
    redirectUrl: linkData.properties.action_link,
  };
}
