/**
 * URGENCE : update les 14 campagnes Brevo programmees pour remplacer
 * les templates avec placeholders cassants par des templates generiques
 * pointant juste vers https://workwave.fr (pas de slug personnalise).
 *
 * Bug initial : Brevo ne substituait pas {{ contact.SLUG }} -> URLs 404
 * dans les emails envoyes au batch 1 (deja parti, irrecuperable).
 *
 * Usage : npx tsx scripts/brevo-fix-templates.ts
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const BREVO_API_KEY = process.env.BREVO_API_KEY!;
const BASE = "https://api.brevo.com";

// Mapping : id campagne Brevo -> step (1, 2, 3)
const CAMPAIGNS: Array<{ id: number; step: number; label: string }> = [
  { id: 3, step: 1, label: "Step 1 Batch 2" },
  { id: 4, step: 1, label: "Step 1 Batch 3" },
  { id: 5, step: 1, label: "Step 1 Batch 4" },
  { id: 6, step: 1, label: "Step 1 Batch 5" },
  { id: 7, step: 2, label: "Step 2 Batch 1" },
  { id: 8, step: 2, label: "Step 2 Batch 2" },
  { id: 9, step: 2, label: "Step 2 Batch 3" },
  { id: 10, step: 2, label: "Step 2 Batch 4" },
  { id: 11, step: 2, label: "Step 2 Batch 5" },
  { id: 12, step: 3, label: "Step 3 Batch 1" },
  { id: 13, step: 3, label: "Step 3 Batch 2" },
  { id: 14, step: 3, label: "Step 3 Batch 3" },
  { id: 15, step: 3, label: "Step 3 Batch 4" },
  { id: 16, step: 3, label: "Step 3 Batch 5" },
];

const SUBJECTS: Record<number, string> = {
  1: "Votre fiche Workwave est en ligne",
  2: "Juste pour confirmer que vous avez bien reçu mon email",
  3: "Dernière relance - votre fiche Workwave",
};

function buildHtml(step: number): string {
  const wrapStart = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Workwave</title></head>
<body style="margin:0;padding:0;background:#f6f6f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:8px;padding:32px 28px;">
          <tr>
            <td style="font-size:15px;color:#1a1a1a;line-height:1.7;">`;

  const wrapEnd = `
              <div style="border-top:1px solid #E5E7EB;padding-top:16px;margin-top:32px;font-size:11px;color:#9CA3AF;line-height:1.6;">
                <p style="margin:0 0 8px;">
                  Vous recevez cet email car votre entreprise est référencée publiquement dans le registre Sirene et sur Workwave.fr (régime soft opt-in B2B, art. L34-5 CPCE).
                </p>
                <p style="margin:0;">
                  <a href="{{ unsubscribe }}" style="color:#9CA3AF;text-decoration:underline;">Se désinscrire</a> · Workwave SAS, 3 rue des Rosiers 86110 Craon
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const signature = `
              <div style="margin-top:16px;font-size:14px;color:#6B7280;line-height:1.6;">
                <strong style="color:#1a1a1a;">Willy Gauvrit</strong><br>
                Fondateur de Workwave<br>
                <a href="https://workwave.fr" style="color:#FF5A36;text-decoration:none;">workwave.fr</a> · <a href="mailto:contact@workwave.fr" style="color:#FF5A36;text-decoration:none;">contact@workwave.fr</a>
              </div>`;

  if (step === 1) {
    return wrapStart + `
              <p style="margin:0 0 16px;">Bonjour,</p>

              <p style="margin:0 0 16px;">
                Je m'appelle <strong>Willy Gauvrit</strong>, fondateur de Workwave, l'annuaire des professionnels de Nouvelle-Aquitaine (226 000 pros référencés).
              </p>

              <p style="margin:0 0 16px;">
                Votre entreprise figure déjà gratuitement sur notre site.
              </p>

              <p style="margin:0 0 16px;">
                Pour la trouver, rendez-vous sur <a href="https://workwave.fr" style="color:#FF5A36;text-decoration:underline;">https://workwave.fr</a> et tapez votre <strong>code postal</strong> et votre <strong>métier</strong> dans la barre de recherche. Vous pourrez ensuite la compléter (photos, description, horaires) et la personnaliser en quelques clics.
              </p>

              <p style="margin:0 0 16px;">
                C'est gratuit, sans engagement, et permet aux particuliers de votre zone de mieux vous trouver.
              </p>

              <p style="margin:0 0 4px;">Bonne journée,</p>
              ${signature}` + wrapEnd;
  }

  if (step === 2) {
    return wrapStart + `
              <p style="margin:0 0 16px;">Bonjour,</p>

              <p style="margin:0 0 16px;">
                Je vous ai écrit il y a quelques jours à propos de votre fiche Workwave, je voulais juste m'assurer que mon email était bien arrivé (ils finissent parfois en spams).
              </p>

              <p style="margin:0 0 16px;">
                Pour rappel : rendez-vous sur <a href="https://workwave.fr" style="color:#FF5A36;text-decoration:underline;">https://workwave.fr</a> et tapez votre <strong>code postal</strong> et votre <strong>métier</strong> dans la barre de recherche pour trouver et personnaliser votre fiche.
              </p>

              <p style="margin:0 0 16px;">
                Si vous n'êtes pas intéressé, ignorez simplement cet email, je n'insisterai pas.
              </p>

              <p style="margin:0 0 4px;">Bonne journée,</p>
              ${signature}` + wrapEnd;
  }

  // step 3
  return wrapStart + `
              <p style="margin:0 0 16px;">Bonjour,</p>

              <p style="margin:0 0 16px;">
                Dernier email de ma part, promis.
              </p>

              <p style="margin:0 0 16px;">
                Votre fiche Workwave est toujours disponible. Pour la trouver, rendez-vous sur <a href="https://workwave.fr" style="color:#FF5A36;text-decoration:underline;">https://workwave.fr</a> et tapez votre <strong>code postal</strong> et votre <strong>métier</strong> dans la barre de recherche.
              </p>

              <p style="margin:0 0 16px;">
                Si Workwave ne vous intéresse pas, pas de souci, je ne vous recontacterai plus.
              </p>

              <p style="margin:0 0 4px;">Bien cordialement,</p>
              ${signature}` + wrapEnd;
}

async function brevoPut(id: number, body: object) {
  const resp = await fetch(`${BASE}/v3/emailCampaigns/${id}`, {
    method: "PUT",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`PUT ${id} -> ${resp.status} ${text}`);
  }
}

async function main() {
  console.log("============================================");
  console.log("URGENCE : update 14 campagnes Brevo");
  console.log("Templates generiques (lien fixe https://workwave.fr)");
  console.log("============================================\n");

  for (const c of CAMPAIGNS) {
    try {
      await brevoPut(c.id, {
        subject: SUBJECTS[c.step],
        htmlContent: buildHtml(c.step),
      });
      console.log(`  ✅ Campagne ${c.id} (${c.label}) updatee`);
    } catch (e) {
      console.log(`  ❌ Campagne ${c.id} (${c.label}) : ${(e as Error).message}`);
    }
  }

  console.log("\n=== DONE ===");
  console.log("Tous les emails programmes auront le nouveau template generique.");
  console.log("Le batch 1 deja envoye (200 contacts) avait l'ancien template");
  console.log("avec URLs cassees : irrecuperable mais ces 200 pros recevront");
  console.log("les step 2 et step 3 avec le bon format.");
}

main().catch((err) => {
  console.error("Erreur fatale :", err);
  process.exit(1);
});
