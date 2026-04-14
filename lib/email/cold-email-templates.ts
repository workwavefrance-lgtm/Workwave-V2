import type { SubjectVariant } from "@/lib/types/database";
import {
  generateUnsubscribeToken,
  generateGlobalUnsubscribeToken,
} from "@/lib/utils/unsubscribe-token";

type ProEmailData = {
  proId: number;
  proName: string;
  proEmail: string;
  prenomDirigeant: string | null;
  cityName: string;
  slug: string;
};

type EmailTemplate = {
  subject: string;
  html: string;
};

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";
const FOUNDER_PHONE =
  process.env.WORKWAVE_FOUNDER_PHONE || "+33XXXXXXXXX";

// ============================================
// Sujets A/B pour l'email 1
// ============================================

function getStep1Subject(
  variant: SubjectVariant,
  data: ProEmailData
): string {
  switch (variant) {
    case "a":
      return `${data.proName}, votre fiche Workwave est prête`;
    case "b":
      return `Willy de Workwave - votre fiche ${data.cityName}`;
    case "c":
      return `${data.proName} référencé sur Workwave (Vienne 86)`;
    case "d":
      return "Petite question d'un entrepreneur de Craon";
    case "e":
      return `Vos clients de ${data.cityName} vous cherchent sur Workwave`;
  }
}

// ============================================
// Footer RGPD (commun aux 3 emails)
// ============================================

function buildFooter(data: ProEmailData): string {
  const unsubToken = generateUnsubscribeToken(data.proId);
  const globalToken = generateGlobalUnsubscribeToken(data.proId);
  const unsubscribeUrl = `${BASE_URL}/unsubscribe?token=${unsubToken}&id=${data.proId}`;
  const globalUnsubscribeUrl = `${BASE_URL}/unsubscribe-all?token=${globalToken}&id=${data.proId}`;

  return `
    <div style="border-top:1px solid #E5E7EB;padding-top:16px;margin-top:32px;font-size:11px;color:#9CA3AF;line-height:1.6;">
      <p style="margin:0 0 8px;">
        Vous recevez cet email à l'adresse ${data.proEmail} car votre entreprise est référencée publiquement dans le registre Sirene et sur Workwave.fr (régime soft opt-in B2B, art. L34-5 CPCE).
      </p>
      <p style="margin:0 0 4px;">
        <a href="${unsubscribeUrl}" style="color:#9CA3AF;text-decoration:underline;">Se désinscrire de ces emails</a>
      </p>
      <p style="margin:0 0 4px;">
        <a href="${globalUnsubscribeUrl}" style="color:#9CA3AF;text-decoration:underline;">Ne plus jamais recevoir d'emails de Workwave</a>
      </p>
      <p style="margin:0;">
        Workwave SAS, 3 rue des Rosiers 86110 Craon. Protection des données : contact@workwave.fr
      </p>
    </div>`;
}

// ============================================
// Salutation avec ou sans prenom
// ============================================

function greeting(prenom: string | null): string {
  if (prenom && prenom.trim()) {
    return `Bonjour ${prenom.trim()},`;
  }
  return "Bonjour,";
}

// ============================================
// Wrapper HTML
// ============================================

function wrapHtml(bodyContent: string, footer: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:20px auto;background:#FFFFFF;padding:32px 24px;border-radius:8px;">
    ${bodyContent}
    ${footer}
  </div>
</body>
</html>`;
}

// ============================================
// Email 1 (J0) — Presentation + PDF
// ============================================

function buildStep1(
  data: ProEmailData,
  subjectVariant: SubjectVariant
): EmailTemplate {
  const profileUrl = `${BASE_URL}/artisan/${data.slug}`;
  const claimUrl = `${BASE_URL}/pro/reclamer/${data.slug}`;

  const body = `
    <p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;line-height:1.7;">
      ${greeting(data.prenomDirigeant)}
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;line-height:1.7;">
      Je m'appelle Willy Gauvrit, je suis fondateur de Workwave et basé à Craon (86110), à côté de chez vous.
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;line-height:1.7;">
      Je viens de lancer Workwave : un annuaire local qui référence tous les artisans et professionnels de la Vienne. L'objectif est simple : permettre aux particuliers de trouver facilement un pro de confiance près de chez eux, et permettre aux artisans comme vous d'être visibles sans dépendre de Pages Jaunes ou Houzz.
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;line-height:1.7;">
      Votre entreprise <strong>${data.proName}</strong> est déjà référencée sur Workwave grâce aux données publiques du registre Sirene. Vous pouvez voir votre fiche ici :<br>
      <a href="${profileUrl}" style="color:#FF5A36;text-decoration:underline;">${profileUrl}</a>
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;line-height:1.7;">
      Cette fiche est gratuite. Vous pouvez la réclamer en 3 minutes pour ajouter vos coordonnées, vos horaires, vos photos de réalisations et personnaliser votre présentation. Aucun engagement, aucune carte bancaire demandée.
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;line-height:1.7;">
      Pour aller plus loin et recevoir directement les demandes de devis qualifiées dans votre zone, j'ai mis en place une formule Pro à 39€ TTC par mois, sans engagement. Tous les détails dans le PDF joint.
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;line-height:1.7;">
      Réclamer votre fiche : <a href="${claimUrl}" style="color:#FF5A36;text-decoration:underline;">${claimUrl}</a>
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;line-height:1.7;">
      Si vous avez des questions, répondez simplement à cet email, je vous réponds personnellement dans la journée.
    </p>
    <p style="margin:0 0 4px;font-size:15px;color:#1a1a1a;line-height:1.7;">
      Bonne fin de journée,
    </p>
    <div style="margin-top:16px;font-size:14px;color:#6B7280;line-height:1.6;">
      <strong style="color:#1a1a1a;">Willy Gauvrit</strong><br>
      Fondateur, Workwave SAS<br>
      3 rue des Rosiers, 86110 Craon<br>
      <a href="mailto:contact@workwave.fr" style="color:#FF5A36;text-decoration:none;">contact@workwave.fr</a><br>
      ${FOUNDER_PHONE}
    </div>
    <p style="margin:24px 0 0;font-size:14px;color:#6B7280;line-height:1.6;font-style:italic;">
      PS : Workwave est 100% indépendant et basé à Craon. Pas de société américaine derrière, pas de capital étranger. Juste un entrepreneur local qui veut aider les artisans de la Vienne à se faire connaître.
    </p>`;

  return {
    subject: getStep1Subject(subjectVariant, data),
    html: wrapHtml(body, buildFooter(data)),
  };
}

// ============================================
// Email 2 (J+3) — Relance douce
// ============================================

function buildStep2(data: ProEmailData): EmailTemplate {
  const profileUrl = `${BASE_URL}/artisan/${data.slug}`;
  const claimUrl = `${BASE_URL}/pro/reclamer/${data.slug}`;

  const body = `
    <p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;line-height:1.7;">
      ${greeting(data.prenomDirigeant)}
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;line-height:1.7;">
      Je vous ai écrit il y a quelques jours à propos de votre fiche Workwave. Je voulais juste m'assurer que mon email était bien arrivé (ils finissent parfois en spams).
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;line-height:1.7;">
      Pour rappel, vous pouvez voir votre fiche ici :<br>
      <a href="${profileUrl}" style="color:#FF5A36;text-decoration:underline;">${profileUrl}</a>
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;line-height:1.7;">
      Et la réclamer gratuitement en 3 minutes :<br>
      <a href="${claimUrl}" style="color:#FF5A36;text-decoration:underline;">${claimUrl}</a>
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;line-height:1.7;">
      Si vous n'êtes pas intéressé, ignorez simplement cet email, je n'insisterai pas.
    </p>
    <p style="margin:0 0 4px;font-size:15px;color:#1a1a1a;line-height:1.7;">
      Bonne journée,
    </p>
    <div style="margin-top:16px;font-size:14px;color:#6B7280;line-height:1.6;">
      <strong style="color:#1a1a1a;">Willy Gauvrit</strong><br>
      Fondateur de Workwave
    </div>`;

  return {
    subject: `${data.proName} - juste pour confirmer que vous avez bien reçu mon email`,
    html: wrapHtml(body, buildFooter(data)),
  };
}

// ============================================
// Email 3 (J+10) — Derniere relance
// ============================================

function buildStep3(data: ProEmailData): EmailTemplate {
  const claimUrl = `${BASE_URL}/pro/reclamer/${data.slug}`;

  const body = `
    <p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;line-height:1.7;">
      ${greeting(data.prenomDirigeant)}
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;line-height:1.7;">
      Dernier email de ma part promis.
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;line-height:1.7;">
      Votre fiche <strong>${data.proName}</strong> est toujours disponible sur Workwave. Je voulais m'assurer que vous ne passiez pas à côté de l'opportunité.
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;line-height:1.7;">
      Si Workwave ne vous intéresse pas, pas de souci, je ne vous recontacterai plus. Si vous voulez juste réserver votre fiche au cas où, c'est ici en 3 minutes :<br>
      <a href="${claimUrl}" style="color:#FF5A36;text-decoration:underline;">${claimUrl}</a>
    </p>
    <p style="margin:0 0 4px;font-size:15px;color:#1a1a1a;line-height:1.7;">
      Bien cordialement,
    </p>
    <div style="margin-top:16px;font-size:14px;color:#6B7280;line-height:1.6;">
      <strong style="color:#1a1a1a;">Willy Gauvrit</strong><br>
      Fondateur de Workwave
    </div>`;

  return {
    subject: `Dernière relance - votre fiche Workwave`,
    html: wrapHtml(body, buildFooter(data)),
  };
}

// ============================================
// Export principal
// ============================================

export function getEmailTemplate(
  step: number,
  data: ProEmailData,
  subjectVariant: SubjectVariant = "b"
): EmailTemplate {
  switch (step) {
    case 1:
      return buildStep1(data, subjectVariant);
    case 2:
      return buildStep2(data);
    case 3:
      return buildStep3(data);
    default:
      throw new Error(`Step ${step} invalide (1-3 attendu)`);
  }
}
