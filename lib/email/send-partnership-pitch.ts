import { Resend } from "resend";
import type { Partnership } from "@/lib/types/database";
import { defaultTemplateForType, PARTNERSHIP_TEMPLATES } from "@/lib/email/partnerships-templates";

let _resend: Resend | null = null;
function getResendClient() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

/**
 * Envoie un pitch de partenariat. Template selectionne :
 *   - templateKey explicite si fourni
 *   - Sinon : defaultTemplateForType(partnership.type)
 *
 * Sender : Workwave <contact@workwave.fr> (domaine verifie Resend).
 * Pas de header tracking : ces emails sont B2B perso, pas du blast.
 *
 * Retourne ok:true si envoi reussi. L'appelant (Server Action) doit
 * mettre a jour les compteurs (last_contacted_at, emails_sent_count,
 * status='contacted') en base.
 */
export async function sendPartnershipPitch(params: {
  partnership: Partnership;
  templateKey?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const template = params.templateKey
    ? PARTNERSHIP_TEMPLATES[params.templateKey] ??
      defaultTemplateForType(params.partnership.type)
    : defaultTemplateForType(params.partnership.type);

  const subject = template.subject(params.partnership);
  const html = template.html(params.partnership);
  const text = template.text(params.partnership);

  try {
    const result = await getResendClient().emails.send({
      from: "Workwave <contact@workwave.fr>",
      to: params.partnership.contact_email,
      // Reply-to vers contact (au cas où la personne réponde, ça
      // tombe bien dans la boîte commune)
      replyTo: "contact@workwave.fr",
      subject,
      html,
      text,
    });
    if (result.error) {
      console.error(
        "[partnership-pitch] Resend error :",
        result.error
      );
      return { ok: false, error: result.error.message };
    }
    return { ok: true };
  } catch (e) {
    const err = e as Error;
    console.error("[partnership-pitch] Exception :", err.message);
    return { ok: false, error: err.message };
  }
}
