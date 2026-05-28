/**
 * Mass cold mail 28/05/2026 : 743 pros BTP Vienne.
 *
 * Objet : "Action requise : Mise à jour de votre fiche Workwave.fr"
 * CTA : "Tapez votre SIRET et récupérez votre fiche" → /pro
 *
 * Securite (lecons CLAUDE.md 30/04 + 23/05) :
 *  - Sender custom : Workwave <contact@workwave.fr> (SPF/DKIM aligned)
 *  - Headers anti-tracking pour preserver le token unsubscribe
 *  - Footer unsubscribe avec token HMAC deterministe
 *  - Tracking JSON idempotent : permet de reprendre si plantage
 *  - Filtres anti-spam : do_not_contact, email_bounced, claimed, blacklist
 *  - Rate limit 2 mails/sec (sleep 500ms entre chaque)
 *
 * Idempotent : relancer le script ne re-envoie pas aux destinataires deja
 * traites (tracking dans tracking/mass-cold-may28.json).
 */
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { generateGlobalUnsubscribeToken } from "../lib/utils/unsubscribe-token";

const BASE_URL = "https://workwave.fr";
const TRACKING_FILE = path.resolve(process.cwd(), "tracking/mass-cold-may28.json");
const RATE_LIMIT_MS = 600; // 600ms entre chaque envoi = ~1.6/sec (marge sous le 2/sec Resend)
const MAX_PER_RUN = 95; // Resend free tier : 100/jour. On garde 5 de marge pour les
// autres mails transactionnels du site (claim welcome, alerte projet, etc.)

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY!);

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

type Tracking = {
  startedAt: string;
  totalEligible: number;
  sent: Array<{ proId: number; email: string; resendId: string; at: string }>;
  failed: Array<{ proId: number; email: string; error: string; at: string }>;
};

function loadTracking(): Tracking {
  if (!fs.existsSync(path.dirname(TRACKING_FILE))) {
    fs.mkdirSync(path.dirname(TRACKING_FILE), { recursive: true });
  }
  if (!fs.existsSync(TRACKING_FILE)) {
    const init: Tracking = {
      startedAt: new Date().toISOString(),
      totalEligible: 0,
      sent: [],
      failed: [],
    };
    fs.writeFileSync(TRACKING_FILE, JSON.stringify(init, null, 2));
    return init;
  }
  return JSON.parse(fs.readFileSync(TRACKING_FILE, "utf-8"));
}

function saveTracking(t: Tracking) {
  fs.writeFileSync(TRACKING_FILE, JSON.stringify(t, null, 2));
}

function buildHtml(params: { proName: string; proId: number }): string {
  const unsubToken = generateGlobalUnsubscribeToken(params.proId);
  const unsubUrl = `${BASE_URL}/unsubscribe-all?token=${unsubToken}&id=${params.proId}`;
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#FFFFFF;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <div style="padding:32px 36px 24px;">
      <p style="margin:0 0 6px;font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Workwave</p>
      <h1 style="margin:0 0 24px;font-size:20px;color:#0A0A0A;font-weight:700;letter-spacing:-0.01em;line-height:1.3;">Mise &agrave; jour de votre fiche Workwave</h1>
      <p style="margin:0 0 16px;font-size:15px;color:#0A0A0A;line-height:1.7;">Bonjour,</p>
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">Votre entreprise <strong style="color:#0A0A0A;">${params.proName}</strong> est d&eacute;sormais r&eacute;pertori&eacute;e sur Workwave.</p>
      <p style="margin:0 0 22px;font-size:15px;color:#374151;line-height:1.7;">Afin de garantir que les clients qui cherchent vos services puissent vous contacter sans erreur, merci de valider vos coordonn&eacute;es ici&nbsp;:</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${BASE_URL}/pro" style="display:inline-block;background:#FF5A36;color:#FFFFFF;text-decoration:none;padding:14px 34px;border-radius:9999px;font-size:15px;font-weight:600;letter-spacing:-0.01em;">Tapez votre SIRET et r&eacute;cup&eacute;rez votre fiche</a>
      </div>
      <p style="margin:0 0 6px;font-size:14px;color:#374151;line-height:1.7;text-align:center;">C'est gratuit et cela prend moins d'une minute.</p>
      <p style="margin:32px 0 4px;font-size:14px;color:#6B7280;line-height:1.6;">Cordialement,</p>
      <p style="margin:0;font-size:14px;color:#0A0A0A;line-height:1.6;font-weight:500;">L'&eacute;quipe Workwave</p>
    </div>
    <div style="padding:14px 36px;background:#FAFAFA;border-top:1px solid #E5E7EB;text-align:center;">
      <p style="margin:0 0 4px;color:#9CA3AF;font-size:11px;line-height:1.6;">Workwave &mdash; Annuaire des professionnels de Nouvelle-Aquitaine</p>
      <p style="margin:0;color:#9CA3AF;font-size:11px;line-height:1.6;"><a href="${unsubUrl}" style="color:#9CA3AF;text-decoration:underline;">Se d&eacute;sinscrire</a> de toute communication Workwave</p>
    </div>
  </div>
</body></html>`;
}

async function main() {
  console.log("=== MASS COLD MAIL 28/05/2026 ===\n");

  // 1) Charger tracking
  const tracking = loadTracking();
  const alreadySent = new Set(tracking.sent.map((s) => s.email.toLowerCase()));
  const alreadyFailed = new Set(tracking.failed.map((f) => f.email.toLowerCase()));
  console.log(`Tracking : ${alreadySent.size} deja sent, ${alreadyFailed.size} deja failed`);

  // 2) Charger blacklist
  const { data: bl } = await sb.from("email_blacklist").select("email");
  const blacklist = new Set((bl || []).map((b: { email: string }) => b.email.toLowerCase()));
  console.log(`Blacklist : ${blacklist.size} emails`);

  // 3) Recuperer destinataires eligibles
  console.log("\nChargement des destinataires (peut prendre 30s)...");
  const PAGE = 1000;
  let offset = 0;
  type Target = { id: number; email: string; name: string };
  const targets: Target[] = [];
  const seenEmails = new Set<string>();

  while (true) {
    const { data } = await sb
      .from("pros")
      .select("id, email, name")
      .not("email", "is", null)
      .eq("is_active", true)
      .is("deleted_at", null)
      .eq("do_not_contact", false)
      .eq("email_bounced", false)
      .is("claimed_by_user_id", null)
      .range(offset, offset + PAGE - 1);
    const rows = data || [];
    if (rows.length === 0) break;
    for (const r of rows as Array<{ id: number; email: string; name: string }>) {
      const em = (r.email || "").trim().toLowerCase();
      if (!em) continue;
      if (blacklist.has(em)) continue;
      if (alreadySent.has(em)) continue;
      if (seenEmails.has(em)) continue;
      seenEmails.add(em);
      targets.push({ id: r.id, email: em, name: r.name || "votre entreprise" });
    }
    offset += rows.length;
  }

  tracking.totalEligible = alreadySent.size + targets.length;
  console.log(`Disponible : ${targets.length}, total cible : ${tracking.totalEligible}`);

  if (targets.length === 0) {
    console.log("Aucun nouveau destinataire. Tout est deja envoye.");
    return;
  }

  // Cap a MAX_PER_RUN pour respecter le quota Resend free tier (100/jour).
  // Le cron quotidien va vider le reste sur plusieurs jours.
  const todayBatch = targets.slice(0, MAX_PER_RUN);
  console.log(`A envoyer ce run (cap ${MAX_PER_RUN}) : ${todayBatch.length}\n`);

  // 4) Envoi 1 par 1 avec rate limit
  console.log(`Envoi en cours (sleep ${RATE_LIMIT_MS}ms entre chaque) ...\n`);
  let progress = 0;
  for (const t of todayBatch) {
    progress++;
    const html = buildHtml({ proName: t.name, proId: t.id });
    try {
      const r = await resend.emails.send({
        from: "Workwave <contact@workwave.fr>",
        to: t.email,
        subject: "Action requise : Mise à jour de votre fiche Workwave.fr",
        html,
        headers: {
          "X-Mailin-Track-Click": "0",
          "X-Mailin-Track-Open": "0",
        },
      });
      if (r.error) {
        tracking.failed.push({
          proId: t.id,
          email: t.email,
          error: r.error.message || String(r.error),
          at: new Date().toISOString(),
        });
        console.log(`  [${progress}/${todayBatch.length}] FAIL ${t.email} : ${r.error.message}`);
      } else {
        tracking.sent.push({
          proId: t.id,
          email: t.email,
          resendId: r.data?.id || "",
          at: new Date().toISOString(),
        });
        if (progress % 25 === 0 || progress === targets.length) {
          console.log(`  [${progress}/${targets.length}] sent OK (last: ${t.email})`);
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      tracking.failed.push({
        proId: t.id,
        email: t.email,
        error: msg,
        at: new Date().toISOString(),
      });
      console.log(`  [${progress}/${todayBatch.length}] EXCEPTION ${t.email} : ${msg}`);
    }

    // Save tracking apres CHAQUE envoi : evite le risque de re-envoi en
    // cas de kill du process. Cout I/O negligeable (~5ms) vs cout d'un
    // double envoi (mauvaise UX cote pro + risque RGPD).
    saveTracking(tracking);

    // Log progress tous les 25 envois pour pas spammer stdout
    if (progress % 25 === 0 || progress === targets.length) {
      console.log(`  [${progress}/${todayBatch.length}] checkpoint (last: ${t.email})`);
    }

    await sleep(RATE_LIMIT_MS);
  }

  saveTracking(tracking);

  // 5) Recap final
  console.log("\n=== FIN ===");
  console.log(`Total sent  : ${tracking.sent.length}`);
  console.log(`Total fail  : ${tracking.failed.length}`);
  console.log(`Tracking    : ${TRACKING_FILE}`);
  if (tracking.failed.length > 0) {
    console.log("\nDernieres erreurs :");
    for (const f of tracking.failed.slice(-3)) {
      console.log(`  ${f.email} : ${f.error.slice(0, 100)}`);
    }
  }
}

main().catch((e) => {
  console.error("Crash :", e instanceof Error ? e.message : e);
  process.exit(1);
});
