/**
 * Mail "Votre fiche a été transférée sur le nouveau Workwave" pour GO-RENOV.
 *
 * Usage :
 *   npx tsx scripts/_send-go-renov-onboarding.ts --preview  → envoie à toi (workwave.france@gmail.com)
 *   npx tsx scripts/_send-go-renov-onboarding.ts            → envoie à go.renovcontact@gmail.com
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { Resend } from "resend";

const PREVIEW = process.argv.includes("--preview");
const TO = PREVIEW ? "workwave.france@gmail.com" : "go.renovcontact@gmail.com";
const SUBJECT_PREFIX = PREVIEW ? "[PREVIEW] " : "";

const BASE = "https://workwave.fr";
const FICHE_URL = `${BASE}/artisan/go-renov-00026`;
const DASHBOARD_URL = `${BASE}/pro/connexion`;
const EMAIL_LOGIN = "go.renovcontact@gmail.com";
const PASSWORD = "Brice86180?";
const PRO_NAME = "GO-RENOV";

const subject = `${SUBJECT_PREFIX}Votre fiche ${PRO_NAME} est prête sur le nouveau Workwave`;

function buildHtml(): string {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#FAFAFA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;color:#0A0A0A;-webkit-font-smoothing:antialiased;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

    <!-- Header logo + accent coral -->
    <div style="text-align:center;padding:8px 0 28px;">
      <div style="display:inline-block;font-size:30px;font-weight:800;letter-spacing:-0.02em;color:#0A0A0A;">
        Workwave<span style="color:#FF5A36;">.</span>
      </div>
    </div>

    <!-- Card principale -->
    <div style="background:#FFFFFF;border:1px solid #E5E7EB;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">

      <!-- Bandeau coral haut -->
      <div style="background:#FF5A36;height:4px;"></div>

      <div style="padding:36px 32px 28px;">

        <!-- Tag -->
        <div style="display:inline-block;background:#FFEBE4;color:#E63E1A;font-size:12px;font-weight:600;padding:5px 11px;border-radius:999px;margin-bottom:18px;text-transform:uppercase;letter-spacing:0.04em;">
          Votre fiche est en ligne
        </div>

        <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;letter-spacing:-0.01em;line-height:1.25;color:#0A0A0A;">
          Bonjour ${PRO_NAME},<br/>
          votre fiche est prête sur le nouveau Workwave 👋
        </h1>

        <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#374151;">
          On a complètement repensé Workwave pour le rendre <strong>plus simple, plus juste, et 100&nbsp;% sans engagement</strong>. Voici ce que ça change pour vous et comment commencer dès aujourd'hui.
        </p>

        <!-- Box "ce qui change" -->
        <div style="background:#FAFAFA;border:1px solid #E5E7EB;border-radius:12px;padding:22px 24px;margin:0 0 26px;">
          <h2 style="margin:0 0 14px;font-size:16px;font-weight:700;color:#0A0A0A;">
            🆕 Ce qui change&nbsp;:
          </h2>
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size:14px;line-height:1.55;color:#374151;">
            <tr>
              <td style="padding:6px 0;vertical-align:top;width:22px;color:#FF5A36;font-weight:800;">✕</td>
              <td style="padding:6px 0;"><strong style="color:#9CA3AF;text-decoration:line-through;">Plus aucun abonnement mensuel</strong> (fini les 39&nbsp;€ ou 49&nbsp;€/mois&nbsp;!).</td>
            </tr>
            <tr>
              <td style="padding:6px 0;vertical-align:top;color:#10B981;font-weight:800;">✓</td>
              <td style="padding:6px 0;"><strong>Votre fiche est gratuite, à vie</strong>, sur tout Workwave (Vienne, Nouvelle-Aquitaine, et bientôt toute la France).</td>
            </tr>
            <tr>
              <td style="padding:6px 0;vertical-align:top;color:#10B981;font-weight:800;">✓</td>
              <td style="padding:6px 0;"><strong>Vous payez seulement quand vous voulez contacter un particulier.</strong> Quand un projet vous intéresse, vous débloquez ses coordonnées pour <strong>9,90&nbsp;€&nbsp;TTC</strong> (paiement unique, jamais récurrent).</td>
            </tr>
            <tr>
              <td style="padding:6px 0;vertical-align:top;color:#10B981;font-weight:800;">✓</td>
              <td style="padding:6px 0;"><strong>Tous les projets vous arrivent par email</strong> dès qu'un particulier de votre zone dépose une demande dans votre métier. À vous de choisir ceux qui vous intéressent.</td>
            </tr>
          </table>
        </div>

        <!-- Box identifiants -->
        <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:12px;padding:22px 24px;margin:0 0 26px;">
          <h2 style="margin:0 0 14px;font-size:16px;font-weight:700;color:#0A0A0A;">
            🔐 Vos identifiants de connexion
          </h2>
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size:14px;line-height:1.55;">
            <tr>
              <td style="padding:5px 0;color:#6B7280;width:120px;">Adresse :</td>
              <td style="padding:5px 0;">
                <a href="${DASHBOARD_URL}" style="color:#FF5A36;font-weight:600;text-decoration:none;">${DASHBOARD_URL}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:5px 0;color:#6B7280;">Email :</td>
              <td style="padding:5px 0;font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:13px;color:#0A0A0A;">${EMAIL_LOGIN}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;color:#6B7280;">Mot de passe :</td>
              <td style="padding:5px 0;font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:13px;color:#0A0A0A;">${PASSWORD}</td>
            </tr>
          </table>
          <p style="margin:14px 0 0;font-size:12px;color:#9A6E2E;">
            💡 Vous pourrez changer ce mot de passe à tout moment depuis votre dashboard, rubrique "Paramètres".
          </p>
        </div>

        <!-- CTA principal -->
        <div style="text-align:center;margin:0 0 26px;">
          <a href="${DASHBOARD_URL}" style="display:inline-block;background:#FF5A36;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:15px;padding:14px 32px;border-radius:999px;">
            Accéder à mon dashboard →
          </a>
          <p style="margin:14px 0 0;font-size:13px;color:#6B7280;">
            Une fois connecté, complétez votre fiche en 3 minutes&nbsp;: photo, description, horaires, certifications RGE/Qualibat.
          </p>
        </div>

        <!-- Box "à savoir" -->
        <div style="border-top:1px solid #E5E7EB;padding:22px 0 0;margin:0;">
          <h2 style="margin:0 0 14px;font-size:16px;font-weight:700;color:#0A0A0A;">
            👀 Pour aller plus loin
          </h2>
          <ul style="margin:0;padding:0 0 0 18px;font-size:14px;line-height:1.7;color:#374151;">
            <li><strong>Votre fiche publique</strong> est ici&nbsp;:<br/>
              <a href="${FICHE_URL}" style="color:#FF5A36;text-decoration:none;font-size:13px;">${FICHE_URL}</a>
            </li>
            <li style="margin-top:8px;"><strong>Vous avez plusieurs métiers&nbsp;?</strong> Dans la rubrique "Ma fiche" du dashboard, vous pouvez ajouter jusqu'à 10 catégories secondaires (plombier + chauffagiste + couvreur, etc.). Vous recevrez alors les leads de ces métiers aussi.</li>
            <li style="margin-top:8px;"><strong>Rayon d'intervention</strong> personnalisable&nbsp;: par défaut 20&nbsp;km autour de votre adresse, modifiable de 5 à 200&nbsp;km dans le dashboard (rubrique "Préférences").</li>
          </ul>
        </div>

      </div>
    </div>

    <!-- Bloc support -->
    <div style="background:#FFFFFF;border:1px solid #E5E7EB;border-radius:12px;padding:20px 24px;margin:18px 0 0;font-size:13px;line-height:1.6;color:#6B7280;">
      <strong style="color:#0A0A0A;">Une question&nbsp;?</strong> Répondez directement à ce mail ou écrivez à
      <a href="mailto:contact@workwave.fr" style="color:#FF5A36;text-decoration:none;">contact@workwave.fr</a>. On vous répond sous 24&nbsp;h ouvrées.
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 0 8px;font-size:12px;color:#9CA3AF;">
      Workwave · Trouvez les meilleurs artisans, simplement.<br/>
      <a href="${BASE}" style="color:#9CA3AF;text-decoration:none;">workwave.fr</a>
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const html = buildHtml();
  console.log(`Envoi à ${TO}\nSujet : ${subject}\n`);

  const { data, error } = await resend.emails.send({
    from: "Workwave <contact@workwave.fr>",
    to: [TO],
    subject,
    html,
    replyTo: "contact@workwave.fr",
  });
  if (error) { console.error("ERREUR Resend :", error); process.exit(1); }
  console.log("✓ Email envoyé. ID Resend :", data?.id);
}

main().catch((e) => { console.error("ERREUR:", e.message); process.exit(1); });
