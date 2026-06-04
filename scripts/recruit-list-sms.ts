/**
 * ENVOI SMS à une LISTE de pros (CSV nom;ville;mobile) — recrutement direct.
 *
 * Pour des entreprises trouvées sur Google Maps (PAS encore dans notre base) :
 * on les invite à créer leur fiche gratuitement pour recevoir une demande de
 * leur secteur. Message validé par Willy.
 *
 * USAGE :
 *   npx tsx scripts/recruit-list-sms.ts --dry-run
 *   npx tsx scripts/recruit-list-sms.ts --test-sms=06XXXXXXXX
 *   npx tsx scripts/recruit-list-sms.ts --execute
 *   (--file=<chemin csv> ; défaut ~/Desktop/workwave-menage-bordeaux.csv)
 *
 * Idempotent : tracking/recruit-list-sms.json (un numéro jamais 2×).
 */
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const BREVO_API_KEY = process.env.BREVO_API_KEY!;
const SMS_SENDER = "Workwave";
const STOP = "STOP au 36180";
const MESSAGE =
  "Workwave : une demande de nettoyage de bureaux a Pessac vient d'arriver pres de chez vous. Inscrivez gratuitement votre entreprise pour la recevoir : workwave.fr/pro - " +
  STOP;

function arg(name: string): string | undefined {
  const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
  return eq ? eq.split("=")[1] : undefined;
}
const FILE =
  arg("file") || path.resolve(process.env.HOME!, "Desktop/workwave-menage-bordeaux.csv");
const EXECUTE = process.argv.includes("--execute");
const TEST_SMS = arg("test-sms");
const DRY_RUN = !EXECUTE && !TEST_SMS;
const LIMIT = arg("limit") ? parseInt(arg("limit")!, 10) : Infinity;

const TRACK = path.resolve(process.cwd(), "tracking/recruit-list-sms.json");

function toE164(phone: string): string | null {
  const d = phone.replace(/\D/g, "").replace(/^33/, "0");
  if (!/^0[67]\d{8}$/.test(d)) return null;
  return "+33" + d.slice(1);
}

async function sendSms(recipient: string): Promise<void> {
  const resp = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: SMS_SENDER,
      recipient,
      content: MESSAGE,
      type: "transactional",
    }),
  });
  if (!resp.ok) throw new Error(`${resp.status} ${(await resp.text()).slice(0, 160)}`);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(`\n=== RECRUTEMENT SMS LISTE — ${DRY_RUN ? "DRY-RUN" : TEST_SMS ? "TEST" : "EXECUTE"} ===\n`);
  console.log("Message :\n  " + MESSAGE + "\n");

  // TEST : 1 SMS vers ton numéro
  if (TEST_SMS) {
    const e = toE164(TEST_SMS);
    if (!e) return console.log("⚠️ numéro test invalide");
    await sendSms(e);
    console.log(`✓ SMS TEST envoyé à ${e}`);
    return;
  }

  // Charger la liste
  const lines = fs.readFileSync(FILE, "utf-8").trim().split("\n").slice(1);
  const targets = lines
    .map((l) => {
      const [nom, ville, mobile] = l.split(";");
      return { nom, ville, e164: toE164(mobile || "") };
    })
    .filter((t) => t.e164);
  console.log(`Liste : ${lines.length} lignes → ${targets.length} mobiles valides\n`);

  if (DRY_RUN) {
    console.log("[DRY-RUN] Aucun envoi. 5 premiers :");
    targets.slice(0, 5).forEach((t) => console.log(`  ${t.nom} (${t.ville}) → ${t.e164}`));
    console.log("\n--execute pour envoyer, --test-sms=06... pour 1 test.");
    return;
  }

  // EXECUTE
  let track: { sms: string[] } = { sms: [] };
  try {
    track = JSON.parse(fs.readFileSync(TRACK, "utf-8"));
  } catch {}
  const pool = targets
    .filter((t) => !track.sms.includes(t.e164!))
    .slice(0, LIMIT === Infinity ? undefined : LIMIT);
  console.log(`[SMS] envoi à ${pool.length} entreprises...`);
  let ok = 0;
  for (const t of pool) {
    try {
      await sendSms(t.e164!);
      track.sms.push(t.e164!);
      fs.mkdirSync(path.dirname(TRACK), { recursive: true });
      fs.writeFileSync(TRACK, JSON.stringify(track, null, 2));
      ok++;
      await sleep(350);
    } catch (e) {
      console.log(`  ❌ ${t.nom} ${t.e164} : ${(e as Error).message}`);
    }
  }
  console.log(`\n[SMS] ✓ ${ok} envoyés`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
