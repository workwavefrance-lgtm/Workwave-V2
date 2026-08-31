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

// Alerte admin quand quelqu un valide un code prouvant le SIRET d une fiche
// mais demande le rattachement d une AUTRE fiche.
//
// Ce cas n arrive pas par accident : le slug vient d un champ du formulaire, il
// faut donc l avoir modifie a la main. C etait la faille corrigee le 31/08/2026
// (voir le commentaire dans verifyClaim). On ne bloque plus seulement : on
// previent, parce qu une tentative signifie que quelqu un cherche activement a
// prendre la fiche d un artisan inscrit.
function notifyAdminOfClaimMismatch(
  slugDemande: string,
  siretProuve: string,
  email: string,
  ip: string | null,
) {
  sendClaimAlreadyClaimedAlert(
    `[TENTATIVE DE DETOURNEMENT] fiche demandee : ${slugDemande}`,
    slugDemande,
    email,
    siretProuve,
    ip ?? "inconnue",
  ).catch((err) => console.error("Alerte detournement de fiche :", err));
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

  // Code correct : créer le compte avec mot de passe et connecter

  if (!attempt.temp_password) {
    return { success: false, message: "Erreur interne. Veuillez recommencer le processus." };
  }

  // Un code obtenu pour supprimer une fiche ne doit pas servir a la reclamer.
  // Les anciennes lignes n'ont pas de type : on refuse ce qui est explicitement
  // autre chose, plutot que d'exiger "claim" et de casser les demandes en cours.
  if (attempt.type && attempt.type !== "claim") {
    return {
      success: false,
      message:
        "Ce code a été demandé pour une autre opération. Recommencez la réclamation depuis votre fiche.",
    };
  }

  // ── La fiche visée est-elle bien celle dont le SIRET a été prouvé ? ──
  //
  // Faille corrigée le 31/08/2026, trouvée par la relecture intégrale du code.
  // Le slug arrive du formulaire (`formData.get("slug")`), et les deux mises à
  // jour plus bas faisaient `.eq("slug", slug)` sans plus de contrôle. Le refus
  // d'une fiche déjà réclamée n'existait qu'à l'étape 1 (l.252), donc il
  // suffisait de prouver le SIRET de SA fiche puis de changer ce champ pour
  // s'attribuer CELLE D'UN AUTRE, même déjà réclamée. Les SIRET sont affichés
  // en clair sur les fiches publiques : il n'y avait rien à deviner. Les 52
  // fiches réclamées étaient exactement les cibles, avec leur tableau de bord,
  // leurs leads déjà payés et les coordonnées des particuliers.
  //
  // Le contrôle est ici, entre la validation du code et les deux rattachements,
  // pour couvrir les deux branches (compte existant et compte neuf) d'un seul
  // endroit : deux contrôles jumeaux finissent toujours par diverger.
  const { data: ficheVisee, error: erreurFiche } = await serviceClient
    .from("pros")
    .select("id, siret, claimed_by_user_id, name")
    .eq("slug", slug)
    .single();

  if (erreurFiche || !ficheVisee) {
    return { success: false, message: "Fiche introuvable" };
  }

  // Le SIRET prouvé par le code reçu par email doit être celui de cette fiche.
  if (!ficheVisee.siret || ficheVisee.siret !== attempt.siret) {
    notifyAdminOfClaimMismatch(slug, attempt.siret, attempt.email, attempt.ip);
    return {
      success: false,
      message:
        "Cette fiche ne correspond pas au SIRET vérifié. Recommencez depuis la fiche de votre entreprise.",
    };
  }

  // Et elle doit toujours être libre : quelqu'un a pu la réclamer entre l'envoi
  // du code et sa saisie.
  if (ficheVisee.claimed_by_user_id) {
    return {
      success: false,
      message:
        "Cette fiche a déjà été réclamée. Si vous pensez qu'il y a une erreur, contactez le support à contact@workwave.fr.",
    };
  }

  // 1. Créer le user Supabase Auth avec email + mot de passe
  const { data: signUpData, error: signUpError } =
    await serviceClient.auth.admin.createUser({
      email: attempt.email,
      password: attempt.temp_password,
      email_confirm: true,
    });

  // Si l'utilisateur existe déjà, mettre à jour son mot de passe.
  // La recherche pagine désormais sur tous les comptes : cf.
  // trouverCompteAuthParEmail, qui explique pourquoi la version d'avant
  // (`listUsers()` sans argument, donc 50 comptes) devenait une panne certaine.
  if (signUpError && signUpError.message.includes("already")) {
    const existingUser = await trouverCompteAuthParEmail(
      serviceClient,
      attempt.email
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
        .eq("id", ficheVisee.id)
        .is("claimed_by_user_id", null);

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

      // Notifications admin + pro (awaitées, bornées 8s, cf. sendClaimNotifications)
      await sendClaimNotifications({
        slug,
        claimEmail: attempt.email,
        ip: attempt.ip ?? undefined,
      });

      // Connecter l'utilisateur côté serveur
      await signInAndSetCookies(attempt.email, attempt.temp_password);

      return { success: true, redirectUrl: "/pro/dashboard/fiche" };
    }

    // Ici, Supabase a refusé la création en disant que l'email existe déjà,
    // mais on n'a pas retrouvé le compte correspondant. Le message doit dire
    // quoi faire (leçon du 13/05 : un cul-de-sac muet dans un parcours de code
    // par email a déjà fait remonter une plainte CNIL), et le mot de passe en
    // clair de cette tentative n'a plus de raison d'être conservé.
    await serviceClient
      .from("claim_attempts")
      .update({ temp_password: null })
      .eq("id", attempt.id);

    return {
      success: false,
      message:
        "Un compte existe déjà avec cet email, mais nous n'avons pas réussi à le retrouver. Écrivez-nous à contact@workwave.fr en indiquant votre SIRET, nous rattachons la fiche manuellement.",
    };
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
    .eq("id", ficheVisee.id)
        .is("claimed_by_user_id", null);

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

  // 5. Notifications admin + pro (awaitées, bornées 8s, cf. sendClaimNotifications)
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
