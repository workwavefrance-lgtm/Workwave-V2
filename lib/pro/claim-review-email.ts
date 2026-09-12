import { Resend } from "resend";

export async function notifyClaimPending(params: { requestId: number; slug: string; email: string }) {
  if (!process.env.ADMIN_EMAIL) return;
  try {
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: "Workwave <contact@workwave.fr>", to: process.env.ADMIN_EMAIL,
      subject: "Une demande de rattachement attend votre vérification · Workwave",
      text: `Demande n°${params.requestId}\nFiche : ${params.slug}\nEmail vérifié : ${params.email}\n\nVérifiez le lien du demandeur avec l'entreprise avant d'autoriser l'accès. Le SIRET public et le code email ne constituent pas cette preuve.\n\nhttps://workwave.fr/admin/reclamations`,
    }, { idempotencyKey: `claim-pending-${params.requestId}` });
    if (error) console.error("[claim] pending notification failed", error.name);
  } catch { console.error("[claim] pending notification unavailable"); }
}
