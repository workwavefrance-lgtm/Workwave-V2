"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { qualifyTechProject } from "@/lib/ai/qualify-tech-project";
import { broadcastTechProject } from "@/lib/email/broadcast-tech-project";
import { sendAiProjectNotification } from "@/lib/email/send-ai-project-notification";
import { isValidEmail } from "@/lib/ai/helpers";

// Max length defensifs (cote serveur, en miroir des maxLength HTML)
const MAX_TITLE = 200;
const MAX_DESCRIPTION = 5000;
const MAX_STACK = 500;
const MAX_NAME = 100;
const MAX_COMPANY = 150;
const MAX_EMAIL = 200;
const MAX_PHONE = 30;

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) : s;
}

/**
 * Server Action de soumission de projet tech.
 *
 * Flow :
 *   1. Validate FormData (champs requis + format)
 *   2. Mapper la categorie selectionnee (form value 'ia', 'dev', etc.)
 *      au slug DB (intelligence-artificielle, developpement-web, etc.)
 *   3. Qualifier le brief via Claude (suspicion + summary + keywords)
 *   4. Insert dans projects (vertical='tech', status='new', ai_qualification)
 *   5. Router vers 3 freelances tech (matching category + dept)
 *   6. Insert project_leads pour chaque freelance route
 *   7. Email admin avec brief + 3 freelances routes
 *   8. Redirect vers /ai/deposer/succes?id=N
 *
 * Note : pas d'email aux freelances (ils n'ont pas d'email Sirene).
 * Phase 8 Stripe avec abonnement = on enverra des notifs email aux abonnes.
 */

// Mapping form value (radio) → category slug DB
const CATEGORY_SLUG_MAP: Record<string, string> = {
  ia: "intelligence-artificielle",
  dev: "developpement-web",
  cloud: "cloud-devops",
  nocode: "no-code-automation",
  data: "data-analytics",
  design: "design-produit",
};

const BUDGET_LABELS: Record<string, string> = {
  lt5k: "Moins de 5 000 €",
  "5k-15k": "5 000 € - 15 000 €",
  "15k-50k": "15 000 € - 50 000 €",
  gt50k: "Plus de 50 000 €",
  tbd: "A definir",
};

const TIMELINE_LABELS: Record<string, string> = {
  asap: "Immediat (< 1 semaine)",
  "1month": "Sous 1 mois",
  "3months": "Dans 1 a 3 mois",
  flexible: "Flexible",
};

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function submitTechProject(formData: FormData): Promise<void> {
  // ─── 0. Honeypot anti-bot ──────────────────────────────────────────────
  // Champ hidden visible uniquement aux bots. S'il est rempli, on simule
  // un succes pour ne pas alerter le bot, mais on ignore la soumission.
  const honeypot = String(formData.get("website") || "").trim();
  if (honeypot.length > 0) {
    // Simuler succes pour ne pas signaler au bot qu'il a ete detecte
    redirect("/ai/deposer/succes?id=0");
  }

  // ─── 1. Extract + truncate defensif ────────────────────────────────────
  // On truncate cote serveur en miroir des maxLength HTML pour parer aux
  // bots qui forgent des FormData hors form HTML.
  const categoryFormValue = String(formData.get("category") || "").trim();
  const title = truncate(String(formData.get("title") || "").trim(), MAX_TITLE);
  const description = truncate(String(formData.get("description") || "").trim(), MAX_DESCRIPTION);
  const stackRaw = truncate(String(formData.get("stack") || "").trim(), MAX_STACK);
  const stack = stackRaw || null;
  const budget = String(formData.get("budget") || "").trim();
  const timeline = String(formData.get("timeline") || "").trim();
  const remoteOk = formData.get("remoteOk") === "on";
  const contactName = truncate(String(formData.get("contactName") || "").trim(), MAX_NAME);
  const companyRaw = truncate(String(formData.get("company") || "").trim(), MAX_COMPANY);
  const company = companyRaw || null;
  const contactEmail = truncate(String(formData.get("contactEmail") || "").trim().toLowerCase(), MAX_EMAIL);
  const contactPhoneRaw = truncate(String(formData.get("contactPhone") || "").trim(), MAX_PHONE);
  const contactPhone = contactPhoneRaw || null;

  if (
    !categoryFormValue ||
    !title ||
    !description ||
    !budget ||
    !timeline ||
    !contactName ||
    !contactEmail
  ) {
    redirect("/ai/deposer?error=missing_fields");
  }

  // Validation format email (defensif si bot bypass le type="email" HTML)
  if (!isValidEmail(contactEmail)) {
    redirect("/ai/deposer?error=invalid_email");
  }

  const categorySlug = CATEGORY_SLUG_MAP[categoryFormValue];
  if (!categorySlug) {
    redirect("/ai/deposer?error=invalid_category");
  }

  const sb = getServiceClient();

  // ─── 2. Resolve categorie ──────────────────────────────────────────────
  const { data: category } = await sb
    .from("categories")
    .select("id, slug, name")
    .eq("slug", categorySlug)
    .eq("vertical", "tech")
    .maybeSingle();

  if (!category) {
    redirect("/ai/deposer?error=category_not_found");
  }

  // ─── 3. Qualifier le brief via Claude ──────────────────────────────────
  const qualification = await qualifyTechProject({
    selectedCategorySlug: category.slug,
    selectedCategoryName: category.name,
    title,
    description,
    stack,
    budget,
    timeline,
  });

  // Si l'IA detecte de la categorisation alternative + haute confiance, on
  // remappe vers la categorie suggeree (sans bloquer le user)
  let finalCategoryId = category.id;
  let finalCategoryName = category.name;
  if (
    qualification &&
    qualification.confidence > 75 &&
    qualification.category_slug &&
    qualification.category_slug !== category.slug
  ) {
    const { data: suggested } = await sb
      .from("categories")
      .select("id, slug, name")
      .eq("slug", qualification.category_slug)
      .eq("vertical", "tech")
      .maybeSingle();
    if (suggested) {
      finalCategoryId = suggested.id;
      finalCategoryName = suggested.name;
    }
  }

  // ─── 4. Status (suspicious si suspicion_score > 70) ────────────────────
  const isSuspicious =
    qualification != null && qualification.suspicion_score > 70;
  const status = isSuspicious ? "suspicious" : "new";

  // ─── 5. Insert project ─────────────────────────────────────────────────
  const projectPayload = {
    vertical: "tech",
    category_id: finalCategoryId,
    city_id: null, // tech projects n'ont pas de city_id (ville client non demandee)
    description: `${title}\n\n${description}${stack ? `\n\nStack: ${stack}` : ""}${remoteOk ? "\n\nRemote OK" : ""}`,
    urgency: timeline,
    budget,
    first_name: contactName,
    email: contactEmail,
    phone: contactPhone,
    status,
    suspicion_score: qualification?.suspicion_score || null,
    ai_qualification: qualification
      ? {
          category_slug: qualification.category_slug,
          confidence: qualification.confidence,
          summary: qualification.summary,
          keywords: qualification.keywords,
          budget_realistic: qualification.budget_realistic,
          budget_comment: qualification.budget_comment,
        }
      : null,
    created_at: new Date().toISOString(),
  };

  const { data: project, error: insertErr } = await sb
    .from("projects")
    .insert(projectPayload)
    .select("id")
    .single();

  if (insertErr || !project) {
    console.error("[submitTechProject] insert project error:", insertErr);
    redirect("/ai/deposer?error=insert_failed");
  }

  // ─── 6. Broadcast a TOUS les freelances tech (Phase 11) ────────────────
  // Modele "communauté" Codeur.com : tous les freelances inscrits (Premium
  // ET gratuits) recoivent un mail. La diff Premium/gratuit se fait dans
  // le dashboard (coordonnees visibles + bouton "j'ai contacte" uniquement
  // pour Premium).
  //
  // Les projets suspicious SONT diffuses aussi mais avec une card "ATTENTION"
  // dans le dashboard (info du user 26/05). Donc on broadcast quoi qu'il
  // arrive — l'IA flag mais ne cache pas.
  const broadcastResult = await broadcastTechProject({
    projectId: project.id,
    projectTitle: title,
    projectDescription: description,
    projectBudget: BUDGET_LABELS[budget] || budget || null,
    projectTimeline: TIMELINE_LABELS[timeline] || timeline || null,
    projectCategoryName: finalCategoryName,
    isSuspicious,
  });

  console.log(
    `[submitTechProject] broadcast project=${project.id}: ${broadcastResult.sent}/${broadcastResult.totalTargets} sent, ${broadcastResult.failed} failed`
  );

  // ─── 7. Email admin (await pour fiabilite — cf. lesson 24/05) ──────────
  // Phase 11 : on passe routed=[] car le routing IA est deprecate. Le mail
  // admin contient maintenant le broadcastResult (count freelances joins).
  await sendAiProjectNotification({
    projectId: project.id,
    title,
    categoryName: finalCategoryName,
    description,
    budget: BUDGET_LABELS[budget] || budget,
    timeline: TIMELINE_LABELS[timeline] || timeline,
    contactName,
    contactEmail,
    contactPhone,
    company,
    postal: null,
    stack,
    remoteOk,
    qualification,
    routed: [],
    broadcastInfo: {
      sent: broadcastResult.sent,
      totalTargets: broadcastResult.totalTargets,
      failed: broadcastResult.failed,
    },
  });

  // ─── 8. Redirect succes ────────────────────────────────────────────────
  redirect(`/ai/deposer/succes?id=${project.id}`);
}
