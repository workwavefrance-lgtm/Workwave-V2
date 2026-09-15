import { emailContent, renderEmail } from "@/lib/email/design";

import { Resend } from "resend";

let _resend: Resend | null = null;
function getResendClient() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const CATEGORY_LABELS: Record<string, string> = {
  amelioration: "Idée d'amélioration",
  bug: "Problème signalé",
  autre: "Autre retour",
};

/**
 * Alerte admin à chaque feedback plateforme recueilli par l'agent SAV.
 * C'est le CHEMIN CRITIQUE du flow (la table platform_feedback n'est que
 * l'archive) : toujours await côté appelant (leçon 24/05 : pas de promise
 * détachée en Server Action / API route).
 */
export async function sendFeedbackAlert(params: {
  category: string;
  summary: string;
  userKind: string;
  email: string | null;
  transcript: { role: string; content: string }[];
}): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || "workwave.france@gmail.com";
  const label = CATEGORY_LABELS[params.category] || params.category;
  const e = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const transcriptHtml = params.transcript
    .map(
      (m) =>
        `<p style="margin:0 0 8px;font-size:13px;line-height:1.5;"><strong style="color:${m.role === "user" ? "#c64b1c" : "#53606a"};">${m.role === "user" ? "Utilisateur" : "Agent"}&nbsp;:</strong> ${e(m.content)}</p>`
    )
    .join("");

  const html = renderEmail({ title: "Un retour à écouter.", subtitle: "Une piste pour progresser.", category: "Administration", body: `

      <p style="margin:0 0 6px;font-size:13px;color:#53606a;">Profil : <strong style="color:#20282c;">${e(params.userKind)}</strong>${params.email ? ` · ${e(params.email)}` : " · email non communiqué"}</p>
      <div style="background:#f5f6f7;border-left:3px solid #c64b1c;border-radius:22px;padding:14px 16px;margin:14px 0 20px;">
        <p style="margin:0;font-size:14px;color:#20282c;line-height:1.6;">${e(params.summary)}</p>
      </div>
      <p style="margin:0 0 10px;font-size:12px;color:#53606a;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Conversation complète</p>
      ${transcriptHtml}

  ` });

  await getResendClient().emails.send({
    from: "Workwave <contact@workwave.fr>",
    to: adminEmail,
    subject: `[Feedback] ${label} · ${params.summary.slice(0, 80)}`,
    ...emailContent(html),
  });
}
