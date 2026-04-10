import { Resend } from "resend";

let _resend: Resend | null = null;
function getResendClient() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export async function sendVerificationCode(
  email: string,
  code: string,
  proName: string
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
        Vous avez demandé à réclamer la fiche <strong>${proName}</strong> sur Workwave.
        Voici votre code de vérification :
      </p>
      <div style="background:#FAFAFA;border:1px solid #E5E7EB;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
        <span style="font-family:'Courier New',monospace;font-size:36px;font-weight:700;letter-spacing:8px;color:#0A0A0A;">${code}</span>
      </div>
      <p style="margin:0 0 8px;font-size:14px;color:#6B7280;line-height:1.6;">
        Ce code est valable <strong>15 minutes</strong>.
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
    from: "Workwave <onboarding@resend.dev>",
    to: email,
    subject: "Votre code de vérification — Workwave",
    html,
  });
}

export async function sendClaimAlreadyClaimedAlert(
  proName: string,
  proSlug: string,
  attemptEmail: string,
  attemptSiret: string,
  ip: string
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#991B1B;padding:24px 32px;">
      <h1 style="margin:0;color:#FFFFFF;font-size:18px;font-weight:600;">Alerte — Tentative de réclamation sur fiche déjà réclamée</h1>
    </div>
    <div style="padding:32px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.6;">
        <tr><td style="padding:6px 0;color:#6B7280;width:160px;">Fiche</td><td style="padding:6px 0;color:#0A0A0A;font-weight:500;">${proName}</td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Slug</td><td style="padding:6px 0;color:#0A0A0A;">${proSlug}</td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Email tentative</td><td style="padding:6px 0;color:#0A0A0A;">${attemptEmail}</td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">SIRET saisi</td><td style="padding:6px 0;font-family:'Courier New',monospace;color:#0A0A0A;">${attemptSiret}</td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">IP</td><td style="padding:6px 0;color:#0A0A0A;">${ip}</td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Date</td><td style="padding:6px 0;color:#0A0A0A;">${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}</td></tr>
      </table>
      <p style="margin:24px 0 0;font-size:14px;color:#6B7280;line-height:1.6;">
        Cette fiche est déjà réclamée. Vérifiez dans le dashboard admin si une action est nécessaire.
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    await getResendClient().emails.send({
      from: "Workwave <onboarding@resend.dev>",
      to: adminEmail,
      subject: `[Workwave Alert] Tentative de réclamation sur fiche déjà réclamée — ${proName}`,
      html,
    });
  } catch (error) {
    console.error("Erreur envoi alerte admin :", error);
  }
}
