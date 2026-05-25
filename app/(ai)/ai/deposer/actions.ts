"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { qualifyTechProject } from "@/lib/ai/qualify-tech-project";
import { routeTechProject } from "@/lib/routing/route-tech-project";
import { sendAiProjectNotification } from "@/lib/email/send-ai-project-notification";
import { sendProjectToAiFreelance } from "@/lib/email/send-ai-project-to-freelance";

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
  // ─── 1. Extract + validate ─────────────────────────────────────────────
  const categoryFormValue = String(formData.get("category") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const stack = String(formData.get("stack") || "").trim() || null;
  const budget = String(formData.get("budget") || "").trim();
  const timeline = String(formData.get("timeline") || "").trim();
  const remoteOk = formData.get("remoteOk") === "on";
  const contactName = String(formData.get("contactName") || "").trim();
  const company = String(formData.get("company") || "").trim() || null;
  const contactEmail = String(formData.get("contactEmail") || "").trim();
  const contactPhone = String(formData.get("contactPhone") || "").trim() || null;

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

  // ─── 6. Router vers 3 freelances (si pas suspicious) ───────────────────
  let routed: Awaited<ReturnType<typeof routeTechProject>> = [];

  if (!isSuspicious) {
    routed = await routeTechProject({
      category_id: finalCategoryId,
      postal_code: null, // tech : pas de postal client, on prend France entiere
    });

    if (routed.length > 0) {
      // Insert project_leads pour chaque freelance route
      const leadsPayload = routed.map((f) => ({
        project_id: project.id,
        pro_id: f.id,
        sent_at: new Date().toISOString(),
        status: "sent",
      }));
      const { error: leadsErr } = await sb.from("project_leads").insert(leadsPayload);
      if (leadsErr) {
        console.warn("[submitTechProject] insert leads error:", leadsErr);
      }
      // Mark project status = routed
      await sb.from("projects").update({ status: "routed" }).eq("id", project.id);
    } else {
      // unrouted = pas trouve de freelance
      await sb.from("projects").update({ status: "unrouted" }).eq("id", project.id);
    }
  }

  // ─── 6 bis. Phase 8 : email aux freelances Premium AI routes ─────────
  // Seuls les abonnes recoivent un email (les autres voient le projet dans
  // leur dashboard /ai/dashboard/projets). Le mail est envoye en await
  // pour ne pas perdre l'envoi (lecon 24/05).
  if (!isSuspicious && routed.length > 0) {
    for (const freelance of routed) {
      if (!freelance.isPremium || !freelance.email) continue;
      const firstName = freelance.name.split(" ")[0] || "Freelance";
      const r = await sendProjectToAiFreelance({
        freelanceEmail: freelance.email,
        freelanceFirstName: firstName,
        projectId: project.id,
        projectTitle: title,
        projectDescription: description,
        projectBudget: BUDGET_LABELS[budget] || budget || null,
        projectTimeline: TIMELINE_LABELS[timeline] || timeline || null,
        projectCategoryName: finalCategoryName,
        clientCity: null,
      });
      if (!r.ok) {
        console.warn(
          `[submitTechProject] email to freelance ${freelance.id} failed:`,
          r.error
        );
      }
    }
  }

  // ─── 7. Email admin (await pour fiabilite — cf. lesson 24/05) ──────────
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
    routed,
  });

  // ─── 8. Redirect succes ────────────────────────────────────────────────
  redirect(`/ai/deposer/succes?id=${project.id}`);
}
