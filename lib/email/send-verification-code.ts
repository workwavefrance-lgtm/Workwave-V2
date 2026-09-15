import { emailContent, renderEmail, escapeEmail, emailParagraph, emailButton, emailDetails } from "@/lib/email/design";

import { Resend } from "resend";

let _resend: Resend | null = null;
function getResendClient() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export type VerificationOperation = "claim" | "deletion";

export function buildVerificationCodeEmail(
  code: string,
  proName: string,
  operation: VerificationOperation = "claim"
): { subject: string; html: string } {

  const action = operation === "deletion" ? "supprimer" : "réclamer";
  const html = renderEmail({
    title: operation === "deletion" ? "Confirmez votre demande." : "Votre code de vérification.",
    subtitle: "Une étape pour sécuriser l’accès.", category: "Sécurité",
    preheader: operation === "deletion" ? "Code de vérification pour votre demande de suppression." : "Confirmez votre adresse email pour poursuivre le rattachement.",
    body: emailParagraph(`Vous avez demandé à ${action} la fiche ${proName} sur Workwave.`)
      + `<div style="background:#f5f6f7;border-radius:22px;padding:24px 12px;text-align:center;margin:24px 0"><span style="font-family:monospace;font-size:34px;letter-spacing:5px;color:#20282c;font-weight:700">${escapeEmail(code)}</span></div>`
      + emailParagraph("Saisissez ce code dans la page ouverte sur Workwave. Il est valable 15 minutes. Ne le communiquez à personne.")
      + (operation === "claim" ? emailParagraph("Ce code confirme votre adresse email. Le rattachement de la fiche reste soumis à la vérification de votre lien avec l’entreprise.") : "")
      + emailParagraph("Vous n’êtes pas à l’origine de cette demande ? Ignorez cet email."),
  });

  return {
    subject: operation === "deletion" ? "Votre code de suppression de fiche · Workwave" : "Votre code de vérification · Workwave",
    html,
  };
}

export async function sendVerificationCode(
  email: string,
  code: string,
  proName: string,
  operation: VerificationOperation = "claim"
): Promise<void> {
  const message = buildVerificationCodeEmail(code, proName, operation);

  // Le SDK Resend ne LEVE PAS d'exception quand l'envoi est refusé : il renvoie
  // { data: null, error: {...} }. Ignorer ce champ rend un échec d'envoi
  // strictement indiscernable d'un succès : c'est ce qui a fait qu'un pro n'a
  // jamais reçu son code (Fabien, 14/06) sans la moindre trace côté serveur,
  // et qu'on a cherché la panne du mauvais côté pendant des heures.
  // On remonte donc l'erreur à l'appelant, qui la trace dans claim_attempts
  // (`error_reason`) et peut afficher un vrai message à l'utilisateur.
  const { error } = await getResendClient().emails.send({
    from: "Workwave <contact@workwave.fr>",
    to: email,
    subject: message.subject,
    ...emailContent(message.html),
  });

  if (error) {
    console.error("[sendVerificationCode] Resend a refusé l'envoi:", error);
    throw new Error(`resend_send_failed: ${error.message || error.name}`);
  }
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

  const html = renderEmail({ title: "Un rattachement à vérifier.", subtitle: "La fiche est déjà gérée.", category: "Administration",
body: emailParagraph("Une demande concerne une fiche déjà rattachée à un compte. Vérifiez le contexte avant toute intervention.")
 + emailDetails([["Fiche", proName], ["Slug", proSlug], ["Email saisi", attemptEmail], ["SIRET saisi", attemptSiret], ["IP", ip]])
 + emailButton("Examiner les rattachements", "https://workwave.fr/admin/reclamations") });

  try {
    await getResendClient().emails.send({
      from: "Workwave <contact@workwave.fr>",
      to: adminEmail,
      subject: `[Workwave Alert] Tentative de réclamation sur fiche déjà réclamée · ${proName}`,
      ...emailContent(html),
    });
  } catch (error) {
    console.error("Erreur envoi alerte admin :", error);
  }
}

// ============================================
// Notification admin : nouvelle reclamation reussie
// ============================================
export async function sendClaimSuccessAlert(params: {
  proId: number;
  proName: string;
  proSlug: string;
  proSiret: string | null;
  proCity?: string | null;
  proCategory?: string | null;
  claimEmail: string;
  ip?: string;
}): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const dashboardUrl = `https://workwave.fr/admin/pros/${params.proId}`;
  const publicUrl = `https://workwave.fr/artisan/${params.proSlug}`;

  const html = renderEmail({ title: "Une fiche rattachée.", subtitle: "Un professionnel peut démarrer.", category: "Administration",
body: emailDetails([["Fiche", params.proName], ["Email", params.claimEmail], ["Ville", params.proCity || "Non renseignée"], ["Métier", params.proCategory || "Non renseigné"], ["SIRET", params.proSiret || "Non renseigné"]])
 + emailButton("Ouvrir dans l’administration", dashboardUrl)
 + `<p style="font-size:14px;line-height:1.7"><a style="color:#a63e18" href="${escapeEmail(publicUrl)}">Consulter la fiche publique</a></p>` });

  try {
    await getResendClient().emails.send({
      from: "Workwave <contact@workwave.fr>",
      to: adminEmail,
      subject: `[Workwave] Nouvelle fiche réclamée · ${params.proName}`,
      ...emailContent(html),
    });
  } catch (error) {
    console.error("Erreur envoi notif claim success :", error);
  }
}
