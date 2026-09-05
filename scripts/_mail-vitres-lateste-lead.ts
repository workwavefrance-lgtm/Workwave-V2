import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

// Lead nettoyage vitres La Teste-de-Buch (33) · Véronique : baies vitrées +
// rambardes, ce mois-ci, <500€. Outreach aux nettoyeurs du Bassin (email public).
const RECIPIENTS = [
  { email: "gclean.gb@hotmail.com", name: "G-Clean (Mios, Bassin d'Arcachon)" },
];

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff;">
  <div style="max-width:560px;margin:0 auto;padding:28px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.65;color:#1a1a1a;">
    <p style="margin:0 0 16px;">Bonjour,</p>
    <p style="margin:0 0 16px;">Je suis Willy Gauvrit, fondateur de <a href="https://workwave.fr" style="color:#1a1a1a;">Workwave</a>. Une particuli&egrave;re vient de d&eacute;poser une demande de <strong>nettoyage de vitres &agrave; La Teste-de-Buch (33)</strong>&nbsp;: <strong>baies vitr&eacute;es et rambardes</strong>, souhait&eacute; <strong>ce mois-ci</strong> &mdash; c'est dans votre secteur.</p>
    <p style="margin:0 0 16px;">Si vous &ecirc;tes disponible et int&eacute;ress&eacute;, <strong>r&eacute;pondez simplement &agrave; ce mail</strong> et je vous mets en relation avec la cliente. C'est <strong>gratuit et sans engagement</strong>.</p>
    <p style="margin:0 0 16px;">Vous pouvez aussi cr&eacute;er votre fiche gratuite pour recevoir ce type de demandes pr&egrave;s de chez vous&nbsp;: <a href="https://workwave.fr/pro" style="color:#FF5A36;font-weight:600;">workwave.fr/pro</a></p>
    <p style="margin:0 0 4px;">Bonne journ&eacute;e,</p>
    <p style="margin:0 0 24px;"><strong>Willy Gauvrit</strong><br>
    <span style="color:#666;font-size:13px;">Fondateur de Workwave &middot; <a href="mailto:contact@workwave.fr" style="color:#666;">contact@workwave.fr</a> &middot; <a href="https://workwave.fr" style="color:#666;">workwave.fr</a></span></p>
  </div>
</body></html>`;

async function main() {
  for (const r of RECIPIENTS) {
    const { data, error } = await resend.emails.send({
      from: "Willy de Workwave <contact@workwave.fr>",
      to: r.email, replyTo: "contact@workwave.fr",
      subject: "Demande de nettoyage de vitres ce mois-ci près de chez vous (La Teste-de-Buch)",
      html,
    });
    console.log(error ? `❌ ${r.name} : ${JSON.stringify(error)}` : `✓ ${r.name} (${r.email}) · id ${data?.id}`);
  }
}
main();
