/**
 * SMS recrutement — projet #70 (nettoyage vitres à Hagetmau, Landes).
 * Source : harvest Apify secteur 40/64 (run xebRxylf9OPcYKb0X, déjà payé),
 * 42 mobiles extraits → curation (exclut lavage auto, laveries, peinture).
 * Modèle validé GSM-7 + sender Workwave + STOP 36180. Idempotent.
 *   npx tsx scripts/_sms-hagetmau-p70.ts            # dry-run
 *   npx tsx scripts/_sms-hagetmau-p70.ts --execute
 */
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const BREVO_API_KEY = process.env.BREVO_API_KEY!;
const APPLY = process.argv.includes("--execute");
const TRACK = path.resolve(process.cwd(), "tracking/sms-hagetmau-p70.json");
const SMS_STOP = "STOP au 36180 pour ne plus recevoir.";

// hors-sujet pour un nettoyage de vitres de maison
const EXCLUDE = /lavage|laverie|auto|station|wash|detail|peinture|redline/i;

const all = JSON.parse(fs.readFileSync("/tmp/hagetmau_mobiles.json", "utf8")) as { name: string; phone: string; city: string }[];
const targets = all.filter((p) => !EXCLUDE.test(p.name));
const excluded = all.filter((p) => EXCLUDE.test(p.name));

const content = `Workwave : une demande de nettoyage de vitres vient d'arriver a Hagetmau, pres de chez vous. Reclamez votre fiche (gratuit) pour la voir : workwave.fr/pro ${SMS_STOP}`;

async function main() {
  let sent: string[] = [];
  try { sent = JSON.parse(fs.readFileSync(TRACK, "utf8")); } catch { /* premier run */ }
  console.log(`Mode : ${APPLY ? "EXECUTE" : "DRY-RUN"} · cibles ${targets.length} · exclus ${excluded.length} (${excluded.map(e=>e.name.slice(0,20)).join(", ")})`);
  console.log(`SMS (${content.length} car) : « ${content} »\n`);
  let ok = 0;
  for (const t of targets) {
    const e164 = "+33" + t.phone.slice(1);
    if (sent.includes(e164)) { console.log(`  ⏭️ ${t.name}`); continue; }
    if (!APPLY) { console.log(`  → ${t.name.slice(0,38).padEnd(38)} ${e164} (${t.city})`); continue; }
    const resp = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
      method: "POST",
      headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ sender: "Workwave", recipient: e164, content }),
    });
    if (resp.ok) { sent.push(e164); ok++; console.log(`  ✓ ${t.name.slice(0,38)} ${e164}`); }
    else console.error(`  ✗ ${t.name.slice(0,30)} : ${resp.status} ${(await resp.text()).slice(0,80)}`);
    await new Promise((r) => setTimeout(r, 500));
  }
  if (APPLY) {
    fs.mkdirSync(path.dirname(TRACK), { recursive: true });
    fs.writeFileSync(TRACK, JSON.stringify(sent));
    console.log(`\n✓ ${ok} SMS envoyés.`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
