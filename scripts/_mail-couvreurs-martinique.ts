import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const TO = "invest.home86@gmail.com";
const DRY = process.argv.includes("--dry");

type Pro = { name: string; insta?: string; tel?: string; note: string };

const ducos: Pro[] = [
  { name: "Couvre Toits Caraïbes (CTC)", insta: "couvre_toits_cie", tel: "0596778880", note: "à Ducos même 🎯 (tél fixe)" },
  { name: "Toiture Caraïbes", insta: "toiturecaraibes", tel: "0696659955", note: "sert Ducos · WhatsApp" },
  { name: "Caraïbe Étanchéité BTP", tel: "0696270132", note: "ZI Petite Cocotte, Ducos" },
  { name: "Couvreur (sert Ducos)", tel: "0696192884", note: "mobile" },
];
const lamentin: Pro[] = [
  { name: "Mr Renovation", insta: "mr.renov_mtq", note: "Le Lamentin · 4,3K abonnés · décennale · gros compte" },
  { name: "Renov Construction Outre-Mer (R'COM)", insta: "rcom_972", note: "Le Lamentin · charpente + couverture" },
  { name: "Spider Couvreur", tel: "0696659117", note: "Trois-Îlets" },
];
const autres: Pro[] = [
  { name: "Joseph Charpente Couverture", insta: "joseph.charpente.couverture", note: "couvreur depuis 2004 · Qualibat RGE" },
  { name: "Toitech Martinique", insta: "toitech_martinique", tel: "0596642471", note: "étanchéité / toitures" },
  { name: "T.A.R Martinique", insta: "t.a.r.martinique", note: "réfection de toitures" },
  { name: "Kaz Nef (David Mimoun)", insta: "kaz_nef_renovation", note: "rénovation, toiture" },
  { name: "Kay Renov", insta: "kay.renov", note: "rénovation toiture" },
];

function telDisplay(t: string) {
  return t.replace(/(\d{4})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4");
}

function proRow(p: Pro): string {
  const insta = p.insta
    ? `<a href="https://www.instagram.com/${p.insta}/" style="color:#FF5A36;text-decoration:none;font-weight:600;">@${p.insta}</a>`
    : `<span style="color:#9CA3AF;">-</span>`;
  const tel = p.tel
    ? ` · 📱 <a href="tel:${p.tel}" style="color:#0A0A0A;text-decoration:none;">${telDisplay(p.tel)}</a>`
    : "";
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #EEE;font-size:14px;">
      <strong style="color:#0A0A0A;">${p.name}</strong> · ${insta}${tel}<br>
      <span style="color:#6B7280;font-size:13px;">${p.note}</span>
    </td></tr>`;
}

function section(title: string, list: Pro[]): string {
  return `<h3 style="font-size:15px;color:#0A0A0A;margin:24px 0 6px;">${title}</h3>
    <table style="width:100%;border-collapse:collapse;">${list.map(proRow).join("")}</table>`;
}

const dm = `Bonjour 👋 Je suis Willy, fondateur de Workwave (workwave.fr). J'ai une cliente à Ducos qui cherche un couvreur cette semaine. Je peux vous transmettre sa demande : gratuit, vous voyez le projet avant, et vous ne payez 9,90€ que si vous voulez ses coordonnées (pas d'abonnement). Ça vous intéresse ?`;

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#F7F7F7;">
<div style="max-width:600px;margin:0 auto;padding:24px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0A0A0A;">
  <div style="background:#0A0A0A;color:#fff;border-radius:14px;padding:22px 24px;margin-bottom:20px;">
    <div style="font-size:11px;letter-spacing:.15em;color:#FF8A6B;font-family:monospace;">WORKWAVE · LEAD MARTINIQUE</div>
    <div style="font-size:21px;font-weight:800;margin-top:6px;">Couvreurs à Ducos · Insta + mobiles</div>
    <div style="font-size:13px;color:#bbb;margin-top:6px;">Lead : Michèle cherche un couvreur à Ducos (972), cette semaine.</div>
  </div>

  <p style="font-size:14px;line-height:1.6;color:#525252;margin:0 0 4px;">
    À contacter (DM Insta ou SMS/WhatsApp). Dès qu'un couvreur réclame sa fiche sur <a href="https://workwave.fr/pro" style="color:#FF5A36;">workwave.fr/pro</a>, le projet de Michèle apparaît <strong style="color:#0A0A0A;">automatiquement</strong> dans son dashboard → il débloque pour 9,90€.
  </p>

  ${section("🎯 À Ducos / sert Ducos (priorité)", ducos)}
  ${section("📍 Le Lamentin (juste à côté)", lamentin)}
  ${section("🛠️ Autres couvreurs Martinique", autres)}

  <h3 style="font-size:15px;color:#0A0A0A;margin:28px 0 8px;">📨 Message prêt à copier (DM / SMS / WhatsApp)</h3>
  <div style="background:#fff;border:1px solid #E5E5E5;border-left:3px solid #FF5A36;border-radius:8px;padding:16px;font-size:14px;line-height:1.6;color:#0A0A0A;">
    ${dm.replace(/\n/g, "<br>")}
  </div>

  <p style="font-size:13px;color:#9CA3AF;margin:24px 0 0;border-top:1px solid #E5E5E5;padding-top:14px;">
    👉 Commence par <strong>@couvre_toits_cie</strong> (à Ducos) et <strong>@mr.renov_mtq</strong> (4,3K, actif).<br>
    Workwave · workwave.fr
  </p>
</div></body></html>`;

async function main() {
  if (DRY) { console.log("DRY, HTML length:", html.length, "\nTo:", TO); return; }
  const { data, error } = await resend.emails.send({
    from: "Willy de Workwave <contact@workwave.fr>",
    to: TO,
    replyTo: "contact@workwave.fr",
    subject: "Couvreurs Martinique (Ducos) · Insta + mobiles + DM prêt",
    html,
  });
  if (error) { console.error("❌", JSON.stringify(error)); process.exit(1); }
  console.log("✓ Envoyé à", TO, "· id", data?.id);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
