import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
// Premier mail = à TOI pour tester le flux complet (form -> base -> admin).
const TO = "invest.home86@gmail.com";

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff;">
  <div style="max-width:560px;margin:0 auto;padding:28px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.65;color:#1a1a1a;">
    <p style="margin:0 0 16px;">Bonjour,</p>
    <p style="margin:0 0 16px;">Chez <a href="https://workwave.fr" style="color:#1a1a1a;">Workwave</a>, on d&eacute;veloppe des outils pour simplifier le quotidien des artisans. Une question simple&nbsp;: <strong>qu'est-ce qui vous prend le plus de temps en dehors du chantier&nbsp;?</strong></p>
    <p style="margin:0 0 22px;">2 minutes, c'est lu par l'&eacute;quipe et &ccedil;a oriente vraiment ce qu'on construit.</p>
    <p style="margin:0 0 24px;">
      <a href="https://workwave.fr/enquete-pro" style="display:inline-block;background:#FF5A36;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 26px;border-radius:9999px;font-size:15px;">Donner mon avis (2 min)</a>
    </p>
    <p style="margin:0 0 4px;">Merci d'avance,</p>
    <p style="margin:0 0 24px;"><strong>Willy Gauvrit</strong><br>
    <span style="color:#666;font-size:13px;">Fondateur de Workwave &middot; <a href="mailto:contact@workwave.fr" style="color:#666;">contact@workwave.fr</a></span></p>
  </div>
</body></html>`;

async function main() {
  const { data, error } = await resend.emails.send({
    from: "Willy de Workwave <contact@workwave.fr>",
    to: TO,
    replyTo: "contact@workwave.fr",
    subject: "2 minutes pour orienter les outils qu'on développe (Workwave)",
    html,
  });
  if (error) { console.error("❌", JSON.stringify(error)); process.exit(1); }
  console.log(`✓ Mail test envoyé à ${TO} (id ${data?.id})`);
}
main();
