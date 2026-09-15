import { escapeEmail, emailContent, renderEmail } from "@/lib/email/design";

import { Resend } from "resend";

import { getServiceClient } from "@/lib/supabase/service-client";

let _resend: Resend | null = null;
function getResendClient() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

// Client service_role pour tracer chaque tentative d'envoi en base
// (projects.admin_notified_at / admin_notification_error). RLS est
// active sur projects depuis le sprint securite 2026-05-22, service_role
// bypasse. Tracking obligatoire pour ne plus avoir de "perte
// silencieuse" sur les notifs (cf. projets #18 et #19 non recus).

/**
 * Audit trail : note en base le resultat de l'envoi (succes ou
 * echec avec message). Best-effort : si le tracking lui-meme foire
 * (network Supabase down), on log mais on n'attend rien.
 *
 * Effet pour l'UI admin : admin_notified_at IS NULL apres un grace
 * period -> badge "Notif non envoyee" + bouton Renvoyer.
 */
async function trackAdminNotification(
  projectId: number,
  result: "sent" | { error: string }
): Promise<void> {
  try {
    const update =
      result === "sent"
        ? {
            admin_notified_at: new Date().toISOString(),
            admin_notification_error: null,
          }
        : { admin_notification_error: result.error };
    const { error } = await getServiceClient()
      .from("projects")
      .update(update)
      .eq("id", projectId);
    if (error) {
      console.error("[trackAdminNotification] update error:", error.message);
    }
  } catch (e) {
    console.error("[trackAdminNotification] exception:", e);
  }
}

type ProjectEmailData = {
  firstName: string;
  email: string;
  phone: string;
  categoryName: string;
  cityName: string;
  departmentName?: string;
  /** true pour une ville belge → libellé « Province » au lieu de « Département ». */
  isBE?: boolean;
  description: string;
  urgency: string;
  budget: string;
  aiQualification: Record<string, unknown> | null;
  projectId: number;
  isSuspicious?: boolean;
};

const URGENCY_LABELS: Record<string, string> = {
  today: "Aujourd'hui",
  this_week: "Cette semaine",
  this_month: "Ce mois-ci",
  not_urgent: "Pas pressé",
};

const BUDGET_LABELS: Record<string, string> = {
  lt500: "Moins de 500 €",
  "500_2000": "500 € à 2 000 €",
  "2000_5000": "2 000 € à 5 000 €",
  "5000_15000": "5 000 € à 15 000 €",
  gt15000: "Plus de 15 000 €",
};

export async function sendProjectNotification(
  data: ProjectEmailData
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.error("ADMIN_EMAIL non configuré, email non envoyé");
    await trackAdminNotification(data.projectId, {
      error: "ADMIN_EMAIL not configured",
    });
    return;
  }

  const urgencyLabel = URGENCY_LABELS[data.urgency] || data.urgency;
  // 28/08/2026 : budget retire du formulaire, les nouveaux projets valent
  // « unknown » et n'affichent plus la ligne (cf. broadcast-btp-project.ts).
  const budgetLabel = BUDGET_LABELS[data.budget] ?? null;

  const aiSection = data.aiQualification
    ? `
    <tr><td colspan="2" style="padding:20px 0 8px;font-size:16px;font-weight:600;color:#20282c;border-top:1px solid #E5E7EB;">Qualification IA</td></tr>
    <tr><td style="padding:6px 0;color:#53606a;width:160px;">Résumé</td><td style="padding:6px 0;color:#20282c;">${(data.aiQualification as Record<string, unknown>).summary || "-"}</td></tr>
    <tr><td style="padding:6px 0;color:#53606a;">Catégorie correcte</td><td style="padding:6px 0;color:#20282c;">${(data.aiQualification as Record<string, unknown>).category_match ? "✓ Oui" : "✗ Non → " + (data.aiQualification as Record<string, unknown>).suggested_category}</td></tr>
    <tr><td style="padding:6px 0;color:#53606a;">Urgence réelle</td><td style="padding:6px 0;color:#20282c;">${(data.aiQualification as Record<string, unknown>).urgency_assessment || "-"}</td></tr>
    <tr><td style="padding:6px 0;color:#53606a;">Budget réaliste</td><td style="padding:6px 0;color:#20282c;">${(data.aiQualification as Record<string, unknown>).budget_realistic ? "✓ Oui" : "✗ Non"} · ${(data.aiQualification as Record<string, unknown>).budget_comment || ""}</td></tr>
    <tr><td style="padding:6px 0;color:#53606a;">Mots-clés</td><td style="padding:6px 0;color:#20282c;">${Array.isArray((data.aiQualification as Record<string, unknown>).keywords) ? ((data.aiQualification as Record<string, unknown>).keywords as string[]).join(", ") : "-"}</td></tr>
    `
    : `<tr><td colspan="2" style="padding:20px 0 8px;color:#66727c;border-top:1px solid #E5E7EB;">Qualification IA non disponible</td></tr>`;

  const html = renderEmail({ title: "Un nouveau projet.", subtitle: "À suivre dans votre espace.", category: "Administration", body: `
    <!-- Header -->
    <div style="background:#20282c;padding:24px 32px;">

      <p style="margin:4px 0 0;color:#66727c;font-size:14px;">${escapeEmail(data.categoryName)} à ${escapeEmail(data.cityName)}</p>
    </div>
    <!-- Body -->

      <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.6;">
        <tbody><tr><td colspan="2" style="padding:0 0 8px;font-size:16px;font-weight:600;color:#20282c;">Projet</td></tr>
        <tr><td style="padding:6px 0;color:#53606a;width:160px;">Catégorie</td><td style="padding:6px 0;color:#20282c;">${escapeEmail(data.categoryName)}</td></tr>
        <tr><td style="padding:6px 0;color:#53606a;">Ville</td><td style="padding:6px 0;color:#20282c;">${escapeEmail(data.cityName)}</td></tr>
        <tr><td style="padding:6px 0;color:#53606a;">${data.isBE ? "Province" : "Département"}</td><td style="padding:6px 0;color:#20282c;">${data.departmentName || "-"}</td></tr>
        <tr><td style="padding:6px 0;color:#53606a;">Urgence</td><td style="padding:6px 0;color:#20282c;">${escapeEmail(urgencyLabel)}</td></tr>
        ${budgetLabel ? `<tr><td style="padding:6px 0;color:#53606a;">Budget</td><td style="padding:6px 0;color:#20282c;">${escapeEmail(budgetLabel)}</td></tr>` : ""}
        <tr><td style="padding:6px 0;color:#53606a;vertical-align:top;">Description</td><td style="padding:6px 0;color:#20282c;">${escapeEmail(data.description)}</td></tr>

        <tr><td colspan="2" style="padding:20px 0 8px;font-size:16px;font-weight:600;color:#20282c;border-top:1px solid #E5E7EB;">Contact</td></tr>
        <tr><td style="padding:6px 0;color:#53606a;">Prénom</td><td style="padding:6px 0;color:#20282c;">${escapeEmail(data.firstName)}</td></tr>
        <tr><td style="padding:6px 0;color:#53606a;">Email</td><td style="padding:6px 0;color:#20282c;"><a href="mailto:${escapeEmail(data.email)}" style="color:#c64b1c;">${escapeEmail(data.email)}</a></td></tr>
        <tr><td style="padding:6px 0;color:#53606a;">Téléphone</td><td style="padding:6px 0;color:#20282c;"><a href="tel:${escapeEmail(data.phone)}" style="color:#c64b1c;">${escapeEmail(data.phone)}</a></td></tr>

        ${aiSection}
      </tbody></table>

      <!-- CTA -->
      <div style="margin-top:32px;text-align:center;">
        <a href="https://workwave.fr/admin/projects/${escapeEmail(data.projectId)}" style="display:inline-block;background:#c64b1c;color:#FFFFFF;padding:12px 32px;border-radius:999px;font-size:14px;font-weight:600;text-decoration:none;">
          Consulter dans l’administration
        </a>
      </div>

    <!-- Footer -->
    <div style="padding:16px 32px;background:#f5f6f7;border-top:1px solid #E5E7EB;text-align:center;">
      <p style="margin:0;color:#66727c;font-size:12px;">Workwave · Notification automatique</p>
    </div>
  ` });

  try {
    await getResendClient().emails.send({
      from: "Workwave <contact@workwave.fr>",
      to: adminEmail,
      subject: `${data.isSuspicious ? "[SUSPECT] " : ""}[Workwave] Nouveau projet · ${data.categoryName} à ${data.cityName}`,
      ...emailContent(html),
    });
    // Audit trail : envoi reussi
    await trackAdminNotification(data.projectId, "sent");
  } catch (error) {
    console.error("Erreur envoi email admin :", error);
    // Audit trail : envoi echoue, on note la raison en base pour
    // que l'admin la voie + puisse decider de renvoyer la notif.
    const errorMsg = error instanceof Error ? error.message : String(error);
    await trackAdminNotification(data.projectId, { error: errorMsg });
    // Ne pas bloquer la soumission si l'email échoue
  }
}
