import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { Resend } from "resend";
import { createHmac } from "crypto";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const BASE = "https://workwave.fr";
const DRY = process.argv.includes("--dry");

// Emails de Willy lui-même (ne pas s'auto-envoyer)
const SELF = new Set(["workwave.france@gmail.com", "gauvrit.86@gmail.com", "invest.home86@gmail.com"]);

// Déjà envoyés au 1er run (les 2 derniers ont rate-limité) : pas de doublon.
const SENT = new Set([
  "nicolas@enr-batiment.fr", "go.renovcontact@gmail.com", "id.renov86@gmail.com",
  "mlp.birot@gmail.com", "melimenu971@gmail.com", "delideco@orange.fr",
  "contact@lacigognemalicieuse.com", "adsolutions.contact@orange.fr",
  "contact@maisonrenovationdinard.fr", "fabien@famoussewood.fr",
  "mjrenovenergies@gmail.com", "ben.interieur@outlook.fr",
  "contact@mb-plansprojets.fr", "cordiste@3six.fr", "contact@2esr.fr",
  "contact.elytravaux@gmail.com", "i2medesign@gmail.com",
]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function globalUnsubToken(proId: number): string {
  return createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY!)
    .update(`cold-email-global-blacklist:${proId}`).digest("hex");
}

function buildHtml(proId: number): string {
  const unsub = `${BASE}/unsubscribe-all?token=${globalUnsubToken(proId)}&id=${proId}`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff;">
  <div style="max-width:560px;margin:0 auto;padding:28px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.65;color:#1a1a1a;">
    <p style="margin:0 0 16px;">Bonjour,</p>
    <p style="margin:0 0 16px;">Chez <a href="${BASE}" style="color:#1a1a1a;">Workwave</a>, on d&eacute;veloppe des outils pour simplifier le quotidien des artisans. Une question simple&nbsp;: <strong>qu'est-ce qui vous prend le plus de temps en dehors du chantier&nbsp;?</strong></p>
    <p style="margin:0 0 22px;">2 minutes, c'est lu par l'&eacute;quipe et &ccedil;a oriente vraiment ce qu'on construit pour vous.</p>
    <p style="margin:0 0 24px;">
      <a href="${BASE}/enquete-pro" style="display:inline-block;background:#FF5A36;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 26px;border-radius:9999px;font-size:15px;">Donner mon avis (2 min)</a>
    </p>
    <p style="margin:0 0 4px;">Merci d'avance,</p>
    <p style="margin:0 0 24px;"><strong>Willy Gauvrit</strong><br>
    <span style="color:#666;font-size:13px;">Fondateur de Workwave &middot; <a href="mailto:contact@workwave.fr" style="color:#666;">contact@workwave.fr</a></span></p>
    <p style="margin:18px 0 0;border-top:1px solid #eee;padding-top:12px;font-size:12px;color:#9CA3AF;">
      Workwave (Willy Gauvrit, entrepreneur individuel), 3 rue des Rosiers 86110 Craon.
      <a href="${unsub}" style="color:#9CA3AF;text-decoration:underline;">Ne plus recevoir d'emails de Workwave</a>.
    </p>
  </div>
</body></html>`;
}

async function main() {
  const { data: bl } = await sb.from("email_blacklist").select("email");
  const blset = new Set((bl || []).map((b) => (b.email || "").toLowerCase()));

  const { data } = await sb.from("pros")
    .select("id, name, email, do_not_contact, source")
    .not("claimed_by_user_id", "is", null).eq("is_active", true).is("deleted_at", null)
    .neq("source", "ai_signup")
    .not("email", "is", null).neq("email", "");

  const targets = (data || []).filter((p) => {
    const e = (p.email || "").toLowerCase();
    return e && !p.do_not_contact && !blset.has(e) && !SELF.has(e) && !SENT.has(e);
  });

  console.log(`GROUPE A · ${targets.length} pros BTP réclamés à contacter${DRY ? " (DRY RUN)" : ""}:\n`);
  let sent = 0;
  for (const p of targets) {
    if (DRY) { console.log(`  · ${p.name} <${p.email}>`); continue; }
    const { data: r, error } = await resend.emails.send({
      from: "Willy de Workwave <contact@workwave.fr>",
      to: p.email!,
      replyTo: "contact@workwave.fr",
      subject: "2 minutes pour orienter les outils qu'on développe (Workwave)",
      html: buildHtml(p.id),
    });
    if (error) console.error(`  ❌ ${p.name} <${p.email}> : ${JSON.stringify(error)}`);
    else { console.log(`  ✓ ${p.name} <${p.email}>`); sent++; }
    await sleep(260); // < 5 req/s pour rester sous le rate-limit Resend
  }
  if (!DRY) console.log(`\n${sent}/${targets.length} envoyés.`);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
