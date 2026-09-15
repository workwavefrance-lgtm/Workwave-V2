import { emailContent, renderEmail, emailParagraph, emailButton, emailDetails } from "@/lib/email/design";

import { Resend } from "resend";

let _resend: Resend | null = null;
function getResendClient() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

/**
 * Alerte admin à chaque déblocage de lead OFFERT (offre "2 premiers leads offerts").
 * Permet de suivre en temps réel les nouveaux pros qui consomment l'offre :
 * ce sont les meilleurs candidats à la conversion payante (relance possible
 * quand freeUsed === freeTotal).
 */
export async function sendFreeUnlockAlert(params: {
  proId: number;
  proName: string;
  projectId: number;
  vertical: "btp" | "tech";
  freeUsed: number;
  freeTotal: number;
}): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || "workwave.france@gmail.com";

  const last = params.freeUsed >= params.freeTotal;

  const html = renderEmail({ title: "Un contact débloqué.", subtitle: "Avec une offre découverte.", category: "Administration",
body: emailDetails([["Professionnel", params.proName], ["Référence pro", params.proId], ["Projet", params.projectId], ["Univers", params.vertical], ["Offre utilisée", `${params.freeUsed} / ${params.freeTotal}`]])
 + emailParagraph(last ? "Les déblocages offerts de ce compte ont été utilisés." : `Il reste ${params.freeTotal - params.freeUsed} déblocage(s) offert(s).`)
 + emailButton("Consulter les projets", "https://workwave.fr/admin/projects") });

  await getResendClient().emails.send({
    from: "Workwave <contact@workwave.fr>",
    to: adminEmail,
    subject: `🎁 Lead offert ${params.freeUsed}/${params.freeTotal} · ${params.proName} → projet #${params.projectId}`,
    ...emailContent(html),
  });
}
