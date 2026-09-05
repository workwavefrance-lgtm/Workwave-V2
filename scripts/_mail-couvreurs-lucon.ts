import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const TO = "invest.home86@gmail.com";
const DRY = process.argv.includes("--dry");

type Pro = { name: string; insta?: string; tel?: string; google?: boolean; note: string };

const top: Pro[] = [
  { name: "Couvreur Tony Coteux", google: true, note: "5★ · 126 avis · 30+ ans · entreprise familiale" },
  { name: "Entreprise Fevery", google: true, note: "5★ · 312 avis · 36 ans · tarifs forfaitaires" },
  { name: "Mickael Bâtiment Couvreur", google: true, note: "5★ · 89 avis · 31 ans · devis gratuit" },
];
const mobile: Pro[] = [
  { name: "FB Renov", tel: "0685129598", note: "Luçon · ardoise / zinc / tôle (SMS direct)" },
  { name: "Artisan Reffin", tel: "0252561269", note: "Luçon" },
];
const insta: Pro[] = [
  { name: "Chaigneau Guerin Construction", insta: "chaigneau.guerin.construction", note: "réfection couverture ARDOISE en Vendée · pile le besoin de Cathie" },
  { name: "French Renovation", insta: "french_renovation", note: "toiture · 5,9k abonnés · gros compte actif" },
  { name: "HCZ (zinguerie)", insta: "hcz087", note: "zinguerie / descente zinc, Vendée" },
  { name: "Aerotech Bâtiment", insta: "aerotech_batiment_drone", note: "façade / bardage, Vendée" },
];

function telDisplay(t: string) {
  return t.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

function proRow(p: Pro): string {
  const insta = p.insta
    ? ` · <a href="https://www.instagram.com/${p.insta}/" style="color:#FF5A36;text-decoration:none;font-weight:600;">@${p.insta}</a>`
    : "";
  const tel = p.tel
    ? ` · 📱 <a href="tel:${p.tel}" style="color:#0A0A0A;text-decoration:none;font-weight:600;">${telDisplay(p.tel)}</a>`
    : "";
  const g = p.google
    ? ` · <a href="https://www.google.com/maps/search/${encodeURIComponent(p.name + " Luçon")}" style="color:#FF5A36;text-decoration:none;font-weight:600;">Appeler via Google</a>`
    : "";
  return `<tr><td style="padding:10px 0;border-bottom:1px solid #EEE;font-size:14px;">
    <strong style="color:#0A0A0A;">${p.name}</strong>${insta}${tel}${g}<br>
    <span style="color:#6B7280;font-size:13px;">${p.note}</span></td></tr>`;
}

function section(title: string, list: Pro[]): string {
  return `<h3 style="font-size:15px;color:#0A0A0A;margin:24px 0 6px;">${title}</h3>
    <table style="width:100%;border-collapse:collapse;">${list.map(proRow).join("")}</table>`;
}

const dm = `Bonjour 👋 Willy de Workwave (workwave.fr). J'ai une cliente à Luçon dont la toiture (ardoise + zinguerie) est à refaire après l'orage, c'est urgent. Je peux vous transmettre sa demande : gratuit, vous voyez le projet avant, vous ne payez 9,90€ que si vous voulez ses coordonnées (pas d'abonnement). Intéressé ?`;

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#F7F7F7;">
<div style="max-width:600px;margin:0 auto;padding:24px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0A0A0A;">
  <div style="background:#0A0A0A;color:#fff;border-radius:14px;padding:22px 24px;margin-bottom:20px;">
    <div style="font-size:11px;letter-spacing:.15em;color:#FF8A6B;font-family:monospace;">WORKWAVE · LEAD VENDÉE</div>
    <div style="font-size:21px;font-weight:800;margin-top:6px;">Couvreurs à Luçon (85)</div>
    <div style="font-size:13px;color:#bbb;margin-top:6px;">Lead : Cathie · toiture ardoise + zinguerie à refaire après l'orage, urgent cette semaine.</div>
  </div>

  <p style="font-size:14px;line-height:1.6;color:#525252;margin:0 0 4px;">
    À contacter (DM Insta, SMS, ou appel). Dès qu'un couvreur réclame sa fiche sur <a href="https://workwave.fr/pro" style="color:#FF5A36;">workwave.fr/pro</a>, le projet de Cathie apparaît <strong style="color:#0A0A0A;">automatiquement</strong> dans son dashboard → il débloque pour 9,90€.
  </p>

  ${section("🎯 Les meilleurs locaux à Luçon (5★, décennies d'expérience)", top)}
  ${section("📱 Avec mobile direct", mobile)}
  ${section("📸 Instagram (DM)", insta)}

  <h3 style="font-size:15px;color:#0A0A0A;margin:28px 0 8px;">📨 Message prêt à copier (DM / SMS)</h3>
  <div style="background:#fff;border:1px solid #E5E5E5;border-left:3px solid #FF5A36;border-radius:8px;padding:16px;font-size:14px;line-height:1.6;color:#0A0A0A;">
    ${dm}
  </div>

  <p style="font-size:13px;color:#9CA3AF;margin:24px 0 0;border-top:1px solid #E5E5E5;padding-top:14px;">
    👉 Commence par <strong>@chaigneau.guerin.construction</strong> (ardoise Vendée) et <strong>FB Renov</strong> (mobile).<br>
    Workwave · workwave.fr
  </p>
</div></body></html>`;

async function main() {
  if (DRY) { console.log("DRY · len:", html.length, "to:", TO); return; }
  const { data, error } = await resend.emails.send({
    from: "Willy de Workwave <contact@workwave.fr>",
    to: TO,
    replyTo: "contact@workwave.fr",
    subject: "Couvreurs Luçon (85) · Insta + tél + DM prêt (lead Cathie)",
    html,
  });
  if (error) { console.error("❌", JSON.stringify(error)); process.exit(1); }
  console.log("✓ Envoyé à", TO, "· id", data?.id);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
