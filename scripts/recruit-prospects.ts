/**
 * Recrutement des PROSPECTS (table prospects) quand un projet est déposé.
 *
 * Pour un projet (métier × département), envoie un SMS aux entreprises moissonnées
 * sur Google Maps (hors base) pour qu'elles créent leur fiche et reçoivent la demande.
 * Message HONNÊTE : il y a une vraie demande (déclenché par un projet réel).
 *
 * USAGE :
 *   npx tsx scripts/recruit-prospects.ts --project=54 --dry-run
 *   npx tsx scripts/recruit-prospects.ts --project=54 --execute
 *   npx tsx scripts/recruit-prospects.ts --category=couvreur --dept=33 --label="Bordeaux" --execute
 *   (--test-sms=06XXXXXXXX  | --limit=N)
 *
 * Idempotent : tag contacted_at => un prospect jamais SMS 2×. Respecte do_not_contact (STOP).
 */
import * as dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const BREVO_API_KEY = process.env.BREVO_API_KEY!;
const SMS_SENDER = "Workwave";
const STOP = "STOP au 36180";

function arg(name: string): string | undefined {
  const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
  return eq ? eq.split("=")[1] : undefined;
}
const PROJECT = arg("project");
const CAT = arg("category");
const DEPT = arg("dept");
const LABEL = arg("label");
const EXECUTE = process.argv.includes("--execute");
const TEST_SMS = arg("test-sms");
const DRY_RUN = !EXECUTE && !TEST_SMS;
const LIMIT = arg("limit") ? parseInt(arg("limit")!, 10) : Infinity;

function toE164(phone: string): string | null {
  const d = (phone || "").replace(/\D/g, "").replace(/^33/, "0");
  if (!/^0[67]\d{8}$/.test(d)) return null;
  return "+33" + d.slice(1);
}
function buildMessage(metier: string, lieu: string): string {
  return `Workwave : une demande de ${metier} vient d'arriver pres de ${lieu}. Inscrivez gratuitement votre entreprise pour la recevoir : workwave.fr/pro - ${STOP}`;
}
async function sendSms(recipient: string, content: string): Promise<void> {
  const resp = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
    method: "POST",
    headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ sender: SMS_SENDER, recipient, content, type: "transactional" }),
  });
  if (!resp.ok) throw new Error(`${resp.status} ${(await resp.text()).slice(0, 160)}`);
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function resolveFromProject(id: string): Promise<{ slug: string; dept: string; lieu: string; metier: string } | null> {
  const { data: p } = await sb.from("projects").select("category_id, city_id").eq("id", id).single();
  if (!p) return null;
  const { data: cat } = await sb.from("categories").select("slug, name").eq("id", p.category_id).single();
  const { data: city } = await sb.from("cities").select("name, department_id").eq("id", p.city_id).single();
  let dept = "", lieu = city?.name || "";
  if (city?.department_id) {
    const { data: d } = await sb.from("departments").select("code, name").eq("id", city.department_id).single();
    dept = d?.code || "";
    lieu = city?.name || d?.name || "";
  }
  return { slug: cat?.slug || "", dept, lieu, metier: (cat?.name || cat?.slug || "").toLowerCase() };
}

async function main() {
  console.log(`\n=== RECRUTEMENT PROSPECTS — ${DRY_RUN ? "DRY-RUN" : TEST_SMS ? "TEST" : "EXECUTE"} ===\n`);

  let slug = CAT || "", dept = DEPT || "", lieu = LABEL || "", metier = CAT || "";
  if (PROJECT) {
    const r = await resolveFromProject(PROJECT);
    if (!r) return console.log(`⚠️ projet ${PROJECT} introuvable`);
    ({ slug, dept, lieu, metier } = r);
    console.log(`Projet ${PROJECT} -> métier=${slug} (${metier}) | dept=${dept} | lieu=${lieu}`);
  }
  if (!slug || !dept) return console.log("⚠️ il faut --project=<id> OU --category=<slug> --dept=<code>");
  if (!lieu) lieu = `votre secteur (${dept})`;
  const message = buildMessage(metier || slug, lieu);
  console.log("Message :\n  " + message + "\n");

  if (TEST_SMS) {
    const e = toE164(TEST_SMS); if (!e) return console.log("⚠️ numéro test invalide");
    await sendSms(e, message); console.log(`✓ SMS TEST envoyé à ${e}`); return;
  }

  // Prospects éligibles : métier × dept, jamais contactés, pas opt-out
  const { data: pool } = await sb.from("prospects")
    .select("id, name, city, phone")
    .eq("category_slug", slug).eq("department_code", dept)
    .is("contacted_at", null).eq("do_not_contact", false);
  const targets = (pool || []).map((p: any) => ({ ...p, e164: toE164(p.phone) })).filter((p) => p.e164);
  console.log(`Prospects éligibles : ${targets.length}`);

  if (DRY_RUN) {
    targets.slice(0, 8).forEach((t: any) => console.log(`  ${t.name} (${t.city}) ${t.phone}`));
    console.log(`\n--execute pour envoyer (${Math.min(targets.length, LIMIT)} SMS).`);
    return;
  }

  const pool2 = targets.slice(0, LIMIT === Infinity ? undefined : LIMIT);
  console.log(`[SMS] envoi à ${pool2.length} prospects...`);
  let ok = 0;
  for (const t of pool2) {
    try {
      await sendSms(t.e164!, message);
      await sb.from("prospects").update({ contacted_at: new Date().toISOString(), contact_channel: "sms" }).eq("id", t.id);
      ok++;
      await sleep(350);
    } catch (e) { console.log(`  ❌ ${t.name} ${t.e164}: ${(e as Error).message}`); }
  }
  console.log(`\n[SMS] ✓ ${ok} envoyés (taggés contacted_at).`);
}
main().catch((e) => { console.error(e); process.exit(1); });
