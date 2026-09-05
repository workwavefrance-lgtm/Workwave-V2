import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const DRY = process.argv.includes("--dry");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 10 couvreurs RÉELS du sud-Vendée (emails publics récupérés sur leurs sites).
const PROS: { name: string; email: string }[] = [
  { name: "Au Toit Couvert", email: "autoitcouvert@gmail.com" },
  { name: "SK Couverture-Zinguerie", email: "contact@skcouverturezinguerie.fr" },
  { name: "LR Couverture", email: "luigi.couvertures.85@gmail.com" },
  { name: "FB Renov", email: "franckbernard85@orange.fr" },
  { name: "GH Couverture & Façades", email: "gringohemery@gmail.com" },
  { name: "Chaigneau Guérin Construction", email: "guerin.y.immo@outlook.fr" },
  { name: "Artisan Reffin", email: "entreprise.reffin@gmail.com" },
  { name: "Couvreur de Vendée", email: "couvreur.devendee@orange.fr" },
  { name: "Vendée Réno Habitat", email: "contact@vendeereno.fr" },
  { name: "La Maison du Bonheur", email: "bonheursauzer@hotmail.fr" },
];

function buildHtml(name: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff;">
  <div style="max-width:560px;margin:0 auto;padding:26px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.65;color:#1a1a1a;">
    <p style="margin:0 0 16px;">Bonjour ${name},</p>
    <p style="margin:0 0 16px;">Je m'appelle Willy, je suis le fondateur de <a href="https://workwave.fr" style="color:#1a1a1a;">Workwave</a>, une plateforme qui met en relation les particuliers avec des artisans de leur secteur.</p>
    <p style="margin:0 0 16px;">Une cliente à <strong>Luçon</strong> doit faire refaire la toiture de sa maison (ardoise + zinguerie) suite à l'orage : c'est <strong>urgent, cette semaine</strong>. Je cherche un couvreur sérieux du coin pour lui répondre.</p>
    <p style="margin:0 0 8px;">Sur Workwave, c'est simple et sans risque pour vous&nbsp;:</p>
    <ul style="margin:0 0 16px;padding-left:20px;">
      <li style="margin:0 0 4px;">Votre fiche est <strong>gratuite</strong> (pas d'abonnement, pas de commission).</li>
      <li style="margin:0 0 4px;">Vous recevez les demandes de particuliers de votre zone.</li>
      <li style="margin:0 0 4px;">Vous ne payez <strong>9,90&nbsp;€ que si vous voulez les coordonnées</strong> d'un projet qui vous intéresse, et vous voyez le projet avant de payer.</li>
    </ul>
    <p style="margin:0 0 22px;">
      <a href="https://workwave.fr/pro" style="display:inline-block;background:#FF5A36;color:#fff;text-decoration:none;font-weight:700;padding:13px 24px;border-radius:9999px;font-size:15px;">Récupérer ma fiche (1 min, avec mon SIRET)</a>
    </p>
    <p style="margin:0 0 4px;">Bien à vous,</p>
    <p style="margin:0 0 22px;"><strong>Willy Gauvrit</strong> · Workwave<br>
    <span style="color:#666;font-size:13px;"><a href="mailto:contact@workwave.fr" style="color:#666;">contact@workwave.fr</a></span></p>
    <p style="margin:18px 0 0;border-top:1px solid #eee;padding-top:12px;font-size:12px;color:#9CA3AF;">
      Workwave (Willy Gauvrit, entrepreneur individuel), Craon. Vous ne souhaitez pas être recontacté&nbsp;? Répondez simplement <strong>STOP</strong> à ce mail, je vous retire immédiatement.
    </p>
  </div>
</body></html>`;
}

async function main() {
  console.log(`Cold couvreurs Luçon · ${PROS.length} mails${DRY ? " (DRY)" : ""}\n`);
  let sent = 0;
  for (const p of PROS) {
    if (DRY) { console.log(`  · ${p.name} <${p.email}>`); continue; }
    const { error } = await resend.emails.send({
      from: "Willy de Workwave <contact@workwave.fr>",
      to: p.email,
      replyTo: "contact@workwave.fr",
      subject: "Une cliente cherche un couvreur à Luçon (urgent)",
      html: buildHtml(p.name),
    });
    if (error) console.error(`  ❌ ${p.name} <${p.email}> : ${JSON.stringify(error)}`);
    else { console.log(`  ✓ ${p.name} <${p.email}>`); sent++; }
    await sleep(280); // < 5 req/s (rate limit Resend)
  }
  if (!DRY) console.log(`\n${sent}/${PROS.length} envoyés.`);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
