import { Resend } from "resend";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
let _sb: SupabaseClient | null = null;
function getServiceClient(): SupabaseClient {
  if (!_sb) {
    _sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _sb;
}

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
  "500_2000": "500 € – 2 000 €",
  "2000_5000": "2 000 € – 5 000 €",
  "5000_15000": "5 000 € – 15 000 €",
  gt15000: "Plus de 15 000 €",
  unknown: "Je ne sais pas",
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
  const budgetLabel = BUDGET_LABELS[data.budget] || data.budget;

  const aiSection = data.aiQualification
    ? `
    <tr><td colspan="2" style="padding:20px 0 8px;font-size:16px;font-weight:600;color:#0A0A0A;border-top:1px solid #E5E7EB;">Qualification IA</td></tr>
    <tr><td style="padding:6px 0;color:#6B7280;width:160px;">Résumé</td><td style="padding:6px 0;color:#0A0A0A;">${(data.aiQualification as Record<string, unknown>).summary || "—"}</td></tr>
    <tr><td style="padding:6px 0;color:#6B7280;">Catégorie correcte</td><td style="padding:6px 0;color:#0A0A0A;">${(data.aiQualification as Record<string, unknown>).category_match ? "✓ Oui" : "✗ Non → " + (data.aiQualification as Record<string, unknown>).suggested_category}</td></tr>
    <tr><td style="padding:6px 0;color:#6B7280;">Urgence réelle</td><td style="padding:6px 0;color:#0A0A0A;">${(data.aiQualification as Record<string, unknown>).urgency_assessment || "—"}</td></tr>
    <tr><td style="padding:6px 0;color:#6B7280;">Budget réaliste</td><td style="padding:6px 0;color:#0A0A0A;">${(data.aiQualification as Record<string, unknown>).budget_realistic ? "✓ Oui" : "✗ Non"} — ${(data.aiQualification as Record<string, unknown>).budget_comment || ""}</td></tr>
    <tr><td style="padding:6px 0;color:#6B7280;">Mots-clés</td><td style="padding:6px 0;color:#0A0A0A;">${Array.isArray((data.aiQualification as Record<string, unknown>).keywords) ? ((data.aiQualification as Record<string, unknown>).keywords as string[]).join(", ") : "—"}</td></tr>
    `
    : `<tr><td colspan="2" style="padding:20px 0 8px;color:#9CA3AF;border-top:1px solid #E5E7EB;">Qualification IA non disponible</td></tr>`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background:#0A0A0A;padding:24px 32px;">
      <h1 style="margin:0;color:#FFFFFF;font-size:18px;font-weight:600;">Nouveau projet déposé</h1>
      <p style="margin:4px 0 0;color:#9CA3AF;font-size:14px;">${data.categoryName} à ${data.cityName}</p>
    </div>
    <!-- Body -->
    <div style="padding:32px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.6;">
        <tr><td colspan="2" style="padding:0 0 8px;font-size:16px;font-weight:600;color:#0A0A0A;">Projet</td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;width:160px;">Catégorie</td><td style="padding:6px 0;color:#0A0A0A;">${data.categoryName}</td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Ville</td><td style="padding:6px 0;color:#0A0A0A;">${data.cityName}</td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Urgence</td><td style="padding:6px 0;color:#0A0A0A;">${urgencyLabel}</td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Budget</td><td style="padding:6px 0;color:#0A0A0A;">${budgetLabel}</td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;vertical-align:top;">Description</td><td style="padding:6px 0;color:#0A0A0A;">${data.description}</td></tr>

        <tr><td colspan="2" style="padding:20px 0 8px;font-size:16px;font-weight:600;color:#0A0A0A;border-top:1px solid #E5E7EB;">Contact</td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Prénom</td><td style="padding:6px 0;color:#0A0A0A;">${data.firstName}</td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Email</td><td style="padding:6px 0;color:#0A0A0A;"><a href="mailto:${data.email}" style="color:#E04A2A;">${data.email}</a></td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Téléphone</td><td style="padding:6px 0;color:#0A0A0A;"><a href="tel:${data.phone}" style="color:#E04A2A;">${data.phone}</a></td></tr>

        ${aiSection}
      </table>

      <!-- CTA -->
      <div style="margin-top:32px;text-align:center;">
        <a href="https://workwave.fr/admin/projects/${data.projectId}" style="display:inline-block;background:#E04A2A;color:#FFFFFF;padding:12px 32px;border-radius:999px;font-size:14px;font-weight:600;text-decoration:none;">
          Voir dans le dashboard
        </a>
      </div>
    </div>
    <!-- Footer -->
    <div style="padding:16px 32px;background:#FAFAFA;border-top:1px solid #E5E7EB;text-align:center;">
      <p style="margin:0;color:#9CA3AF;font-size:12px;">Workwave — Notification automatique</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await getResendClient().emails.send({
      from: "Workwave <contact@workwave.fr>",
      to: adminEmail,
      subject: `${data.isSuspicious ? "[SUSPECT] " : ""}[Workwave] Nouveau projet — ${data.categoryName} à ${data.cityName}`,
      html,
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
