import { Resend } from "resend";

let _resend: Resend | null = null;
function getResendClient() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

/**
 * Mail de sollicitation d'avis envoye au particulier 7 jours apres le
 * depot de projet. Demande son retour sur l'experience avec le pro
 * contacte. Format court : 1 question, 1 CTA, 1 fallback contact.
 *
 * Vouvoiement strict. Design coherent avec les autres mails Workwave.
 */
export async function sendReviewRequest(params: {
  particulierEmail: string;
  particulierName: string;
  proName: string;
  proSlug: string;
  proCity: string | null;
  token: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr"
  ).replace(/\s+/g, "");

  const reviewUrl = `${baseUrl}/avis/${params.token}`;
  const proPageUrl = `${baseUrl}/artisan/${params.proSlug}`;
  const firstName = params.particulierName.split(/\s+/)[0] ?? "";
  const proCityLabel = params.proCity ? ` à ${params.proCity}` : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

    <!-- Liseré coral -->
    <div style="height:4px;background:linear-gradient(90deg,#FF5A36 0%,#FF7A5C 50%,#FF5A36 100%);"></div>

    <!-- Contenu principal -->
    <div style="padding:36px 32px 28px;">

      <p style="margin:0 0 18px;font-size:13px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">
        Votre avis compte
      </p>

      <h1 style="margin:0 0 18px;color:#0A0A0A;font-size:24px;font-weight:700;letter-spacing:-0.02em;line-height:1.3;">
        Bonjour${firstName ? ` ${firstName}` : ""},<br>comment ça s'est passé avec <span style="color:#FF5A36;">${escapeHtml(params.proName)}</span> ?
      </h1>

      <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
        Vous avez déposé un projet sur Workwave il y a une semaine et nous avons mis en relation${proCityLabel} <strong>${escapeHtml(params.proName)}</strong>. Votre retour aide d'autres particuliers à faire le bon choix.
      </p>

      <!-- CTA principal -->
      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 24px;">
        <tr>
          <td align="center" style="border-radius:999px;background:#FF5A36;box-shadow:0 4px 14px -2px rgba(255,90,54,0.45);">
            <a href="${reviewUrl}" style="display:inline-block;padding:14px 32px;color:#FFFFFF;font-size:15px;font-weight:600;text-decoration:none;border-radius:999px;letter-spacing:-0.01em;">
              Laisser mon avis (30 secondes)
            </a>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 8px;color:#6B7280;font-size:13px;text-align:center;line-height:1.5;">
        5 étoiles + commentaire optionnel · 30 secondes
      </p>
      <p style="margin:0 0 28px;color:#9CA3AF;font-size:12px;text-align:center;line-height:1.5;">
        Confidentiel : seul votre prénom et la première lettre de votre nom seront affichés.
      </p>

      <!-- Divider subtil -->
      <div style="border-top:1px solid #F1F1F3;margin:0 -8px 24px;"></div>

      <!-- Recap mise en relation -->
      <p style="margin:0 0 8px;color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">
        Récapitulatif
      </p>
      <p style="margin:0 0 8px;color:#0A0A0A;font-size:14px;line-height:1.5;">
        <strong style="color:#0A0A0A;">Artisan contacté :</strong> ${escapeHtml(params.proName)}${proCityLabel}
      </p>
      <p style="margin:0 0 4px;color:#0A0A0A;font-size:14px;line-height:1.5;">
        <strong style="color:#0A0A0A;">Sa fiche Workwave :</strong>
        <a href="${proPageUrl}" style="color:#FF5A36;text-decoration:none;font-weight:500;">${proPageUrl.replace("https://", "")}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#FAFAFA;padding:20px 32px;text-align:center;border-top:1px solid #F1F1F3;">
      <p style="margin:0 0 4px;color:#6B7280;font-size:12px;line-height:1.5;">
        Vous n'avez pas été en contact avec cet artisan ? Pas de souci, ignorez cet email.
      </p>
      <p style="margin:0;color:#9CA3AF;font-size:11px;line-height:1.5;">
        Un problème ? Écrivez-nous à <a href="mailto:contact@workwave.fr" style="color:#FF5A36;text-decoration:none;">contact@workwave.fr</a>
      </p>
    </div>

  </div>
</body>
</html>
  `.trim();

  const text = `
Bonjour${firstName ? ` ${firstName}` : ""},

Comment s'est passée votre mise en relation avec ${params.proName}${proCityLabel} via Workwave ?

Votre avis aide d'autres particuliers à faire le bon choix.

Laissez votre avis ici (30 secondes) :
${reviewUrl}

Confidentiel : seul votre prénom et la première lettre de votre nom seront affichés.

—

Récapitulatif
- Artisan contacté : ${params.proName}${proCityLabel}
- Sa fiche Workwave : ${proPageUrl}

Vous n'avez pas été en contact avec cet artisan ? Ignorez cet email.

Un problème ? Écrivez-nous à contact@workwave.fr.

— L'équipe Workwave
  `.trim();

  try {
    const result = await getResendClient().emails.send({
      from: "Workwave <contact@workwave.fr>",
      to: params.particulierEmail,
      subject: `Comment s'est passé votre contact avec ${params.proName} ?`,
      html,
      text,
      headers: {
        // Bloque le tracking pour respecter la simplicite du flow
        // (les emails de demande d'avis n'ont pas besoin d'analytics
        // Resend, on a deja le submitted_at en base pour mesurer).
        "List-Unsubscribe": `<mailto:contact@workwave.fr?subject=Désinscription avis>`,
      },
    });
    if (result.error) {
      console.error("[review-request] Resend error :", result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true };
  } catch (e) {
    const err = e as Error;
    console.error("[review-request] Exception :", err.message);
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
