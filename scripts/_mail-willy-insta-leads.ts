import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const TO = "invest.home86@gmail.com";

type Lead = { titre: string; client: string; pros: [string, string][] };

const leads: Lead[] = [
  {
    titre: "🧱 Lead #74 · Maçon · Juignac (16)",
    client: "Cliente Jocelyne · assainissement · ☎ 07 77 46 05 28",
    pros: [
      ["sorc_16", "Sud-Ouest Rénovation Construction · entreprise générale (16)"],
      ["adbatiment", "AD Bâtiment · Angoulême, 3,3k abonnés"],
      ["projetentretienrenovation16", "AB Façades & Maçonnerie (16)"],
      ["abellamaconnerie", "Abella Maçonnerie · pierre / moellons"],
      ["rt.maconnerie", "RT Maçonnerie · parpaings / agglos"],
    ],
  },
  {
    titre: "🔨 Lead #71 · Plaquiste · Riantec (56)",
    client: "Client Jean-Pierre · ☎ 06 08 17 11 88",
    pros: [
      ["artiplac", "⭐ SARL ARTI'PLAC · À RIANTEC MÊME, RGE Qualibat, 631 abonnés"],
      ["qualisoplac", "QUALISOPLAC · À Riantec, isolation / cloison"],
      ["authentik_plaquiste", "Authentik Plaquiste · Larmor-Plage"],
      ["lgfplatrerie", "LGF Plâtrerie · Larmor-Plage"],
      ["atlantiplac", "Atlanti Plac · Lanester, isolation"],
      ["lucas_r_elec_placo", "LR Plaquiste · placo haut de gamme, 5,7k abonnés"],
    ],
  },
  {
    titre: "🏠 Lead #54 · Couvreur · Dienné (86, ton fief)",
    client: "Réfection toiture (Vienne)",
    pros: [
      ["botoi_artisans_couvreurs", "⭐ BoToi · Migné-Auxances / Poitiers (86)"],
      ["cooke.couverture", "Cooke Couverture · Vienne (86)"],
      ["champicharpente", "Champi Charpente · Poitiers, couverture / zinguerie"],
      ["groupe.esb", "Groupe ESB · Poitiers, toute la Vienne (☎ 05 49 50 35 65)"],
      ["artisansdupatrimoine", "Artisans du Patrimoine · Roiffé (86)"],
    ],
  },
  {
    titre: "🧰 Lead #55 · Plaquiste · Limoges (87)",
    client: "Plaquiste / plâtrerie Haute-Vienne",
    pros: [
      ["hoster_platrier_plaquiste", "Hoster · plâtrier / plaquiste / jointeur"],
      ["acdomelec", "AC-Domelec · Le Palais-sur-Vienne (placo / élec)"],
      ["db_multiservices_87", "DB Multiservices · plaquiste Limoges"],
      ["pl.agencement", "PL Agencement · Limoges"],
    ],
  },
];

const link = (h: string) =>
  `<a href="https://instagram.com/${h}" style="color:#FF5A36;font-weight:600;text-decoration:none;">@${h}</a>`;

const leadHtml = (l: Lead) => `
  <h3 style="font-size:15px;margin:22px 0 4px;color:#1a1a1a;">${l.titre}</h3>
  <p style="font-size:13px;color:#666;margin:0 0 8px;">${l.client}</p>
  <table style="width:100%;border-collapse:collapse;">
    ${l.pros
      .map(
        ([h, d]) =>
          `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:14px;white-space:nowrap;vertical-align:top;">${link(
            h,
          )}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:14px;vertical-align:top;color:#333;">${d}</td></tr>`,
      )
      .join("")}
  </table>`;

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fff;">
<div style="max-width:640px;margin:0 auto;padding:24px 18px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;">
  <h2 style="font-size:19px;margin:0 0 4px;">📷 Pros à DM sur Instagram · 4 leads</h2>
  <p style="font-size:14px;color:#666;margin:0 0 8px;">Comptes Instagram réels, locaux et actifs, trouvés sur ton navigateur connecté. Clique le @ pour ouvrir le profil et envoyer un DM.</p>

  ${leads.map(leadHtml).join("")}

  <h3 style="font-size:15px;margin:28px 0 8px;color:#FF5A36;">📩 Le DM à coller (change juste le métier + la ville)</h3>
  <div style="background:#fafafa;border-left:3px solid #FF5A36;padding:12px 14px;font-size:14px;line-height:1.6;color:#333;border-radius:0 8px 8px 0;">
    Bonjour 👋 Je suis Willy, fondateur de <strong>Workwave</strong> (workwave.fr). Un client cherche <strong>un plaquiste à Riantec</strong> en ce moment, projet sérieux. Si ça vous intéresse je vous mets en relation, <strong>gratuit, sans abonnement</strong>, vous ne payez que <strong>9,90 € pour débloquer le contact</strong> d'un client qui vous plaît. Je vous envoie le détail ? 😊
  </div>

  <p style="font-size:13px;color:#888;margin:24px 0 0;">À traiter ensuite si tu veux : ramoneur Labastide-d'Armagnac (40), électricien Creuse (23) + Côte-d'Or (21), plombier Les Billanges (87).</p>
  <p style="font-size:13px;color:#666;margin:16px 0 0;">- Workwave</p>
</div>
</body></html>`;

async function main() {
  const { data, error } = await resend.emails.send({
    from: "Workwave <contact@workwave.fr>",
    to: TO,
    subject: "Pros à DM sur Instagram · 4 leads (maçon, plaquiste ×2, couvreur)",
    html,
  });
  if (error) { console.error("❌", JSON.stringify(error)); process.exit(1); }
  console.log(`✓ Mail envoyé à ${TO} (id ${data?.id})`);
}
main();
