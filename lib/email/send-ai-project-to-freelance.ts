/**
 * Email envoye au freelance Premium AI quand un nouveau projet matche
 * son profil et qu'il fait partie du top 3 route.
 *
 * Seuls les freelances avec subscription_status='active' OR 'trialing'
 * AND subscription_product='ai' recoivent cet email (filtre cote routing).
 *
 * Le freelance se connecte ensuite a /ai/dashboard/projets pour voir le
 * detail et contacter le client directement (coordonnees fournies dans
 * le dashboard, pas dans le mail pour eviter scraping email).
 */
import { Resend } from "resend";

let _resend: Resend | null = null;
function getResendClient(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export type ProjectNotifInput = {
  freelanceEmail: string;
  freelanceFirstName: string;
  projectId: number;
  projectTitle: string;
  projectDescription: string;
  projectBudget: string | null;
  projectTimeline: string | null;
  projectCategoryName: string;
  clientCity: string | null;
};

export async function sendProjectToAiFreelance(
  input: ProjectNotifInput
): Promise<{ ok: boolean; error?: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";

  // Truncate description pour preview (full visible dans dashboard)
  const previewDesc =
    input.projectDescription.length > 220
      ? input.projectDescription.slice(0, 220).trim() + "..."
      : input.projectDescription;

  const subject = `Nouveau projet ${input.projectCategoryName} — Workwave AI`;
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#F7F7F7;margin:0;padding:24px;color:#0A0A0A;">
  <div style="max-width:600px;margin:0 auto;background:white;border:1px solid #E5E5E5;border-radius:16px;padding:32px;">
    <p style="font-family:'SF Mono',Menlo,monospace;font-size:11px;color:#999;letter-spacing:0.2em;margin:0 0 20px 0;">[ WORKWAVE AI · NOUVEAU PROJET ]</p>

    <h1 style="font-size:24px;color:#0A0A0A;margin:0 0 8px 0;font-weight:800;letter-spacing:-0.02em;">Bonjour ${input.freelanceFirstName},</h1>
    <p style="font-size:14px;color:#525252;line-height:1.6;margin:0 0 24px 0;">
      Un nouveau projet ${input.projectCategoryName} matche votre profil. Vous etes dans le <strong>top 3 des freelances selectionnes</strong> par notre IA.
    </p>

    <div style="background:#FAFAFA;border-left:3px solid #FF6803;padding:20px;border-radius:8px;margin:0 0 24px 0;">
      <h2 style="font-size:18px;color:#0A0A0A;margin:0 0 12px 0;font-weight:700;">${input.projectTitle}</h2>
      <p style="font-size:13px;color:#525252;line-height:1.6;margin:0 0 16px 0;white-space:pre-wrap;">${previewDesc}</p>
      <table style="font-size:12px;width:100%;border-collapse:collapse;">
        ${input.projectBudget ? `<tr><td style="padding:4px 0;color:#999;width:90px;">Budget</td><td style="color:#0A0A0A;font-weight:600;">${input.projectBudget}</td></tr>` : ""}
        ${input.projectTimeline ? `<tr><td style="padding:4px 0;color:#999;">Delai</td><td style="color:#0A0A0A;font-weight:600;">${input.projectTimeline}</td></tr>` : ""}
        ${input.clientCity ? `<tr><td style="padding:4px 0;color:#999;">Ville</td><td style="color:#0A0A0A;">${input.clientCity}</td></tr>` : ""}
      </table>
    </div>

    <a href="${baseUrl}/ai/dashboard/projets" style="display:inline-block;background:#FF6803;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin:0 0 24px 0;">
      Voir le projet et repondre →
    </a>

    <p style="font-size:13px;color:#525252;line-height:1.6;margin:24px 0 0 0;">
      Pour ne plus recevoir ces notifications, mettez votre profil en pause depuis votre <a href="${baseUrl}/ai/dashboard/preferences" style="color:#FF6803;">dashboard</a>.
    </p>

    <hr style="border:none;border-top:1px solid #E5E5E5;margin:32px 0 16px 0;">
    <p style="font-size:11px;color:#999;text-align:center;">
      Workwave AI · <a href="${baseUrl}/ai" style="color:#999;">workwave.fr/ai</a> · projet #${input.projectId}
    </p>
  </div>
</body></html>`;

  try {
    const r = await getResendClient().emails.send({
      from: "Workwave AI <contact@workwave.fr>",
      to: [input.freelanceEmail],
      subject,
      html,
    });
    if (r.error) {
      console.error("[sendProjectToAiFreelance] Resend error:", r.error);
      return { ok: false, error: r.error.message || String(r.error) };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[sendProjectToAiFreelance] exception:", msg);
    return { ok: false, error: msg };
  }
}
