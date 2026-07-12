"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
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
  // Description OPTIONNELLE : l'UI l'annonce comme telle (« Laissez vide si vous
  // préférez, les artisans vous rappelleront pour préciser ») — choix délibéré
  // pour réduire la friction et le drop-off du tunnel. Le serveur doit donc
  // accepter une description vide (avant : .min(20) → submit en échec SILENCIEUX
  // quand l'user suivait l'invitation à laisser vide, erreur sur l'étape cachée).
  description: z.string().max(5000, "Description trop longue (5000 caractères max)"),
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
    .select("name, department_id, country, department:departments(name, code)")
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

  // Pays de la ville (BE vs FR) : contexte marché pour la qualif IA + libellé
  // « Province »/« Département » dans le mail admin.
  const isBE = (city as unknown as { country?: string }).country === "BE";

  // Qualification IA (non bloquante)
  const aiQualification = await qualifyProject({
    categoryName: category.name,
    categorySlug: category.slug,
    cityName: city.name,
    description: data.description,
    urgency: data.urgency,
    budget: data.budget,
    countryName: isBE ? "Belgique" : "France",
  });

  // Insertion en base
  // On utilise le service_role key pour bypass RLS sur l'insert + select
  const { createClient: createServiceClient } = await import("@supabase/supabase-js");
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Dédup anti double-soumission : si un projet identique (même email + ville +
  // métier + description) a été déposé dans les 5 dernières minutes, on NE
  // recrée PAS et on NE re-broadcast PAS — on renvoie l'utilisateur sur l'écran
  // de confirmation comme si c'était passé. Cas réel 15/06 : projet #74/#75
  // déposé 2× à 44 s d'écart (le particulier a re-cliqué pendant la qualif IA
  // qui dure ~4 s). Évite le doublon en base + le double mail aux pros.
  const dedupSince = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: recentDup } = await serviceClient
    .from("projects")
    .select("id")
    .eq("email", data.email)
    .eq("city_id", data.cityId)
    .eq("category_id", data.categoryId)
    .eq("description", data.description)
    .neq("status", "deleted")
    .gte("created_at", dedupSince)
    .limit(1);
  if (recentDup && recentDup.length > 0) {
    console.log(
      `[submitProject] doublon détecté (projet ${recentDup[0].id} < 5min) — skip insert + broadcast`
    );
    redirect("/deposer-projet/merci");
  }

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

  // Département (pour le brief admin) — dérivé de la ville
  const deptRel = (city as unknown as {
    department?: { name?: string; code?: string } | { name?: string; code?: string }[] | null;
  }).department;
  const deptObj = Array.isArray(deptRel) ? deptRel[0] : deptRel;
  const departmentName = deptObj?.name
    ? `${deptObj.name}${deptObj.code ? ` (${deptObj.code})` : ""}`
    : undefined;

  // Emails (non bloquants)
  sendProjectNotification({
    firstName: data.firstName,
    email: data.email,
    phone: data.phone,
    categoryName: category.name,
    cityName: city.name,
    departmentName,
    isBE,
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

  // Sprint 14 (06/06/2026) — Broadcast BTP en SYNCHRONE, AWAIT direct.
  // Pourquoi pas after() : after() de Next.js 16 n'execute PAS la callback
  // en prod Vercel sur les Server Actions (bug confirme : projet #55 cree le
  // 02/06 broadcast_count=0 jusqu'au cron rescue du 06/06 = 4 jours de
  // retard). Le user veut un envoi IMMEDIAT au pro des le depot, pas un
  // rattrapage J+1/J+4.
  // Cout en UX : ~1-2s de latence ajoutee sur le submit (1 SELECT cities +
  // 1 SELECT pros + 1 mail Resend chunk de 50). Invisible quand le submit
  // dure deja ~3-4s avec la qualification IA. Le cron rescue reste actif
  // comme filet de securite si jamais le mail Resend echoue ou que la
  // function timeout.
  // NB : on broadcast meme si le projet est suspicious, mais avec le banner
  // "Projet flague par notre IA" pour que les pros decident en connaissance.
  console.log(`[submitProject] project ${project.id} created, broadcasting NOW (sync)`);
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
      projectCityId: data.cityId,
      projectDepartmentId: city.department_id,
      isSuspicious,
    });
    console.log(
      `[submitProject] broadcast project ${project.id} : ${result.sent}/${result.totalTargets} sent, ${result.failed} failed`
    );
  } catch (err) {
    // Non bloquant : si le broadcast plante, le projet reste cree et le cron
    // de rattrapage 9h/15h reprendra le relais. L'user ne voit pas l'erreur.
    console.error(`[submitProject] broadcast project ${project.id} failed :`, err);
  }

  redirect("/deposer-projet/merci");
}
