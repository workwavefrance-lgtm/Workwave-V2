import { Resend } from "resend";

let _resend: Resend | null = null;
function getResendClient() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

/**
 * Mail de bienvenue envoye au pro juste apres qu'il ait valide son code
 * de verification. Ce mail :
 *  - Confirme que la fiche est a lui
 *  - Recap les avantages Workwave Pro (extraits de /pro/page.tsx)
 *  - Communique la date de fin d'essai gratuit
 *  - Incite legerement a activer l'abonnement (offre annuelle 2 mois offerts)
 *  - Donne 3 conseils pour demarrer (compleer fiche, photos, rayon)
 *
 * Vouvoiement strict. Design coherent avec les autres mails Workwave
 * (header colore, card blanche, table clean, CTA coral arrondis).
 */
export async function sendClaimWelcomeEmail(params: {
  email: string;
  proName: string;
  trialEndsAt: Date;
}): Promise<void> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr"
  ).replace(/\s+/g, "");

  const trialEndStr = params.trialEndsAt.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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
        Votre essai gratuit de 14 jours démarre maintenant — vous recevez les demandes de clients de votre zone
        sans avoir à entrer de carte bancaire.
      </p>

      <!-- Card trial info -->
      <div style="background:#FFF5F2;border:1px solid #FFD4C7;border-radius:12px;padding:18px 20px;margin:24px 0;">
        <p style="margin:0 0 6px;font-size:12px;color:#FF5A36;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Essai gratuit actif</p>
        <p style="margin:0;font-size:15px;color:#0A0A0A;line-height:1.5;">
          Jusqu'au <strong>${trialEndStr}</strong>. Aucune carte bancaire requise.
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

    <!-- Section avantages -->
    <div style="padding:8px 32px 8px;">
      <p style="margin:0 0 18px;font-size:13px;color:#6B7280;text-transform:uppercase;letter-spacing:1.2px;font-weight:600;text-align:center;">
        Ce que vous obtenez avec Workwave Pro
      </p>

      <table style="width:100%;border-collapse:separate;border-spacing:0 12px;font-size:14px;">
        <tr>
          <td style="background:#FAFAFA;border:1px solid #E5E7EB;border-radius:12px;padding:16px 18px;vertical-align:top;">
            <p style="margin:0 0 4px;font-size:14px;color:#0A0A0A;font-weight:600;line-height:1.4;">Leads qualifiés dans votre zone</p>
            <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.6;">
              Chaque demande est analysée par notre IA et routée aux 3 pros les mieux placés. Pas de spam, que des projets réels.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#FAFAFA;border:1px solid #E5E7EB;border-radius:12px;padding:16px 18px;vertical-align:top;">
            <p style="margin:0 0 4px;font-size:14px;color:#0A0A0A;font-weight:600;line-height:1.4;">Zéro commission sur vos chantiers</p>
            <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.6;">
              Un abonnement fixe, pas de pourcentage sur vos devis ni sur vos factures. Vos revenus restent vos revenus.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#FAFAFA;border:1px solid #E5E7EB;border-radius:12px;padding:16px 18px;vertical-align:top;">
            <p style="margin:0 0 4px;font-size:14px;color:#0A0A0A;font-weight:600;line-height:1.4;">Visibilité Google maximale</p>
            <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.6;">
              Votre fiche est référencée automatiquement sur les moteurs de recherche. Plus vous la complétez, plus vous gagnez en position.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#FAFAFA;border:1px solid #E5E7EB;border-radius:12px;padding:16px 18px;vertical-align:top;">
            <p style="margin:0 0 4px;font-size:14px;color:#0A0A0A;font-weight:600;line-height:1.4;">Résiliation libre, sans engagement</p>
            <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.6;">
              Vous pouvez résilier à tout moment en un clic depuis votre dashboard. Pas de frais cachés, pas de blocage.
            </p>
          </td>
        </tr>
      </table>
    </div>

    <!-- Section conseils 3 etapes -->
    <div style="padding:24px 32px 8px;">
      <p style="margin:0 0 14px;font-size:13px;color:#6B7280;text-transform:uppercase;letter-spacing:1.2px;font-weight:600;text-align:center;">
        Pour bien démarrer
      </p>
      <ol style="margin:0;padding:0 0 0 20px;font-size:14px;color:#374151;line-height:1.8;">
        <li><strong style="color:#0A0A0A;">Complétez votre fiche</strong> — logo, description, photos de réalisations. Une fiche complète reçoit 3× plus de leads qu'une fiche vide.</li>
        <li><strong style="color:#0A0A0A;">Réglez votre rayon d'intervention</strong> dans Préférences leads (5-100 km). Plus le rayon est précis, plus les leads sont pertinents.</li>
        <li><strong style="color:#0A0A0A;">Activez les notifications email</strong> pour ne manquer aucune demande dans vos paramètres.</li>
      </ol>
    </div>

    <!-- Section incitation activation (douce) -->
    <div style="padding:32px 32px 8px;">
      <div style="background:#0A0A0A;border-radius:14px;padding:24px;text-align:center;color:#FFFFFF;">
        <p style="margin:0 0 6px;font-size:12px;color:#FFB8A3;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">
          Quand vous serez prêt
        </p>
        <p style="margin:0 0 14px;font-size:18px;color:#FFFFFF;font-weight:600;line-height:1.4;">
          Activez votre abonnement et économisez<br/>2 mois en passant à l'annuel
        </p>
        <p style="margin:0 0 18px;font-size:13px;color:#A1A1AA;line-height:1.6;">
          Mensuel : 39 €/mois · Annuel : 32,50 €/mois (390 €/an)<br/>
          Sans engagement, résiliable à tout moment.
        </p>
        <a href="${baseUrl}/pro/dashboard/abonnement"
           style="display:inline-block;background:#FFFFFF;color:#0A0A0A;text-decoration:none;padding:12px 28px;border-radius:9999px;font-size:14px;font-weight:600;">
          Voir les options d'abonnement
        </a>
        <p style="margin:14px 0 0;font-size:12px;color:#6B7280;line-height:1.5;">
          Pas pressé ? Profitez d'abord de vos 14 jours d'essai. Aucun prélèvement automatique sans votre accord.
        </p>
      </div>
    </div>

    <!-- Signature -->
    <div style="padding:32px;">
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
        Workwave — Annuaire gratuit de Nouvelle-Aquitaine
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
