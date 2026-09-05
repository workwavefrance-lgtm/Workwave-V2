import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const TO = "invest.home86@gmail.com";
const DRY = process.argv.includes("--dry");

type Pro = { name: string; email: string; tel?: string; insta?: string; note: string };

const pros: Pro[] = [
  { name: "Au Toit Couvert", email: "autoitcouvert@gmail.com", note: "Chasnais (~10 km de Luçon, intervient jusqu'à 30 km) · le plus proche 🎯" },
  { name: "FB Renov (Franck Bernard)", email: "franckbernard85@orange.fr", tel: "0685129598", note: "Saint-Jean de Beugné · ardoise / zinc / tôle" },
  { name: "G.H Couverture & Façades", email: "gringohemery@gmail.com", tel: "0664932780", note: "Le Poiré-sur-Vie · 17 ans · toiture / étanchéité / zinguerie" },
  { name: "Chaigneau Guérin Construction", email: "guerin.y.immo@outlook.fr", tel: "0612748340", insta: "chaigneau.guerin.construction", note: "La Barre-de-Monts · gros œuvre + couverture ARDOISE" },
];

function telDisplay(t: string) {
  return t.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

function row(p: Pro): string {
  const tel = p.tel ? ` · 📱 <a href="tel:${p.tel}" style="color:#0A0A0A;text-decoration:none;">${telDisplay(p.tel)}</a>` : "";
  const insta = p.insta ? ` · 📸 <a href="https://www.instagram.com/${p.insta}/" style="color:#FF5A36;text-decoration:none;">@${p.insta}</a>` : "";
  return `<tr><td style="padding:11px 0;border-bottom:1px solid #EEE;font-size:14px;">
    <strong style="color:#0A0A0A;">${p.name}</strong><br>
    📧 <a href="mailto:${p.email}" style="color:#FF5A36;text-decoration:none;font-weight:600;">${p.email}</a>${tel}${insta}<br>
    <span style="color:#6B7280;font-size:13px;">${p.note}</span></td></tr>`;
}

const dm = `Bonjour, Willy de Workwave (workwave.fr). J'ai une cliente à Luçon dont la toiture (ardoise + zinguerie) est à refaire après l'orage, c'est urgent. Je peux vous transmettre sa demande : gratuit, vous voyez le projet avant, vous ne payez 9,90€ que si vous voulez ses coordonnées. Intéressé ?`;

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#F7F7F7;">
<div style="max-width:600px;margin:0 auto;padding:24px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0A0A0A;">
  <div style="background:#0A0A0A;color:#fff;border-radius:14px;padding:22px 24px;margin-bottom:20px;">
    <div style="font-size:11px;letter-spacing:.15em;color:#FF8A6B;font-family:monospace;">WORKWAVE · COUVREURS 85 · EMAILS</div>
    <div style="font-size:21px;font-weight:800;margin-top:6px;">Couvreurs Luçon avec email</div>
    <div style="font-size:13px;color:#bbb;margin-top:6px;">Lead Cathie : toiture après orage, urgent.</div>
  </div>

  <table style="width:100%;border-collapse:collapse;">${pros.map(row).join("")}</table>

  <h3 style="font-size:15px;color:#0A0A0A;margin:26px 0 8px;">📨 Message à copier</h3>
  <div style="background:#fff;border:1px solid #E5E5E5;border-left:3px solid #FF5A36;border-radius:8px;padding:16px;font-size:14px;line-height:1.6;color:#0A0A0A;">${dm}</div>

  <p style="font-size:12px;color:#9CA3AF;margin:20px 0 0;border-top:1px solid #E5E5E5;padding-top:12px;">
    ⚠️ À utiliser en perso (1 mail / DM à la fois), jamais en masse, sinon ça grille la réputation d'envoi. Commence par <strong>Au Toit Couvert</strong> (le plus proche) et <strong>FB Renov</strong>.<br>
    Workwave · workwave.fr
  </p>
</div></body></html>`;

async function main() {
  if (DRY) { console.log("DRY · len:", html.length, "to:", TO); return; }
  const { data, error } = await resend.emails.send({
    from: "Willy de Workwave <contact@workwave.fr>",
    to: TO,
    replyTo: "contact@workwave.fr",
    subject: "Couvreurs Luçon (85) · leurs EMAILS (lead Cathie)",
    html,
  });
  if (error) { console.error("❌", JSON.stringify(error)); process.exit(1); }
  console.log("✓ Envoyé à", TO, "· id", data?.id);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
