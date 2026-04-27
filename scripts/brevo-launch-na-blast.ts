/**
 * Brevo Cold Email NA - Sequence en 3 mails (J0 + J+3 + J+10).
 *
 * Crée la liste, importe les pros eligibles, et crée la campagne du step
 * specifie. Re-synchronise la liste avant chaque step pour exclure les pros
 * qui ont reclame leur fiche ou se sont desinscrit entre temps.
 *
 * Usage :
 *   npx tsx scripts/brevo-launch-na-blast.ts --step 1 --dry-run
 *   npx tsx scripts/brevo-launch-na-blast.ts --step 1            # creer campagne en DRAFT
 *   npx tsx scripts/brevo-launch-na-blast.ts --step 1 --send     # creer + envoyer immediat
 *
 * Workflow recommande :
 *   - Aujourd'hui : --step 1 --send (envoi mail 1)
 *   - J+3         : --step 2 --send (envoi mail 2 = relance courte)
 *   - J+10        : --step 3 --send (envoi mail 3 = derniere relance)
 *
 * Le script reutilise la meme liste pour les 3 steps. Avant chaque step :
 *   - Retire de la liste Brevo les pros qui ont claimed entre temps
 *   - (Brevo gere lui-meme les unsubscribed via le lien {{ unsubscribe }})
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BREVO_API_KEY = process.env.BREVO_API_KEY!;
const BREVO_BASE = "https://api.brevo.com/v3";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const SEND_NOW = args.includes("--send");
const stepArgIdx = args.indexOf("--step");
const STEP = stepArgIdx >= 0 ? parseInt(args[stepArgIdx + 1], 10) : 0;
const batchArgIdx = args.indexOf("--batch");
const BATCH = batchArgIdx >= 0 ? parseInt(args[batchArgIdx + 1], 10) : 0;
const BATCH_SIZE = 200;

if (![1, 2, 3].includes(STEP)) {
  console.error("Usage : --step 1|2|3 --batch N [--dry-run | --send]");
  process.exit(1);
}
if (!BATCH || BATCH < 1) {
  console.error("Usage : --batch N (1, 2, 3, ...). 200 contacts par batch.");
  process.exit(1);
}

const LIST_NAME = `Pros NA - Step ${STEP} - Batch ${BATCH}`;
// workwave.france@gmail.com est le seul sender valide dans Brevo (compte gratuit).
// Pour utiliser contact@workwave.fr en sender, il faut l'ajouter + valider dans
// Brevo > Senders, IPs & Domains (necessite acces email DNS workwave.fr).
const SENDER = { name: "Willy Gauvrit - Workwave", email: "workwave.france@gmail.com" };
const REPLY_TO = "contact@workwave.fr";

// =====================================================================
// 3 templates : sujet + HTML
// =====================================================================
const SUBJECTS: Record<number, string> = {
  1: "Votre fiche Workwave est en ligne",
  2: "{{ contact.NOM_PRO }} - juste pour confirmer que vous avez bien reçu mon email",
  3: "Dernière relance - votre fiche Workwave",
};

const CAMPAIGN_NAMES: Record<number, string> = {
  1: "Cold NA - Mail 1 (presentation)",
  2: "Cold NA - Mail 2 (relance courte)",
  3: "Cold NA - Mail 3 (derniere relance)",
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
                Votre entreprise <strong>{{ contact.NOM_PRO }}</strong> est déjà référencée gratuitement sur notre site :<br>
                <a href="https://workwave.fr/artisan/{{ contact.SLUG }}" style="color:#FF5A36;text-decoration:underline;">https://workwave.fr/artisan/{{ contact.SLUG }}</a>
              </p>

              <p style="margin:0 0 16px;">
                Si vous voulez la compléter (photos, description, horaires), vous pouvez la réclamer en 3 minutes ici :<br>
                <a href="https://workwave.fr/pro/reclamer/{{ contact.SLUG }}" style="color:#FF5A36;text-decoration:underline;">https://workwave.fr/pro/reclamer/{{ contact.SLUG }}</a>
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
                Pour rappel, votre fiche est ici :<br>
                <a href="https://workwave.fr/artisan/{{ contact.SLUG }}" style="color:#FF5A36;text-decoration:underline;">https://workwave.fr/artisan/{{ contact.SLUG }}</a>
              </p>

              <p style="margin:0 0 16px;">
                Et la réclamer gratuitement en 3 minutes :<br>
                <a href="https://workwave.fr/pro/reclamer/{{ contact.SLUG }}" style="color:#FF5A36;text-decoration:underline;">https://workwave.fr/pro/reclamer/{{ contact.SLUG }}</a>
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
                Votre fiche <strong>{{ contact.NOM_PRO }}</strong> est toujours disponible sur Workwave. Je voulais m'assurer que vous ne passiez pas à côté de l'opportunité.
              </p>

              <p style="margin:0 0 16px;">
                Si Workwave ne vous intéresse pas, pas de souci, je ne vous recontacterai plus. Si vous voulez juste réserver votre fiche au cas où, c'est ici en 3 minutes :<br>
                <a href="https://workwave.fr/pro/reclamer/{{ contact.SLUG }}" style="color:#FF5A36;text-decoration:underline;">https://workwave.fr/pro/reclamer/{{ contact.SLUG }}</a>
              </p>

              <p style="margin:0 0 4px;">Bien cordialement,</p>
              ${signature}` + wrapEnd;
}

// =====================================================================
// Helpers Brevo
// =====================================================================
async function brevo<T = unknown>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  endpoint: string,
  body?: unknown
): Promise<T> {
  const resp = await fetch(`${BREVO_BASE}${endpoint}`, {
    method,
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await resp.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  if (!resp.ok) {
    throw new Error(`Brevo ${method} ${endpoint} -> ${resp.status} ${text}`);
  }
  return json as T;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// =====================================================================
// Main
// =====================================================================
async function main() {
  console.log("============================================");
  console.log(`Brevo Cold NA - Step ${STEP}`);
  console.log("============================================\n");
  if (DRY_RUN) console.log("MODE : DRY-RUN");
  if (SEND_NOW) console.log("⚠️  MODE : SEND immediat");
  if (!DRY_RUN && !SEND_NOW) console.log("MODE : DRAFT (validation manuelle dans Brevo apres)");
  console.log();

  // --- 1. Pros eligibles ---
  console.log("[1/5] Recuperation des pros eligibles...");
  let allPros: Array<{
    id: number;
    email: string;
    name: string;
    slug: string;
    prenom_dirigeant: string | null;
    city: { name: string } | null;
  }> = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase
      .from("pros")
      .select("id, email, name, slug, prenom_dirigeant, city:cities(name)")
      .not("email", "is", null)
      .eq("do_not_contact", false)
      .eq("email_bounced", false)
      .is("claimed_by_user_id", null)
      .eq("is_active", true)
      .is("deleted_at", null)
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    // @ts-expect-error - join shape
    allPros = allPros.concat(data);
    if (data.length < 1000) break;
    offset += 1000;
  }

  // Filtre garde-fou : exclure les emails malformes (URL, garbage Apify, etc.)
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const before = allPros.length;
  allPros = allPros.filter((p) => EMAIL_REGEX.test((p.email || "").trim()));
  const skippedInvalid = before - allPros.length;
  if (skippedInvalid > 0) {
    console.log(`  ⚠️  ${skippedInvalid} emails malformes filtres`);
  }
  console.log(`  -> ${allPros.length} pros eligibles total`);

  // Tri stable par id pour batches reproductibles
  allPros.sort((a, b) => a.id - b.id);

  // Slice du batch demande : [BATCH_SIZE * (BATCH-1), BATCH_SIZE * BATCH]
  const startIdx = BATCH_SIZE * (BATCH - 1);
  const endIdx = BATCH_SIZE * BATCH;
  allPros = allPros.slice(startIdx, endIdx);
  console.log(`  -> Batch ${BATCH} : ${allPros.length} pros (positions ${startIdx + 1}-${startIdx + allPros.length})`);

  if (allPros.length === 0) {
    console.log("\n⚠️  Batch vide : tous les pros ont deja ete traites dans les batches precedents.");
    return;
  }

  if (DRY_RUN) {
    console.log("\n[DRY-RUN] Apercu :");
    console.log(`  Sujet  : ${SUBJECTS[STEP]}`);
    console.log(`  HTML   : ${buildHtml(STEP).length} chars`);
    console.log(`  Liste  : ${LIST_NAME} (sera creee/maj)`);
    console.log(`  Camp   : ${CAMPAIGN_NAMES[STEP]} (sera creee)`);
    console.log("\n3 premiers contacts :");
    for (const p of allPros.slice(0, 3)) {
      console.log(`  - ${p.email} | NOM_PRO=${p.name} | SLUG=${p.slug}`);
    }
    return;
  }

  // --- 2. Attributs : crees automatiquement par Brevo lors de l'import,
  // pas besoin de pre-creer ici (l'API attributes/normal/X a 404 sur certains plans).

  // --- 3. Liste ---
  console.log("\n[3/5] Liste...");
  const lists = await brevo<{ lists: Array<{ id: number; name: string }> }>(
    "GET",
    "/contacts/lists"
  );
  let listId: number;
  const existing = lists.lists?.find((l) => l.name === LIST_NAME);
  if (existing) {
    listId = existing.id;
    console.log(`  = Liste existe (id=${listId})`);
  } else {
    const created = await brevo<{ id: number }>("POST", "/contacts/lists", {
      name: LIST_NAME,
      folderId: 1,
    });
    listId = created.id;
    console.log(`  + Liste creee (id=${listId})`);
  }

  // --- 4. Import contacts ---
  console.log("\n[4/5] Import contacts (batch 100)...");
  const IMPORT_BATCH = 100;
  let imported = 0;
  for (let i = 0; i < allPros.length; i += IMPORT_BATCH) {
    const batch = allPros.slice(i, i + IMPORT_BATCH);
    const jsonBody = batch.map((p) => ({
      email: p.email,
      attributes: {
        NOM_PRO: p.name,
        PRENOM: p.prenom_dirigeant || "",
        SLUG: p.slug,
        VILLE: p.city?.name || "",
      },
      listIds: [listId],
      updateEnabled: true,
    }));
    await brevo("POST", "/contacts/import", {
      jsonBody,
      listIds: [listId],
      emailBlacklist: false,
      smsBlacklist: false,
      updateExistingContacts: true,
      emptyContactsAttributes: false,
    });
    imported += batch.length;
    if ((i + IMPORT_BATCH) % 500 === 0 || i + IMPORT_BATCH >= allPros.length) {
      console.log(`  ${Math.min(i + IMPORT_BATCH, allPros.length)}/${allPros.length} importes`);
    }
    await sleep(300);
  }

  // --- 5. Campagne ---
  console.log("\n[5/5] Creation campagne...");
  const campaign = await brevo<{ id: number }>("POST", "/emailCampaigns", {
    name: CAMPAIGN_NAMES[STEP],
    subject: SUBJECTS[STEP],
    sender: SENDER,
    replyTo: REPLY_TO,
    htmlContent: buildHtml(STEP),
    recipients: { listIds: [listId] },
    inlineImageActivation: false,
  });
  console.log(`  + Campagne creee : id=${campaign.id}`);

  if (SEND_NOW) {
    console.log("\n⚠️  Envoi immediat...");
    await brevo("POST", `/v3/emailCampaigns/${campaign.id}/sendNow`);
    console.log("  ✅ Campagne envoyee");
  } else {
    console.log("\n=> Campagne en DRAFT.");
    console.log(`   Va sur https://my.brevo.com/camp/listing/type/marketing`);
    console.log(`   Relis le rendu, puis clique 'Schedule' ou 'Send Now'`);
  }

  console.log("\n=== DONE ===");
  console.log(`Step ${STEP} | Liste ${listId} | Campagne ${campaign.id} | ${imported} contacts`);
}

main().catch((err) => {
  console.error("\nErreur fatale :", err);
  process.exit(1);
});
