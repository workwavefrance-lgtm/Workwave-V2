/**
 * Soft-delete la fiche GO-RENOV (workwave.fr/artisan/go-renov-00018).
 * Pattern : is_active=false + deleted_at + do_not_contact + nullification PII
 * (cf. lecon CLAUDE.md 01/05 sur les 2 patterns RGPD).
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const SLUG = "go-renov-00018";

async function main() {
  console.log(`Suppression de la fiche /artisan/${SLUG}\n`);

  // 1. Snapshot avant
  const { data: before } = await sb
    .from("pros")
    .select("id, name, email, phone, website, is_active, deleted_at, do_not_contact, claimed_by_user_id")
    .eq("slug", SLUG)
    .single();
  if (!before) { console.log("✗ Fiche introuvable"); return; }
  console.log("Avant :", before);

  if (before.claimed_by_user_id) {
    console.log("\n⚠️ ATTENTION : fiche réclamée par un user. Confirmer avant de delete.");
    return;
  }

  // 2. Soft delete + nullify PII + add to blacklist if email
  const nowIso = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: upErr } = await (sb.from("pros") as any)
    .update({
      is_active: false,
      deleted_at: nowIso,
      do_not_contact: true,
      email: null,
      phone: null,
      website: null,
      updated_at: nowIso,
    })
    .eq("slug", SLUG);
  if (upErr) { console.error("ERREUR update:", upErr); process.exit(1); }

  // 3. Si email présent avant, l'ajouter en blacklist
  if (before.email) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: blErr } = await (sb.from("email_blacklist") as any)
      .upsert({ email: before.email.toLowerCase(), reason: "RGPD deletion via admin", created_at: nowIso }, { onConflict: "email" });
    if (blErr) console.warn("  blacklist warn:", blErr.message);
    else console.log(`  ✓ ${before.email} ajouté à email_blacklist`);
  }

  // 4. Snapshot après
  const { data: after } = await sb
    .from("pros")
    .select("id, name, email, phone, is_active, deleted_at, do_not_contact")
    .eq("slug", SLUG)
    .single();
  console.log("\nAprès :", after);
  console.log("\n✓ Soft delete OK. La page /artisan/" + SLUG + " va renvoyer 404 dès la revalidation ISR.");
}

main().catch((e) => { console.error("ERREUR:", e.message); process.exit(1); });
