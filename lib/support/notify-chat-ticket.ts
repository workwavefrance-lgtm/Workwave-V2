/**
 * Alerte l'admin qu'un ticket vient d'être ouvert depuis le chat.
 *
 * Volontairement SÉPARÉ du forward de la route email : celui-ci retransmet un
 * vrai email (HTML d'origine, pièces jointes), celui-là résume une
 * conversation. Les fusionner obligerait à un module qui gère deux formes très
 * différentes, pour refactorer du code de production qui fonctionne — mauvais
 * échange.
 *
 * Le `replyTo` pointe sur le visiteur : l'admin peut répondre directement
 * depuis sa boîte, et sa réponse part au bon endroit.
 */
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type ChatTicketAlert = {
  ticketId: number;
  subject: string;
  resume: string;
  requesterEmail: string;
  requesterName?: string | null;
  pathname?: string | null;
};

/**
 * Envoie l'alerte et TRACE le résultat en base.
 *
 * Retourne true si l'admin a bien été prévenu. L'appelant ne doit jamais dire
 * au visiteur « c'est transmis » sur la seule foi de l'écriture en base : si
 * l'email ne part pas, la demande dort dans une file que personne ne regarde.
 */
export async function notifyAdminOfChatTicket(
  alert: ChatTicketAlert
): Promise<boolean> {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const trace = async (error: string | null) => {
    await sb
      .from("support_tickets")
      .update(
        error
          ? { admin_notification_error: error.slice(0, 500) }
          : { admin_notified_at: new Date().toISOString(), admin_notification_error: null }
      )
      .eq("id", alert.ticketId);
  };

  const adminEmail = process.env.ADMIN_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;
  if (!adminEmail || !apiKey) {
    await trace("ADMIN_EMAIL ou RESEND_API_KEY manquant");
    return false;
  }

  const base = (process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr").replace(/\s+/g, "");
  const url = `${base}/admin/support/${alert.ticketId}`;
  const who = alert.requesterName
    ? `${alert.requesterName} <${alert.requesterEmail}>`
    : alert.requesterEmail;

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0A0A0A;line-height:1.6">
      <div style="background:#FAFAFA;border:1px solid #E5E7EB;border-radius:12px;padding:14px 18px;margin-bottom:18px;font-size:13px;color:#374151">
        <div style="font-weight:700;color:#0A0A0A;margin-bottom:6px">Nouveau ticket depuis le chat</div>
        <b>De :</b> ${esc(who)}<br>
        <b>Objet :</b> ${esc(alert.subject)}<br>
        ${alert.pathname ? `<b>Page :</b> ${esc(alert.pathname)}<br>` : ""}
        <span style="color:#6B7280">Réponds directement à cet email : ta réponse part vers le visiteur.</span>
      </div>
      <pre style="white-space:pre-wrap;font-family:inherit;font-size:14px">${esc(alert.resume)}</pre>
      <p style="margin-top:22px">
        <a href="${url}" style="background:#FF5A36;color:#fff;text-decoration:none;padding:11px 20px;border-radius:12px;font-weight:600;display:inline-block">Ouvrir le ticket</a>
      </p>
    </div>`;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "Workwave Inbox <noreply@workwave.fr>",
      to: adminEmail,
      replyTo: alert.requesterEmail,
      subject: `[Chat] ${alert.subject}`,
      html,
      text: `Nouveau ticket depuis le chat\nDe : ${who}\nObjet : ${alert.subject}\n\n${alert.resume}\n\n${url}`,
    });
    if (error) {
      await trace(error.message || "erreur Resend inconnue");
      return false;
    }
    await trace(null);
    return true;
  } catch (e) {
    await trace((e as Error).message || "exception lors de l'envoi");
    return false;
  }
}
