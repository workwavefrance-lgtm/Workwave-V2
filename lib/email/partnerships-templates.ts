import type { Partnership } from "@/lib/types/database";

/**
 * Templates de pitch email pour les partenariats locaux.
 *
 * Principes :
 * - Vouvoiement, court (< 15 lignes), tutoie pas
 * - Angle benefice pour l'interlocuteur (PAS "aidez-nous à grandir")
 * - CTA clair : 1 question simple, pas 3
 * - Pas de promesse fausse, pas de superlatifs
 * - Sender : contact@workwave.fr
 * - Signature : Willy Gauvrit (founder)
 *
 * Chaque template a 2 variants :
 *   - html (rendu visuel)
 *   - text (fallback pour clients texte)
 */

export type PartnershipTemplate = {
  key: string;
  label: string;
  subject: (p: Partnership) => string;
  html: (p: Partnership) => string;
  text: (p: Partnership) => string;
};

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr").replace(
    /\s+/g,
    ""
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function commonHtmlWrap(content: string, signature: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <div style="height:4px;background:linear-gradient(90deg,#FF5A36 0%,#FF7A5C 50%,#FF5A36 100%);"></div>
    <div style="padding:32px 32px 24px;color:#1A1A1A;font-size:15px;line-height:1.65;">
      ${content}
      ${signature}
    </div>
    <div style="background:#FAFAFA;padding:16px 32px;border-top:1px solid #F1F1F3;text-align:center;">
      <p style="margin:0;color:#9CA3AF;font-size:11px;line-height:1.5;">
        Workwave — Plateforme gratuite de mise en relation entre particuliers et artisans en France.<br>
        <a href="${baseUrl()}" style="color:#FF5A36;text-decoration:none;">workwave.fr</a> · 1 069 733 artisans référencés
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

const SIGNATURE_HTML = `
<p style="margin:28px 0 4px;color:#1A1A1A;font-size:15px;">Bien cordialement,</p>
<p style="margin:0;color:#1A1A1A;font-size:15px;font-weight:600;">Willy Gauvrit</p>
<p style="margin:2px 0 0;color:#6B7280;font-size:13px;">Fondateur, Workwave</p>
<p style="margin:2px 0 0;color:#6B7280;font-size:13px;">
  <a href="mailto:contact@workwave.fr" style="color:#FF5A36;text-decoration:none;">contact@workwave.fr</a>
  · <a href="${baseUrl()}" style="color:#FF5A36;text-decoration:none;">workwave.fr</a>
</p>
`;

const SIGNATURE_TEXT = `
Bien cordialement,
Willy Gauvrit
Fondateur, Workwave
contact@workwave.fr · ${baseUrl()}
`;

// ─── Template 1 : MAIRIE ─────────────────────────────────────────────────────
const TEMPLATE_MAIRIE: PartnershipTemplate = {
  key: "mairie",
  label: "Mairie",
  subject: (p) => `Service gratuit pour vos administrés — ${p.city ?? "votre commune"}`,
  html: (p) => {
    const greeting = p.contact_last_name
      ? `Madame, Monsieur ${escapeHtml(p.contact_last_name)},`
      : "Madame, Monsieur le Maire,";
    const cityLabel = escapeHtml(p.city ?? "votre commune");
    const content = `
<p style="margin:0 0 16px;">${greeting}</p>

<p style="margin:0 0 16px;">
  Je suis le fondateur de <strong>Workwave</strong>, un annuaire en ligne et plateforme de mise en relation entre particuliers et artisans, lancée en Nouvelle-Aquitaine. Notre service est <strong>100% gratuit</strong> pour les particuliers — sans création de compte, sans démarchage commercial.
</p>

<p style="margin:0 0 16px;">
  Vos administrés peuvent y trouver les artisans référencés à ${cityLabel} et alentours (plombiers, électriciens, maçons, jardiniers, ménagers, gardes d'enfants — 38 métiers couverts), comparer les profils et demander des devis directement.
</p>

<p style="margin:0 0 16px;">
  Je voudrais savoir si la mairie de ${cityLabel} accepterait de référencer Workwave dans la rubrique <strong>« Services » ou « Vie pratique »</strong> de son site municipal — au même titre que d'autres ressources utiles à vos administrés (CAF, Pôle Emploi, etc.).
</p>

<p style="margin:0 0 16px;">
  Sans contrepartie commerciale ni démarchage de notre part. Je serais ravi de vous en dire plus si l'idée vous intéresse.
</p>
    `.trim();
    return commonHtmlWrap(content, SIGNATURE_HTML);
  },
  text: (p) => {
    const greeting = p.contact_last_name
      ? `Madame, Monsieur ${p.contact_last_name},`
      : "Madame, Monsieur le Maire,";
    const cityLabel = p.city ?? "votre commune";
    return `
${greeting}

Je suis le fondateur de Workwave, un annuaire en ligne et plateforme de mise en relation entre particuliers et artisans, lancée en Nouvelle-Aquitaine. Notre service est 100% gratuit pour les particuliers — sans création de compte, sans démarchage commercial.

Vos administrés peuvent y trouver les artisans référencés à ${cityLabel} et alentours (plombiers, électriciens, maçons, jardiniers, ménagers, gardes d'enfants — 38 métiers couverts), comparer les profils et demander des devis directement.

Je voudrais savoir si la mairie de ${cityLabel} accepterait de référencer Workwave dans la rubrique « Services » ou « Vie pratique » de son site municipal — au même titre que d'autres ressources utiles à vos administrés (CAF, Pôle Emploi, etc.).

Sans contrepartie commerciale ni démarchage de notre part. Je serais ravi de vous en dire plus si l'idée vous intéresse.
${SIGNATURE_TEXT}
    `.trim();
  },
};

// ─── Template 2 : OFFICE DE TOURISME ─────────────────────────────────────────
const TEMPLATE_OFFICE_TOURISME: PartnershipTemplate = {
  key: "office_tourisme",
  label: "Office de tourisme",
  subject: (p) => `Partenariat artisans locaux — ${p.city ?? "votre territoire"}`,
  html: (p) => {
    const cityLabel = escapeHtml(p.city ?? "votre territoire");
    const content = `
<p style="margin:0 0 16px;">Bonjour,</p>

<p style="margin:0 0 16px;">
  Je suis le fondateur de <strong>Workwave</strong>, un annuaire en ligne d'artisans locaux en France. Service entièrement gratuit pour les particuliers, sans inscription requise.
</p>

<p style="margin:0 0 16px;">
  Les visiteurs et résidents secondaires de ${cityLabel} cherchent régulièrement des artisans pour des petits travaux ou des urgences pendant leur séjour. Workwave référence 1 000 000+ artisans en France — une ressource utile à intégrer dans votre rubrique « Vie pratique » ou « Services » à côté des contacts urgents.
</p>

<p style="margin:0 0 16px;">
  Seriez-vous d'accord pour un lien depuis votre site officiel ? Je peux aussi proposer une page dédiée « Artisans de ${cityLabel} » sur Workwave avec votre logo et un message d'accueil de votre office si vous le souhaitez.
</p>
    `.trim();
    return commonHtmlWrap(content, SIGNATURE_HTML);
  },
  text: (p) => {
    const cityLabel = p.city ?? "votre territoire";
    return `
Bonjour,

Je suis le fondateur de Workwave, un annuaire en ligne d'artisans locaux en France. Service entièrement gratuit pour les particuliers, sans inscription requise.

Les visiteurs et résidents secondaires de ${cityLabel} cherchent régulièrement des artisans pour des petits travaux ou des urgences pendant leur séjour. Workwave référence 1 000 000+ artisans en France — une ressource utile à intégrer dans votre rubrique « Vie pratique » ou « Services » à côté des contacts urgents.

Seriez-vous d'accord pour un lien depuis votre site officiel ? Je peux aussi proposer une page dédiée « Artisans de ${cityLabel} » sur Workwave avec votre logo et un message d'accueil de votre office si vous le souhaitez.
${SIGNATURE_TEXT}
    `.trim();
  },
};

// ─── Template 3 : AGENCE IMMO ────────────────────────────────────────────────
const TEMPLATE_AGENCE_IMMO: PartnershipTemplate = {
  key: "agence_immo",
  label: "Agence immobilière",
  subject: (p) => `Aider vos acquéreurs à trouver un artisan rapidement — ${p.city ?? ""}`.trim(),
  html: (p) => {
    const cityLabel = escapeHtml(p.city ?? "votre zone");
    const content = `
<p style="margin:0 0 16px;">Bonjour,</p>

<p style="margin:0 0 16px;">
  Je vous contacte au sujet d'un service que vos clients acquéreurs et vendeurs sollicitent souvent : <strong>trouver un artisan de confiance localement</strong> (plombier, électricien, peintre, carreleur, paysagiste…) après l'achat ou pour préparer un bien à la vente.
</p>

<p style="margin:0 0 16px;">
  <strong>Workwave</strong> est un annuaire en ligne gratuit d'artisans locaux en France (1 000 000+ professionnels référencés). Vos clients peuvent y déposer un projet en 30 secondes et recevoir 3 devis sans inscription ni démarchage.
</p>

<p style="margin:0 0 16px;">
  L'idée : <strong>vous gagnez du temps</strong> en redirigeant vos clients vers Workwave plutôt que de chercher vous-même chaque fois un artisan. En échange, je vous propose un lien depuis nos pages locales vers votre site, et la mise en avant de votre agence dans nos contenus liés à ${cityLabel}.
</p>

<p style="margin:0 0 16px;">
  Quelques minutes au téléphone pour en parler vous tenteraient ? Vous pouvez aussi me répondre directement par email.
</p>
    `.trim();
    return commonHtmlWrap(content, SIGNATURE_HTML);
  },
  text: (p) => {
    const cityLabel = p.city ?? "votre zone";
    return `
Bonjour,

Je vous contacte au sujet d'un service que vos clients acquéreurs et vendeurs sollicitent souvent : trouver un artisan de confiance localement (plombier, électricien, peintre, carreleur, paysagiste…) après l'achat ou pour préparer un bien à la vente.

Workwave est un annuaire en ligne gratuit d'artisans locaux en France (1 000 000+ professionnels référencés). Vos clients peuvent y déposer un projet en 30 secondes et recevoir 3 devis sans inscription ni démarchage.

L'idée : vous gagnez du temps en redirigeant vos clients vers Workwave plutôt que de chercher vous-même chaque fois un artisan. En échange, je vous propose un lien depuis nos pages locales vers votre site, et la mise en avant de votre agence dans nos contenus liés à ${cityLabel}.

Quelques minutes au téléphone pour en parler vous tenteraient ? Vous pouvez aussi me répondre directement par email.
${SIGNATURE_TEXT}
    `.trim();
  },
};

// ─── Template 4 : NOTAIRE ────────────────────────────────────────────────────
const TEMPLATE_NOTAIRE: PartnershipTemplate = {
  key: "notaire",
  label: "Notaire",
  subject: () => "Service gratuit pour vos clients après acte de vente",
  html: (p) => {
    const cityLabel = escapeHtml(p.city ?? "votre étude");
    const content = `
<p style="margin:0 0 16px;">Maître,</p>

<p style="margin:0 0 16px;">
  Après un achat immobilier, vos clients cherchent souvent des artisans de confiance pour des travaux d'aménagement, des diagnostics complémentaires ou des urgences. C'est une question récurrente lors de la signature.
</p>

<p style="margin:0 0 16px;">
  <strong>Workwave</strong> est un annuaire en ligne gratuit d'artisans locaux en France (1 000 000+ professionnels référencés, dont les artisans RGE certifiés ADEME pour la rénovation énergétique). Sans inscription pour les particuliers, sans démarchage commercial.
</p>

<p style="margin:0 0 16px;">
  Une simple mention de Workwave dans votre brochure d'accueil ou sur votre site internet — à côté des liens utiles pour vos clients post-acquisition — pourrait leur rendre service. Je ne demande rien en contrepartie, juste votre validation de pertinence.
</p>

<p style="margin:0 0 16px;">
  Disponible si vous souhaitez en discuter brièvement par téléphone ou par email.
</p>

<p style="margin:0 0 16px;">Avec mes respectueuses salutations,</p>
    `.trim();
    return commonHtmlWrap(content, SIGNATURE_HTML);
  },
  text: () => {
    return `
Maître,

Après un achat immobilier, vos clients cherchent souvent des artisans de confiance pour des travaux d'aménagement, des diagnostics complémentaires ou des urgences. C'est une question récurrente lors de la signature.

Workwave est un annuaire en ligne gratuit d'artisans locaux en France (1 000 000+ professionnels référencés, dont les artisans RGE certifiés ADEME pour la rénovation énergétique). Sans inscription pour les particuliers, sans démarchage commercial.

Une simple mention de Workwave dans votre brochure d'accueil ou sur votre site internet — à côté des liens utiles pour vos clients post-acquisition — pourrait leur rendre service. Je ne demande rien en contrepartie, juste votre validation de pertinence.

Disponible si vous souhaitez en discuter brièvement par téléphone ou par email.

Avec mes respectueuses salutations,
${SIGNATURE_TEXT}
    `.trim();
  },
};

// ─── Template 5 : CCI / CMA ──────────────────────────────────────────────────
const TEMPLATE_CCI_CMA: PartnershipTemplate = {
  key: "cci_cma",
  label: "CCI / Chambre des Métiers",
  subject: (p) =>
    p.type === "cci"
      ? `Partenariat institutionnel — Annuaire artisans en France`
      : `Plateforme de mise en relation pour vos ressortissants artisans`,
  html: (p) => {
    const isCma = p.type === "chambre_metiers";
    const intro = isCma
      ? `Je suis le fondateur de <strong>Workwave</strong>, un annuaire en ligne d'artisans en France. Notre plateforme référence aujourd'hui <strong>1 000 000+ artisans</strong>, dont nous avons synchronisé l'ensemble des certifications RGE officielles via l'ADEME.`
      : `Je suis le fondateur de <strong>Workwave</strong>, une plateforme régionale de mise en relation entre particuliers et artisans, lancée en Nouvelle-Aquitaine. Service entièrement gratuit pour les particuliers — sans création de compte, sans démarchage.`;

    const pitch = isCma
      ? `Workwave peut offrir à vos ressortissants une visibilité gratuite supplémentaire et leur transmettre automatiquement des projets de particuliers de leur zone. Aucun frais pour les artisans (référencement à vie gratuit), abonnement optionnel uniquement pour ceux qui veulent recevoir les leads automatiquement.`
      : `Workwave couvre 40 départements de France et 38 métiers du BTP, services à domicile et aide à la personne. Une ressource utile à mentionner dans la rubrique « Services aux particuliers » de votre site, à côté des autres ressources locales.`;

    const ask = isCma
      ? `Seriez-vous disposé à étudier un partenariat institutionnel — au minimum un lien réciproque, idéalement une mention de Workwave dans votre communication aux artisans nouvellement immatriculés ?`
      : `Seriez-vous d'accord pour un lien depuis votre site officiel vers Workwave dans une rubrique pertinente ? Aucune contrepartie financière demandée.`;

    const content = `
<p style="margin:0 0 16px;">Bonjour,</p>

<p style="margin:0 0 16px;">${intro}</p>

<p style="margin:0 0 16px;">${pitch}</p>

<p style="margin:0 0 16px;">${ask}</p>

<p style="margin:0 0 16px;">Disponible pour un échange si vous souhaitez approfondir le sujet.</p>
    `.trim();
    return commonHtmlWrap(content, SIGNATURE_HTML);
  },
  text: (p) => {
    const isCma = p.type === "chambre_metiers";
    const intro = isCma
      ? `Je suis le fondateur de Workwave, un annuaire en ligne d'artisans en France. Notre plateforme référence aujourd'hui 1 000 000+ artisans, dont nous avons synchronisé l'ensemble des certifications RGE officielles via l'ADEME.`
      : `Je suis le fondateur de Workwave, une plateforme régionale de mise en relation entre particuliers et artisans, lancée en Nouvelle-Aquitaine. Service entièrement gratuit pour les particuliers — sans création de compte, sans démarchage.`;
    const pitch = isCma
      ? `Workwave peut offrir à vos ressortissants une visibilité gratuite supplémentaire et leur transmettre automatiquement des projets de particuliers de leur zone.`
      : `Workwave couvre 40 départements de France et 38 métiers. Une ressource à mentionner dans la rubrique « Services aux particuliers » de votre site.`;
    const ask = isCma
      ? `Seriez-vous disposé à étudier un partenariat institutionnel — au minimum un lien réciproque ?`
      : `Seriez-vous d'accord pour un lien depuis votre site officiel ?`;
    return `
Bonjour,

${intro}

${pitch}

${ask}

Disponible pour un échange si vous souhaitez approfondir le sujet.
${SIGNATURE_TEXT}
    `.trim();
  },
};

// ─── Registry ────────────────────────────────────────────────────────────────

export const PARTNERSHIP_TEMPLATES: Record<string, PartnershipTemplate> = {
  mairie: TEMPLATE_MAIRIE,
  office_tourisme: TEMPLATE_OFFICE_TOURISME,
  agence_immo: TEMPLATE_AGENCE_IMMO,
  notaire: TEMPLATE_NOTAIRE,
  cci_cma: TEMPLATE_CCI_CMA,
};

/**
 * Resolution auto du template selon le type du partnership. Permet de
 * laisser l'admin envoyer sans choisir, en utilisant la template par
 * defaut associee au type.
 */
export function defaultTemplateForType(
  type: Partnership["type"]
): PartnershipTemplate {
  if (type === "mairie") return TEMPLATE_MAIRIE;
  if (type === "office_tourisme") return TEMPLATE_OFFICE_TOURISME;
  if (type === "agence_immo") return TEMPLATE_AGENCE_IMMO;
  if (type === "notaire") return TEMPLATE_NOTAIRE;
  if (type === "cci" || type === "chambre_metiers") return TEMPLATE_CCI_CMA;
  // syndic, association_quartier, autre → fallback agence immo (plus generique)
  return TEMPLATE_AGENCE_IMMO;
}
