/**
 * Email admin pour nouveau projet tech Workwave AI.
 *
 * Differences avec send-project-notification.ts (BTP) :
 *   - Sender : "Workwave AI <contact@workwave.fr>"
 *   - Subject : "[AI] Nouveau brief tech : {title}"
 *   - Inclut la categorie tech (developpement-web, IA, etc.)
 *   - Inclut les 3 freelances routes (nom + slug profile + dept + GitHub)
 *
 * Comme pour BTP, tracking en base via admin_notified_at /
 * admin_notification_error (les memes colonnes que pour le BTP).
 */
import { Resend } from "resend";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _resend: Resend | null = null;
function getResendClient() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

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
    if (error) console.warn("[AI notif tracking]", error.message);
  } catch (e) {
    console.warn("[AI notif tracking] exception:", e);
  }
}

type RoutedFreelance = {
  id: number;
  name: string;
  slug: string;
  postal_code: string | null;
  github_username: string | null;
  years_experience: number | null;
  score: number;
};

type SendAiProjectNotificationInput = {
  projectId: number;
  title: string;
  categoryName: string;
  description: string;
  budget: string;
  timeline: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  company: string | null;
  postal: string | null;
  stack: string | null;
  remoteOk: boolean;
  qualification: {
    summary: string;
    suspicion_score: number;
    budget_realistic: boolean;
    budget_comment: string;
    keywords: string[];
    confidence: number;
  } | null;
  routed: RoutedFreelance[];
  /**
   * Phase 11 — broadcast a tous les freelances tech au lieu du routing top 3.
   * Optionnel pour retrocompat avec d'autres appelants eventuels.
   */
  broadcastInfo?: {
    sent: number;
    totalTargets: number;
    failed: number;
  };
};

export async function sendAiProjectNotification(
  input: SendAiProjectNotificationInput
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";
  const adminEmail = "workwave.france@gmail.com";

  const suspicionBadge =
    input.qualification && input.qualification.suspicion_score > 70
      ? `<span style="background:#FEE2E2;color:#DC2626;padding:4px 8px;border-radius:4px;font-size:12px;font-weight:600;">⚠ Suspicion ${input.qualification.suspicion_score}/100</span>`
      : "";

  // Phase 11 : broadcast remplace routing IA. On affiche les stats du broadcast
  // dans le mail admin (combien de freelances joins) plutot que le top 3.
  // Le bloc routed reste supporte pour retrocompat BTP (qui utilise toujours
  // le routing). En tech, broadcastInfo est defini et routed=[].
  const broadcastHtml = input.broadcastInfo
    ? `<h3 style="font-size:14px;color:#525252;margin:24px 0 12px 0;">Broadcast a la communaute :</h3>
       <table style="font-size:13px;width:100%;border-collapse:collapse;">
         <tr><td style="padding:4px 0;color:#999;width:160px;">Freelances cibles</td><td style="color:#0A0A0A;font-weight:600;">${input.broadcastInfo.totalTargets}</td></tr>
         <tr><td style="padding:4px 0;color:#999;">Emails envoyes</td><td style="color:#0A0A0A;font-weight:600;">${input.broadcastInfo.sent}</td></tr>
         ${input.broadcastInfo.failed > 0 ? `<tr><td style="padding:4px 0;color:#999;">Echecs envoi</td><td style="color:#DC2626;font-weight:600;">${input.broadcastInfo.failed}</td></tr>` : ""}
       </table>`
    : "";

  const routedHtml = input.routed.length
    ? `<h3 style="font-size:14px;color:#525252;margin:24px 0 12px 0;">Top 3 freelances routes par l'IA :</h3>
       <ol style="padding-left:20px;">
         ${input.routed
           .map(
             (f) => `
           <li style="margin-bottom:10px;">
             <a href="${baseUrl}/ai/freelance/${f.slug}" style="color:#FF6803;text-decoration:none;font-weight:600;">${f.name}</a>
             <span style="color:#999;font-size:13px;">
               · ${f.postal_code || "—"}
               · ${f.years_experience != null ? `${f.years_experience} ans XP` : "XP inconnue"}
               ${f.github_username ? `· <a href="https://github.com/${f.github_username}" style="color:#525252;">@${f.github_username}</a>` : ""}
               · score ${f.score}
             </span>
           </li>`
           )
           .join("")}
       </ol>`
    : broadcastHtml;

  const aiInsightsHtml = input.qualification
    ? `<h3 style="font-size:14px;color:#525252;margin:24px 0 12px 0;">Analyse IA :</h3>
       <table style="font-size:13px;width:100%;border-collapse:collapse;">
         <tr><td style="padding:4px 0;color:#999;">Resume</td><td style="color:#0A0A0A;">${input.qualification.summary}</td></tr>
         <tr><td style="padding:4px 0;color:#999;">Confiance categorie</td><td style="color:#0A0A0A;">${input.qualification.confidence}/100</td></tr>
         <tr><td style="padding:4px 0;color:#999;">Budget realiste</td><td style="color:#0A0A0A;">${input.qualification.budget_realistic ? "✓" : "✗"} — ${input.qualification.budget_comment}</td></tr>
         <tr><td style="padding:4px 0;color:#999;">Keywords</td><td style="color:#0A0A0A;">${input.qualification.keywords.join(", ")}</td></tr>
       </table>`
    : "";

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#F7F7F7;margin:0;padding:24px;color:#0A0A0A;">
  <div style="max-width:600px;margin:0 auto;background:white;border:1px solid #E5E5E5;border-radius:16px;padding:32px;">
    <div style="margin-bottom:20px;">
      <span style="font-family:'SF Mono',Menlo,monospace;font-size:11px;color:#999;letter-spacing:0.2em;">[ AI · NEW BRIEF ]</span>
      ${suspicionBadge}
    </div>

    <h1 style="font-size:22px;color:#0A0A0A;margin:0 0 8px 0;font-weight:800;letter-spacing:-0.02em;">${input.title}</h1>
    <p style="font-size:14px;color:#525252;margin:0 0 24px 0;">Categorie : <strong>${input.categoryName}</strong></p>

    <h3 style="font-size:14px;color:#525252;margin:0 0 8px 0;">Description :</h3>
    <p style="font-size:14px;color:#0A0A0A;line-height:1.6;background:#FAFAFA;padding:16px;border-radius:8px;border-left:3px solid #FF6803;white-space:pre-wrap;">${input.description}</p>

    <h3 style="font-size:14px;color:#525252;margin:24px 0 12px 0;">Brief :</h3>
    <table style="font-size:13px;width:100%;border-collapse:collapse;">
      <tr><td style="padding:4px 0;color:#999;">Budget</td><td style="color:#0A0A0A;font-family:'SF Mono',Menlo,monospace;">${input.budget}</td></tr>
      <tr><td style="padding:4px 0;color:#999;">Calendrier</td><td style="color:#0A0A0A;">${input.timeline}</td></tr>
      <tr><td style="padding:4px 0;color:#999;">Stack</td><td style="color:#0A0A0A;">${input.stack || "—"}</td></tr>
      <tr><td style="padding:4px 0;color:#999;">Remote OK</td><td style="color:#0A0A0A;">${input.remoteOk ? "✓ Oui" : "✗ Non"}</td></tr>
      <tr><td style="padding:4px 0;color:#999;">Localisation</td><td style="color:#0A0A0A;font-family:'SF Mono',Menlo,monospace;">${input.postal || "—"}</td></tr>
    </table>

    <h3 style="font-size:14px;color:#525252;margin:24px 0 12px 0;">Contact :</h3>
    <table style="font-size:13px;width:100%;border-collapse:collapse;">
      <tr><td style="padding:4px 0;color:#999;">Nom</td><td style="color:#0A0A0A;"><strong>${input.contactName}</strong>${input.company ? ` · ${input.company}` : ""}</td></tr>
      <tr><td style="padding:4px 0;color:#999;">Email</td><td style="color:#0A0A0A;"><a href="mailto:${input.contactEmail}" style="color:#FF6803;">${input.contactEmail}</a></td></tr>
      <tr><td style="padding:4px 0;color:#999;">Telephone</td><td style="color:#0A0A0A;">${input.contactPhone || "—"}</td></tr>
    </table>

    ${aiInsightsHtml}

    ${routedHtml}

    <hr style="border:none;border-top:1px solid #E5E5E5;margin:32px 0 16px 0;">
    <p style="font-size:11px;color:#999;text-align:center;">
      Workwave AI · projet #${input.projectId} · <a href="${baseUrl}/admin/projects/${input.projectId}" style="color:#999;">Ouvrir dans l'admin</a>
    </p>
  </div>
</body></html>`;

  try {
    const r = await getResendClient().emails.send({
      from: "Workwave AI <contact@workwave.fr>",
      to: [adminEmail],
      replyTo: input.contactEmail,
      subject: `[AI] ${input.title}`,
      html,
    });
    if (r.error) {
      console.error("[sendAiProjectNotification] Resend error:", r.error);
      await trackAdminNotification(input.projectId, {
        error: r.error.message || String(r.error),
      });
      return;
    }
    await trackAdminNotification(input.projectId, "sent");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[sendAiProjectNotification] exception:", msg);
    await trackAdminNotification(input.projectId, { error: msg });
  }
}
