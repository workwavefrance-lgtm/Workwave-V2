"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import {
  sendAiSignupAdminNotification,
  sendAiSignupWelcome,
  type SignupData,
} from "@/lib/email/send-ai-signup-emails";
import { activateAiSignup } from "@/lib/ai/auth/activate-signup";
import { isValidEmail } from "@/lib/ai/helpers";
import { createAiCheckoutSession } from "@/lib/stripe/create-ai-checkout";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";

// Max length defensifs (cote serveur)
const MAX_NAME = 100;
const MAX_EMAIL = 200;
const MAX_URL = 500;
const MAX_SKILLS = 500;
const MAX_BIO = 1000;
const MAX_LOCATION = 100;

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) : s;
}

/**
 * Server Action pour /ai/inscription (Phase 8) :
 *   1. Valide FormData
 *   2. Insert dans ai_signups (status=pending)
 *   3. Phase 8 : activateAiSignup() = cree auth user Supabase + row pros tech
 *      Si OK : ai_signups status='validated' avec pro_id lie
 *      Si fail : ai_signups reste 'pending' (admin valide manuellement)
 *   4. Send admin notification + welcome email
 *   5. Redirect vers /ai/inscription/succes
 *
 * Auto-activation = simplicite. L'admin peut suspendre les fakes via le
 * dashboard admin (a venir). RLS strict + pas d'acces tant que pas claim.
 */

const CATEGORY_SLUG_MAP: Record<string, string> = {
  // Tech
  ia: "intelligence-artificielle",
  dev: "developpement-web",
  cloud: "cloud-devops",
  nocode: "no-code-automation",
  data: "data-analytics",
  design: "design-produit",
  // Business
  marketing: "marketing-communication",
  strategie: "strategie-management",
  finance: "finance-comptabilite",
  juridique: "juridique-conseil",
  rh: "rh-recrutement",
  // Creatif
  redaction: "redaction-copywriting",
  audiovisuel: "audiovisuel-medias",
  creation: "design-creation",
};

const CATEGORY_NAME_MAP: Record<string, string> = {
  "intelligence-artificielle": "Intelligence Artificielle",
  "developpement-web": "Developpement Web",
  "cloud-devops": "Cloud & DevOps",
  "no-code-automation": "No-Code & Automation",
  "data-analytics": "Data & Analytics",
  "design-produit": "Design Produit",
  "marketing-communication": "Marketing & Communication",
  "strategie-management": "Strategie & Management",
  "finance-comptabilite": "Finance & Comptabilite",
  "juridique-conseil": "Juridique & Conseil",
  "rh-recrutement": "RH & Recrutement",
  "redaction-copywriting": "Redaction & Copywriting",
  "audiovisuel-medias": "Audiovisuel & Medias",
  "design-creation": "Design & Creation",
};

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function submitInscription(formData: FormData): Promise<void> {
  // Honeypot anti-bot (champ visible aux bots, cache aux humains)
  const honeypot = String(formData.get("website") || "").trim();
  if (honeypot.length > 0) {
    // Simuler succes pour ne pas alerter le bot
    redirect("/ai/inscription/succes?id=0&plan=free");
  }

  // Validation + truncation defensive
  const firstName = truncate(String(formData.get("firstName") || "").trim(), MAX_NAME);
  const lastName = truncate(String(formData.get("lastName") || "").trim(), MAX_NAME);
  const email = truncate(String(formData.get("email") || "").trim().toLowerCase(), MAX_EMAIL);
  const githubRaw = truncate(String(formData.get("github") || "").trim(), MAX_URL);
  const github = githubRaw || null;
  const linkedinRaw = truncate(String(formData.get("linkedin") || "").trim(), MAX_URL);
  const linkedin = linkedinRaw || null;
  const categoryForm = String(formData.get("category") || "").trim();
  const skillsRaw = truncate(String(formData.get("skills") || "").trim(), MAX_SKILLS);
  const skills = skillsRaw || null;
  const bioRaw = truncate(String(formData.get("bio") || "").trim(), MAX_BIO);
  const bio = bioRaw || null;
  const tjmRaw = String(formData.get("tjmIndicatif") || "").trim();
  const tjm = tjmRaw ? parseInt(tjmRaw, 10) : null;
  const experienceRaw = String(formData.get("experience") || "").trim();
  const experienceYears = experienceRaw ? parseInt(experienceRaw, 10) : null;
  const availability = String(formData.get("availability") || "").trim() || null;
  const locationRaw = truncate(String(formData.get("location") || "").trim(), MAX_LOCATION);
  const location = locationRaw || null;
  const plan = (String(formData.get("plan") || "free").trim() as "free" | "premium");
  const cgu = formData.get("cgu") === "on";

  if (!firstName || !lastName || !email || !categoryForm || !cgu) {
    redirect("/ai/inscription?error=missing_fields");
  }
  // Validation format email (regex stricte, plus solide que juste "@")
  if (!isValidEmail(email)) {
    redirect("/ai/inscription?error=invalid_email");
  }

  const categorySlug = CATEGORY_SLUG_MAP[categoryForm];
  if (!categorySlug) {
    redirect("/ai/inscription?error=invalid_category");
  }

  const categoryName = CATEGORY_NAME_MAP[categorySlug] || categorySlug;

  const sb = getServiceClient();

  // Insert signup
  const { data: signup, error } = await sb
    .from("ai_signups")
    .insert({
      first_name: firstName,
      last_name: lastName,
      email,
      github_username: github,
      linkedin_url: linkedin,
      category_slug: categorySlug,
      skills_raw: skills,
      bio,
      tjm_indicatif: tjm && tjm >= 50 && tjm <= 5000 ? tjm : null,
      experience_years: experienceYears != null && experienceYears >= 0 && experienceYears <= 50 ? experienceYears : null,
      availability: availability && ["remote", "hybrid", "onsite"].includes(availability) ? availability : null,
      location,
      plan: plan === "premium" ? "premium" : "free",
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !signup) {
    // Fix #6 : Postgres 23505 = unique constraint violation (email deja
    // inscrit). On redirige vers /ai/connexion avec prefill plutot que
    // d'afficher une erreur generique.
    if (error?.code === "23505") {
      redirect(`/ai/connexion?prefill=${encodeURIComponent(email)}`);
    }
    console.error("[submitInscription] insert error:", error);
    redirect("/ai/inscription?error=insert_failed");
  }

  // Phase 8 : auto-activation du signup (cree auth user + row pros tech)
  // Best-effort : si fail, ai_signups reste 'pending' et admin valide manuel.
  let activatedProId: number | null = null;
  try {
    const activateResult = await activateAiSignup({
      signupId: signup.id,
      firstName,
      lastName,
      email,
      categorySlug,
      bio,
      skills,
      github,
      linkedin,
      tjm,
      experienceYears,
      availability,
      location,
    });
    if (!activateResult.ok) {
      console.error("[submitInscription] activate failed:", activateResult.reason);
      // On continue le flow normalement (signup en pending pour validation admin)
    } else {
      activatedProId = activateResult.proId;
      console.log(
        `[submitInscription] activated: signupId=${signup.id} -> proId=${activateResult.proId}`
      );
    }
  } catch (activateErr) {
    console.error("[submitInscription] activate exception:", activateErr);
  }

  // Prepare email data
  const data: SignupData = {
    signupId: signup.id,
    firstName,
    lastName,
    email,
    github,
    linkedin,
    categoryName,
    categorySlug,
    skills,
    bio,
    tjm,
    experienceYears,
    availability,
    location,
    plan: plan === "premium" ? "premium" : "free",
  };

  // Send emails (await for reliability — lesson 24/05)
  await sendAiSignupAdminNotification(data);
  await sendAiSignupWelcome(data);

  // Phase 11+ : si plan='premium' et activation OK, on redirige directement
  // vers Stripe Checkout avec 14j trial. L'user saisit sa CB et accede au
  // dashboard avec subscription_status='trialing' (set par le webhook).
  //
  // Si fail (Stripe down, activation echec), on retombe sur /ai/inscription/succes
  // qui guide l'user vers /ai/dashboard/abonnement (= bouton "Activer Premium").
  if (plan === "premium" && activatedProId) {
    const fullName = `${firstName} ${lastName}`.trim();
    const checkoutResult = await createAiCheckoutSession({
      proId: activatedProId,
      email,
      name: fullName,
      plan: "monthly",
      existingCustomerId: null,
      successUrl: `${BASE_URL}/ai/dashboard/abonnement?activated=1`,
      cancelUrl: `${BASE_URL}/ai/inscription/succes?id=${signup.id}&plan=premium&checkout_canceled=1`,
    });
    if (checkoutResult.ok) {
      redirect(checkoutResult.url);
    }
    // Si Stripe fail, on tombe sur le redirect /succes plus bas (fallback)
    console.error("[submitInscription] Stripe checkout failed:", checkoutResult.error);
  }

  redirect(`/ai/inscription/succes?id=${signup.id}&plan=${data.plan}`);
}
