import { escapeEmail, emailContent, renderEmail } from "@/lib/email/design";

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

import { getServiceClient } from "@/lib/supabase/service-client";

let _resend: Resend | null = null;
function getResendClient() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
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
   * Phase 11 : broadcast a tous les freelances tech au lieu du routing top 3.
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
      ? `<span style="background:#FEE2E2;color:#DC2626;padding:4px 8px;border-radius:4px;font-size:12px;font-weight:600;">⚠ Suspicion ${escapeEmail(input.qualification.suspicion_score)}/100</span>`
      : "";

  // Phase 11 : broadcast remplace routing IA. On affiche les stats du broadcast
  // dans le mail admin (combien de freelances joins) plutot que le top 3.
  // Le bloc routed reste supporte pour retrocompat BTP (qui utilise toujours
  // le routing). En tech, broadcastInfo est defini et routed=[].
  const broadcastHtml = input.broadcastInfo
    ? `<h3 style="font-size:14px;color:#53606a;margin:24px 0 12px 0;">Diffusion aux professionnels :</h3>
       <table style="font-size:13px;width:100%;border-collapse:collapse;">
         <tr><td style="padding:4px 0;color:#66727c;width:160px;">Professionnels ciblés</td><td style="color:#20282c;font-weight:600;">${escapeEmail(input.broadcastInfo.totalTargets)}</td></tr>
         <tr><td style="padding:4px 0;color:#66727c;">Emails envoyés</td><td style="color:#20282c;font-weight:600;">${escapeEmail(input.broadcastInfo.sent)}</td></tr>
         ${input.broadcastInfo.failed > 0 ? `<tr><td style="padding:4px 0;color:#66727c;">Échecs d’envoi</td><td style="color:#DC2626;font-weight:600;">${escapeEmail(input.broadcastInfo.failed)}</td></tr>` : ""}
       </table>`
    : "";

  const routedHtml = input.routed.length
    ? `<h3 style="font-size:14px;color:#53606a;margin:24px 0 12px 0;">Professionnels proposés :</h3>
       <ol style="padding-left:20px;">
         ${input.routed
           .map(
             (f) => `
           <li style="margin-bottom:10px;">
             <a href="${escapeEmail(baseUrl)}/ai/freelance/${escapeEmail(f.slug)}" style="color:#c64b1c;text-decoration:none;font-weight:600;">${escapeEmail(f.name)}</a>
             <span style="color:#66727c;font-size:13px;">
               · ${f.postal_code || "-"}
               · ${f.years_experience != null ? `${escapeEmail(f.years_experience)} ans XP` : "XP inconnue"}
               ${f.github_username ? `· <a href="https://github.com/${escapeEmail(f.github_username)}" style="color:#53606a;">@${escapeEmail(f.github_username)}</a>` : ""}
               · score ${escapeEmail(f.score)}
             </span>
           </li>`
           )
           .join("")}
       </ol>`
    : broadcastHtml;

  const aiInsightsHtml = input.qualification
    ? `<h3 style="font-size:14px;color:#53606a;margin:24px 0 12px 0;">Analyse IA :</h3>
       <table style="font-size:13px;width:100%;border-collapse:collapse;">
         <tr><td style="padding:4px 0;color:#66727c;">Résumé</td><td style="color:#20282c;">${escapeEmail(input.qualification.summary)}</td></tr>
         <tr><td style="padding:4px 0;color:#66727c;">Confiance sur la catégorie</td><td style="color:#20282c;">${escapeEmail(input.qualification.confidence)}/100</td></tr>
         <tr><td style="padding:4px 0;color:#66727c;">Budget réaliste</td><td style="color:#20282c;">${input.qualification.budget_realistic ? "✓" : "✗"} · ${escapeEmail(input.qualification.budget_comment)}</td></tr>
         <tr><td style="padding:4px 0;color:#66727c;">Mots-clés</td><td style="color:#20282c;">${input.qualification.keywords.join(", ")}</td></tr>
       </table>`
    : "";

  const html = renderEmail({ title: "Un nouveau projet AI.", subtitle: "Découvrez la demande.", category: "Administration", body: `
    <div style="margin-bottom:20px;">
      <span style="font-family:'SF Mono',Menlo,monospace;font-size:11px;color:#66727c;letter-spacing:0.2em;">WORKWAVE AI</span>
      ${suspicionBadge}
    </div>

    <p style="font-size:14px;color:#53606a;margin:0 0 24px 0;">Catégorie : <strong>${escapeEmail(input.categoryName)}</strong></p>

    <h3 style="font-size:14px;color:#53606a;margin:0 0 8px 0;">Description :</h3>
    <p style="font-size:14px;color:#20282c;line-height:1.6;background:#f5f6f7;padding:16px;border-radius:22px;border-left:3px solid #c64b1c;white-space:pre-wrap;">${escapeEmail(input.description)}</p>

    <h3 style="font-size:14px;color:#53606a;margin:24px 0 12px 0;">Brief :</h3>
    <table style="font-size:13px;width:100%;border-collapse:collapse;">
      <tbody><tr><td style="padding:4px 0;color:#66727c;">Budget</td><td style="color:#20282c;font-family:'SF Mono',Menlo,monospace;">${escapeEmail(input.budget)}</td></tr>
      <tr><td style="padding:4px 0;color:#66727c;">Calendrier</td><td style="color:#20282c;">${escapeEmail(input.timeline)}</td></tr>
      <tr><td style="padding:4px 0;color:#66727c;">Stack</td><td style="color:#20282c;">${input.stack || "-"}</td></tr>
      <tr><td style="padding:4px 0;color:#66727c;">À distance</td><td style="color:#20282c;">${input.remoteOk ? "✓ Oui" : "✗ Non"}</td></tr>
      <tr><td style="padding:4px 0;color:#66727c;">Localisation</td><td style="color:#20282c;font-family:'SF Mono',Menlo,monospace;">${input.postal || "-"}</td></tr>
    </tbody></table>

    <h3 style="font-size:14px;color:#53606a;margin:24px 0 12px 0;">Contact :</h3>
    <table style="font-size:13px;width:100%;border-collapse:collapse;">
      <tbody><tr><td style="padding:4px 0;color:#66727c;">Nom</td><td style="color:#20282c;"><strong>${escapeEmail(input.contactName)}</strong>${input.company ? ` · ${escapeEmail(input.company)}` : ""}</td></tr>
      <tr><td style="padding:4px 0;color:#66727c;">Email</td><td style="color:#20282c;"><a href="mailto:${escapeEmail(input.contactEmail)}" style="color:#c64b1c;">${escapeEmail(input.contactEmail)}</a></td></tr>
      <tr><td style="padding:4px 0;color:#66727c;">Téléphone</td><td style="color:#20282c;">${input.contactPhone || "-"}</td></tr>
    </tbody></table>

    ${aiInsightsHtml}

    ${routedHtml}

    <hr style="border:none;border-top:1px solid #E5E5E5;margin:32px 0 16px 0;">
    <p style="font-size:11px;color:#66727c;text-align:center;">
      Workwave AI · projet #${escapeEmail(input.projectId)} · <a href="${escapeEmail(baseUrl)}/admin/projects/${escapeEmail(input.projectId)}" style="color:#66727c;">Ouvrir dans l'admin</a>
    </p>
  ` });

  try {
    const r = await getResendClient().emails.send({
      from: "Workwave AI <contact@workwave.fr>",
      to: [adminEmail],
      replyTo: input.contactEmail,
      subject: `[AI] ${input.title}`,
      ...emailContent(html),
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
