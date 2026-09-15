import { emailContent, renderEmail, emailParagraph, emailButton } from "@/lib/email/design";

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
  const html = renderEmail({
    title: "Un nouveau mot de passe.", subtitle: "Un accès qui reste le vôtre.", category: "Sécurité",
    body: emailParagraph("Vous avez demandé à réinitialiser votre mot de passe Workwave.")
      + emailButton("Choisir mon mot de passe", resetUrl)
      + emailParagraph("Ce lien est valable 15 minutes. Si vous n’avez pas fait cette demande, ignorez cet email : votre mot de passe reste inchangé."),
  });

  await getResendClient().emails.send({
    from: "Workwave <contact@workwave.fr>",
    to: email,
    subject: "Réinitialisation de votre mot de passe · Workwave",
    ...emailContent(html),
  });
}
