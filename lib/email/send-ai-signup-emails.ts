import { emailContent, renderEmail, emailParagraph, emailButton, emailDetails } from "@/lib/email/design";

/**
 * Emails pour signup freelance Workwave AI :
 *   - sendAiSignupAdminNotification : admin recoit le profil avec toutes les data
 *   - sendAiSignupWelcome : user recoit confirmation "Inscription enregistree, on previent des l'ouverture"
 *
 * Tracking en BDD via ai_signups.admin_notified_at + welcome_sent_at.
 */
import { Resend } from "resend";

import type { Locale } from "@/lib/i18n/config";
import { getServiceClient } from "@/lib/supabase/service-client";

let _resend: Resend | null = null;
function getResendClient() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export type SignupData = {
  signupId: number;
  firstName: string;
  lastName: string;
  email: string;
  github: string | null;
  linkedin: string | null;
  categoryName: string;
  categorySlug: string;
  skills: string | null;
  bio: string | null;
  tjm: number | null;
  experienceYears: number | null;
  availability: string | null;
  location: string | null;
  plan: "free" | "premium";
};

const PLAN_LABELS = {
  free: "Gratuit (profil visible, reception des projets par email)",
  premium: "Gratuit (profil visible, reception des projets par email)",
};

const AVAILABILITY_LABELS: Record<string, string> = {
  remote: "100% remote",
  hybrid: "Hybride (remote + bureau)",
  onsite: "Sur site uniquement",
};

// ─── ADMIN NOTIFICATION ─────────────────────────────────────────────────
export async function sendAiSignupAdminNotification(data: SignupData): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";
  const adminEmail = "workwave.france@gmail.com";

  const html = renderEmail({ title: "Un nouveau compte AI.", subtitle: "Une expertise à découvrir.", category: "Administration",
body: emailDetails([["Nom", `${data.firstName} ${data.lastName}`], ["Email", data.email], ["Catégorie", data.categoryName], ["Offre", PLAN_LABELS[data.plan]], ["Localisation", data.location || "Non précisée"], ["Présentation", data.bio || "Non renseignée"], ["Compétences", data.skills || "Non renseignées"], ["GitHub", data.github || "Non renseigné"], ["LinkedIn", data.linkedin || "Non renseigné"], ["TJM indicatif", data.tjm == null ? "Non renseigné" : `${data.tjm} €`], ["Expérience", data.experienceYears == null ? "Non renseignée" : `${data.experienceYears} ans`], ["Disponibilité", data.availability ? AVAILABILITY_LABELS[data.availability] || data.availability : "Non renseignée"]])
 + emailButton("Ouvrir l’administration", `${baseUrl}/admin`) });

  try {
    const r = await getResendClient().emails.send({
      from: "Workwave AI <contact@workwave.fr>",
      to: [adminEmail],
      replyTo: data.email,
      subject: `[AI Signup] ${data.firstName} ${data.lastName} · ${data.categoryName} (${data.plan})`,
      ...emailContent(html),
    });
    if (r.error) {
      console.error("[sendAiSignupAdminNotification] Resend error:", r.error);
      await getServiceClient().from("ai_signups").update({
        admin_notification_error: r.error.message || String(r.error),
      }).eq("id", data.signupId);
      return;
    }
    await getServiceClient().from("ai_signups").update({
      admin_notified_at: new Date().toISOString(),
      admin_notification_error: null,
    }).eq("id", data.signupId);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[sendAiSignupAdminNotification] exception:", msg);
    await getServiceClient().from("ai_signups").update({
      admin_notification_error: msg,
    }).eq("id", data.signupId);
  }
}

// ─── WELCOME USER ─────────────────────────────────────────────────────────
export async function sendAiSignupWelcome(
  data: SignupData,
  locale: Locale = "fr"
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";

  // Variante EN : pointe vers le tunnel anglais sur le gTLD workwaveai.co,
  // pay-per-lead uniquement. Le freelance US recoit un mail anglais.
  if (locale === "en") {
    const aiBase = "https://www.workwaveai.co/en/ai";
    const enHtml = renderEmail({ title: "Your profile is ready.", subtitle: "Make it yours.", category: "Workwave AI", locale: "en",
body: emailParagraph(`Welcome ${data.firstName}, your Workwave AI account is active.`)
 + emailParagraph("Add your introduction, skills and portfolio so clients can discover your work. Then explore available projects and choose those that suit your expertise.")
 + emailButton("Open my account", `${aiBase}/connexion`)
 + emailParagraph("Your profile is free. Check the price and any available offers before unlocking a client’s contact details. No subscription is required.")
 + emailParagraph("Need a hand getting started? Just reply to this email.") });
    try {
      const r = await getResendClient().emails.send({
        from: "Workwave AI <contact@workwave.fr>",
        to: [data.email],
        subject: `Welcome to Workwave AI, ${data.firstName}!`,
        ...emailContent(enHtml),
      });
      if (r.error) {
        console.error("[sendAiSignupWelcome EN] Resend error:", r.error);
        return;
      }
      await getServiceClient().from("ai_signups").update({
        welcome_sent_at: new Date().toISOString(),
      }).eq("id", data.signupId);
    } catch (e: unknown) {
      console.error("[sendAiSignupWelcome EN] exception:", e);
    }
    return;
  }

  const html = renderEmail({ title: "Votre profil est prêt.", subtitle: "Place à votre expertise.", category: "Workwave AI",
body: emailParagraph(`Bienvenue ${data.firstName}, votre compte Workwave AI est actif.`)
 + emailParagraph("Présentez votre activité, ajoutez vos compétences et vos liens professionnels. Consultez ensuite les projets disponibles pour choisir ceux qui vous correspondent.")
 + emailButton("Compléter mon profil", `${baseUrl}/ai/connexion`)
 + emailParagraph("Votre profil est gratuit. Le tarif et les éventuelles offres sont affichés avant le déblocage des coordonnées. Sans abonnement obligatoire.")
 + emailParagraph("Une question pour démarrer ? Répondez directement à cet email.") });

  try {
    const r = await getResendClient().emails.send({
      from: "Workwave AI <contact@workwave.fr>",
      to: [data.email],
      subject: `Bienvenue sur Workwave AI, ${data.firstName} !`,
      ...emailContent(html),
    });
    if (r.error) {
      console.error("[sendAiSignupWelcome] Resend error:", r.error);
      return;
    }
    await getServiceClient().from("ai_signups").update({
      welcome_sent_at: new Date().toISOString(),
    }).eq("id", data.signupId);
  } catch (e: unknown) {
    console.error("[sendAiSignupWelcome] exception:", e);
  }
}
