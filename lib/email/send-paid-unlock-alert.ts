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
 * C'est l'événement business le plus important — du vrai revenu. Symétrique de
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
  const e = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const amount = (params.amountCents / 100).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
  });
  const ctx = [params.category, params.city].filter(Boolean).map((x) => e(String(x))).join(" · ");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;">
    <div style="background:#0A0A0A;padding:20px 28px;">
      <h1 style="margin:0;color:#fff;font-size:17px;font-weight:700;">💶 Contact PAYÉ — ${amount}&nbsp;€</h1>
    </div>
    <div style="padding:28px;">
      <p style="margin:0 0 8px;font-size:14px;color:#0A0A0A;line-height:1.6;"><strong>${e(params.proName)}</strong> (pro #${params.proId}) vient de débloquer le projet <strong>#${params.projectId}</strong> pour <strong>${amount}&nbsp;€</strong>.</p>
      ${ctx ? `<p style="margin:0 0 8px;font-size:13px;color:#6B7280;">${ctx}</p>` : ""}
      <div style="background:#ECFDF5;border-left:3px solid #10B981;border-radius:8px;padding:14px 16px;margin:14px 0;">
        <p style="margin:0;font-size:14px;color:#0A0A0A;line-height:1.6;"><strong>Premier vrai revenu de la journée ?</strong> C'est un pro convaincu — bon candidat pour un retour d'expérience / témoignage.</p>
      </div>
      <p style="margin:16px 0 0;font-size:12px;color:#6B7280;">Détail : admin → Projets #${params.projectId}. Paiement complet dans le dashboard Stripe.</p>
    </div>
  </div>
</body></html>`;

  await getResendClient().emails.send({
    from: "Workwave <contact@workwave.fr>",
    to: adminEmail,
    subject: `💶 Contact payé ${amount} € — ${params.proName} → projet #${params.projectId}`,
    html,
  });
}
