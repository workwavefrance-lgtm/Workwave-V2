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

function getServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Mapping category_slug -> category_id (categories tech BDD : 43-48)
const CATEGORY_ID_MAP: Record<string, number> = {
  "intelligence-artificielle": 43,
  "developpement-web": 44,
  "cloud-devops": 45,
  "no-code-automation": 46,
  "data-analytics": 47,
  "design-produit": 48,
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
  const base = `${firstName} ${lastName}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base}-${signupId}`;
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
  const { data: signup } = await sb
    .from("ai_signups")
    .select("status, pro_id")
    .eq("id", input.signupId)
    .maybeSingle();

  if (signup?.status === "validated" && signup.pro_id) {
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
    if (createUserError.message.includes("already") || createUserError.message.includes("registered")) {
      // User existe deja en auth Supabase. Recuperer son id.
      const { data: listData } = await sb.auth.admin.listUsers();
      const existingUser = listData?.users?.find(
        (u) => u.email === input.email
      );
      if (!existingUser) {
        return { ok: false, reason: "auth_user_lookup_failed_after_already_exists" };
      }
      userId = existingUser.id;
    } else {
      return { ok: false, reason: `auth_create_failed: ${createUserError.message}` };
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
    .in("category_id", [43, 44, 45, 46, 47, 48])
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

    const { data: newPro, error: proError } = await sb
      .from("pros")
      .insert({
        slug,
        name: proName,
        category_id: categoryId,
        is_active: true,
        source: "ai_signup",
        description: input.bio,
        skills: input.skills,
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
      return {
        ok: false,
        reason: `pros_insert_failed: ${proError?.message || "unknown"}`,
      };
    }
    proId = newPro.id;
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
