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
import { track } from "@/lib/analytics/track";
import { EVENTS } from "@/lib/analytics/events";
import { after } from "next/server";
import { notifyClaimPending } from "@/lib/pro/claim-review-email";
import { getServiceClient } from "@/lib/supabase/service-client";

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


async function getIp(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown"
  );
}

// Nombre de numéros erronés tolérés pour un même email sur 7 jours. Une faute
// de frappe ne se produit pas 15 fois : ce plafond n'existe que pour qu'un
// robot ne puisse pas remplir la table indéfiniment (le formulaire est public
// et sans authentification). Le vrai garde-fou anti-détournement est ailleurs :
// il compte les SIRET qui désignent réellement une fiche (cf. submitClaim).
const MAX_SIRET_ERRONES_7J = 15;

type ClientDeService = Awaited<ReturnType<typeof getServiceClient>>;

// Recherche un compte Supabase Auth par email, en parcourant TOUTES les pages.
//
// Corrigé le 31/08/2026. `listUsers()` sans argument ne renvoie que les 50
// premiers comptes : au-delà, un pro qui possède déjà un compte (typiquement
// parce qu'il a déjà réclamé une première fiche) n'était plus retrouvé, la
// création échouait avec « already registered », et on lui répondait « Erreur
// lors de la création du compte » sans qu'il puisse rien y faire. Le nombre de
// comptes ne fait que croître : c'était une panne programmée.
//
// Leçon CLAUDE.md du 26/05 : `auth.admin.getUserByEmail` n'existe pas dans le
// SDK et `sb.schema("auth").from("users")` est refusé par PostgREST
// (« Invalid schema: auth »). Paginer puis filtrer côté application est la
// seule voie.
//
// On s'arrête sur une page VIDE, jamais sur « page plus courte que demandée » :
// GoTrue peut plafonner `perPage` en silence, et le même piège a déjà coûté
// 97 % des URL du sitemap le 30/04 puis 225 000 pros le 09/05.
async function trouverCompteAuthParEmail(
  serviceClient: ClientDeService,
  email: string
): Promise<{ id: string } | null> {
  const emailCherche = email.trim().toLowerCase();
  const TAILLE_PAGE = 1000;
  // Borne de sécurité : 100 pages. Elle n'est atteinte que si le compte est
  // introuvable, ce qui ne devrait jamais arriver puisqu'on n'entre ici
  // qu'après un refus « already registered ».
  const PAGES_MAX = 100;

  for (let page = 1; page <= PAGES_MAX; page++) {
    const { data, error } = await serviceClient.auth.admin.listUsers({
      page,
      perPage: TAILLE_PAGE,
    });

    if (error) {
      console.error(`listUsers page ${page} :`, error.message);
      return null;
    }

    const comptes = data?.users ?? [];
    if (comptes.length === 0) return null;

    const trouve = comptes.find(
      (u) => u.email?.trim().toLowerCase() === emailCherche
    );
    if (trouve) return trouve;
  }

  console.error(
    `trouverCompteAuthParEmail : ${PAGES_MAX} pages parcourues sans trouver le compte`
  );
  return null;
}

// ============================================
// Validation
// ============================================

// Formulaire de réclamation allégé (refonte 15/06, variante A) : on ne demande
// que le numéro de fiche + email (où recevoir le code) + mot de passe.
// managerName/phone étaient collectés mais JAMAIS stockés (le pro les complète
// dans son espace après) ; passwordConfirm retiré au profit de l'œil afficher.
const claimSchema = z.object({
  email: z.string().email("Adresse email invalide").transform((email) => email.trim().toLowerCase()),
  // France : SIRET 14 chiffres. Belgique : numéro d'entreprise BCE 10 chiffres
  // (stocké dans pros.siret). Ce numéro identifie la fiche ; seul un examen
  // manuel permet ensuite d'autoriser le rattachement.
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
// submitClaim : Vérification SIRET + envoi code
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

  // Ménage des mots de passe laissés par les réclamations abandonnées.
  //
  // Le mot de passe choisi par le pro est écrit en clair dans
  // `claim_attempts.temp_password` (plus bas) parce que le compte n'est créé
  // qu'à la saisie du code : il DOIT survivre entre l'envoi du code et sa
  // saisie, sinon le parcours ne peut pas aboutir. Tous les chemins de sortie
  // le nullifient (succès, code expiré, trop d'essais, échec d'envoi du mail),
  // sauf un : le pro qui ne revient jamais. Sa ligne gardait le mot de passe
  // en clair indéfiniment, sans aucun ménage automatique.
  //
  // Purger ces lignes ne peut RIEN casser : `verifyClaim` refuse déjà tout code
  // dont `code_expires_at` est dépassé (et nullifie alors le mot de passe). Une
  // ligne expirée est donc déjà morte pour le parcours, on ne fait que retirer
  // le secret qui y traînait.
  //
  // Limite assumée : le ménage se déclenche à la réclamation suivante, donc un
  // mot de passe abandonné peut survivre plus de 15 minutes s'il ne se passe
  // rien sur le site. Le correctif propre serait une tâche planifiée (pg_cron
  // sur Supabase) ou, mieux, ne plus stocker le mot de passe du tout, ce qui
  // demande de revoir l'ordre du parcours. Ni l'un ni l'autre ne se fait dans
  // ce fichier.
  // 🔴 On nullifie le mot de passe SANS toucher au statut. Corrige le 01/09/2026,
  // avant tout deploiement : la premiere version passait aussi la ligne en
  // "expired", ce qui rendait AVEUGLE le controle de delivrabilite
  // `invariantCodes` de scripts/verif-invariants.ts (lignes 129-146). Celui-ci
  // compte les lignes restees "pending" sans `error_reason` depuis plus de 2 h et
  // alerte au-dela de 3 : c'est ce controle qui detecte qu'un lot de codes n'est
  // jamais arrive (le cas Fabien du 14/06). En requalifiant les lignes en
  // "expired", le menage effacait la trace meme que le controle cherche.
  //
  // Effet de bord evite au passage : un pro qui revient saisir son code apres
  // 15 minutes lit "Ce code a expire" (branche expiration) et non "Ce code n'est
  // plus valide" (branche statut), qui est le message des codes deja consommes.
  await serviceClient
    .from("claim_attempts")
    .update({ temp_password: null })
    .eq("status", "pending")
    .not("temp_password", "is", null)
    .lt("code_expires_at", new Date().toISOString());

  // Fetch pro par slug
  const { data: pro, error: proError } = await serviceClient
    .from("pros")
    .select("id, name, siret, claimed_by_user_id")
    .eq("slug", slug)
    .is("deleted_at", null)
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

  // Tentatives récentes de cet email, lues UNE seule fois : elles servent aux
  // deux garde-fous ci-dessous. Le nombre de requêtes est inchangé par rapport
  // à avant le 31/08/2026, cette lecture était juste faite plus bas.
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: tentativesRecentes } = await serviceClient
    .from("claim_attempts")
    .select("siret, type, error_reason")
    .eq("email", data.email)
    .gte("created_at", sevenDaysAgo);

  // Les demandes de suppression RGPD vivent dans la même table (type
  // "deletion", cf. app/(public)/artisan/[slug]/supprimer/actions.ts). Elles ne
  // disent rien d'une intention de réclamer : elles ne comptent pas ici.
  const tentativesReclamation = (tentativesRecentes ?? []).filter(
    (t) => t.type !== "deletion"
  );
  const numerosErrones = tentativesReclamation.filter(
    (t) => t.error_reason === "siret_mismatch"
  );

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

    // Corrigé le 31/08/2026. Cette ligne est enregistrée pour l'audit, mais un
    // numéro qui ne correspond à AUCUNE fiche ne compte plus dans le garde-fou
    // anti-détournement plus bas. Avant, il y comptait : deux fautes de frappe
    // puis le BON numéro faisaient trois SIRET distincts en 7 jours, donc un
    // blocage de 7 jours au moment précis où le pro rejoignait la plateforme.
    // Sur 52 pros inscrits, on ne peut en perdre aucun de cette façon.
    // Le plafond qui reste ici est volontairement très large : il ne vise que
    // le remplissage automatisé de la table, pas l'artisan qui se trompe.
    if (numerosErrones.length + 1 >= MAX_SIRET_ERRONES_7J) {
      return {
        success: false,
        message:
          "Trop d'essais infructueux avec cet email. Écrivez-nous à contact@workwave.fr en indiquant votre SIRET, nous rattachons la fiche manuellement.",
      };
    }

    return {
      success: false,
      errors: {
        siret: "Le SIRET saisi ne correspond pas à cette fiche",
      },
    };
  }

  // Garde-fou anti-détournement : un même email qui demande un code pour 3
  // entreprises DIFFÉRENTES en 7 jours. On ne compte que les numéros qui ont
  // réellement désigné une fiche, c'est-à-dire ceux qui ont passé la
  // vérification ci-dessus (les fautes de frappe en sont exclues). Un pro qui
  // réessaie sur SA fiche n'est jamais bloqué, d'où le test `!has`.
  const siretsDejaDemandes = new Set(
    tentativesReclamation
      .filter((t) => t.error_reason !== "siret_mismatch")
      .map((t) => t.siret)
  );
  if (siretsDejaDemandes.size >= 3 && !siretsDejaDemandes.has(data.siret)) {
    return {
      success: false,
      message:
        "Trop de tentatives de réclamation avec cet email. Veuillez réessayer plus tard ou contacter le support.",
    };
  }

  // Générer et hasher le code
  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // Créer la tentative en base (avec temp_password)
  const { data: attempt, error: attemptError } = await serviceClient
    .from("claim_attempts")
    .insert({
      target_pro_id: pro.id,
      siret: data.siret,
      email: data.email,
      ip,
      success: false,
      verification_code_hash: codeHash,
      code_expires_at: expiresAt,
      attempts_count: 0,
      status: "pending",
      // La table claim_attempts sert AUSSI aux demandes de suppression RGPD
      // (app/(public)/artisan/[slug]/supprimer/actions.ts, type "deletion").
      // Sans ce marquage, les deux parcours sont indiscernables et un code
      // obtenu pour supprimer une fiche permettait de se l attribuer.
      type: "claim",
      temp_password: data.password,
    })
    .select("id")
    .single();

  if (attemptError || !attempt) {
    if (attemptError?.message.includes("claim_rate_limited")) {
      return {
        success: false,
        message: "Trop de codes demandés. Patientez au moins 15 minutes avant de réessayer. Si le blocage persiste, contactez contact@workwave.fr.",
      };
    }
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
// verifyClaim : Vérification code + création compte avec mot de passe
// ============================================

export async function verifyClaim(
  _prevState: VerifyFormState,
  formData: FormData
): Promise<VerifyFormState> {
  const attemptId = Number(formData.get("attemptId"));
  const code = String(formData.get("code") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (!Number.isSafeInteger(attemptId) || attemptId <= 0 || !slug) {
    return { success: false, message: "Lien de vérification invalide." };
  }
  if (!/^\d{6}$/.test(code)) {
    return { success: false, errors: { code: "Le code doit contenir 6 chiffres" } };
  }
  const serviceClient = getServiceClient();
  // Un seul appel transactionnel : aucun rejeu du code ni contournement du
  // plafond par requêtes simultanées. L'email vérifié ne rattache AUCUNE fiche.
  const { data: verification, error: verificationError } = await serviceClient.rpc("consume_pro_claim_code", {
    p_attempt_id: attemptId, p_slug: slug, p_code_hash: hashCode(code),
  });
  if (verificationError || !verification) {
    console.error("[claim] verification unavailable", verificationError?.code);
    return { success: false, message: "Vérification indisponible. Réessayez ou contactez contact@workwave.fr." };
  }
  if (verification.error) {
    const messages: Record<string, string> = {
      invalid: "Ce code n'est plus valide. Recommencez la demande.",
      expired: "Ce code a expiré. Recommencez la demande.",
      blocked: "Les trois essais sont épuisés. Recommencez la demande.",
      unavailable: "Cette fiche n'est plus disponible ou ne correspond pas à la demande. Contactez contact@workwave.fr.",
      code: `Code incorrect. ${verification.remaining ?? 0} essai(s) restant(s).`,
    };
    return { success: false, message: messages[verification.error] ?? messages.invalid };
  }
  const email = String(verification.email);
  const password = String(verification.password);
  const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  let userId = created?.user?.id;
  if (createError && (createError.code === "email_exists" || createError.message.includes("already"))) {
    const existingUser = await trouverCompteAuthParEmail(serviceClient, email);
    if (existingUser) {
      // L'OTP à usage unique prouve l'accès à CET email, jamais à l'entreprise.
      const { error } = await serviceClient.auth.admin.updateUserById(existingUser.id, {
        password, email_confirm: true,
      });
      if (!error) userId = existingUser.id;
    }
  }
  if (!userId) {
    return { success: false, message: "L'email a été vérifié, mais le compte n'a pas pu être préparé. Recommencez ou contactez contact@workwave.fr." };
  }
  const { data: requestId, error: requestError } = await serviceClient.rpc("enqueue_pro_claim", {
    p_attempt_id: attemptId, p_pro_id: verification.pro_id, p_user_id: userId,
  });
  if (requestError || !requestId) {
    console.error("[claim] queue failed", requestError?.code);
    return { success: false, message: "Votre demande n'a pas pu être enregistrée. Contactez contact@workwave.fr : aucun accès à la fiche n'a été accordé." };
  }
  after(() => notifyClaimPending({ requestId, slug, email }));
  const signedIn = await signInAndSetCookies(email, password);
  return { success: true, redirectUrl: signedIn ? "/pro/reclamations" : "/pro/connexion" };
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

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return !error;
}
