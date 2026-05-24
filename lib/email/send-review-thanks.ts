import { Resend } from "resend";

let _resend: Resend | null = null;
function getResendClient() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

/**
 * Mail de remerciement envoye au particulier juste apres soumission
 * de son avis. Variant selon que l'avis est auto-publie (>= 3 etoiles)
 * ou en moderation (< 3 etoiles).
 *
 * Vouvoiement strict. Court (4-5 lignes). Pas de chichi.
 */
export async function sendReviewThanks(params: {
  particulierEmail: string;
  particulierName: string;
  proName: string;
  proSlug: string;
  rating: number;
  published: boolean; // true si auto-publie, false si en moderation
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr"
  ).replace(/\s+/g, "");

  const proUrl = `${baseUrl}/artisan/${params.proSlug}`;
  const firstName = params.particulierName.split(/\s+/)[0] ?? "";

  const subject = params.published
    ? `Merci ! Votre avis sur ${params.proName} est en ligne`
    : `Merci pour votre avis sur ${params.proName}`;

  const stars = "★".repeat(params.rating) + "☆".repeat(5 - params.rating);

  const statusBlockHtml = params.published
    ? `
    <div style="background:#DCFCE7;border:1px solid #BBF7D0;border-radius:12px;padding:14px 16px;margin:0 0 24px;text-align:center;">
      <p style="margin:0;color:#15803D;font-size:14px;font-weight:600;line-height:1.5;">
        ✓ Votre avis est en ligne sur la fiche de l'artisan
      </p>
    </div>
    `
    : `
    <div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:12px;padding:14px 16px;margin:0 0 24px;text-align:center;">
      <p style="margin:0;color:#92400E;font-size:14px;font-weight:600;line-height:1.5;">
        Votre avis sera vérifié par notre équipe sous 24h
      </p>
      <p style="margin:6px 0 0;color:#92400E;font-size:12px;line-height:1.5;">
        Les avis &lt; 3 étoiles sont relus pour vérifier qu'ils ne contiennent pas d'éléments diffamatoires. C'est une protection pour les particuliers comme les artisans.
      </p>
    </div>
    `;

  const ctaHtml = params.published
    ? `
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
      <tr>
        <td style="border-radius:999px;background:#FF5A36;box-shadow:0 4px 14px -2px rgba(255,90,54,0.45);">
          <a href="${proUrl}" style="display:inline-block;padding:12px 28px;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;border-radius:999px;">
            Voir mon avis en ligne
          </a>
        </td>
      </tr>
    </table>
    `
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

    <!-- Liseré coral -->
    <div style="height:4px;background:linear-gradient(90deg,#FF5A36 0%,#FF7A5C 50%,#FF5A36 100%);"></div>

    <div style="padding:32px 32px 28px;">

      <h1 style="margin:0 0 14px;color:#0A0A0A;font-size:22px;font-weight:700;letter-spacing:-0.02em;line-height:1.3;">
        Merci${firstName ? `, ${firstName}` : ""} !
      </h1>

      <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
        Nous avons bien reçu votre avis sur <strong>${escapeHtml(params.proName)}</strong>. Votre retour aide d'autres particuliers à faire le bon choix d'artisan.
      </p>

      <!-- Recap note -->
      <div style="background:#FAFAFA;border:1px solid #E5E7EB;border-radius:12px;padding:14px 16px;margin:0 0 20px;text-align:center;">
        <p style="margin:0 0 4px;color:#9CA3AF;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Votre note</p>
        <p style="margin:0;color:#FF5A36;font-size:24px;line-height:1;letter-spacing:2px;">
          ${stars}
        </p>
        <p style="margin:6px 0 0;color:#6B7280;font-size:12px;">
          ${params.rating}/5
        </p>
      </div>

      ${statusBlockHtml}

      ${ctaHtml}

    </div>

    <div style="background:#FAFAFA;padding:18px 32px;border-top:1px solid #F1F1F3;text-align:center;">
      <p style="margin:0;color:#9CA3AF;font-size:11px;line-height:1.5;">
        Workwave — Mise en relation gratuite entre particuliers et artisans en Nouvelle-Aquitaine.<br>
        <a href="mailto:contact@workwave.fr" style="color:#9CA3AF;text-decoration:underline;">contact@workwave.fr</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Merci${firstName ? `, ${firstName}` : ""} !

Nous avons bien reçu votre avis sur ${params.proName}.

Votre note : ${params.rating}/5 (${stars})

${params.published
    ? `Votre avis est en ligne sur la fiche de l'artisan : ${proUrl}`
    : `Votre avis sera vérifié par notre équipe sous 24h (procédure standard pour les avis < 3 étoiles).`}

Merci de votre contribution. Votre retour aide d'autres particuliers à choisir le bon artisan.

— L'équipe Workwave
contact@workwave.fr
  `.trim();

  try {
    const result = await getResendClient().emails.send({
      from: "Workwave <contact@workwave.fr>",
      to: params.particulierEmail,
      subject,
      html,
      text,
    });
    if (result.error) {
      console.error("[review-thanks] Resend error :", result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true };
  } catch (e) {
    const err = e as Error;
    console.error("[review-thanks] Exception :", err.message);
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
