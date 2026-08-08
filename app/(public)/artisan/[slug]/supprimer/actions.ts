"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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
  // France : SIRET 14 chiffres. Belgique : numero BCE 10 chiffres (stocke
  // dans pros.siret). La verification reste le match exact avec la fiche.
  siret: z
    .string()
    .regex(
      /^(\d{14}|\d{10})$/,
      "Numero invalide : SIRET (14 chiffres, France) ou numero d'entreprise BCE (10 chiffres, Belgique)"
    ),
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

  // 1. Soft-delete COMPLET.
  //
  // Avant le 08/08/2026 cette etape n'ecrivait QUE `deleted_at`. Constate sur la
  // demande de MOSES UTUKA (07/08 23:35) : 8 h plus tard sa fiche repondait
  // toujours 200 et il restait contactable en prospection. Trois manques :
  //   - `is_active` restait true  -> la fiche continuait de compter comme active
  //   - `do_not_contact` restait false -> il pouvait recevoir un mail de
  //     prospection APRES avoir demande sa suppression (art. 21 RGPD)
  //   - les coordonnees restaient en base
  // C'est le "pattern suppression complete" deja documente dans CLAUDE.md
  // (cas Freddy DURAND) : il n'etait applique que par script, jamais par le
  // parcours libre-service que les pros utilisent reellement.
  const { error: deleteError } = await serviceClient
    .from("pros")
    .update({
      deleted_at: new Date().toISOString(),
      is_active: false,
      do_not_contact: true,
      email: null,
      phone: null,
      website: null,
    })
    .eq("id", pro.id);

  // Une mutation Supabase qui echoue renvoie { error } SANS lever d'exception.
  // Sans ce controle, on annoncait la suppression au pro ET a l'admin alors que
  // la fiche etait toujours en ligne — le pire des cas en RGPD : la personne
  // croit sa demande traitee et ne relance pas. On s'arrete net.
  if (deleteError) {
    console.error("[verifyDeletion] soft-delete KO:", deleteError.message);
    return {
      success: false,
      message:
        "La suppression n'a pas pu être enregistrée. Écrivez-nous à contact@workwave.fr en mentionnant votre SIRET, nous la traiterons manuellement sous 48h ouvrées.",
    };
  }

  // 1 bis. Blacklist de l'email du demandeur : sans ca, il reste dans les
  // listes de prospection tant qu'il figure sur une AUTRE fiche (32 % des
  // fiches partagent leur email — cf. memoire `pros-email-non-unique`).
  try {
    await serviceClient
      .from("email_blacklist")
      .upsert(
        { email: attempt.email, reason: "Suppression de fiche (RGPD, libre-service)" },
        { onConflict: "email" }
      );
  } catch (err) {
    console.error("Erreur blacklist email suppression fiche:", err);
  }

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
      from: "Workwave <contact@workwave.fr>",
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

  // 5. PURGE DU CACHE — sans ca, la suppression n'existe pas pour le visiteur.
  //
  // La fiche `/artisan/[slug]` est en cache ISR 7 jours. Le 08/08/2026, la fiche
  // de MOSES UTUKA repondait encore 200 huit heures apres sa demande, alors que
  // `deleted_at` etait bien en base : c'est le cache qui servait l'ancienne page.
  // Il a fallu appeler /api/revalidate-sitemap a la main pour qu'elle passe 404.
  // Une suppression RGPD non purgee reste donc en ligne jusqu'a une semaine.
  //
  // On revalide aussi le sitemap : la fiche doit cesser d'y etre listee, sinon
  // Google continue de la reclamer.
  try {
    revalidatePath(`/artisan/${slug}`);
    revalidatePath("/sitemap/[__metadata_id__]", "page");
  } catch (err) {
    console.error("Erreur purge cache suppression fiche:", err);
  }

  return { success: true };
}
