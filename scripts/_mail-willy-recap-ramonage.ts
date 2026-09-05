import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const TO = "invest.home86@gmail.com";

const insta = [
  ["vigues.ramonage", "Viguès Ramonage · Landes (40/64), ramonage + démoussage toiture"],
  ["sud_ac_ramonage", "Sud AC Ramonage · ramonage/tubage/poêles (sudacramonage.fr · 07 82 90 82 48)"],
  ["gascogne_habitat", "Gascogne Habitat · poêles/inserts/cheminées + ramonage (1,4k abonnés)"],
  ["tastet_cheminees", "Cheminées Tastet · Dax / Saint-Paul-lès-Dax, ramonage (210 abonnés)"],
  ["rionmorcenx", "Rion (Morcenx) · Mont-de-Marsan & côte landaise, ramonage + dépannage"],
  ["chemineesdalbret", "Cheminées d'Albret · Montesquieu (47), cheminées + ramonage"],
  ["flamattitude_32", "Flam'attitude · Gers (32), poêles/cheminées + ramonage (200 abonnés)"],
  ["woodenergies", "Wood Energies · Pouillon (40), poêles granulés/bois"],
  ["lepoelescandinave40", "Le Poêle Scandinave · Mées (40), poêles"],
  ["lepoelescandinave32", "Le Poêle Scandinave · Auch (32), poêles"],
  ["baticonceptcheminees", "Bati Concept Cheminées · Gironde/Landes"],
  ["rocal_france_cheminees_design", "Rocal France Cheminées · Mont-de-Marsan"],
];

const mailsEnvoyes = [
  ["HA Ramonage", "Bougue (40) · ~30 km", "contact@ha-ramonage.fr"],
  ["Bussy Team", "Mont-de-Marsan (40) · ~33 km", "contact@bussy-team.fr"],
  ["Tonoli Ferrière", "Nogaro (32) · ~25 km", "secretariat.tonoli@orange.fr"],
  ["Lalanne Sébastien", "Aire-sur-l'Adour (40) · ~30 km", "sarl.lalanne40@orange.fr"],
  ["AMBIFEU", "Saint-Avit (40) · ~40 km", "ambifeu@gmail.com"],
  ["Pile Poêle La Cheminée", "Saint-Sever (40) · ~45 km", "pilepoelelacheminee@gmail.com"],
];

const tels = [
  ["Patrick Fitte", "Manciet (32) · ~20 km", "05 62 08 53 81"],
  ["Sylvain Flassayer (Espace Ramonage 32)", "Manciet (32) · ~20 km", "06 78 58 17 57"],
  ["Mathieu Magnes", "Espas (32) · ~25 km", "06 83 22 38 33"],
  ["Armagnac Nettoyage Dehez", "Eauze (32) · ~28 km", "09 70 35 74 04"],
  ["Tonoli Ferrière", "Nogaro (32) · ~25 km", "05 62 09 19 05"],
  ["Lalanne Sébastien", "Aire-sur-l'Adour (40) · ~30 km", "06 82 56 27 82"],
];

const row = (cells: string[]) =>
  `<tr>${cells.map((c) => `<td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:14px;vertical-align:top;">${c}</td>`).join("")}</tr>`;

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fff;">
<div style="max-width:640px;margin:0 auto;padding:24px 18px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;">
  <h2 style="font-size:18px;margin:0 0 4px;">Récap ramonage · Labastide-d'Armagnac</h2>
  <p style="font-size:14px;color:#666;margin:0 0 20px;">Chantier de Laurent (ramonage cheminée, cette semaine). Recherche faite sur Google + Instagram (ton navigateur connecté).</p>

  <h3 style="font-size:15px;margin:18px 0 8px;color:#FF5A36;">📷 Instagram (ramonage / cheminée / poêle · Landes &amp; Gers)</h3>
  <table style="width:100%;border-collapse:collapse;">
    ${insta.map(([h, d]) => row([`<a href="https://instagram.com/${h}" style="color:#FF5A36;font-weight:600;text-decoration:none;">@${h}</a>`, d])).join("")}
  </table>

  <h3 style="font-size:15px;margin:24px 0 8px;color:#1a1a1a;">✉️ Mails déjà envoyés (6 · proposition du chantier)</h3>
  <table style="width:100%;border-collapse:collapse;">
    <tr style="background:#fafafa;"><td style="padding:6px 10px;font-size:12px;color:#888;">Entreprise</td><td style="padding:6px 10px;font-size:12px;color:#888;">Lieu</td><td style="padding:6px 10px;font-size:12px;color:#888;">Email</td></tr>
    ${mailsEnvoyes.map(row).join("")}
  </table>
  <p style="font-size:13px;color:#666;margin:8px 0 0;">→ Leurs réponses arrivent sur contact@workwave.fr (reply-to). Tu connectes au client.</p>

  <h3 style="font-size:15px;margin:24px 0 8px;color:#1a1a1a;">📞 Les plus proches à appeler (pas d'email public)</h3>
  <table style="width:100%;border-collapse:collapse;">
    ${tels.map(row).join("")}
  </table>

  <p style="font-size:13px;color:#888;margin:24px 0 0;">⚠️ À NE PAS contacter : « Landes Ramonage » (Gabarret) : entreprise radiée depuis 2021.</p>
  <p style="font-size:13px;color:#666;margin:16px 0 0;">- Workwave</p>
</div>
</body></html>`;

async function main() {
  const { data, error } = await resend.emails.send({
    from: "Workwave <contact@workwave.fr>",
    to: TO,
    subject: "Récap ramonage Labastide · Instagram + contacts + mails envoyés",
    html,
  });
  if (error) { console.error("❌", JSON.stringify(error)); process.exit(1); }
  console.log(`✓ Récap envoyé à ${TO} (id ${data?.id})`);
}
main();
