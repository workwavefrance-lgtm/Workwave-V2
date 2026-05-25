"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import {
  sendAiSignupAdminNotification,
  sendAiSignupWelcome,
  type SignupData,
} from "@/lib/email/send-ai-signup-emails";

/**
 * Vrai Server Action pour /ai/inscription :
 *   1. Valide FormData
 *   2. Insert dans ai_signups (status=pending)
 *   3. Send admin notification + welcome email (await — pas detache)
 *   4. Redirect vers /ai/inscription/succes
 *
 * Phase 8 viendra remplacer ai_signups par une vraie creation auth user
 * Supabase + row pros + Stripe customer (pour les Premium).
 */

const CATEGORY_SLUG_MAP: Record<string, string> = {
  ia: "intelligence-artificielle",
  dev: "developpement-web",
  cloud: "cloud-devops",
  nocode: "no-code-automation",
  data: "data-analytics",
  design: "design-produit",
};

const CATEGORY_NAME_MAP: Record<string, string> = {
  "intelligence-artificielle": "Intelligence Artificielle",
  "developpement-web": "Developpement Web",
  "cloud-devops": "Cloud & DevOps",
  "no-code-automation": "No-Code & Automation",
  "data-analytics": "Data & Analytics",
  "design-produit": "Design Produit",
};

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function submitInscription(formData: FormData): Promise<void> {
  // Validation
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const github = String(formData.get("github") || "").trim() || null;
  const linkedin = String(formData.get("linkedin") || "").trim() || null;
  const categoryForm = String(formData.get("category") || "").trim();
  const skills = String(formData.get("skills") || "").trim() || null;
  const bio = String(formData.get("bio") || "").trim() || null;
  const tjmRaw = String(formData.get("tjmIndicatif") || "").trim();
  const tjm = tjmRaw ? parseInt(tjmRaw, 10) : null;
  const experienceRaw = String(formData.get("experience") || "").trim();
  const experienceYears = experienceRaw ? parseInt(experienceRaw, 10) : null;
  const availability = String(formData.get("availability") || "").trim() || null;
  const location = String(formData.get("location") || "").trim() || null;
  const plan = (String(formData.get("plan") || "free").trim() as "free" | "premium");
  const cgu = formData.get("cgu") === "on";

  if (!firstName || !lastName || !email || !categoryForm || !cgu) {
    redirect("/ai/inscription?error=missing_fields");
  }
  if (!email.includes("@")) {
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
    console.error("[submitInscription] insert error:", error);
    redirect("/ai/inscription?error=insert_failed");
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

  redirect(`/ai/inscription/succes?id=${signup.id}&plan=${data.plan}`);
}
