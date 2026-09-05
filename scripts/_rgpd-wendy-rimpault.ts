/**
 * RGPD : suppression complete fiche + COMPTE de WENDY RIMPAULT.
 *
 * Objet du mail : "Suppression de mon compte professionnel".
 * Preuve d'identite : elle a reclame la fiche (SIRET 88418437500043) avec l'email
 * anaellewendy@live.fr, puis a demande la suppression depuis ce meme email.
 * "Mon SIRET et mon nom n'ont rien a voir avec cette activite" (fiche mal categorisee
 * en garde-animaux). RGPD art. 17.
 *
 * Vs Durand : ici la fiche est RECLAMEE => en plus du soft-delete, on delie le claim
 * (claimed_by_user_id=null) et on supprime le compte auth (le "compte professionnel").
 *
 *   1. AUDIT  : npx tsx scripts/_rgpd-wendy-rimpault.ts
 *   2. APPLY  : npx tsx scripts/_rgpd-wendy-rimpault.ts --apply
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SIRET = "88418437500043";
const REQUESTER_EMAIL = "anaellewendy@live.fr";
const REASON = "rgpd_deletion_request_2026-07-30";
const APPLY = process.argv.includes("--apply");

async function main() {
  console.log(`=== RGPD : suppression fiche + compte (SIRET ${SIRET}) ===\n`);

  const { data: fiche, error } = await supabase
    .from("pros")
    .select(
      "id, slug, name, siret, phone, email, website, city_id, category_id, claimed_by_user_id, claimed_at, is_active, deleted_at, do_not_contact, source"
    )
    .eq("siret", SIRET)
    .single();

  if (error || !fiche) {
    console.error("Fiche introuvable par SIRET :", error?.message);
    return;
  }

  console.log("Fiche :");
  console.log(`  id/slug   : ${fiche.id} / ${fiche.slug}`);
  console.log(`  name      : ${fiche.name}`);
  console.log(`  siret     : ${fiche.siret}`);
  console.log(`  category  : ${fiche.category_id}`);
  console.log(`  email     : ${fiche.email}`);
  console.log(`  is_active : ${fiche.is_active}  deleted_at: ${fiche.deleted_at}`);
  console.log(`  claimed_by: ${fiche.claimed_by_user_id ?? "non"}  claimed_at: ${fiche.claimed_at}`);

  const userId = fiche.claimed_by_user_id as string | null;

  // GARDE-FOU : la fiche est RÉCLAMÉE → l'email de preuve est celui du COMPTE auth
  // (fiche.email est null car squelette Sirene ; l'email de réclamation vit sur auth.users).
  let authEmail: string | null = null;
  if (userId) {
    const { data: u } = await supabase.auth.admin.getUserById(userId);
    authEmail = u?.user?.email ?? null;
  }
  console.log(`\n  email du compte auth : ${authEmail}`);
  const emailOk = (authEmail || "").trim().toLowerCase() === REQUESTER_EMAIL.toLowerCase();
  console.log(`  Garde-fou compte == ${REQUESTER_EMAIL} : ${emailOk ? "✓" : "✗ NE MATCHE PAS"}`);
  if (!emailOk) {
    console.error("\n🛑 STOP : l'email du compte ne correspond pas au demandeur. Vérifier manuellement.");
    return;
  }

  // Sécurité : est-ce que ce compte a réclamé d'AUTRES fiches ? (ne pas orpheliner)
  let otherClaims: number[] = [];
  if (userId) {
    const { data: others } = await supabase
      .from("pros")
      .select("id")
      .eq("claimed_by_user_id", userId)
      .neq("id", fiche.id);
    otherClaims = (others || []).map((o: { id: number }) => o.id);
  }
  console.log(`  Autres fiches réclamées par ce compte : ${otherClaims.length ? otherClaims.join(", ") : "aucune"}`);

  if (!APPLY) {
    console.log("\n[DRY-RUN] Pour appliquer :");
    console.log("  npx tsx scripts/_rgpd-wendy-rimpault.ts --apply");
    console.log("\nActions :");
    console.log("  1. UPDATE pros SET deleted_at=NOW(), is_active=false, do_not_contact=true,");
    console.log("     phone=NULL, email=NULL, website=NULL, claimed_by_user_id=NULL, claimed_at=NULL");
    console.log(`  2. UPSERT email_blacklist (${REQUESTER_EMAIL}, reason=${REASON})`);
    console.log(
      `  3. Supprimer le compte auth ${userId ?? "(aucun)"}` +
        (otherClaims.length ? " · ⚠️ SKIP (ce compte a d'autres fiches)" : "")
    );
    return;
  }

  console.log("\n[APPLY] Suppression en cours...");

  const { error: updErr } = await supabase
    .from("pros")
    .update({
      deleted_at: new Date().toISOString(),
      is_active: false,
      do_not_contact: true,
      phone: null,
      email: null,
      website: null,
      claimed_by_user_id: null,
      claimed_at: null,
    })
    .eq("id", fiche.id);
  if (updErr) {
    console.error("Erreur update fiche :", updErr.message);
    return;
  }
  console.log("✓ Fiche soft-deleted + déliée du compte + PII nullifiées");

  const { error: blErr } = await supabase
    .from("email_blacklist")
    .upsert({ email: REQUESTER_EMAIL, reason: REASON }, { onConflict: "email" });
  console.log(blErr ? `✗ blacklist : ${blErr.message}` : `✓ ${REQUESTER_EMAIL} blacklisté`);

  // Supprimer le compte auth (le "compte professionnel"), sauf s'il a d'autres fiches.
  if (userId && otherClaims.length === 0) {
    const { error: delErr } = await supabase.auth.admin.deleteUser(userId);
    console.log(delErr ? `✗ delete auth user : ${delErr.message}` : `✓ compte auth ${userId} supprimé`);
  } else if (userId) {
    console.log(`⚠️ compte auth ${userId} NON supprimé (il a d'autres fiches : ${otherClaims.join(", ")})`);
  } else {
    console.log("(pas de compte auth lié, rien à supprimer côté auth)");
  }

  // Preuve état final
  const { data: after } = await supabase
    .from("pros")
    .select("is_active, deleted_at, do_not_contact, email, claimed_by_user_id")
    .eq("id", fiche.id)
    .single();
  console.log("\nÉtat final :", JSON.stringify(after));
  console.log(`Slug pour vérif 404 : /artisan/${fiche.slug}`);
}

main().catch((e) => {
  console.error("Erreur :", e);
  process.exit(1);
});
