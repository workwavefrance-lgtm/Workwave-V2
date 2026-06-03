/**
 * RECRUTEMENT PROS NON RÉCLAMÉS — par projet, via Brevo (email + SMS).
 *
 * Quand un projet est déposé, on contacte les pros NON réclamés du même métier
 * (principal OU secondaire) + même département pour les inciter à réclamer leur
 * fiche → ils voient la demande → ils débloquent (9,90 €). Automatise le hustle
 * manuel de Willy, proprement (sender authentifié, désinscription, blacklist).
 *
 * Canaux :
 *   - EMAIL : pros avec adresse, hors blacklist (email_blacklist + bounced +
 *     do_not_contact). Brevo /smtp/email, sender contact@workwave.fr.
 *   - SMS   : pros avec MOBILE (06/07), hors do_not_contact. Brevo
 *     /transactionalSMS/sms, sender "Workwave".
 *
 * ⚠️ SMS : nécessite des CRÉDITS SMS + un SENDER "Workwave" enregistré dans
 *    Brevo (sinon l'API renvoie une erreur — c'est attendu tant que non setup).
 *    Le STOP légal France est géré par Brevo à la config du sender.
 *
 * USAGE :
 *   npx tsx scripts/recruit-pros.ts --project=56                 # dry-run (défaut)
 *   npx tsx scripts/recruit-pros.ts --project=56 --channel=email
 *   npx tsx scripts/recruit-pros.ts --project=56 --test          # 1 email -> admin
 *   npx tsx scripts/recruit-pros.ts --project=56 --execute --limit=1
 *   npx tsx scripts/recruit-pros.ts --project=56 --execute       # envoi réel complet
 *
 * Idempotent : tracking/recruit-<projectId>.json (un pro n'est jamais contacté
 * 2× pour le même projet).
 */
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { createClient } from "@supabase/supabase-js";
import { generateGlobalUnsubscribeToken } from "../lib/utils/unsubscribe-token";

const BASE_URL = "https://workwave.fr";
const BREVO_API_KEY = process.env.BREVO_API_KEY!;
const BREVO_BASE = "https://api.brevo.com/v3";
const SENDER_EMAIL = "contact@workwave.fr";
const SENDER_NAME = "Workwave";
const REPLY_TO = "contact@workwave.fr";
const SMS_SENDER = "Workwave"; // 11 chars max, alphanumérique
const ADMIN_TEST_EMAIL = "workwave.france@gmail.com";
// STOP : à confirmer au setup du sender SMS Brevo (Brevo gère le STOP France).
const SMS_STOP = "STOP au 36180 pour ne plus recevoir.";

const SOURCE_WHITELIST = ["sirene", "pagesjaunes", "manual", "ai_signup"];
const CHUNK = 40;
const CHUNK_DELAY_MS = 1200;

// ---- args ----
function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--"))
    return process.argv[i + 1];
  const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
  return eq ? eq.split("=")[1] : undefined;
}
const PROJECT_ID = parseInt(arg("project") || "0", 10);
const EXECUTE = process.argv.includes("--execute");
const TEST_MODE = process.argv.includes("--test");
const DRY_RUN = !EXECUTE && !TEST_MODE;
const LIMIT = arg("limit") ? parseInt(arg("limit")!, 10) : Infinity;
const CHANNEL = (arg("channel") || "both") as "email" | "sms" | "both";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const URGENCY_LABELS: Record<string, string> = {
  today: "Aujourd'hui",
  this_week: "Cette semaine",
  this_month: "Ce mois-ci",
  not_urgent: "Pas pressé",
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function brevo(method: string, endpoint: string, body: object) {
  const resp = await fetch(`${BREVO_BASE}${endpoint}`, {
    method,
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`${method} ${endpoint} -> ${resp.status} ${t.slice(0, 200)}`);
  }
  return resp.json();
}

// ---- idempotence ----
const TRACK_PATH = path.resolve(process.cwd(), `tracking/recruit-${PROJECT_ID}.json`);
type Track = { emails: string[]; sms: string[] };
function loadTrack(): Track {
  try {
    return JSON.parse(fs.readFileSync(TRACK_PATH, "utf-8"));
  } catch {
    return { emails: [], sms: [] };
  }
}
function saveTrack(t: Track) {
  fs.mkdirSync(path.dirname(TRACK_PATH), { recursive: true });
  fs.writeFileSync(TRACK_PATH, JSON.stringify(t, null, 2));
}

// ---- phone helpers ----
function toE164(phone: string): string | null {
  const d = phone.replace(/\D/g, "");
  let local = d;
  if (d.startsWith("33")) local = "0" + d.slice(2);
  if (!/^0[67]\d{8}$/.test(local)) return null; // mobile FR only
  return "+33" + local.slice(1);
}

// ---- email template (validé : pas de prix, focus "réclamer gratuit") ----
function buildEmail(opts: {
  proId: number;
  proName: string;
  proSlug: string;
  metier: string;
  ville: string;
  summary: string;
  delai: string;
}): string {
  const claimUrl = `${BASE_URL}/pro/reclamer/${opts.proSlug}`;
  const unsubUrl = `${BASE_URL}/unsubscribe-all?token=${generateGlobalUnsubscribeToken(
    opts.proId
  )}&id=${opts.proId}`;
  const e = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#F7F7F7;margin:0;padding:24px;color:#0A0A0A;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #E5E5E5;border-radius:16px;padding:32px;">
    <p style="font-family:'SF Mono',Menlo,monospace;font-size:11px;color:#999;letter-spacing:.2em;margin:0 0 18px;">[ WORKWAVE &middot; UNE DEMANDE PR&Egrave;S DE CHEZ VOUS ]</p>
    <h1 style="font-size:23px;font-weight:800;letter-spacing:-.02em;margin:0 0 8px;">Une demande de ${e(opts.metier)} &agrave; ${e(opts.ville)}</h1>
    <p style="font-size:14px;color:#525252;line-height:1.6;margin:0 0 20px;">Bonjour ${e(opts.proName)}, votre entreprise est r&eacute;f&eacute;renc&eacute;e sur Workwave mais votre fiche n'est pas encore r&eacute;clam&eacute;e. Un particulier vient de d&eacute;poser cette demande dans votre zone&nbsp;:</p>
    <div style="background:#FAFAFA;border-left:3px solid #FF5A36;padding:18px;border-radius:8px;margin:0 0 22px;">
      <h2 style="font-size:16px;font-weight:700;margin:0 0 8px;">${e(opts.metier)} &middot; ${e(opts.ville)}</h2>
      <p style="font-size:13px;color:#525252;line-height:1.55;margin:0 0 10px;">${e(opts.summary)}</p>
      <p style="font-size:12px;color:#999;margin:0;">D&eacute;lai&nbsp;: <strong style="color:#0A0A0A;">${e(opts.delai)}</strong></p>
    </div>
    <a href="${claimUrl}" style="display:inline-block;background:#FF5A36;color:#fff;padding:14px 26px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;margin:0 0 20px;">R&eacute;clamer ma fiche (gratuit) &rarr;</a>
    <p style="font-size:13px;color:#525252;line-height:1.6;margin:0;">R&eacute;clamez votre fiche <strong>gratuitement</strong> pour voir cette demande dans votre espace et &ecirc;tre mis en relation. Acc&egrave;s gratuit &agrave; tous les projets de votre zone, sans abonnement et sans engagement.</p>
    <hr style="border:none;border-top:1px solid #E5E5E5;margin:24px 0 14px;">
    <p style="font-size:11px;color:#999;text-align:center;line-height:1.5;">Vous recevez cet email car votre entreprise est r&eacute;f&eacute;renc&eacute;e sur Workwave (sources publiques). <a href="${unsubUrl}" style="color:#999;">Se d&eacute;sinscrire</a> &middot; <a href="${BASE_URL}" style="color:#999;">workwave.fr</a></p>
  </div>
</body></html>`;
}

function buildSms(metier: string, ville: string): string {
  // Sans accents = GSM-7 (1 segment, moins cher). Lien court (lookup SIRET).
  const noAccent = (s: string) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return `Workwave : une demande de ${noAccent(metier.toLowerCase())} vient d'arriver a ${noAccent(ville)}, pres de chez vous. Reclamez votre fiche (gratuit) pour la voir : ${BASE_URL.replace("https://", "")}/pro ${SMS_STOP}`;
}

async function main() {
  if (!PROJECT_ID) {
    console.error("❌ --project=<id> requis");
    process.exit(1);
  }
  console.log(
    `\n=== RECRUTEMENT PROS — projet #${PROJECT_ID} — canal=${CHANNEL} — ${
      DRY_RUN ? "DRY-RUN" : TEST_MODE ? "TEST" : "EXECUTE"
    } ===\n`
  );

  // 1) projet
  const { data: proj } = await sb
    .from("projects")
    .select(
      "id, category_id, urgency, ai_qualification, city:cities(name, department_id), category:categories(name)"
    )
    .eq("id", PROJECT_ID)
    .single();
  if (!proj) {
    console.error("❌ projet introuvable");
    process.exit(1);
  }
  const p = proj as Record<string, unknown>;
  const metier = ((p.category as { name?: string })?.name as string) || "professionnel";
  const ville = ((p.city as { name?: string })?.name as string) || "votre secteur";
  const deptId = (p.city as { department_id?: number })?.department_id;
  const summary =
    ((p.ai_qualification as { summary?: string })?.summary as string) ||
    "Un particulier recherche un professionnel dans votre zone.";
  const delai = URGENCY_LABELS[(p.urgency as string) || ""] || "À définir";
  console.log(`Projet : ${metier} à ${ville} (dépt ${deptId})`);
  console.log(`Résumé : ${summary}\n`);

  if (!deptId) {
    console.error("❌ projet sans département");
    process.exit(1);
  }

  // 2) villes du département
  const { data: cities } = await sb
    .from("cities")
    .select("id")
    .eq("department_id", deptId);
  const cityIds = (cities || []).map((c: { id: number }) => c.id);

  // 3) pros non réclamés du métier (principal OU secondaire) + département
  const catId = p.category_id as number;
  const pros: Array<{
    id: number;
    name: string;
    slug: string;
    email: string | null;
    phone: string | null;
    email_bounced: boolean | null;
  }> = [];
  let offset = 0;
  while (true) {
    const { data } = await sb
      .from("pros")
      .select("id, name, slug, email, phone, email_bounced")
      .or(`category_id.eq.${catId},secondary_category_ids.cs.{${catId}}`)
      .in("city_id", cityIds)
      .is("claimed_by_user_id", null)
      .eq("is_active", true)
      .is("deleted_at", null)
      .eq("do_not_contact", false)
      .in("source", SOURCE_WHITELIST)
      .range(offset, offset + 999);
    const rows = data || [];
    if (rows.length === 0) break;
    pros.push(...(rows as typeof pros));
    offset += rows.length;
  }
  console.log(`Pros non réclamés matchés : ${pros.length}`);

  // 4) blacklist email
  const candidateEmails = pros
    .map((x) => x.email)
    .filter((e): e is string => !!e);
  const blacklisted = new Set<string>();
  for (let i = 0; i < candidateEmails.length; i += 200) {
    const slice = candidateEmails.slice(i, i + 200);
    const { data } = await sb
      .from("email_blacklist")
      .select("email")
      .in("email", slice);
    (data || []).forEach((b: { email: string }) => blacklisted.add(b.email));
  }

  // 5) cibles par canal
  const emailTargets = pros.filter(
    (x) => x.email && !blacklisted.has(x.email) && !x.email_bounced
  );
  const smsTargets = pros
    .map((x) => ({ ...x, e164: x.phone ? toE164(x.phone) : null }))
    .filter((x) => x.e164);

  console.log(
    `→ Email : ${emailTargets.length} cibles | SMS : ${smsTargets.length} cibles (mobiles)\n`
  );

  const track = loadTrack();

  // ---------- DRY-RUN ----------
  if (DRY_RUN) {
    console.log("[DRY-RUN] Aucun envoi. Aperçus :\n");
    if (CHANNEL !== "sms" && emailTargets[0]) {
      console.log("EMAIL exemple →", emailTargets[0].email, `(${emailTargets[0].name})`);
      console.log(`  Objet : Une demande de ${metier.toLowerCase()} à ${ville} — réclamez votre fiche Workwave`);
      console.log(`  CTA   : ${BASE_URL}/pro/reclamer/${emailTargets[0].slug}`);
    }
    if (CHANNEL !== "email" && smsTargets[0]) {
      console.log("\nSMS exemple →", smsTargets[0].e164, `(${smsTargets[0].name})`);
      console.log("  " + buildSms(metier, ville));
    }
    console.log(
      `\nPour envoyer : --execute (réel) ou --test (1 email -> ${ADMIN_TEST_EMAIL}). --limit=N pour borner.`
    );
    return;
  }

  // ---------- TEST : 1 email vers admin ----------
  if (TEST_MODE) {
    if (CHANNEL === "sms") {
      console.log("⚠️ --test n'envoie qu'un email (pas de SMS test sans numéro). Utilise --execute --limit=1 pour un vrai SMS.");
    }
    const sample = emailTargets[0] || pros[0];
    const html = buildEmail({
      proId: sample?.id || 1,
      proName: sample?.name || "ATSAF",
      proSlug: sample?.slug || "atsaf",
      metier,
      ville,
      summary,
      delai,
    });
    await brevo("POST", "/smtp/email", {
      sender: { email: SENDER_EMAIL, name: SENDER_NAME },
      to: [{ email: ADMIN_TEST_EMAIL }],
      replyTo: { email: REPLY_TO, name: SENDER_NAME },
      subject: `[TEST] Une demande de ${metier.toLowerCase()} à ${ville} — réclamez votre fiche`,
      htmlContent: html,
      headers: { "X-Mailin-Track-Click": "0", "X-Mailin-Track-Open": "0" },
    });
    console.log(`✓ Email TEST envoyé à ${ADMIN_TEST_EMAIL}`);
    return;
  }

  // ---------- EXECUTE ----------
  // EMAIL
  if (CHANNEL !== "sms") {
    const pool = emailTargets
      .filter((x) => !track.emails.includes(x.email!))
      .slice(0, LIMIT === Infinity ? undefined : LIMIT);
    console.log(`[EMAIL] envoi à ${pool.length} pros...`);
    let ok = 0;
    for (let i = 0; i < pool.length; i += CHUNK) {
      const chunk = pool.slice(i, i + CHUNK);
      await Promise.all(
        chunk.map(async (t) => {
          try {
            await brevo("POST", "/smtp/email", {
              sender: { email: SENDER_EMAIL, name: SENDER_NAME },
              to: [{ email: t.email, name: t.name || undefined }],
              replyTo: { email: REPLY_TO, name: SENDER_NAME },
              subject: `Une demande de ${metier.toLowerCase()} à ${ville} — réclamez votre fiche Workwave`,
              htmlContent: buildEmail({
                proId: t.id,
                proName: t.name,
                proSlug: t.slug,
                metier,
                ville,
                summary,
                delai,
              }),
              headers: { "X-Mailin-Track-Click": "0", "X-Mailin-Track-Open": "0" },
            });
            track.emails.push(t.email!);
            ok++;
          } catch (e) {
            console.log(`  ❌ ${t.email} : ${(e as Error).message.slice(0, 120)}`);
          }
        })
      );
      saveTrack(track);
      if (i + CHUNK < pool.length) await sleep(CHUNK_DELAY_MS);
    }
    console.log(`[EMAIL] ✓ ${ok} envoyés`);
  }

  // SMS
  if (CHANNEL !== "email") {
    const pool = smsTargets
      .filter((x) => !track.sms.includes(x.e164!))
      .slice(0, LIMIT === Infinity ? undefined : LIMIT);
    console.log(`[SMS] envoi à ${pool.length} pros...`);
    const content = buildSms(metier, ville);
    let ok = 0;
    for (const t of pool) {
      try {
        await brevo("POST", "/transactionalSMS/sms", {
          sender: SMS_SENDER,
          recipient: t.e164,
          content,
          type: "transactional",
        });
        track.sms.push(t.e164!);
        ok++;
        saveTrack(track);
        await sleep(300);
      } catch (e) {
        console.log(`  ❌ ${t.e164} : ${(e as Error).message.slice(0, 140)}`);
        if (/credit|sender|not_enough|unauthorized/i.test((e as Error).message)) {
          console.log(
            "\n⚠️ SMS Brevo non configuré (crédits + sender 'Workwave' à activer dans Brevo). Arrêt SMS."
          );
          break;
        }
      }
    }
    console.log(`[SMS] ✓ ${ok} envoyés`);
  }

  console.log("\n=== Terminé ===");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
