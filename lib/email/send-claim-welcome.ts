import { Resend } from "resend";
import { buildGoogleReviewBlock } from "./google-review-block";
import type { AvailableProjectsResult } from "@/lib/queries/available-projects";
import { FREE_UNLOCK_COUNT } from "@/lib/billing/free-unlocks";

// Plafond d'affichage aligné sur PROJECTS_LIMIT du dashboard /pro/dashboard/leads
// (le pro n'y voit que 50 projets à la fois) → on ne sur-promet pas dans le mail.
const DISPLAY_CAP = 50;

/**
 * Bloc "X projets vous attendent déjà" — dynamique, affiché seulement si le pro
 * a des projets disponibles dans sa zone au moment du claim. Fond noir + coral
 * pour ressortir. ZÉRO PII : uniquement des champs structurés (métier · ville ·
 * distance · délai) — jamais de texte libre / résumé (risque de fuite avant
 * paiement, un résumé IA étant dérivé de la description brute du client).
 */
export function buildAvailableProjectsBlock(
  baseUrl: string,
  data: AvailableProjectsResult
): string {
  if (!data || data.count <= 0 || data.top.length === 0) return "";

  const capped = data.count > DISPLAY_CAP;
  const shownCount = capped ? `${DISPLAY_CAP}+` : `${data.count}`;
  const plural = data.count > 1;
  const heading = `${shownCount} projet${plural ? "s" : ""} vous attend${plural ? "ent" : ""} déjà dans votre zone`;

  const items = data.top
    .map((p) => {
      const dist = p.distanceKm != null ? ` · à ${p.distanceKm} km` : "";
      return `
        <div style="background:#1A1A1A;border-radius:10px;padding:13px 15px;margin-bottom:8px;">
          <p style="margin:0;font-size:14px;color:#FFFFFF;font-weight:600;line-height:1.35;">
            ${p.metier}${p.city ? ` · ${p.city}` : ""}${dist}
          </p>
          ${p.urgencyLabel ? `<p style="margin:3px 0 0;font-size:12px;color:#9CA3AF;line-height:1.4;">Délai : ${p.urgencyLabel}</p>` : ""}
        </div>`;
    })
    .join("");

  const rest = data.count - data.top.length;
  const others =
    rest > 0
      ? `<p style="margin:2px 0 0;font-size:12px;color:#9CA3AF;text-align:center;">… et ${capped ? "bien d'autres" : `${rest} autre${rest > 1 ? "s" : ""}`}.</p>`
      : "";

  const offer =
    FREE_UNLOCK_COUNT <= 1
      ? "Votre premier déblocage est offert."
      : `Vos ${FREE_UNLOCK_COUNT} premiers déblocages sont offerts.`;

  return `
      <!-- Projets déjà disponibles (dynamique) -->
      <div style="background:#0A0A0A;border-radius:14px;padding:22px 22px 20px;margin:24px 0;">
        <p style="margin:0 0 4px;font-size:12px;color:#FF8A6B;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Bonne nouvelle</p>
        <p style="margin:0 0 16px;font-size:19px;color:#FFFFFF;font-weight:700;line-height:1.3;">
          ${heading}
        </p>
        ${items}
        ${others}
        <div style="text-align:center;margin-top:18px;">
          <a href="${baseUrl}/pro/dashboard/leads"
             style="display:inline-block;background:#FF5A36;color:#FFFFFF;text-decoration:none;padding:12px 30px;border-radius:9999px;font-size:14px;font-weight:600;letter-spacing:-0.01em;">
            Voir les projets &rarr;
          </a>
        </div>
        <p style="margin:14px 0 0;font-size:12px;color:#9CA3AF;text-align:center;line-height:1.5;">
          🎁 ${offer}
        </p>
      </div>`;
}

let _resend: Resend | null = null;
function getResendClient() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

/**
 * Mail de bienvenue envoye au pro BTP juste apres qu'il ait valide son code
 * de verification.
 *
 * Modele Sprint 13 : pay-per-lead 9,90 EUR par lead debloque, fiche gratuite
 * a vie. PLUS d'essai 14j / PLUS de CB obligatoire. Le pro recoit les projets
 * de sa zone par email, et il paie 9,90 EUR uniquement quand il veut voir les
 * coordonnees du client (debloquer le lead).
 *
 * Vouvoiement strict. Design coherent avec les autres mails Workwave
 * (header colore, card blanche, table clean, CTA coral arrondis).
 */
export async function sendClaimWelcomeEmail(params: {
  email: string;
  proName: string;
  availableProjects?: AvailableProjectsResult;
}): Promise<void> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr"
  ).replace(/\s+/g, "");

  const availableBlock = params.availableProjects
    ? buildAvailableProjectsBlock(baseUrl, params.availableProjects)
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

    <!-- Header coral celebratoire -->
    <div style="background:linear-gradient(135deg,#FF5A36 0%,#E63E1A 100%);padding:36px 32px;text-align:center;">
      <p style="margin:0 0 8px;font-size:13px;color:#FFE5DD;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Workwave Pro</p>
      <h1 style="margin:0;color:#FFFFFF;font-size:26px;font-weight:700;letter-spacing:-0.02em;line-height:1.2;">
        Bienvenue, votre fiche est à vous
      </h1>
    </div>

    <!-- Body -->
    <div style="padding:36px 32px 8px;">
      <p style="margin:0 0 18px;font-size:16px;color:#0A0A0A;line-height:1.6;">
        Bonjour,
      </p>
      <p style="margin:0 0 18px;font-size:15px;color:#374151;line-height:1.7;">
        Vous venez de réclamer la fiche <strong style="color:#0A0A0A;">${params.proName}</strong> sur Workwave.
        Votre fiche est désormais à vous, <strong>gratuite à vie</strong>, sans engagement et sans carte bancaire.
      </p>
${availableBlock}
      <!-- Card modele pay-per-lead -->
      <div style="background:#FFF5F2;border:1px solid #FFD4C7;border-radius:12px;padding:20px;margin:24px 0;">
        <p style="margin:0 0 6px;font-size:12px;color:#FF5A36;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Fonctionnement</p>
        <p style="margin:0 0 12px;font-size:15px;color:#0A0A0A;line-height:1.5;font-weight:600;">
          Vous ne payez que les leads qui vous intéressent.
        </p>
        <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.6;">
          Recevez gratuitement par email les projets de votre zone. Quand un projet vous plaît, débloquez les coordonnées du client pour <strong style="color:#0A0A0A;">9,90&nbsp;€</strong>. Pas d'abonnement, pas de surprise.
        </p>
      </div>

      <!-- CTA principal -->
      <div style="text-align:center;margin:32px 0 12px;">
        <a href="${baseUrl}/pro/dashboard"
           style="display:inline-block;background:#FF5A36;color:#FFFFFF;text-decoration:none;padding:14px 32px;border-radius:9999px;font-size:15px;font-weight:600;letter-spacing:-0.01em;">
          Accéder à mon dashboard
        </a>
      </div>
      <p style="margin:0 0 32px;font-size:13px;color:#9CA3AF;text-align:center;line-height:1.5;">
        Vous êtes déjà connecté, le lien vous emmène directement sur votre espace.
      </p>
    </div>

    <!-- Section "Comment ca marche ?" : 5 etapes pedagogiques pour que le pro
         comprenne tout le flow d'un coup. Identique a la section affichee sur
         le dashboard pour coherence. -->
    <div style="padding:8px 32px 8px;">
      <p style="margin:0 0 18px;font-size:13px;color:#6B7280;text-transform:uppercase;letter-spacing:1.2px;font-weight:600;text-align:center;">
        Comment ça marche ?
      </p>

      <table style="width:100%;border-collapse:separate;border-spacing:0 10px;font-size:14px;">
        <tr>
          <td style="background:#FAFAFA;border:1px solid #E5E7EB;border-radius:12px;padding:16px 18px;vertical-align:top;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="width:28px;vertical-align:top;padding-right:12px;">
                  <div style="width:24px;height:24px;border-radius:50%;background:#FF5A36;color:#FFFFFF;font-size:12px;font-weight:700;text-align:center;line-height:24px;">1</div>
                </td>
                <td>
                  <p style="margin:0;font-size:14px;color:#0A0A0A;line-height:1.55;">
                    <strong>Réclamez votre fiche gratuitement</strong> en vérifiant votre SIRET. Inscription en 2&nbsp;min.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#FAFAFA;border:1px solid #E5E7EB;border-radius:12px;padding:16px 18px;vertical-align:top;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="width:28px;vertical-align:top;padding-right:12px;">
                  <div style="width:24px;height:24px;border-radius:50%;background:#FF5A36;color:#FFFFFF;font-size:12px;font-weight:700;text-align:center;line-height:24px;">2</div>
                </td>
                <td>
                  <p style="margin:0;font-size:14px;color:#0A0A0A;line-height:1.55;">
                    <strong>Recevez automatiquement tous les projets</strong> de votre catégorie et département (par email + dashboard).
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#FAFAFA;border:1px solid #E5E7EB;border-radius:12px;padding:16px 18px;vertical-align:top;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="width:28px;vertical-align:top;padding-right:12px;">
                  <div style="width:24px;height:24px;border-radius:50%;background:#FF5A36;color:#FFFFFF;font-size:12px;font-weight:700;text-align:center;line-height:24px;">3</div>
                </td>
                <td>
                  <p style="margin:0;font-size:14px;color:#0A0A0A;line-height:1.55;">
                    <strong>Choisissez les projets qui vous intéressent</strong> en lisant la description, le budget et le délai.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#FAFAFA;border:1px solid #E5E7EB;border-radius:12px;padding:16px 18px;vertical-align:top;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="width:28px;vertical-align:top;padding-right:12px;">
                  <div style="width:24px;height:24px;border-radius:50%;background:#FF5A36;color:#FFFFFF;font-size:12px;font-weight:700;text-align:center;line-height:24px;">4</div>
                </td>
                <td>
                  <p style="margin:0;font-size:14px;color:#0A0A0A;line-height:1.55;">
                    <strong>Débloquez les coordonnées pour 9,90&nbsp;€ TTC</strong> quand vous voulez répondre. Paiement unique par projet.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#FAFAFA;border:1px solid #E5E7EB;border-radius:12px;padding:16px 18px;vertical-align:top;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="width:28px;vertical-align:top;padding-right:12px;">
                  <div style="width:24px;height:24px;border-radius:50%;background:#FF5A36;color:#FFFFFF;font-size:12px;font-weight:700;text-align:center;line-height:24px;">5</div>
                </td>
                <td>
                  <p style="margin:0;font-size:14px;color:#0A0A0A;line-height:1.55;">
                    <strong>Contactez le client en direct.</strong> Devis, contrat, paiement&nbsp;: 100&nbsp;% entre vous et le client. Workwave ne prend aucune commission.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>

    <!-- Signature -->
    <div style="padding:32px;">
${buildGoogleReviewBlock({ audience: "pro" })}
      <p style="margin:0 0 8px;font-size:14px;color:#374151;line-height:1.6;">
        Si vous avez la moindre question, répondez simplement à cet email.
      </p>
      <p style="margin:0;font-size:14px;color:#6B7280;line-height:1.6;">
        À bientôt,<br/>
        <span style="color:#0A0A0A;font-weight:500;">L'équipe Workwave</span>
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:18px 32px;background:#FAFAFA;border-top:1px solid #E5E7EB;text-align:center;">
      <p style="margin:0 0 4px;color:#9CA3AF;font-size:12px;line-height:1.6;">
        Workwave — Annuaire gratuit des professionnels en France
      </p>
      <p style="margin:0;color:#9CA3AF;font-size:11px;line-height:1.6;">
        Vous recevez cet email parce que vous venez de réclamer une fiche pro sur Workwave.
      </p>
    </div>

  </div>
</body>
</html>`;

  await getResendClient().emails.send({
    from: "Workwave <contact@workwave.fr>",
    to: params.email,
    subject: `Bienvenue sur Workwave Pro — votre fiche ${params.proName} est active`,
    html,
  });
}
