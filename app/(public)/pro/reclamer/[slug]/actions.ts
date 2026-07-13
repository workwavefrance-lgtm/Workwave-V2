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
  sendClaimSuccessAlert,
} from "@/lib/email/send-verification-code";
import { sendClaimWelcomeEmail } from "@/lib/email/send-claim-welcome";
import { track } from "@/lib/analytics/track";
import { EVENTS } from "@/lib/analytics/events";

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

// Notification admin (fire-and-forget) apres une reclamation reussie.
// Recupere les details du pro et envoie une alerte par email a ADMIN_EMAIL.
async function notifyAdminOfClaimSuccess(params: {
  slug: string;
  claimEmail: string;
  ip?: string;
}) {
  try {
    const serviceClient = await getServiceClient();
    const { data: pro } = await serviceClient
      .from("pros")
      .select(
        "id, slug, name, siret, cities(name), categories(name)"
      )
      .eq("slug", params.slug)
      .single();

    if (!pro) return;

    // cities et categories peuvent etre objets ou tableaux selon le shape
    type Joined = { name?: string } | { name?: string }[] | null;
    const pickName = (v: Joined): string | null => {
      if (!v) return null;
      if (Array.isArray(v)) return v[0]?.name ?? null;
      return v.name ?? null;
    };

    await sendClaimSuccessAlert({
      proId: pro.id,
      proName: pro.name,
      proSlug: pro.slug,
      proSiret: pro.siret,
      proCity: pickName(pro.cities as Joined),
      proCategory: pickName(pro.categories as Joined),
      claimEmail: params.claimEmail,
      ip: params.ip,
    });
  } catch (err) {
    console.error("notifyAdminOfClaimSuccess error :", err);
  }
}

// Notification PRO (fire-and-forget) apres une reclamation reussie.
// Envoie un mail de bienvenue au pro avec recap trial + avantages
// Workwave Pro + 3 conseils pour demarrer.
async function notifyProOfClaimSuccess(params: {
  slug: string;
  claimEmail: string;
}) {
  try {
    const serviceClient = await getServiceClient();
    const { data: pro } = await serviceClient
      .from("pros")
      .select(
        "name, category_id, secondary_category_ids, intervention_radius_km, cities(latitude, longitude, department_id)"
      )
      .eq("slug", params.slug)
      .single();

    if (!pro) return;

    // Projets DÉJÀ disponibles dans la zone du pro (hook « X projets vous
    // attendent déjà » dans le mail). Isolé dans son propre try/catch : si le
    // calcul échoue, le mail de bienvenue part quand même, sans le bloc.
    let availableProjects;
    try {
      const { getAvailableProjectsForPro } = await import(
        "@/lib/queries/available-projects"
      );
      const city = Array.isArray(pro.cities) ? pro.cities[0] : pro.cities;
      availableProjects = await getAvailableProjectsForPro(serviceClient, {
        category_id: pro.category_id,
        secondary_category_ids: pro.secondary_category_ids,
        intervention_radius_km: pro.intervention_radius_km,
        city: city ?? null,
      });
    } catch (e) {
      console.error("getAvailableProjectsForPro error :", e);
    }

    await sendClaimWelcomeEmail({
      email: params.claimEmail,
      proName: pro.name,
      availableProjects,
    });
  } catch (err) {
    console.error("notifyProOfClaimSuccess error :", err);
  }
}

// Notifs claim (mail admin + mail pro) : awaitées pour GARANTIR l'envoi (leçon
// 24/05 : une promesse détachée dans un Server Action est tuée au return ; le
// mail pro fait des requêtes DB → 06/06 : await le business-critique), MAIS
// bornées à 8 s par Promise.race : Resend n'a pas de timeout par défaut, un hang
// provider ne doit JAMAIS geler l'auto-login + le redirect du claim. Les 2
// fonctions notify* catchent déjà leurs erreurs → jamais de throw ici.
async function sendClaimNotifications(params: {
  slug: string;
  claimEmail: string;
  ip?: string;
}) {
  await Promise.race([
    Promise.all([
      notifyAdminOfClaimSuccess(params),
      notifyProOfClaimSuccess({ slug: params.slug, claimEmail: params.claimEmail }),
    ]),
    new Promise((resolve) => setTimeout(resolve, 8000)),
  ]);
}

// ============================================
// Validation
// ============================================

// Formulaire de réclamation allégé (refonte 15/06, variante A) : on ne demande
// que l'identité (SIRET = preuve) + email (où recevoir le code) + mot de passe.
// managerName/phone étaient collectés mais JAMAIS stockés (le pro les complète
// dans son espace après) ; passwordConfirm retiré au profit de l'œil afficher.
const claimSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  // France : SIRET 14 chiffres. Belgique : numéro d'entreprise BCE 10 chiffres
  // (stocké dans pros.siret). La preuve de propriété reste identique : le
  // numéro saisi doit matcher EXACTEMENT celui de la fiche.
  siret: z
    .string()
    .regex(
      /^(\d{14}|\d{10})$/,
      "Numéro invalide : SIRET (14 chiffres, France) ou numéro d'entreprise BCE (10 chiffres, Belgique)"
    ),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/\d/, "Le mot de passe doit contenir au moins 1 chiffre"),
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
    // On retire TOUT non-chiffre : espaces du SIRET FR ("123 456…") ET points du
    // BCE belge ("1016.514.072"). L'ancien /\s/ ne retirait que les espaces →
    // le BCE avec points échouait au regex \d{10} = « Numéro invalide » (Nelson,
    // N.C.O Design, bloqué en réclamation le 12/07).
    siret: (formData.get("siret") as string)?.replace(/\D/g, ""),
    password: formData.get("password") as string,
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

  // Tracking claim_started (fire-and-forget)
  track(EVENTS.CLAIM_STARTED, {
    proId: pro.id,
    metadata: { email: data.email },
  });

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

      // Lier la fiche au user. Modele BTP Sprint 13 : pay-per-lead 9,90€ par
      // lead debloque, fiche gratuite a vie. Pas d'essai gratuit / pas de CB
      // requise. Le subscription_status reste "none" jusqu'au premier paiement.
      await serviceClient
        .from("pros")
        .update({
          claimed_by_user_id: userId,
          claimed_at: new Date().toISOString(),
          subscription_status: "none",
          trial_ends_at: null,
          // Rayon par defaut 100 km a la reclamation (decision 11/06) : la fiche
          // scrapee porte encore l'ancien defaut 20 km, jamais choisi par le pro.
          intervention_radius_km: 200,
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

      // Tracking claim_completed (fire-and-forget)
      track(EVENTS.CLAIM_COMPLETED, {
        userId: userId,
        metadata: { slug },
      });

      // Notifications admin + pro (awaitées, bornées 8s — cf. sendClaimNotifications)
      await sendClaimNotifications({
        slug,
        claimEmail: attempt.email,
        ip: attempt.ip ?? undefined,
      });

      // Connecter l'utilisateur côté serveur
      await signInAndSetCookies(attempt.email, attempt.temp_password);

      return { success: true, redirectUrl: "/pro/dashboard/fiche" };
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

  // 2. Lier la fiche au user. Modele BTP Sprint 13 : pay-per-lead 9,90€ par
  // lead debloque, fiche gratuite a vie. Pas d'essai gratuit / pas de CB
  // requise. Le subscription_status reste "none" jusqu'au premier paiement.
  const { error: updateError } = await serviceClient
    .from("pros")
    .update({
      claimed_by_user_id: userId,
      claimed_at: new Date().toISOString(),
      subscription_status: "none",
      trial_ends_at: null,
      // Rayon par defaut 100 km a la reclamation (cf. branche ci-dessus).
      intervention_radius_km: 200,
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

  // 4. Tracking claim_completed (fire-and-forget)
  track(EVENTS.CLAIM_COMPLETED, {
    userId,
    metadata: { slug },
  });

  // 5. Notifications admin + pro (awaitées, bornées 8s — cf. sendClaimNotifications)
  await sendClaimNotifications({
    slug,
    claimEmail: attempt.email,
    ip: attempt.ip ?? undefined,
  });

  // 6. Connecter l'utilisateur côté serveur (écrire les cookies de session)
  await signInAndSetCookies(attempt.email, attempt.temp_password);

  return { success: true, redirectUrl: "/pro/dashboard/fiche" };
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
