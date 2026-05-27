"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { qualifyProject } from "@/lib/ai/qualify-project";
import { sendProjectNotification } from "@/lib/email/send-project-notification";
import { sendProjectConfirmation } from "@/lib/email/send-project-confirmation";
import { broadcastBtpProject } from "@/lib/email/broadcast-btp-project";
import { detectPii, formatPiiErrorMessage } from "@/lib/ai/detect-pii";
import { track } from "@/lib/analytics/track";
import { EVENTS } from "@/lib/analytics/events";

// --- Validation schema ---

const projectSchema = z.object({
  firstName: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
  phone: z
    .string()
    .regex(
      /^(?:(?:\+33|0)\s?[1-9])(?:[\s.-]?\d{2}){4}$/,
      "Numéro de téléphone invalide"
    ),
  categoryId: z.coerce
    .number()
    .int()
    .positive("Veuillez choisir un type de travaux"),
  cityId: z.coerce.number().int().positive("Veuillez choisir une ville"),
  description: z
    .string()
    .min(20, "Décrivez votre besoin en au moins 20 caractères"),
  urgency: z.enum(["today", "this_week", "this_month", "not_urgent"], {
    message: "Veuillez indiquer l'urgence",
  }),
  budget: z.enum(
    ["lt500", "500_2000", "2000_5000", "5000_15000", "gt15000", "unknown"],
    { message: "Veuillez indiquer votre budget" }
  ),
  consent: z.literal("on", {
    message: "Vous devez accepter la transmission de vos données",
  }),
  // Honeypot — doit rester vide
  website: z.string().max(0).optional(),
});

// --- Rate limiting en mémoire ---
// TODO: Migrer vers Upstash Redis au Sprint 5 ou 6 pour que le rate limiting
// fonctionne en production sur Vercel. Les serverless functions sont des
// instances indépendantes qui ne partagent pas la mémoire, donc ce Map
// en mémoire ne protège qu'en développement local.
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 heure
// Sprint 13 : relax 3 -> 30 par heure. Avec le modele broadcast BTP (tous les
// pros recoivent), un volume plus eleve de projets/h est OK. La protection
// anti-spam reelle se fait via PII detection + IA suspicion_score + admin
// moderation manuelle des projets flagues.
const RATE_LIMIT_MAX = 30;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
  if (recent.length >= RATE_LIMIT_MAX) {
    return false;
  }
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return true;
}

// --- Types de retour ---

export type FormState = {
  success: boolean;
  errors?: Record<string, string>;
  message?: string;
};

// --- Server Action ---

export async function submitProject(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  console.log("[submitProject] called");

  // Honeypot check
  const honeypot = formData.get("website") as string;
  if (honeypot && honeypot.length > 0) {
    // Bot détecté, on simule un succès pour ne pas alerter
    redirect("/deposer-projet/merci");
  }

  // Rate limiting
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return {
      success: false,
      message:
        "Trop de demandes envoyées. Veuillez réessayer dans quelques minutes.",
    };
  }

  // Validation
  const raw = {
    firstName: formData.get("firstName") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    categoryId: formData.get("categoryId") as string,
    cityId: formData.get("cityId") as string,
    description: formData.get("description") as string,
    urgency: formData.get("urgency") as string,
    budget: formData.get("budget") as string,
    consent: formData.get("consent") as string,
    website: formData.get("website") as string,
  };

  const result = projectSchema.safeParse(raw);

  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as string;
      if (!errors[key]) {
        errors[key] = issue.message;
      }
    }
    console.log("[submitProject] zod validation failed:", errors);
    return { success: false, errors };
  }

  const data = result.data;
  console.log(`[submitProject] zod OK, category=${data.categoryId} city=${data.cityId} budget=${data.budget}`);

  // Sprint 13 — Anti-PII bypass : detection de tel/email/URL dans la description.
  const piiResult = detectPii(data.description);
  if (piiResult.hasPii) {
    console.log(
      `[submitProject] PII detected: phones=${piiResult.foundPhones.length} emails=${piiResult.foundEmails.length} urls=${piiResult.foundUrls.length}`
    );
    return {
      success: false,
      errors: {
        description: formatPiiErrorMessage(piiResult),
      },
    };
  }

  // Récupérer les noms de catégorie et ville pour l'IA et l'email
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("name, slug")
    .eq("id", data.categoryId)
    .single();

  const { data: city } = await supabase
    .from("cities")
    .select("name, department_id")
    .eq("id", data.cityId)
    .single();

  if (!category || !city) {
    return {
      success: false,
      errors: {
        categoryId: !category ? "Catégorie invalide" : "",
        cityId: !city ? "Ville invalide" : "",
      },
    };
  }

  // Qualification IA (non bloquante)
  const aiQualification = await qualifyProject({
    categoryName: category.name,
    categorySlug: category.slug,
    cityName: city.name,
    description: data.description,
    urgency: data.urgency,
    budget: data.budget,
  });

  // Insertion en base
  // On utilise le service_role key pour bypass RLS sur l'insert + select
  const { createClient: createServiceClient } = await import("@supabase/supabase-js");
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Déterminer le statut et le score de suspicion
  const suspicionScore = aiQualification?.suspicion_score ?? null;
  const isSuspicious = suspicionScore !== null && suspicionScore > 70;
  const deletionToken = crypto.randomUUID();

  const { data: project, error: insertError } = await serviceClient
    .from("projects")
    .insert({
      first_name: data.firstName,
      email: data.email,
      phone: data.phone,
      category_id: data.categoryId,
      city_id: data.cityId,
      description: data.description,
      urgency: data.urgency,
      budget: data.budget,
      ai_qualification: aiQualification,
      status: isSuspicious ? "suspicious" : "new",
      suspicion_score: suspicionScore,
      deletion_token: deletionToken,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Erreur insertion projet :", insertError);
    return {
      success: false,
      message: "Une erreur est survenue. Veuillez réessayer.",
    };
  }

  // Emails (non bloquants)
  sendProjectNotification({
    firstName: data.firstName,
    email: data.email,
    phone: data.phone,
    categoryName: category.name,
    cityName: city.name,
    description: data.description,
    urgency: data.urgency,
    budget: data.budget,
    aiQualification: aiQualification as Record<string, unknown> | null,
    projectId: project.id,
    isSuspicious,
  }).catch((err) => console.error("Erreur email admin (non bloquante) :", err));

  sendProjectConfirmation({
    firstName: data.firstName,
    email: data.email,
    categoryName: category.name,
    cityName: city.name,
    description: data.description,
    urgency: data.urgency,
    budget: data.budget,
    deletionToken,
  }).catch((err) => console.error("Erreur email confirmation (non bloquante) :", err));

  // Tracking (fire-and-forget)
  track(EVENTS.PROJECT_FORM_SUBMITTED, {
    projectId: project.id,
    metadata: {
      category: category.name,
      city: city.name,
      urgency: data.urgency,
      suspicious: isSuspicious,
    },
  });

  // Sprint 13 — Broadcast BTP en BACKGROUND via after() (Next.js 16).
  // Le redirect vers /deposer-projet/merci arrive IMMEDIATEMENT a l'user
  // (UX rapide), et le broadcast s'execute apres que la response soit envoyee.
  // after() est l'API officielle Next.js pour le post-response work, equivalent
  // a waitUntil de Vercel. Pas de "promise detachee morte" : la function lifetime
  // est etendue automatiquement.
  // NB : on broadcast meme si le projet est suspicious, mais avec le banner
  // "Projet flague par notre IA" pour que les pros decident en connaissance de
  // cause.
  console.log(`[submitProject] project ${project.id} created, scheduling broadcast in background`);
  after(async () => {
    try {
      const result = await broadcastBtpProject({
        projectId: project.id,
        projectTitle: data.description.split("\n")[0].slice(0, 100) || "Nouveau projet",
        projectDescription: data.description,
        projectBudget: data.budget,
        projectTimeline: data.urgency,
        projectCategoryName: category.name,
        projectCategoryId: data.categoryId,
        projectCityName: city.name,
        projectDepartmentId: city.department_id,
        isSuspicious,
      });
      console.log(
        `[submitProject] broadcast project ${project.id} : ${result.sent}/${result.totalTargets} sent, ${result.failed} failed`
      );
    } catch (err) {
      console.error(`[submitProject] broadcast project ${project.id} failed :`, err);
    }
  });

  redirect("/deposer-projet/merci");
}
