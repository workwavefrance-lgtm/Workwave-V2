import { escapeEmail, emailContent, renderEmail } from "@/lib/email/design";

import { Resend } from "resend";

let _resend: Resend | null = null;
function getResendClient() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

/**
 * Alerte admin envoyee a chaque soumission d'avis < 3 etoiles.
 *
 * Permet a l'admin d'aller direct sur /admin/reviews pour publier ou
 * rejeter. Email court (1 phrase + lien), pas de chichi.
 *
 * ADMIN_EMAIL configure dans .env.local. Fallback : contact@workwave.fr.
 */
export async function sendReviewModerationAlert(params: {
  proName: string;
  proSlug: string;
  particulierName: string;
  rating: number;
  comment: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr"
  ).replace(/\s+/g, "");

  const adminEmail = process.env.ADMIN_EMAIL || "contact@workwave.fr";
  const adminUrl = `${baseUrl}/admin/reviews`;
  const proUrl = `${baseUrl}/artisan/${params.proSlug}`;

  const ratingColor =
    params.rating <= 1 ? "#DC2626" : params.rating === 2 ? "#EA580C" : "#D97706";

  const html = renderEmail({ title: "Un avis attend.", subtitle: "Prenez le temps de le lire.", category: "Administration", body: `

    <!-- Liseré rouge en haut -->
    <div style="height:4px;background:${escapeEmail(ratingColor)};"></div>

      <p style="margin:0 0 12px;font-size:11px;color:#66727c;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">
        Modération requise · Workwave
      </p>

      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:0 0 20px;">
        <tbody><tr>
          <td style="padding:6px 0;color:#53606a;font-size:13px;font-weight:500;width:120px;">Note :</td>
          <td style="padding:6px 0;color:${escapeEmail(ratingColor)};font-size:14px;font-weight:700;">${escapeEmail(params.rating)}/5 ★</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#53606a;font-size:13px;font-weight:500;">Particulier :</td>
          <td style="padding:6px 0;color:#20282c;font-size:14px;">${escapeHtml(params.particulierName)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#53606a;font-size:13px;font-weight:500;vertical-align:top;">Fiche pro :</td>
          <td style="padding:6px 0;">
            <a href="${escapeEmail(proUrl)}" style="color:#c64b1c;font-size:13px;text-decoration:none;">${escapeHtml(params.proSlug)}</a>
          </td>
        </tr>
      </tbody></table>

      ${params.comment ? `
      <div style="background:#f5f6f7;border:1px solid #E5E7EB;border-radius:22px;padding:14px 16px;margin:0 0 24px;">
        <p style="margin:0 0 4px;color:#66727c;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Commentaire</p>
        <p style="margin:0;color:#20282c;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(params.comment)}</p>
      </div>
      ` : `
      <p style="margin:0 0 24px;color:#66727c;font-size:13px;font-style:italic;">
        (Aucun commentaire, note uniquement)
      </p>
      `}

      <table cellpadding="0" cellspacing="0" border="0" style="margin:0;">
        <tbody><tr>
          <td style="border-radius:999px;background:#c64b1c;">
            <a href="${escapeEmail(adminUrl)}" style="display:inline-block;padding:12px 24px;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;border-radius:999px;">
              Modérer cet avis
            </a>
          </td>
        </tr>
      </tbody></table>

    <div style="background:#f5f6f7;padding:14px 32px;border-top:1px solid #F1F1F3;">
      <p style="margin:0;color:#66727c;font-size:11px;line-height:1.5;">
        Auto-publication des avis ≥ 3★. Les avis &lt; 3★ requièrent votre validation.
      </p>
    </div>
  ` }).trim();

  const text = `
Avis ${params.rating}/5 à modérer sur ${params.proName}

- Particulier : ${params.particulierName}
- Note : ${params.rating}/5 ★
- Fiche : ${proUrl}
${params.comment ? `\nCommentaire :\n${params.comment}\n` : "\n(Aucun commentaire)\n"}
Modérer ici : ${adminUrl}
  `.trim();

  try {
    const result = await getResendClient().emails.send({
      from: "Workwave <contact@workwave.fr>",
      to: adminEmail,
      subject: `[Mod] Avis ${params.rating}/5 à valider · ${params.proName}`,
      ...emailContent(html),
      text,
    });
    if (result.error) {
      console.error("[review-moderation-alert] Resend error :", result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true };
  } catch (e) {
    const err = e as Error;
    console.error("[review-moderation-alert] Exception :", err.message);
    return { ok: false, error: err.message };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
