/**
 * RECUPERATION : mail "desole pour le bug" aux 183 contacts du batch 1
 * cold email envoye le 27/04 17:28 dont l'URL de fiche etait cassee
 * (placeholders Brevo {{ contact.SLUG }} non substitues -> 404).
 *
 * Cette fois on PRE-REND le HTML cote script (1 mail = 1 contenu unique).
 * Aucun placeholder Brevo. Impossible que ca rebuge.
 *
 * Usage:
 *   npx tsx scripts/brevo-recovery-batch1.ts                  # dry-run
 *   npx tsx scripts/brevo-recovery-batch1.ts --test           # 1 mail a workwave.france@gmail.com
 *   npx tsx scripts/brevo-recovery-batch1.ts --execute        # envoie aux 183
 *   npx tsx scripts/brevo-recovery-batch1.ts --execute --limit 50  # max 50 envois
 */
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { createClient } from "@supabase/supabase-js";

// Fichier de tracking pour rendre le script idempotent : si on l'arrete a
// 110 envois aujourd'hui (quota Brevo Free 300/jour partage avec les
// campaigns), demain on relance et il finit automatiquement le reste sans
// jamais renvoyer a un email deja contacte.
const SENT_LOG_PATH = path.resolve(process.cwd(), "scripts/.brevo-recovery-sent.json");

function loadSentEmails(): Set<string> {
  if (!fs.existsSync(SENT_LOG_PATH)) return new Set();
  try {
    const raw = fs.readFileSync(SENT_LOG_PATH, "utf-8");
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function appendSentEmail(email: string) {
  const sent = loadSentEmails();
  sent.add(email);
  fs.writeFileSync(SENT_LOG_PATH, JSON.stringify([...sent], null, 2));
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BREVO_API_KEY = process.env.BREVO_API_KEY!;
const BASE = "https://api.brevo.com/v3";
const SENDER_EMAIL = "workwave.france@gmail.com";
const SENDER_NAME = "Willy Gauvrit - Workwave";
const REPLY_TO_EMAIL = "contact@workwave.fr";
const ADMIN_TEST_EMAIL = "workwave.france@gmail.com";

const DRY_RUN = !process.argv.includes("--execute") && !process.argv.includes("--test");
const TEST_MODE = process.argv.includes("--test");
const limitIdx = process.argv.indexOf("--limit");
const LIMIT =
  limitIdx >= 0 && process.argv[limitIdx + 1]
    ? parseInt(process.argv[limitIdx + 1], 10)
    : Infinity;

const LIST_NAME = "Pros NA - Step 1 - Batch 1";

async function brevo<T>(method: string, endpoint: string, body?: object): Promise<T> {
  const resp = await fetch(`${BASE}${endpoint}`, {
    method,
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`${method} ${endpoint} -> ${resp.status} ${text}`);
  }
  return resp.json() as Promise<T>;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function buildHtml(params: {
  proName: string;
  proSlug: string | null;
}): string {
  const proUrl = params.proSlug
    ? `https://workwave.fr/artisan/${params.proSlug}`
    : `https://workwave.fr`;

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Workwave</title></head>
<body style="margin:0;padding:0;background:#f6f6f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:8px;padding:32px 28px;">
          <tr>
            <td style="font-size:15px;color:#1a1a1a;line-height:1.7;">
              <p style="margin:0 0 16px;">Bonjour,</p>

              <p style="margin:0 0 16px;">
                Hier je vous ai envoyé un email à propos de votre fiche Workwave.
              </p>

              <p style="margin:0 0 16px;">
                Le lien dans cet email contenait un bug technique de mon côté qui le rendait inactif. Je m'en excuse, c'est entièrement de ma faute.
              </p>

              <p style="margin:0 0 16px;">
                Voici le <strong>lien correct</strong> vers votre fiche${params.proName ? ` <strong>${params.proName.replace(/</g, "&lt;")}</strong>` : ""} :
              </p>

              <p style="margin:0 0 24px;text-align:center;">
                <a href="${proUrl}" style="display:inline-block;background:#FF5A36;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
                  Voir ma fiche Workwave
                </a>
              </p>

              <p style="margin:0 0 16px;font-size:13px;color:#6B7280;">
                Lien direct : <a href="${proUrl}" style="color:#FF5A36;text-decoration:underline;">${proUrl}</a>
              </p>

              <p style="margin:0 0 16px;">
                Vous pouvez la compléter en 2 minutes (photos, description, horaires) — c'est gratuit, sans engagement.
              </p>

              <p style="margin:0 0 4px;">Encore désolé pour la confusion,</p>

              <div style="margin-top:16px;font-size:14px;color:#6B7280;line-height:1.6;">
                <strong style="color:#1a1a1a;">Willy Gauvrit</strong><br>
                Fondateur de Workwave<br>
                <a href="https://workwave.fr" style="color:#FF5A36;text-decoration:none;">workwave.fr</a> · <a href="mailto:contact@workwave.fr" style="color:#FF5A36;text-decoration:none;">contact@workwave.fr</a>
              </div>

              <div style="border-top:1px solid #E5E7EB;padding-top:16px;margin-top:32px;font-size:11px;color:#9CA3AF;line-height:1.6;">
                <p style="margin:0 0 8px;">
                  Vous recevez cet email car votre entreprise est référencée publiquement dans le registre Sirene et sur Workwave.fr (régime soft opt-in B2B, art. L34-5 CPCE).
                </p>
                <p style="margin:0;">
                  <a href="https://workwave.fr/unsubscribe-all" style="color:#9CA3AF;text-decoration:underline;">Se désinscrire</a> · Workwave SAS, 3 rue des Rosiers 86110 Craon
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
}

async function getListContacts(listId: number): Promise<Array<{ email: string }>> {
  const all: Array<{ email: string }> = [];
  let offset = 0;
  const limit = 500;
  while (true) {
    const res = await brevo<{ contacts: Array<{ email: string }> }>(
      "GET",
      `/contacts/lists/${listId}/contacts?limit=${limit}&offset=${offset}`
    );
    const contacts = res.contacts ?? [];
    all.push(...contacts);
    if (contacts.length < limit) break;
    offset += limit;
  }
  return all;
}

async function main() {
  console.log("============================================");
  console.log("RECUPERATION batch 1 cold email cassé");
  console.log("============================================");
  if (DRY_RUN) console.log("MODE : DRY-RUN (ajouter --execute pour envoyer)");
  if (TEST_MODE) console.log("MODE : TEST (envoie 1 mail a " + ADMIN_TEST_EMAIL + ")");
  if (!DRY_RUN && !TEST_MODE) console.log("MODE : EXECUTE (envoie pour de vrai)");
  console.log();

  // 1. Trouver la liste Brevo du batch 1 (paginer toutes les listes)
  const allLists: Array<{ id: number; name: string }> = [];
  {
    let offset = 0;
    while (true) {
      const page = await brevo<{ lists: Array<{ id: number; name: string }> }>(
        "GET",
        `/contacts/lists?limit=50&offset=${offset}`
      );
      const items = page.lists ?? [];
      allLists.push(...items);
      if (items.length < 50) break;
      offset += 50;
    }
  }
  const list = allLists.find((l) => l.name === LIST_NAME);
  if (!list) {
    console.error(`Liste introuvable : "${LIST_NAME}"`);
    console.log("Listes disponibles :");
    for (const l of allLists) console.log(`  - [${l.id}] ${l.name}`);
    process.exit(1);
  }
  console.log(`Liste : ${list.name} (id=${list.id})`);

  // 2. Recuperer les contacts
  console.log("\n[1/3] Recup contacts Brevo...");
  const brevoContacts = await getListContacts(list.id);
  console.log(`  Total : ${brevoContacts.length} contacts`);

  // 3. Match avec Supabase pour trouver slug + name
  console.log("\n[2/3] Match avec Supabase (slug + nom commercial)...");
  const emails = brevoContacts.map((c) => c.email).filter(Boolean);

  type Pro = { email: string; slug: string; name: string };
  const matched: Pro[] = [];
  const BATCH_QUERY = 100;
  for (let i = 0; i < emails.length; i += BATCH_QUERY) {
    const slice = emails.slice(i, i + BATCH_QUERY);
    const { data } = await supabase
      .from("pros")
      .select("email, slug, name")
      .in("email", slice);
    if (data) {
      const lookup = new Map(data.map((p) => [p.email, p as Pro]));
      for (const e of slice) {
        const p = lookup.get(e);
        if (p) matched.push(p);
        else matched.push({ email: e, slug: "", name: "" });
      }
    }
  }

  const withSlug = matched.filter((m) => m.slug);
  const withoutSlug = matched.filter((m) => !m.slug);
  console.log(`  Match avec slug    : ${withSlug.length}`);
  console.log(`  Match sans slug    : ${withoutSlug.length} (fallback /home)`);

  // 4. Apercu
  console.log("\n[3/3] Apercu 3 premiers :");
  for (const m of matched.slice(0, 3)) {
    const url = m.slug ? `https://workwave.fr/artisan/${m.slug}` : "https://workwave.fr";
    console.log(`  ${m.email.padEnd(35)}  -> ${url}`);
  }

  if (DRY_RUN) {
    console.log(`\n[DRY-RUN] ${matched.length} mails seraient envoyes.`);
    console.log("Ajouter --execute pour envoyer pour de vrai, ou --test pour 1 envoi a " + ADMIN_TEST_EMAIL);
    return;
  }

  // 5. Filtrer les emails deja envoyes (idempotence)
  const alreadySent = loadSentEmails();
  if (alreadySent.size > 0) {
    console.log(`\n[idempotence] ${alreadySent.size} emails deja envoyes precedemment, on les skip.`);
  }

  let pool: Pro[];
  if (TEST_MODE) {
    pool = [
      {
        email: ADMIN_TEST_EMAIL,
        slug: matched[0]?.slug || "",
        name: matched[0]?.name || "ATSAF",
      },
    ];
  } else {
    pool = matched.filter((m) => !alreadySent.has(m.email));
  }

  // Appliquer la limite (pour ne pas depasser le quota Brevo daily)
  const targets: Pro[] = pool.slice(0, LIMIT);

  console.log(`\nENVOI a ${targets.length} destinataires` +
    (pool.length > targets.length ? ` (${pool.length - targets.length} reportes a un prochain run)` : "") +
    "...");

  let ok = 0;
  let ko = 0;
  for (const [i, t] of targets.entries()) {
    const html = buildHtml({ proName: t.name, proSlug: t.slug });
    try {
      await brevo("POST", "/smtp/email", {
        sender: { email: SENDER_EMAIL, name: SENDER_NAME },
        to: [{ email: t.email, name: t.name || undefined }],
        replyTo: { email: REPLY_TO_EMAIL, name: SENDER_NAME },
        subject: "Désolé pour le bug — votre fiche Workwave",
        htmlContent: html,
      });
      ok++;
      if (!TEST_MODE) appendSentEmail(t.email);
      if ((i + 1) % 25 === 0 || i === targets.length - 1) {
        console.log(`  envoyes : ${ok}/${targets.length}`);
      }
    } catch (e) {
      ko++;
      const msg = (e as Error).message;
      console.log(`  ❌ ${t.email} : ${msg.slice(0, 120)}`);
      // Si on detecte un quota depasse, on stoppe net pour pas tout claquer
      if (
        msg.includes("rate limit") ||
        msg.includes("daily limit") ||
        msg.includes("not_enough_credits") ||
        msg.includes("over_quota")
      ) {
        console.log(`\n⚠️ Quota Brevo atteint, arret. Relance demain avec --execute pour finir.`);
        break;
      }
    }
    await sleep(150); // ~6 envois/sec, sous la limite Brevo
  }

  const remaining = pool.length - ok;
  console.log(`\n=== DONE ===`);
  console.log(`  Envoyes ce run     : ${ok}`);
  console.log(`  Echecs             : ${ko}`);
  console.log(`  Restants pour la prochaine fois : ${Math.max(0, remaining - ko)}`);
  if (remaining > 0 && !TEST_MODE) {
    console.log(`  -> npx tsx scripts/brevo-recovery-batch1.ts --execute  (demain pour finir)`);
  }
}

main().catch((err) => {
  console.error("Erreur fatale :", err);
  process.exit(1);
});
