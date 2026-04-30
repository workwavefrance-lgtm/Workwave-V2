/**
 * Cold NA - Mail 1 (presentation) - BATCH 5
 *
 * Equivalent du script batch3/batch4, pour la liste id=11 "Pros NA - Step 1 - Batch 5".
 * Tracking idempotent dedie : scripts/.brevo-cold-batch5-sent.json
 *
 * Usage:
 *   npx tsx scripts/brevo-cold-batch5.ts                # dry-run
 *   npx tsx scripts/brevo-cold-batch5.ts --test         # 1 mail a workwave.france@gmail.com
 *   npx tsx scripts/brevo-cold-batch5.ts --execute      # envoie aux pros eligibles
 *   npx tsx scripts/brevo-cold-batch5.ts --execute --limit 100
 */
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
  override: true,
});

import { createClient } from "@supabase/supabase-js";
import { generateGlobalUnsubscribeToken } from "@/lib/utils/unsubscribe-token";

const SENT_LOG_PATH = path.resolve(
  process.cwd(),
  "scripts/.brevo-cold-batch5-sent.json"
);

function loadSentEmails(): Set<string> {
  if (!fs.existsSync(SENT_LOG_PATH)) return new Set();
  try {
    return new Set(JSON.parse(fs.readFileSync(SENT_LOG_PATH, "utf-8")) as string[]);
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
const SENDER_EMAIL = "contact@workwave.fr";
const SENDER_NAME = "Willy Gauvrit";
const REPLY_TO_EMAIL = "contact@workwave.fr";
const ADMIN_TEST_EMAIL = "workwave.france@gmail.com";

const DRY_RUN =
  !process.argv.includes("--execute") && !process.argv.includes("--test");
const TEST_MODE = process.argv.includes("--test");
const limitIdx = process.argv.indexOf("--limit");
const LIMIT =
  limitIdx >= 0 && process.argv[limitIdx + 1]
    ? parseInt(process.argv[limitIdx + 1], 10)
    : Infinity;

const LIST_ID = 11;
const LIST_NAME = "Pros NA - Step 1 - Batch 5";
const SUBJECT = "Votre fiche Workwave est en ligne";

async function brevo<T>(
  method: string,
  endpoint: string,
  body?: object
): Promise<T> {
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(params: { proId: number; proName: string; proSlug: string }): string {
  const proUrl = `https://workwave.fr/artisan/${params.proSlug}`;
  const claimUrl = `https://workwave.fr/pro/reclamer/${params.proSlug}`;
  const unsubToken = generateGlobalUnsubscribeToken(params.proId);
  const unsubUrl = `https://workwave.fr/unsubscribe-all?token=${unsubToken}&id=${params.proId}`;
  const safeName = escapeHtml(params.proName);

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
              <p style="margin:0 0 16px;">Je m'appelle <strong>Willy Gauvrit</strong>, fondateur de Workwave, l'annuaire des professionnels de Nouvelle-Aquitaine (226 000 pros référencés).</p>
              <p style="margin:0 0 16px;">Votre entreprise <strong>${safeName}</strong> est déjà référencée gratuitement sur notre site :</p>
              <p style="margin:0 0 24px;"><a href="${proUrl}" style="color:#FF5A36;text-decoration:underline;">${proUrl}</a></p>
              <p style="margin:0 0 16px;"><strong>Petite alerte importante :</strong> votre fiche a été créée automatiquement à partir des données publiques du registre Sirene. Téléphone, adresse, horaires... certaines infos peuvent être obsolètes ou erronées. Vos clients potentiels qui tombent sur la fiche n'arrivent peut-être pas à vous joindre.</p>
              <p style="margin:0 0 16px;">Vérifiez et corrigez votre fiche en 3 minutes pour que les particuliers de votre zone vous trouvent (et vous contactent) vraiment :</p>
              <p style="margin:0 0 24px;"><a href="${claimUrl}" style="color:#FF5A36;text-decoration:underline;">${claimUrl}</a></p>
              <p style="margin:0 0 16px;">C'est gratuit, sans engagement, et boost votre référencement local sur Google.</p>
              <p style="margin:0 0 4px;">Bonne journée,</p>
              <div style="margin-top:16px;font-size:14px;color:#6B7280;line-height:1.6;">
                <strong style="color:#1a1a1a;">Willy Gauvrit</strong><br>
                Fondateur de Workwave<br>
                <a href="https://workwave.fr" style="color:#FF5A36;text-decoration:none;">workwave.fr</a> · <a href="mailto:contact@workwave.fr" style="color:#FF5A36;text-decoration:none;">contact@workwave.fr</a>
              </div>
              <div style="border-top:1px solid #E5E7EB;padding-top:16px;margin-top:32px;font-size:11px;color:#9CA3AF;line-height:1.6;">
                <p style="margin:0 0 8px;">Vous recevez cet email car votre entreprise est référencée publiquement dans le registre Sirene et sur Workwave.fr (régime soft opt-in B2B, art. L34-5 CPCE).</p>
                <p style="margin:0;"><a href="${unsubUrl}" style="color:#9CA3AF;text-decoration:underline;">Se désinscrire</a> · Workwave SAS, 3 rue des Rosiers 86110 Craon</p>
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
  console.log("==========================================================");
  console.log("Cold NA - Mail 1 (presentation) - BATCH 5");
  console.log("==========================================================");
  if (DRY_RUN) console.log("MODE : DRY-RUN (ajouter --execute pour envoyer)");
  if (TEST_MODE) console.log(`MODE : TEST (envoie 1 mail a ${ADMIN_TEST_EMAIL})`);
  if (!DRY_RUN && !TEST_MODE) console.log("MODE : EXECUTE (envoie pour de vrai)");
  console.log();

  console.log(`[1/4] Recup contacts liste ${LIST_ID} "${LIST_NAME}"...`);
  const brevoContacts = await getListContacts(LIST_ID);
  console.log(`  Total : ${brevoContacts.length} contacts`);

  console.log("\n[2/4] Match avec Supabase (slug + nom commercial)...");
  const emails = brevoContacts.map((c) => c.email).filter(Boolean);

  type Pro = {
    id: number;
    email: string;
    slug: string;
    name: string;
    claimed_by_user_id: string | null;
  };
  const matched: Pro[] = [];
  const BATCH_QUERY = 100;
  for (let i = 0; i < emails.length; i += BATCH_QUERY) {
    const slice = emails.slice(i, i + BATCH_QUERY);
    const { data } = await supabase
      .from("pros")
      .select("id, email, slug, name, claimed_by_user_id")
      .in("email", slice);
    if (data) {
      const lookup = new Map(data.map((p) => [p.email, p as Pro]));
      for (const e of slice) {
        const p = lookup.get(e);
        if (p) matched.push(p);
        else matched.push({ id: 0, email: e, slug: "", name: "", claimed_by_user_id: null });
      }
    }
  }

  const withSlug = matched.filter((m) => m.slug);
  const withoutSlug = matched.filter((m) => !m.slug);
  const alreadyClaimed = matched.filter((m) => m.claimed_by_user_id);

  console.log(`  Match avec slug    : ${withSlug.length}`);
  console.log(`  Match SANS slug    : ${withoutSlug.length} (skipped)`);
  console.log(`  Pros DEJA CLAIM    : ${alreadyClaimed.length} (skipped pour pas spammer)`);

  const eligible = matched.filter((m) => m.slug && !m.claimed_by_user_id);
  console.log(`  Eligibles          : ${eligible.length}`);

  console.log("\n[3/4] Apercu 3 premiers :");
  for (const m of eligible.slice(0, 3)) {
    console.log(`  ${m.email.padEnd(35)}`);
    console.log(`    -> https://workwave.fr/artisan/${m.slug}  (${m.name})`);
  }

  if (DRY_RUN) {
    console.log(`\n[DRY-RUN] ${eligible.length} mails seraient envoyes.`);
    console.log("Ajouter --execute pour envoyer pour de vrai, ou --test pour 1 envoi a " + ADMIN_TEST_EMAIL);
    return;
  }

  console.log("\n[4/4] Envoi via Transactional API...");
  const alreadySent = loadSentEmails();
  if (alreadySent.size > 0) {
    console.log(`  ${alreadySent.size} emails deja envoyes precedemment, skipped.`);
  }

  let pool: Pro[];
  if (TEST_MODE) {
    pool = [{ id: eligible[0]?.id || 1, email: ADMIN_TEST_EMAIL, slug: eligible[0]?.slug || "atsaf", name: eligible[0]?.name || "ATSAF", claimed_by_user_id: null }];
  } else {
    pool = eligible.filter((m) => !alreadySent.has(m.email));
  }

  const targets: Pro[] = pool.slice(0, LIMIT);
  console.log(
    `  ENVOI a ${targets.length} destinataires` +
      (pool.length > targets.length ? ` (${pool.length - targets.length} reportes a un prochain run)` : "") +
      "..."
  );

  let ok = 0;
  let ko = 0;
  for (const [i, t] of targets.entries()) {
    const html = buildHtml({ proId: t.id, proName: t.name, proSlug: t.slug });
    const personalSubject = t.name
      ? `Erreurs possibles sur votre fiche ${t.name}`
      : SUBJECT;
    try {
      await brevo("POST", "/smtp/email", {
        sender: { email: SENDER_EMAIL, name: SENDER_NAME },
        to: [{ email: t.email, name: t.name || undefined }],
        replyTo: { email: REPLY_TO_EMAIL, name: SENDER_NAME },
        subject: personalSubject,
        htmlContent: html,
        headers: {
          "X-Mailin-Tag": "cold-batch5",
          "X-Mailin-Track-Click": "0",
          "X-Mailin-Track-Open": "0",
        },
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
      if (
        msg.includes("rate limit") ||
        msg.includes("daily limit") ||
        msg.includes("not_enough_credits") ||
        msg.includes("over_quota") ||
        msg.includes("DAILY_LIMIT_EXCEEDED")
      ) {
        console.log(`\n⚠️ Quota Brevo atteint, arret. Relance plus tard avec --execute pour finir.`);
        break;
      }
    }
    await sleep(150);
  }

  const remaining = pool.length - ok;
  console.log(`\n=== DONE ===`);
  console.log(`  Envoyes ce run     : ${ok}`);
  console.log(`  Echecs             : ${ko}`);
  console.log(`  Restants pour la prochaine fois : ${Math.max(0, remaining - ko)}`);
  if (remaining > 0 && !TEST_MODE) {
    console.log(`  -> npx tsx scripts/brevo-cold-batch5.ts --execute  (relance pour finir)`);
  }
}

main().catch((err) => {
  console.error("Erreur fatale :", err);
  process.exit(1);
});
