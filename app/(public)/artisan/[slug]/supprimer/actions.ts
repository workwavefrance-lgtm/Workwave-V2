"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createHash, randomInt } from "crypto";
import { sendVerificationCode } from "@/lib/email/send-verification-code";

// ============================================
// Types
// ============================================

export type DeletionRequestState = {
  success: boolean;
  errors?: Record<string, string>;
  message?: string;
};

export type DeletionVerifyState = {
  success: boolean;
  errors?: Record<string, string>;
  message?: string;
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

const deletionSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  siret: z
    .string()
    .regex(/^\d{14}$/, "Le SIRET doit contenir exactement 14 chiffres"),
});

// ============================================
// submitDeletionRequest — Vérification SIRET + envoi code
// ============================================

export async function submitDeletionRequest(
  _prevState: DeletionRequestState,
  formData: FormData
): Promise<DeletionRequestState> {
  const slug = formData.get("slug") as string;
  if (!slug) {
    return { success: false, message: "Fiche introuvable" };
  }

  const raw = {
    email: (formData.get("email") as string)?.trim(),
    siret: (formData.get("siret") as string)?.replace(/\s/g, ""),
  };

  const result = deletionSchema.safeParse(raw);
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

  // Fetch pro
  const { data: pro, error: proError } = await serviceClient
    .from("pros")
    .select("id, name, siret, deleted_at")
    .eq("slug", slug)
    .single();

  if (proError || !pro) {
    return { success: false, message: "Fiche introuvable" };
  }

  if (pro.deleted_at) {
    return { success: false, message: "Cette fiche a déjà été supprimée." };
  }

  if (!pro.siret) {
    return {
      success: false,
      message: "Cette fiche ne peut pas être supprimée automatiquement. Contactez le support.",
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
      type: "deletion",
    });

    return {
      success: false,
      errors: { siret: "Le SIRET saisi ne correspond pas à cette fiche" },
    };
  }

  // Générer et hasher le code
  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

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
      type: "deletion",
    })
    .select("id")
    .single();

  if (attemptError || !attempt) {
    return { success: false, message: "Erreur interne, veuillez réessayer" };
  }

  try {
    await sendVerificationCode(data.email, code, pro.name);
  } catch {
    await serviceClient
      .from("claim_attempts")
      .update({ status: "expired", error_reason: "email_send_failed" })
      .eq("id", attempt.id);

    return {
      success: false,
      message: "Impossible d'envoyer l'email de vérification.",
    };
  }

  redirect(`/artisan/${slug}/supprimer/verification?attempt=${attempt.id}`);
}

// ============================================
// verifyDeletion — Vérification code + soft-delete
// ============================================

export async function verifyDeletion(
  _prevState: DeletionVerifyState,
  formData: FormData
): Promise<DeletionVerifyState> {
  const attemptId = formData.get("attemptId") as string;
  const code = formData.get("code") as string;
  const slug = formData.get("slug") as string;

  if (!attemptId || !code || !slug) {
    return { success: false, message: "Données manquantes" };
  }

  if (!/^\d{6}$/.test(code)) {
    return {
      success: false,
      errors: { code: "Le code doit contenir 6 chiffres" },
    };
  }

  const serviceClient = await getServiceClient();

  const { data: attempt, error: attemptError } = await serviceClient
    .from("claim_attempts")
    .select("*")
    .eq("id", parseInt(attemptId))
    .eq("type", "deletion")
    .single();

  if (attemptError || !attempt) {
    return { success: false, message: "Tentative introuvable ou expirée" };
  }

  if (attempt.status !== "pending") {
    if (attempt.status === "blocked") {
      return {
        success: false,
        message:
          "Cette tentative a été bloquée après trop d'essais. Veuillez recommencer.",
      };
    }
    return {
      success: false,
      message: "Ce code n'est plus valide. Veuillez recommencer.",
    };
  }

  if (new Date(attempt.code_expires_at) < new Date()) {
    await serviceClient
      .from("claim_attempts")
      .update({ status: "expired" })
      .eq("id", attempt.id);

    return { success: false, message: "Ce code a expiré. Veuillez recommencer." };
  }

  if (attempt.attempts_count >= 3) {
    await serviceClient
      .from("claim_attempts")
      .update({ status: "blocked" })
      .eq("id", attempt.id);

    return {
      success: false,
      message: "Trop de tentatives échouées. Veuillez recommencer dans 1 heure.",
    };
  }

  const submittedHash = hashCode(code);
  if (submittedHash !== attempt.verification_code_hash) {
    const newCount = attempt.attempts_count + 1;
    const updates: Record<string, unknown> = { attempts_count: newCount };
    if (newCount >= 3) updates.status = "blocked";

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

  // Code correct — soft-delete la fiche

  // Récupérer le pro pour vérification et infos Stripe
  const { data: pro } = await serviceClient
    .from("pros")
    .select("id, name, stripe_subscription_id, subscription_status")
    .eq("slug", slug)
    .single();

  if (!pro) {
    return { success: false, message: "Fiche introuvable" };
  }

  // 1. Soft-delete
  await serviceClient
    .from("pros")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", pro.id);

  // 2. Résilier l'abonnement Stripe si actif
  if (
    pro.stripe_subscription_id &&
    (pro.subscription_status === "active" || pro.subscription_status === "trialing")
  ) {
    try {
      const { getStripeServer } = await import("@/lib/stripe/server");
      const stripe = getStripeServer();
      await stripe.subscriptions.cancel(pro.stripe_subscription_id);
    } catch (err) {
      console.error("Erreur résiliation Stripe lors de suppression fiche:", err);
    }
  }

  // 3. Marquer la tentative comme vérifiée
  await serviceClient
    .from("claim_attempts")
    .update({
      status: "verified",
      success: true,
      verification_code_hash: null,
    })
    .eq("id", attempt.id);

  // 4. Email alerte admin
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Workwave <onboarding@resend.dev>",
      to: process.env.ADMIN_EMAIL || "admin@workwave.fr",
      subject: `[Workwave Alert] Demande de suppression de fiche — ${pro.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #0A0A0A;">Fiche supprimée (RGPD)</h2>
          <p>Le professionnel <strong>${pro.name}</strong> a demandé la suppression de sa fiche.</p>
          <p>La fiche a été désactivée (soft-delete). L'abonnement Stripe a été résilié si actif.</p>
          <p><strong>Slug :</strong> ${slug}</p>
          <p><strong>Email demandeur :</strong> ${attempt.email}</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Erreur envoi alerte admin suppression fiche:", err);
  }

  return { success: true };
}
