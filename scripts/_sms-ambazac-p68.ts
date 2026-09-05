/**
 * Envoi SMS ciblé : projet #68 (Électricien à Mourioux-Vieilleville, Creuse).
 * 3 électriciens d'Ambazac (Haute-Vienne, ~25 km) avec mobile, issus des
 * datasets Apify déjà payés. Recrutement (réclame ta fiche gratuite).
 *
 * Modèle validé (GSM-7, sans accent) + sender "Workwave" + STOP 36180 (Brevo).
 * Idempotent : tracking/sms-ambazac-p68.json. Dry-run par défaut, --execute pour envoyer.
 */
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const BREVO_API_KEY = process.env.BREVO_API_KEY!;
const BREVO_BASE = "https://api.brevo.com/v3";
const SMS_SENDER = "Workwave";
const SMS_STOP = "STOP au 36180 pour ne plus recevoir.";
const APPLY = process.argv.includes("--execute");
const TRACK = path.resolve(process.cwd(), "tracking/sms-ambazac-p68.json");

const recipients = [
  { name: "SASU Besnier Électricité", e164: "+33662586279" },
  { name: "BGM Elec", e164: "+33630073985" },
  { name: "Sarlu AP Elec", e164: "+33699313972" },
];

const metier = "electricien";
const ville = "Mourioux-Vieilleville";
const content = `Workwave : une demande de ${metier} vient d'arriver a ${ville}, pres de chez vous. Reclamez votre fiche (gratuit) pour la voir : workwave.fr/pro ${SMS_STOP}`;

async function brevoSms(recipient: string) {
  const resp = await fetch(`${BREVO_BASE}/transactionalSMS/sms`, {
    method: "POST",
    headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ sender: SMS_SENDER, recipient, content }),
  });
  const t = await resp.text();
  if (!resp.ok) throw new Error(`${resp.status} ${t.slice(0, 250)}`);
  return JSON.parse(t || "{}");
}

async function main() {
  let sent: string[] = [];
  try { sent = JSON.parse(fs.readFileSync(TRACK, "utf8")); } catch { /* premier run */ }

  const segs = content.length <= 160 ? 1 : Math.ceil(content.length / 153);
  console.log(`Mode : ${APPLY ? "EXECUTE (envoi réel)" : "DRY-RUN"}`);
  console.log(`\nSMS (${content.length} car · ${segs} segment(s) GSM-7) :`);
  console.log(`  « ${content} »\n`);
  console.log("Destinataires :");
  for (const r of recipients) console.log(`  ${sent.includes(r.e164) ? "⏭️ déjà envoyé" : "→"} ${r.name} · ${r.e164}`);

  if (!APPLY) { console.log("\n[DRY-RUN] Relance avec --execute pour envoyer."); return; }

  console.log("\n[EXECUTE] Envoi...");
  for (const r of recipients) {
    if (sent.includes(r.e164)) { console.log(`  ⏭️ ${r.name} déjà envoyé`); continue; }
    try {
      const res = await brevoSms(r.e164);
      sent.push(r.e164);
      console.log(`  ✓ ${r.name} ${r.e164} (ref ${res.reference || res.messageId || "ok"})`);
    } catch (e) {
      console.error(`  ✗ ${r.name} ${r.e164} : ${(e as Error).message}`);
    }
    await new Promise((res) => setTimeout(res, 600));
  }
  fs.mkdirSync(path.dirname(TRACK), { recursive: true });
  fs.writeFileSync(TRACK, JSON.stringify(sent));
  console.log("\n✓ Terminé.");
}

main().catch((e) => { console.error(e); process.exit(1); });
