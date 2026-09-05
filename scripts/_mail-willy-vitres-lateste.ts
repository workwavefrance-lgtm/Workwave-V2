import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);
const TO = "invest.home86@gmail.com";

const insta: [string,string][] = [
  ["l_as2carreaux", "⭐ L'As 2 Carreaux · nettoyage vitres Bassin d'Arcachon (particuliers + pros)"],
  ["cleanferret", "⭐ Clean Ferret · tout le Bassin d'Arcachon"],
  ["nicolasnettoyage33", "Nicolas Nettoyage · maison / vitres (33)"],
  ["vitrnet", "Windows Cleaner · Franck, Arès"],
  ["dbg_wash_33", "dbg wash · Gujan-Mestras (5★)"],
  ["douceursdevivre", "Douceurs de Vivre · spécialiste vitres / velux (sud Bassin)"],
  ["garbi_berri_paskot", "Garbi Berri · nettoyage vitres Bassin d'Arcachon"],
];
const mailsEnvoyes: [string,string,string][] = [
  ["G-Clean", "Mios / Bassin d'Arcachon", "gclean.gb@hotmail.com"],
];
const aAppeler: [string,string][] = [
  ["Bassin Nettoyage", "La Teste-de-Buch ⭐ · 05 47 44 03 55"],
  ["BRIL", "Gujan-Mestras (5★) · 07 88 72 21 68"],
  ["Windows Cleaner", "Arès · 06 62 76 06 68"],
  ["dbg wash 33", "Gujan-Mestras · 06 37 28 88 20"],
];

const link = (h:string) => `<a href="https://instagram.com/${h}" style="color:#FF5A36;font-weight:600;text-decoration:none;">@${h}</a>`;
const row = (c:string[]) => `<tr>${c.map(x=>`<td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:14px;vertical-align:top;">${x}</td>`).join("")}</tr>`;

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fff;">
<div style="max-width:640px;margin:0 auto;padding:24px 18px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;">
  <h2 style="font-size:18px;margin:0 0 4px;">Nettoyage vitres · La Teste-de-Buch (33)</h2>
  <p style="font-size:14px;color:#666;margin:0 0 20px;">Lead de <strong>Véronique</strong> : baies vitrées + rambardes, ce mois-ci, &lt;500&nbsp;€. Bassin d'Arcachon.</p>

  <h3 style="font-size:15px;margin:18px 0 8px;color:#FF5A36;">📷 Instagram à DM (ton canal)</h3>
  <table style="width:100%;border-collapse:collapse;">${insta.map(([h,d])=>row([link(h),d])).join("")}</table>

  <h3 style="font-size:15px;margin:24px 0 8px;color:#1a1a1a;">✉️ Mail déjà envoyé</h3>
  <table style="width:100%;border-collapse:collapse;">${mailsEnvoyes.map(row).join("")}</table>
  <p style="font-size:13px;color:#666;margin:8px 0 0;">→ Réponse sur contact@workwave.fr, tu connectes à Véronique.</p>

  <h3 style="font-size:15px;margin:24px 0 8px;color:#1a1a1a;">📞 À appeler</h3>
  <table style="width:100%;border-collapse:collapse;">${aAppeler.map(row).join("")}</table>

  <h3 style="font-size:15px;margin:24px 0 8px;color:#FF5A36;">📩 Le DM à coller (change le @)</h3>
  <div style="background:#fafafa;border-left:3px solid #FF5A36;padding:12px 14px;font-size:14px;line-height:1.6;color:#333;border-radius:0 8px 8px 0;">
    Bonjour 👋 Je suis Willy, fondateur de <strong>Workwave</strong> (workwave.fr). Une cliente cherche un <strong>nettoyage de vitres à La Teste-de-Buch</strong> ce mois-ci (baies vitrées + rambardes). Si ça vous intéresse je vous mets en relation, <strong>gratuit, sans abonnement</strong>, 9,90 € seulement pour débloquer le contact. Je vous envoie le détail ? 😊
  </div>
  <p style="font-size:13px;color:#666;margin:20px 0 0;">- Workwave</p>
</div>
</body></html>`;

async function main(){
  const { data, error } = await resend.emails.send({
    from: "Workwave <contact@workwave.fr>", to: TO,
    subject: "Nettoyage vitres La Teste · Instagram à DM + contacts",
    html,
  });
  console.log(error ? `❌ ${JSON.stringify(error)}` : `✓ Récap envoyé à ${TO} (id ${data?.id})`);
}
main();
