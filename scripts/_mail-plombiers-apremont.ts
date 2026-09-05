import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const TO = "invest.home86@gmail.com";
const DRY = process.argv.includes("--dry");

type Pro = { name: string; insta: string; note: string };

const pros: Pro[] = [
  { name: "Ecotech 85", insta: "ecotech.85", note: "Sud Vendée · rénovation salle de bain de A à Z (pile douche italienne) · RGE QualiPAC ⭐" },
  { name: "Vrignaud Frères", insta: "vrignaudfreres", note: "Challans (~20 km) · plomberie/chauffage RGE depuis 1975" },
  { name: "Saneli", insta: "saneli_gmpjns", note: "La Roche-sur-Yon (~25 km) · plomberie + électricité" },
  { name: "A3EDI", insta: "a3edi_85", note: "Montaigu / La Roche · plomberie, chauffage, génie climatique" },
  { name: "SARL Boissinot Fabien", insta: "sarlboissinotfabien", note: "secteur La Roche-sur-Yon" },
  { name: "BFDI", insta: "sarl_bfdi", note: "La Chaize-le-Vicomte / La Roche · plomberie/chauffage/élec/clim" },
  { name: "SARL JPC85", insta: "sarl_jpc85", note: "Vendée · plomberie, clim, chauffage, électricité, rénovation" },
  { name: "RT Plomberie Chauffage", insta: "rtplomberiechauffage", note: "Montaigu-Vendée (~30 km)" },
  { name: "Tomann Plomberie & Chauffage", insta: "tomann_plomberie_chauffage", note: "Vendée · petit artisan (bonne cible)" },
  { name: "Turquand", insta: "turquand_85", note: "Montaigu · grosse boîte RGE (réclame rarement, mais on tente)" },
];

function row(p: Pro): string {
  return `<tr><td style="padding:11px 0;border-bottom:1px solid #EEE;font-size:14px;">
    <strong style="color:#0A0A0A;">${p.name}</strong> · 📸 <a href="https://www.instagram.com/${p.insta}/" style="color:#FF5A36;text-decoration:none;font-weight:600;">@${p.insta}</a><br>
    <span style="color:#6B7280;font-size:13px;">${p.note}</span></td></tr>`;
}

const dm = `Bonjour 👋 Willy de Workwave (workwave.fr). J'ai une cliente à Apremont (Vendée) qui veut transformer son bac de douche en douche à l'italienne, elle cherche un plombier pour un devis. Je peux vous transmettre sa demande : gratuit, vous voyez le projet avant, vous ne payez 9,90€ que si vous voulez ses coordonnées. Intéressé ?`;

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#F7F7F7;">
<div style="max-width:600px;margin:0 auto;padding:24px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0A0A0A;">
  <div style="background:#0A0A0A;color:#fff;border-radius:14px;padding:22px 24px;margin-bottom:20px;">
    <div style="font-size:11px;letter-spacing:.15em;color:#FF8A6B;font-family:monospace;">WORKWAVE · LEAD VENDÉE</div>
    <div style="font-size:21px;font-weight:800;margin-top:6px;">10 plombiers Vendée · secteur Apremont</div>
    <div style="font-size:13px;color:#bbb;margin-top:6px;">Lead Dominique : bac de douche 80×80 → douche à l'italienne.</div>
  </div>

  <p style="font-size:14px;line-height:1.6;color:#525252;margin:0 0 4px;">
    10 plombiers vendéens à DM. Dès qu'un réclame sa fiche sur <a href="https://workwave.fr/pro" style="color:#FF5A36;">workwave.fr/pro</a>, le projet de Dominique l'attend <strong style="color:#0A0A0A;">automatiquement</strong> dans son dashboard.
  </p>

  <table style="width:100%;border-collapse:collapse;margin-top:8px;">${pros.map(row).join("")}</table>

  <h3 style="font-size:15px;color:#0A0A0A;margin:26px 0 8px;">📨 Message à copier (DM)</h3>
  <div style="background:#fff;border:1px solid #E5E5E5;border-left:3px solid #FF5A36;border-radius:8px;padding:16px;font-size:14px;line-height:1.6;color:#0A0A0A;">${dm}</div>

  <p style="font-size:12px;color:#9CA3AF;margin:20px 0 0;border-top:1px solid #E5E5E5;padding-top:12px;">
    👉 Commence par <strong>@ecotech.85</strong> (spécialiste rénovation SDB) et les petits artisans. Les grosses boîtes (Turquand) réclament rarement.<br>
    Workwave · workwave.fr
  </p>
</div></body></html>`;

async function main() {
  if (DRY) { console.log("DRY · len:", html.length, "to:", TO); return; }
  const { data, error } = await resend.emails.send({
    from: "Willy de Workwave <contact@workwave.fr>",
    to: TO,
    replyTo: "contact@workwave.fr",
    subject: "10 plombiers Vendée (secteur Apremont) · Insta (lead douche italienne)",
    html,
  });
  if (error) { console.error("❌", JSON.stringify(error)); process.exit(1); }
  console.log("✓ Envoyé à", TO, "· id", data?.id);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
