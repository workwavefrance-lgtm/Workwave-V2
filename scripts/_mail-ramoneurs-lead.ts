import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Lead ramonage Labastide-d'Armagnac (40) : outreach aux 2 ramoneurs du secteur
// qui ont un email public (HA Ramonage + Bussy Team). Validé par Willy le 15/06.
const RECIPIENTS = [
  { email: "secretariat.tonoli@orange.fr", name: "Tonoli Ferrière (Nogaro)" },
  { email: "sarl.lalanne40@orange.fr", name: "Lalanne Sébastien (Aire-sur-l'Adour)" },
  { email: "ambifeu@gmail.com", name: "AMBIFEU (Saint-Avit)" },
  { email: "pilepoelelacheminee@gmail.com", name: "Pile Poêle La Cheminée (Saint-Sever)" },
];

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff;">
  <div style="max-width:560px;margin:0 auto;padding:28px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.65;color:#1a1a1a;">
    <p style="margin:0 0 16px;">Bonjour,</p>
    <p style="margin:0 0 16px;">Je suis Willy Gauvrit, fondateur de <a href="https://workwave.fr" style="color:#1a1a1a;">Workwave</a>. Un particulier vient de d&eacute;poser une demande de <strong>ramonage de chemin&eacute;e</strong> &agrave; <strong>Saint-Julien-d'Armagnac / Labastide-d'Armagnac (40)</strong>, souhait&eacute;e <strong>cette semaine</strong>, c'est dans votre secteur.</p>
    <p style="margin:0 0 16px;">Si vous &ecirc;tes disponible et int&eacute;ress&eacute;, <strong>r&eacute;pondez simplement &agrave; ce mail</strong> et je vous mets en relation avec le client aujourd'hui. C'est <strong>gratuit et sans engagement</strong>.</p>
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
      to: r.email,
      replyTo: "contact@workwave.fr",
      subject: "Demande de ramonage cette semaine près de chez vous (Labastide-d'Armagnac)",
      html,
    });
    if (error) {
      console.error(`❌ ${r.name} (${r.email}) :`, JSON.stringify(error));
    } else {
      console.log(`✓ ${r.name} (${r.email}) : id ${data?.id}`);
    }
  }
}
main();
