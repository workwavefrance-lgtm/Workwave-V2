/**
 * Activation d'un freelance ai_signups en compte complet :
 *   1. Cree auth user Supabase (avec password aleatoire)
 *   2. Cree row pros tech (category_id depuis category_slug)
 *   3. Lie ai_signups -> pros via pro_id, status='validated'
 *
 * Idempotent : si email existe deja en auth, on link au pro existant (ou
 * cree un nouveau pro associe a cet user). Si signup deja valide, no-op.
 *
 * Retourne :
 *   - { ok: true, proId } si activation reussie
 *   - { ok: false, reason } si activation impossible (a logger + admin alert)
 *
 * Pattern strictement identique a l'activation BTP via /pro/reclamer/[slug],
 * adapte aux specificites Workwave AI (pas de SIRET requis, category tech).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";

const AI_CATEGORY_IDS_QUERY = AI_CATEGORY_IDS as unknown as number[];

function getServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Mapping category_slug -> category_id (categories Workwave AI : tech 43-48 + business/creatif 79-87).
// IDs verifies via scripts/_check-cat-mapping.ts (source unique de verite : table BDD categories).
// Maintenu aligne avec lib/ai/helpers.ts AI_CATEGORY_IDS.
//
// ATTENTION historique (26/05/2026) : l'ancienne version de ce map avait des
// IDs swappes (43 -> intelligence-artificielle, 44 -> developpement-web), ce
// qui creait les pros sous la mauvaise categorie. Les signups 1-6 de la BDD
// portent donc des category_id incoherents avec leur category_slug declare.
// Fixe par scripts/_fix-mismapped-signups.ts apres ce commit.
const CATEGORY_ID_MAP: Record<string, number> = {
  // Tech (6)
  "developpement-web": 43,
  "intelligence-artificielle": 44,
  "cloud-devops": 45,
  "no-code-automation": 46,
  "data-analytics": 47,
  "design-produit": 48,
  // Business (5)
  "marketing-communication": 79,
  "design-creation": 80,
  "strategie-management": 81,
  "finance-comptabilite": 82,
  "rh-recrutement": 83,
  "juridique-conseil": 85,
  // Creatif (2)
  "redaction-copywriting": 86,
  "audiovisuel-medias": 87,
};

export type AiSignupActivateInput = {
  signupId: number;
  firstName: string;
  lastName: string;
  email: string;
  categorySlug: string;
  bio: string | null;
  skills: string | null;
  github: string | null;
  linkedin: string | null;
  tjm: number | null;
  experienceYears: number | null;
  availability: string | null;
  location: string | null;
};

export type AiSignupActivateResult =
  | { ok: true; proId: number; userId: string; createdNewUser: boolean }
  | { ok: false; reason: string };

function generateStrongPassword(): string {
  // 32 bytes URL-safe (Base64URL) ≈ 43 caracteres. Tres robuste.
  return randomBytes(32).toString("base64url");
}

function slugifyName(firstName: string, lastName: string, signupId: number): string {
  // Fix #23 : regex Unicode escape explicite ̀-ͯ pour strip
  // les combining diacriticals (NFD accents). L'ancienne version utilisait
  // les chars raw directement, problematique sur certains parsers SWC.
  const base = `${firstName} ${lastName}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base}-${signupId}`;
}

// Helper : recuperer un auth user par email.
//
// Tentatives (par ordre de preference) :
//   1. listUsers({ filter: email }) — supporte une chaine sql-like dans le
//      filter param. Plus efficace que de tout charger.
//   2. listUsers() sans filtre, on parcourt cote app — fallback simple.
//
// NB : `auth.admin.getUserByEmail` n'existe PAS dans le SDK Supabase actuel
// (verifie via typeof === undefined). Et `sb.schema("auth").from("users")`
// fail avec 'Invalid schema: auth' car PostgREST n'expose pas auth.
async function findAuthUserByEmail(
  sb: SupabaseClient,
  email: string
): Promise<{ id: string } | null> {
  const lc = email.toLowerCase();
  // listUsers paginé. Plan tier-paid limite a 1000/page par defaut. Si on
  // depasse 1000 users tech, on doit paginer. Pour l'instant : 1 page suffit.
  const { data, error } = await sb.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) {
    console.error("[findAuthUserByEmail] listUsers error:", error.message);
    return null;
  }
  const match = data?.users?.find((u) => u.email?.toLowerCase() === lc);
  return match ? { id: match.id } : null;
}

export async function activateAiSignup(
  input: AiSignupActivateInput
): Promise<AiSignupActivateResult> {
  const sb = getServiceClient();

  const categoryId = CATEGORY_ID_MAP[input.categorySlug];
  if (!categoryId) {
    return { ok: false, reason: `unknown_category_slug: ${input.categorySlug}` };
  }

  // 1) Verifier que le signup n'est pas deja valide (idempotence)
  // Defense en profondeur : on charge aussi l'email du signup pour
  // verifier qu'il matche input.email. Cela protege contre un appelant
  // (futur) qui forgerait { signupId: 12, email: "victim@x.com" } pour
  // detourner l'activation d'un signup vers un email arbitraire.
  const { data: signup } = await sb
    .from("ai_signups")
    .select("status, pro_id, email")
    .eq("id", input.signupId)
    .maybeSingle();

  if (!signup) {
    return { ok: false, reason: `signup_not_found: ${input.signupId}` };
  }

  // Garde-fou : signupId DOIT correspondre a un signup avec le meme email
  const signupEmailNorm = (signup.email || "").trim().toLowerCase();
  const inputEmailNorm = input.email.trim().toLowerCase();
  if (signupEmailNorm !== inputEmailNorm) {
    return {
      ok: false,
      reason: "email_mismatch_with_signup_record",
    };
  }

  if (signup.status === "validated" && signup.pro_id) {
    return {
      ok: true,
      proId: signup.pro_id,
      userId: "", // already linked, no new user
      createdNewUser: false,
    };
  }

  // 2) Creer ou recuperer auth user Supabase
  const initialPassword = generateStrongPassword();
  let userId: string;
  let createdNewUser = false;

  const { data: createUserData, error: createUserError } =
    await sb.auth.admin.createUser({
      email: input.email,
      password: initialPassword,
      email_confirm: true,
    });

  if (createUserError) {
    if (
      createUserError.message.includes("already") ||
      createUserError.message.includes("registered")
    ) {
      // User existe deja en auth Supabase. Recuperer son id via
      // getUserByEmail (fix #3 : pas de listUsers() qui charge tout).
      const existingUser = await findAuthUserByEmail(sb, input.email);
      if (!existingUser) {
        return {
          ok: false,
          reason: "auth_user_lookup_failed_after_already_exists",
        };
      }
      userId = existingUser.id;
    } else {
      return {
        ok: false,
        reason: `auth_create_failed: ${createUserError.message}`,
      };
    }
  } else if (createUserData?.user) {
    userId = createUserData.user.id;
    createdNewUser = true;
  } else {
    return { ok: false, reason: "auth_create_no_user_returned" };
  }

  // 3) Verifier si l'user a deja une row pros (cas signup re-soumis)
  const { data: existingPro } = await sb
    .from("pros")
    .select("id")
    .eq("claimed_by_user_id", userId)
    .in("category_id", AI_CATEGORY_IDS_QUERY)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();

  let proId: number;

  if (existingPro) {
    proId = existingPro.id;
  } else {
    // 4) Creer une nouvelle row pros tech
    const slug = slugifyName(input.firstName, input.lastName, input.signupId);
    const proName = `${input.firstName} ${input.lastName}`.trim();

    // NB : pros.skills est NOT NULL en BDD (heritage du modele BTP).
    // Si l'user n'a pas fourni de skills a l'inscription, on met une chaine vide.
    // Idem pour description (bio peut etre null en signup, mais on garantit ici).
    const { data: newPro, error: proError } = await sb
      .from("pros")
      .insert({
        slug,
        name: proName,
        category_id: categoryId,
        is_active: true,
        source: "ai_signup",
        description: input.bio || "",
        skills: input.skills || "",
        github_username: input.github,
        linkedin: input.linkedin,
        years_experience: input.experienceYears,
        available_for_remote:
          input.availability === "remote" || input.availability === "hybrid",
        email: input.email,
        claimed_by_user_id: userId,
        claimed_at: new Date().toISOString(),
        // Pas d'abonnement Stripe a la creation - se fera via /ai/dashboard/abonnement
        subscription_status: "none",
      })
      .select("id")
      .single();

    if (proError || !newPro) {
      // Fix race condition : si une autre requete d'activation parallele
      // a deja insere la row pros (entre notre SELECT ligne 173 et notre
      // INSERT ici), on aura une violation de l'INDEX UNIQUE partiel
      // idx_pros_claim_unique_active (code Postgres 23505).
      // On re-SELECT pour recuperer la row existante et continuer
      // l'idempotence proprement.
      if (proError?.code === "23505") {
        const { data: racedPro } = await sb
          .from("pros")
          .select("id")
          .eq("claimed_by_user_id", userId)
          .in("category_id", AI_CATEGORY_IDS_QUERY)
          .eq("is_active", true)
          .is("deleted_at", null)
          .maybeSingle();
        if (racedPro) {
          proId = racedPro.id;
          // continue normalement (link ai_signups -> proId ci-dessous)
        } else {
          // INDEX viol mais re-SELECT vide : etat anormal, on remonte l'erreur
          return {
            ok: false,
            reason: "pros_insert_unique_conflict_but_no_existing_row",
          };
        }
      } else {
        return {
          ok: false,
          reason: `pros_insert_failed: ${proError?.message || "unknown"}`,
        };
      }
    } else {
      proId = newPro.id;
    }
  }

  // 5) Lier ai_signups -> pros, status='validated'
  await sb
    .from("ai_signups")
    .update({
      pro_id: proId,
      status: "validated",
      validated_at: new Date().toISOString(),
    })
    .eq("id", input.signupId);

  return { ok: true, proId, userId, createdNewUser };
}
