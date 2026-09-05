/**
 * TEST cold email "très humain" : projet #71 plaquiste Riantec.
 * Envoie UN email de test via Resend à workwave.france@gmail.com.
 * Le vrai envoi (après GO Willy) réutilisera ce template vers les emails harvested.
 *
 *   npx tsx scripts/_cold-riantec-test.ts
 *
 * ⚠️ Lien désinscription du test généré avec proId=0 (factice), leçon 30/04 :
 *    ne jamais utiliser le token d'un vrai pro dans un mail de test.
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { Resend } from "resend";
import { generateGlobalUnsubscribeToken } from "../lib/utils/unsubscribe-token";

const BASE_URL = "https://workwave.fr";
const TEST_TO = "workwave.france@gmail.com";
// Exemple réel pour le test : Eveno Isolation (Caudan, 8 km) → fiche sarl-eveno-platrerie-00010
const SAMPLE_SLUG = "sarl-eveno-platrerie-00010";

export function buildHumanEmail(opts: { claimUrl: string; unsubUrl: string }): string {
  const { claimUrl, unsubUrl } = opts;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff;">
  <div style="max-width:560px;margin:0 auto;padding:28px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.65;color:#1a1a1a;">
    <p style="margin:0 0 16px;">Bonjour,</p>
    <p style="margin:0 0 16px;">Je me pr&eacute;sente&nbsp;: Willy Gauvrit, j'ai cr&eacute;&eacute; <a href="${BASE_URL}" style="color:#1a1a1a;">Workwave</a>. C'est le m&ecirc;me principe qu'Habitatpresto ou Travaux.com (des particuliers d&eacute;posent leurs projets de travaux, des artisans les prennent), sauf que chez nous il n'y a <strong>pas d'abonnement</strong>&nbsp;: voir les projets est gratuit, et si un projet vous int&eacute;resse, les coordonn&eacute;es du client co&ucirc;tent 9,90&nbsp;&euro;. C'est tout.</p>
    <p style="margin:0 0 16px;">Si je vous &eacute;cris, c'est parce que j'ai re&ccedil;u cet apr&egrave;s-midi un projet dans votre secteur&nbsp;:</p>
    <div style="border:1px solid #e2e2e2;border-left:3px solid #FF5A36;border-radius:8px;padding:16px 18px;margin:0 0 16px;background:#fafafa;">
      <p style="margin:0 0 6px;font-weight:700;">Plaquiste &middot; Riantec (Morbihan)</p>
      <p style="margin:0 0 4px;font-size:14px;">Budget&nbsp;: <strong>plus de 15&nbsp;000&nbsp;&euro;</strong></p>
      <p style="margin:0 0 10px;font-size:14px;">D&eacute;lai&nbsp;: pas press&eacute;</p>
      <p style="margin:0;font-size:13px;color:#555;font-style:italic;">&laquo;&nbsp;Un particulier &agrave; Riantec souhaite faire appel &agrave; un plaquiste pour un projet de grande envergure.&nbsp;&raquo;</p>
    </div>
    <p style="margin:0 0 16px;">Le probl&egrave;me&nbsp;: je n'ai encore <strong>aucun plaquiste inscrit autour de Riantec</strong>, donc ce projet attend.</p>
    <p style="margin:0 0 16px;">Votre entreprise, elle, est d&eacute;j&agrave; r&eacute;f&eacute;renc&eacute;e sur le site (donn&eacute;es publiques Sirene). Votre fiche est ici&nbsp;:</p>
    <p style="margin:0 0 16px;"><a href="${claimUrl}" style="color:#FF5A36;font-weight:700;">R&eacute;cup&eacute;rer ma fiche (gratuit) &rarr;</a></p>
    <p style="margin:0 0 16px;">Si vous la r&eacute;cup&eacute;rez (&ccedil;a prend 2 minutes), vous verrez le projet directement dans votre espace, avec le d&eacute;tail. Apr&egrave;s, c'est vous qui voyez si vous voulez le prendre ou pas&nbsp;: z&eacute;ro engagement, et &ccedil;a ne vous co&ucirc;te rien d'&ecirc;tre inscrit.</p>
    <p style="margin:0 0 4px;">Bonne journ&eacute;e,</p>
    <p style="margin:0 0 24px;"><strong>Willy Gauvrit</strong><br>
    <span style="color:#666;font-size:13px;">Fondateur de Workwave &middot; <a href="mailto:contact@workwave.fr" style="color:#666;">contact@workwave.fr</a> &middot; <a href="${BASE_URL}" style="color:#666;">workwave.fr</a></span></p>
    <p style="margin:0;padding-top:14px;border-top:1px solid #eee;font-size:11px;color:#999;line-height:1.5;">Vous recevez cet email car votre entreprise est r&eacute;f&eacute;renc&eacute;e sur Workwave (sources publiques). <a href="${unsubUrl}" style="color:#999;">Se d&eacute;sinscrire</a></p>
  </div>
</body></html>`;
}

async function main() {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const claimUrl = `${BASE_URL}/pro/reclamer/${SAMPLE_SLUG}`;
  const unsubUrl = `${BASE_URL}/unsubscribe-all?token=${generateGlobalUnsubscribeToken(0)}&id=0`;
  const { data, error } = await resend.emails.send({
    from: "Willy de Workwave <contact@workwave.fr>",
    to: TEST_TO,
    replyTo: "contact@workwave.fr",
    subject: "[TEST] Un projet plaquiste à Riantec (+15 000 €) · personne sur le secteur pour l'instant",
    html: buildHumanEmail({ claimUrl, unsubUrl }),
  });
  if (error) { console.error("❌ Resend :", error); process.exit(1); }
  console.log(`✓ Email TEST envoyé à ${TEST_TO} (id ${data?.id})`);
  console.log(`  Fiche exemple : ${claimUrl}`);
  console.log(`  ⚠️ Le lien "Se désinscrire" du test est factice (proId=0) : cliquable sans risque.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
