/**
 * RGPD : suppression fiche carole-guasch-00034 (réclamation 14/06).
 * Carole Guasch (gcarole.ch@gmail.com) conteste être référencée en "Garde
 * animaux" à Juillac (19350) et demande l'annulation. Fiche Sirene brute
 * (faux positif NAF lors du scrape Corrèze), sans coordonnées.
 * Pattern "suppression complète" (leçon CLAUDE.md 01/05, art. 17 RGPD) :
 *   is_active=false + deleted_at + do_not_contact + blacklist email.
 *   → /artisan/carole-guasch-00034 retourne 404 (filtre route).
 *   npx tsx scripts/_rgpd-carole-guasch.ts            # DRY-RUN
 *   npx tsx scripts/_rgpd-carole-guasch.ts --execute  # applique + mail
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const SLUG = "carole-guasch-00034";
const PLAIGNANT_EMAIL = "gcarole.ch@gmail.com";
const EXECUTE = process.argv.includes("--execute");
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY);

async function main() {
  const { data: pro } = await sb.from("pros")
    .select("id, slug, name, is_active, deleted_at")
    .eq("slug", SLUG).single();
  if (!pro) { console.error("Fiche introuvable"); process.exit(1); }
  console.log(`Fiche : #${pro.id} ${pro.name} (active=${pro.is_active}, deleted=${pro.deleted_at})`);

  if (!EXECUTE) {
    console.log("\n[DRY-RUN] Actions prévues avec --execute :");
    console.log("  1. pros: is_active=false, deleted_at=NOW, do_not_contact=true, email/phone=null");
    console.log(`  2. email_blacklist += ${PLAIGNANT_EMAIL}`);
    console.log("  3. mail de réponse neutre → " + PLAIGNANT_EMAIL);
    return;
  }

  // 1. Soft delete + nullify PII + do_not_contact
  const { error: e1 } = await sb.from("pros").update({
    is_active: false,
    deleted_at: new Date().toISOString(),
    do_not_contact: true,
    email: null,
    phone: null,
    updated_at: new Date().toISOString(),
  }).eq("id", pro.id);
  console.log(e1 ? `❌ update pros : ${e1.message}` : "✓ fiche soft-deleted + PII nullifiée + do_not_contact");

  // 2. Blacklist email du plaignant
  const { error: e2 } = await sb.from("email_blacklist")
    .upsert({ email: PLAIGNANT_EMAIL, reason: "RGPD - demande de retrait (14/06)" }, { onConflict: "email", ignoreDuplicates: true });
  console.log(e2 ? `❌ blacklist : ${e2.message}` : `✓ ${PLAIGNANT_EMAIL} blacklisté`);

  // 3. Vérif état final
  const { data: after } = await sb.from("pros").select("is_active, deleted_at").eq("id", pro.id).single();
  console.log(`État final : active=${after?.is_active}, deleted_at=${after?.deleted_at}`);

  // 4. Mail de réponse (neutre, factuel)
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff;">
  <div style="max-width:560px;margin:0 auto;padding:28px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.65;color:#1a1a1a;">
    <p style="margin:0 0 16px;">Bonjour,</p>
    <p style="margin:0 0 16px;">Votre demande a &eacute;t&eacute; trait&eacute;e&nbsp;: <strong>votre fiche a &eacute;t&eacute; retir&eacute;e de Workwave</strong>. Elle n'appara&icirc;t plus sur le site et ne sera plus propos&eacute;e dans les r&eacute;sultats de recherche (Google peut mettre quelques jours &agrave; la d&eacute;r&eacute;f&eacute;rencer de son c&ocirc;t&eacute;).</p>
    <p style="margin:0 0 16px;">Pour information&nbsp;: les fiches de base sur Workwave sont cr&eacute;&eacute;es automatiquement &agrave; partir du registre public <strong>Sirene de l'INSEE</strong> (donn&eacute;es ouvertes), et la cat&eacute;gorie est d&eacute;duite du code d'activit&eacute; officiel. C'est ce qui a entra&icirc;n&eacute; le classement erron&eacute; en &laquo;&nbsp;garde d'animaux&nbsp;&raquo; dans votre cas, et nous en sommes d&eacute;sol&eacute;s.</p>
    <p style="margin:0 0 16px;">Votre adresse a &eacute;galement &eacute;t&eacute; ajout&eacute;e &agrave; notre liste d'exclusion&nbsp;: vous ne serez plus contact&eacute;e ni r&eacute;f&eacute;renc&eacute;e.</p>
    <p style="margin:0 0 16px;">Si vous constatez quoi que ce soit d'autre, r&eacute;pondez simplement &agrave; ce message.</p>
    <p style="margin:0 0 4px;">Cordialement,</p>
    <p style="margin:0;"><strong>L'&eacute;quipe Workwave</strong><br>
    <span style="color:#666;font-size:13px;"><a href="mailto:contact@workwave.fr" style="color:#666;">contact@workwave.fr</a></span></p>
  </div>
</body></html>`;
  const { error: e3 } = await resend.emails.send({
    from: "Workwave <contact@workwave.fr>",
    to: PLAIGNANT_EMAIL,
    replyTo: "contact@workwave.fr",
    subject: "Votre demande · fiche retirée de Workwave",
    html,
  });
  console.log(e3 ? `❌ mail : ${JSON.stringify(e3)}` : `✓ mail de réponse envoyé à ${PLAIGNANT_EMAIL}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
