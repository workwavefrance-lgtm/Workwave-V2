import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff;">
  <div style="max-width:560px;margin:0 auto;padding:28px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.65;color:#1a1a1a;">
    <p style="margin:0 0 16px;">Bonjour M. Montourcy,</p>
    <p style="margin:0 0 16px;">Merci de votre message.</p>
    <p style="margin:0 0 16px;">Apr&egrave;s v&eacute;rification dans notre base, <strong>nous ne trouvons aucune fiche &agrave; votre nom ni au nom de &laquo;&nbsp;CM Couverture Zinguerie&nbsp;&raquo; sur Workwave</strong>. Il n'y a donc, de notre c&ocirc;t&eacute;, <strong>aucune adresse erron&eacute;e vous concernant en ligne</strong> &mdash; vous pensez peut-&ecirc;tre &agrave; un autre annuaire.</p>
    <p style="margin:0 0 16px;">En revanche, c'est l'occasion id&eacute;ale&nbsp;: si vous le souhaitez, vous pouvez <strong>cr&eacute;er votre fiche gratuite avec votre adresse actuelle</strong> (38 avenue du midi, 19240 Allassac). Vous gagnez en visibilit&eacute; et vous recevez les <strong>demandes de particuliers de votre secteur</strong> qui cherchent un couvreur.</p>
    <p style="margin:0 0 16px;">C'est <strong>100&nbsp;% gratuit, sans abonnement</strong>&nbsp;: votre fiche reste en ligne &agrave; vie. Vous ne payez que <strong>9,90&nbsp;&euro; (sans engagement)</strong> uniquement si vous d&eacute;cidez de d&eacute;bloquer le contact d'un client qui vous int&eacute;resse.</p>
    <p style="margin:0 0 20px;">&#128073; Pour cr&eacute;er votre fiche en 2 minutes (avec votre SIRET)&nbsp;: <a href="https://workwave.fr/pro" style="color:#FF5A36;font-weight:600;">workwave.fr/pro</a></p>
    <p style="margin:0 0 16px;">Et bien s&ucirc;r, si vous pr&eacute;f&eacute;rez ne rien faire, aucun souci&nbsp;: rien de vous n'est publi&eacute; chez nous.</p>
    <p style="margin:0 0 4px;">Bien &agrave; vous,</p>
    <p style="margin:0 0 0;"><strong>Willy Gauvrit</strong><br>
    <span style="color:#666;font-size:13px;">Fondateur de Workwave &middot; <a href="mailto:contact@workwave.fr" style="color:#666;">contact@workwave.fr</a> &middot; <a href="https://workwave.fr" style="color:#666;">workwave.fr</a></span></p>
  </div>
</body></html>`;

async function main(){
  const { data, error } = await resend.emails.send({
    from: "Willy de Workwave <contact@workwave.fr>",
    to: "cmontourcy@gmail.com",
    replyTo: "contact@workwave.fr",
    subject: "Re: RECLAMATION FICHE · votre présence sur Workwave",
    html,
  });
  console.log(error ? `❌ ${JSON.stringify(error)}` : `✓ Mail envoyé à cmontourcy@gmail.com (id ${data?.id})`);
}
main();
