import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff;">
  <div style="max-width:560px;margin:0 auto;padding:28px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.65;color:#1a1a1a;">
    <p style="margin:0 0 16px;">Bonjour,</p>
    <p style="margin:0 0 16px;">Je suis Willy Gauvrit, le fondateur de <a href="https://workwave.fr" style="color:#1a1a1a;">Workwave</a>. Vous avez r&eacute;clam&eacute; votre fiche <strong>Renov&rsquo;Toit</strong> hier, et je vous en remercie&nbsp;!</p>
    <p style="margin:0 0 16px;">Il me manque juste <strong>une information</strong> pour que tout soit op&eacute;rationnel&nbsp;: votre <strong>commune</strong>. Sans elle, votre fiche n'appara&icirc;t pas dans les recherches de votre secteur, et surtout <strong>vous ne recevez pas les demandes de projets de couvreur pr&egrave;s de chez vous</strong> &mdash; ce serait dommage de passer &agrave; c&ocirc;t&eacute;.</p>
    <p style="margin:0 0 8px;">Pourriez-vous simplement <strong>r&eacute;pondre &agrave; ce mail</strong> en m'indiquant&nbsp;:</p>
    <ul style="margin:0 0 16px;padding-left:20px;">
      <li style="margin-bottom:6px;">Votre <strong>commune</strong> (la ville o&ugrave; vous &ecirc;tes bas&eacute;)</li>
      <li>Et si possible, confirmez votre <strong>SIRET</strong> &mdash; celui enregistr&eacute; ne semble pas correspondre au registre officiel, c'est peut-&ecirc;tre une petite coquille</li>
    </ul>
    <p style="margin:0 0 16px;">D&egrave;s que je les ai, je compl&egrave;te votre fiche et vous commencez &agrave; recevoir les projets de votre zone. Pour rappel c'est <strong>gratuit</strong>&nbsp;: vous ne payez 9,90&nbsp;&euro; que si un projet vous int&eacute;resse et que vous voulez les coordonn&eacute;es du client. Pas d'abonnement.</p>
    <p style="margin:0 0 4px;">Bonne journ&eacute;e,</p>
    <p style="margin:0 0 24px;"><strong>Willy Gauvrit</strong><br>
    <span style="color:#666;font-size:13px;">Fondateur de Workwave &middot; <a href="mailto:contact@workwave.fr" style="color:#666;">contact@workwave.fr</a> &middot; <a href="https://workwave.fr" style="color:#666;">workwave.fr</a></span></p>
  </div>
</body></html>`;

async function main() {
  const { data, error } = await resend.emails.send({
    from: "Willy de Workwave <contact@workwave.fr>",
    to: "renov.toit07@gmail.com",
    replyTo: "contact@workwave.fr",
    subject: "Votre fiche Renov’Toit sur Workwave · une info à compléter",
    html,
  });
  if (error) {
    console.error("❌", error);
    process.exit(1);
  }
  console.log(`✓ Mail envoyé à renov.toit07@gmail.com (id ${data?.id})`);
}
main();
