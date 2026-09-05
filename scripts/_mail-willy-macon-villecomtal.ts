import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const TO = "invest.home86@gmail.com";

const insta: [string, string][] = [
  ["moulyreyconstruction", "⭐ MOULY REY CONSTRUCTION · Baraqueville, maçonnerie + rénovation (810 abonnés)"],
  ["av_construction_macon_aveyron", "⭐ AV CONSTRUCTION · Sévérac-d'Aveyron (couvre Espalion/Bozouls/Rodez)"],
  ["pierres_aveyronnaises", "ETL · bâtisseur de pierres, rénovation Aveyron"],
  ["coop12_participatif", "COOP12 (Denis Siol) · maçonnerie pierre / façades Aveyron"],
  ["procivilsolidsarl", "Pro Civil Solid · fondations / maçonnerie"],
  ["sarlsantiago", "SARL Santiago · terrassement / fondations (actif)"],
  ["hc_construction", "HC Construction · maître d'œuvre"],
];

const mailsEnvoyes: [string, string, string][] = [
  ["ABTP", "Montrozier (12630) · ~15 km", "contact@abtp-maconnerie.fr"],
  ["AV Construction", "Sévérac-d'Aveyron · couvre la zone", "av-construction@outlook.fr"],
  ["COOP12 (Denis Siol)", "Aveyron (pierre)", "denis.siol.maconnerie@gmail.com"],
];

const aAppeler: [string, string][] = [
  ["Noyer Constructions", "Bozouls (12340) · 4,8★/48 avis"],
  ["Lemouzy André", "Saint-Côme-d'Olt (12500)"],
  ["Jean-Marie Salelles", "Cayrol"],
  ["EDS Maçonnerie", "Espalion (12500)"],
];

const link = (h: string) => `<a href="https://instagram.com/${h}" style="color:#FF5A36;font-weight:600;text-decoration:none;">@${h}</a>`;
const row = (cells: string[]) => `<tr>${cells.map((c) => `<td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:14px;vertical-align:top;">${c}</td>`).join("")}</tr>`;

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fff;">
<div style="max-width:640px;margin:0 auto;padding:24px 18px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;">
  <h2 style="font-size:18px;margin:0 0 4px;">Maçon · Villecomtal (Aveyron)</h2>
  <p style="font-size:14px;color:#666;margin:0 0 20px;">Lead de <strong>Valérie</strong> : déplacement d'une fenêtre + modification d'une cheminée, budget 500 à 2&nbsp;000&nbsp;€, ce mois-ci. Recherche faite sur ton navigateur connecté.</p>

  <h3 style="font-size:15px;margin:18px 0 8px;color:#FF5A36;">📷 Instagram à DM (ton canal)</h3>
  <table style="width:100%;border-collapse:collapse;">
    ${insta.map(([h, d]) => row([link(h), d])).join("")}
  </table>

  <h3 style="font-size:15px;margin:24px 0 8px;color:#1a1a1a;">✉️ Mails déjà envoyés (3 : proposition du chantier)</h3>
  <table style="width:100%;border-collapse:collapse;">
    <tr style="background:#fafafa;"><td style="padding:6px 10px;font-size:12px;color:#888;">Entreprise</td><td style="padding:6px 10px;font-size:12px;color:#888;">Lieu</td><td style="padding:6px 10px;font-size:12px;color:#888;">Email</td></tr>
    ${mailsEnvoyes.map(row).join("")}
  </table>
  <p style="font-size:13px;color:#666;margin:8px 0 0;">→ Leurs réponses arrivent sur contact@workwave.fr (reply-to). Tu connectes à la cliente.</p>

  <h3 style="font-size:15px;margin:24px 0 8px;color:#1a1a1a;">📞 Les plus proches à appeler (pas d'email public)</h3>
  <table style="width:100%;border-collapse:collapse;">
    ${aAppeler.map(row).join("")}
  </table>

  <h3 style="font-size:15px;margin:24px 0 8px;color:#FF5A36;">📩 Le DM à coller (change le @)</h3>
  <div style="background:#fafafa;border-left:3px solid #FF5A36;padding:12px 14px;font-size:14px;line-height:1.6;color:#333;border-radius:0 8px 8px 0;">
    Bonjour 👋 Je suis Willy, fondateur de <strong>Workwave</strong> (workwave.fr). Une cliente cherche <strong>un maçon à Villecomtal (Aveyron)</strong> ce mois-ci : déplacement de fenêtre + modif cheminée, budget sérieux. Si ça vous intéresse je vous mets en relation, <strong>gratuit, sans abonnement</strong>, 9,90 € seulement pour débloquer le contact. Je vous envoie le détail ? 😊
  </div>

  <p style="font-size:13px;color:#666;margin:20px 0 0;">- Workwave</p>
</div>
</body></html>`;

async function main() {
  const { data, error } = await resend.emails.send({
    from: "Workwave <contact@workwave.fr>",
    to: TO,
    subject: "Maçon Villecomtal · Instagram à DM + 3 mails envoyés",
    html,
  });
  if (error) { console.error("❌", JSON.stringify(error)); process.exit(1); }
  console.log(`✓ Récap envoyé à ${TO} (id ${data?.id})`);
}
main();
