import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff;">
  <div style="max-width:560px;margin:0 auto;padding:28px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.65;color:#1a1a1a;">
    <p style="margin:0 0 16px;">Bonjour,</p>
    <p style="margin:0 0 16px;">Je suis Willy Gauvrit, fondateur de <a href="https://workwave.fr" style="color:#1a1a1a;">Workwave</a>. J'ai bien re&ccedil;u votre message, et je me permets de revenir vers vous car je crois qu'il y a une petite confusion &mdash; bien naturelle.</p>
    <p style="margin:0 0 16px;">Le formulaire que vous avez utilis&eacute; (&laquo;&nbsp;d&eacute;poser un projet&nbsp;&raquo;) est destin&eacute; aux <strong>particuliers qui cherchent un professionnel</strong>. Or vous &ecirc;tes vous-m&ecirc;me un professionnel (dessinateur / architecte). Sur Workwave, pour recevoir des demandes de clients, c'est donc l'inverse&nbsp;: il faut <strong>cr&eacute;er votre fiche professionnelle</strong>. C'est gratuit.</p>
    <p style="margin:0 0 8px;"><strong>Comment faire, en 2 minutes&nbsp;:</strong></p>
    <p style="margin:0 0 16px;">Rendez-vous sur <a href="https://workwave.fr/pro" style="color:#FF5A36;font-weight:600;">workwave.fr/pro</a>, entrez votre num&eacute;ro SIRET&nbsp;: on r&eacute;cup&egrave;re automatiquement vos informations officielles et votre fiche est cr&eacute;&eacute;e. Vous recevez ensuite les demandes de particuliers de votre zone et de votre m&eacute;tier.</p>
    <p style="margin:0 0 16px;">Le fonctionnement est simple et transparent&nbsp;: la fiche est <strong>gratuite &agrave; vie</strong>, sans abonnement. Vous ne payez <strong>9,90&nbsp;&euro;</strong> que si un projet vous int&eacute;resse et que vous souhaitez obtenir les coordonn&eacute;es du client. Aucun engagement, aucune commission.</p>
    <p style="margin:0 0 16px;">N'h&eacute;sitez pas &agrave; me r&eacute;pondre directement si vous avez la moindre question, je serai ravi de vous aider.</p>
    <p style="margin:0 0 4px;">Bonne journ&eacute;e,</p>
    <p style="margin:0 0 24px;"><strong>Willy Gauvrit</strong><br>
    <span style="color:#666;font-size:13px;">Fondateur de Workwave &middot; <a href="mailto:contact@workwave.fr" style="color:#666;">contact@workwave.fr</a> &middot; <a href="https://workwave.fr" style="color:#666;">workwave.fr</a></span></p>
  </div>
</body></html>`;

async function main() {
  const { data, error } = await resend.emails.send({
    from: "Willy de Workwave <contact@workwave.fr>",
    to: "contact@mb-plansprojets.fr",
    replyTo: "contact@workwave.fr",
    subject: "Votre activité sur Workwave · créez votre fiche pro (gratuit)",
    html,
  });
  if (error) { console.error("❌", JSON.stringify(error)); process.exit(1); }
  console.log(`✓ Mail envoyé à contact@mb-plansprojets.fr (id ${data?.id})`);
}
main();
