import { emailContent, renderEmail, escapeEmail, emailParagraph, emailButton } from "@/lib/email/design";

import { Resend } from "resend";
import { buildGoogleReviewBlock } from "./google-review-block";
import type { AvailableProjectsResult } from "@/lib/queries/available-projects";
const UNLOCK_PRICE_EUR_TTC = "9,90";

// Plafond d'affichage aligné sur PROJECTS_LIMIT du dashboard /pro/dashboard/leads
// (le pro n'y voit que 50 projets à la fois) → on ne sur-promet pas dans le mail.
const DISPLAY_CAP = 50;

/**
 * Bloc "X projets vous attendent déjà", dynamique, affiché seulement si le pro
 * a des projets disponibles dans sa zone au moment du claim. Fond noir + coral
 * pour ressortir. ZÉRO PII : uniquement des champs structurés (métier · ville ·
 * distance · délai), jamais de texte libre / résumé (risque de fuite avant
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
        <div style="background:#f5f6f7;border-radius:10px;padding:13px 15px;margin-bottom:8px;">
          <p style="margin:0;font-size:14px;color:#20282c;font-weight:600;line-height:1.35;">
            ${escapeEmail(p.metier)}${p.city ? ` · ${escapeEmail(p.city)}` : ""}${escapeEmail(dist)}
          </p>
          ${p.urgencyLabel ? `<p style="margin:3px 0 0;font-size:12px;color:#66727c;line-height:1.4;">Délai : ${escapeEmail(p.urgencyLabel)}</p>` : ""}
        </div>`;
    })
    .join("");

  const rest = data.count - data.top.length;
  const others =
    rest > 0
      ? `<p style="margin:2px 0 0;font-size:12px;color:#66727c;text-align:center;">… et ${capped ? "bien d'autres" : `${escapeEmail(rest)} autre${rest > 1 ? "s" : ""}`}.</p>`
      : "";

  return `
      <!-- Projets déjà disponibles (dynamique) -->
      <div style="background:#f5f6f7;border-radius:14px;padding:22px 22px 20px;margin:24px 0;">
        <p style="margin:0 0 4px;font-size:12px;color:#a63e18;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Bonne nouvelle</p>
        <p style="margin:0 0 16px;font-size:19px;color:#20282c;font-weight:700;line-height:1.3;">
          ${escapeEmail(heading)}
        </p>
        ${items}
        ${others}
        <div style="text-align:center;margin-top:18px;">
          <a href="${escapeEmail(baseUrl)}/pro/dashboard/leads"
             style="display:inline-block;background:#c64b1c;color:#FFFFFF;text-decoration:none;padding:12px 30px;border-radius:9999px;font-size:14px;font-weight:600;letter-spacing:-0.01em;">
            Voir les projets &rarr;
          </a>
        </div>
        <p style="margin:14px 0 0;font-size:12px;color:#66727c;text-align:center;line-height:1.5;">
          Consultez vos déblocages offerts disponibles dans votre espace.
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
 * Mail de bienvenue envoyé après approbation du rattachement par l’administration.
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

  const html = renderEmail({
    title: "Votre fiche est validée.", subtitle: "Faites-la vivre.", category: "Professionnels",
    preheader: `Votre fiche ${params.proName} est rattachée à votre compte. Ajoutez vos réalisations et vos informations.`,
    body: emailParagraph(`Bonjour, votre fiche ${params.proName} est maintenant rattachée à votre compte Workwave.`)
      + emailParagraph("Ajoutez vos photos de réalisations, présentez votre activité et vérifiez vos coordonnées pour aider les particuliers à vous connaître.")
      + emailButton("Compléter ma fiche", `${baseUrl}/pro/dashboard/fiche`)
      + emailParagraph("Votre fiche est gratuite. Si une connexion vous est demandée, utilisez l’adresse email de votre compte.")
      + availableBlock
      + emailParagraph(`Vous choisissez les projets qui vous intéressent. Le déblocage des coordonnées coûte ${UNLOCK_PRICE_EUR_TTC} € TTC par projet, hors déblocages offerts disponibles sur votre compte. Sans abonnement ni commission sur vos prestations.`)
      + emailParagraph("Une question pour démarrer ? Répondez simplement à cet email.")
      + buildGoogleReviewBlock({ audience: "pro" }),
  });

  const { error } = await getResendClient().emails.send({
    from: "Workwave <contact@workwave.fr>",
    to: params.email,
    subject: `Votre fiche ${params.proName} est validée · Bienvenue sur Workwave`,
    ...emailContent(html),
  });
  if (error) throw new Error(`claim_welcome_send_failed: ${error.message}`);
}
