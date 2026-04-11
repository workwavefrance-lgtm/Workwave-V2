import { Resend } from "resend";

let _resend: Resend | null = null;
function getResendClient() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#0A0A0A;padding:24px 32px;">
      <h1 style="margin:0;color:#FFFFFF;font-size:20px;font-weight:700;letter-spacing:-0.02em;">Workwave</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;font-size:16px;color:#0A0A0A;line-height:1.6;">
        Bonjour,
      </p>
      <p style="margin:0 0 24px;font-size:16px;color:#0A0A0A;line-height:1.6;">
        Vous avez demandé à réinitialiser votre mot de passe sur Workwave.
        Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :
      </p>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${resetUrl}" style="display:inline-block;background:#FF5A36;color:#FFFFFF;text-decoration:none;padding:14px 32px;border-radius:9999px;font-size:15px;font-weight:600;">
          Réinitialiser mon mot de passe
        </a>
      </div>
      <p style="margin:0 0 8px;font-size:14px;color:#6B7280;line-height:1.6;">
        Ce lien est valable <strong>15 minutes</strong>.
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#6B7280;line-height:1.6;">
        Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
      </p>
      <p style="margin:0;font-size:14px;color:#6B7280;line-height:1.6;">
        À bientôt,<br>
        <span style="color:#0A0A0A;font-weight:500;">L'équipe Workwave</span>
      </p>
    </div>
    <div style="padding:16px 32px;background:#FAFAFA;border-top:1px solid #E5E7EB;text-align:center;">
      <p style="margin:0;color:#9CA3AF;font-size:12px;">Workwave — Trouvez un professionnel de confiance près de chez vous</p>
    </div>
  </div>
</body>
</html>`;

  await getResendClient().emails.send({
    from: "Workwave <contact@workwave.fr>",
    to: email,
    subject: "Réinitialisation de votre mot de passe — Workwave",
    html,
  });
}
