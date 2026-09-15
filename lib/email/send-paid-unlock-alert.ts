import { emailContent, renderEmail, emailButton, emailDetails } from "@/lib/email/design";

import { Resend } from "resend";

let _resend: Resend | null = null;
function getResendClient() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

/**
 * Alerte admin à chaque déblocage de lead PAYÉ (9,90 € one-time via Stripe).
 * C'est l'événement business le plus important : du vrai revenu. Symétrique de
 * sendFreeUnlockAlert (leçon 28/04 : tout événement business critique notifie
 * l'admin dans le même flux). Stripe notifie déjà le paiement côté marchand ;
 * ici on donne le CONTEXTE métier (quel pro, quel projet) directement en boîte.
 */
export async function sendPaidUnlockAlert(params: {
  proId: number;
  proName: string;
  projectId: number;
  amountCents: number;
  city?: string | null;
  category?: string | null;
}): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || "workwave.france@gmail.com";

  const amount = (params.amountCents / 100).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
  });

  const html = renderEmail({ title: "Un contact débloqué.", subtitle: "Un paiement enregistré.", category: "Administration",
body: emailDetails([["Professionnel", params.proName], ["Référence pro", params.proId], ["Projet", params.projectId], ["Montant", `${amount} €`], ["Contexte", [params.category, params.city].filter(Boolean).join(" · ")]])
 + emailButton("Consulter les projets", "https://workwave.fr/admin/projects") });

  await getResendClient().emails.send({
    from: "Workwave <contact@workwave.fr>",
    to: adminEmail,
    subject: `💶 Contact payé ${amount} € · ${params.proName} → projet #${params.projectId}`,
    ...emailContent(html),
  });
}
