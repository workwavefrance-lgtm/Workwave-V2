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
 * Permet de suivre en temps réel les nouveaux pros qui consomment l'offre —
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
  const e = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const last = params.freeUsed >= params.freeTotal;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;">
    <div style="background:#0A0A0A;padding:20px 28px;">
      <h1 style="margin:0;color:#fff;font-size:17px;font-weight:700;">🎁 Lead OFFERT utilisé (${params.freeUsed}/${params.freeTotal})</h1>
    </div>
    <div style="padding:28px;">
      <p style="margin:0 0 8px;font-size:14px;color:#0A0A0A;"><strong>${e(params.proName)}</strong> (pro #${params.proId}, ${params.vertical.toUpperCase()}) vient de débloquer gratuitement le projet <strong>#${params.projectId}</strong>.</p>
      ${
        last
          ? `<div style="background:#FFF7ED;border-left:3px solid #FF5A36;border-radius:8px;padding:14px 16px;margin:14px 0;">
      <p style="margin:0;font-size:14px;color:#0A0A0A;line-height:1.6;"><strong>Offre consommée</strong> — le prochain déblocage de ce pro sera payant (9,90&nbsp;€). Bon moment pour une relance / demande de retour d'expérience.</p>
    </div>`
          : `<p style="margin:0;font-size:13px;color:#6B7280;">Il lui reste ${params.freeTotal - params.freeUsed} déblocage(s) offert(s).</p>`
      }
      <p style="margin:16px 0 0;font-size:12px;color:#6B7280;">Suivi complet : <code>npx tsx scripts/_suivi-leads-offerts.ts</code> ou admin → Projets #${params.projectId}.</p>
    </div>
  </div>
</body></html>`;

  await getResendClient().emails.send({
    from: "Workwave <contact@workwave.fr>",
    to: adminEmail,
    subject: `🎁 Lead offert ${params.freeUsed}/${params.freeTotal} — ${params.proName} → projet #${params.projectId}`,
    html,
  });
}
