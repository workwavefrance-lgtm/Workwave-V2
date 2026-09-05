/**
 * Claim direct (sans magic link) de la fiche /artisan/go-renov-00026 :
 *  1. Crée (ou retrouve) l'auth user go.renovcontact@gmail.com avec password
 *     "Brice86180?" en bypass de la vérif email (email_confirm: true).
 *  2. Met à jour pros.claimed_by_user_id + claimed_at sur le slug.
 *
 * Patterns respectés :
 *  - Service role pour bypass RLS.
 *  - Pas de findByEmail (n'existe pas dans le SDK), listUsers paginé (cf.
 *    leçon CLAUDE.md 26/05/2026).
 *  - Idempotent : si user existe déjà, on met juste à jour son mot de passe.
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const EMAIL = "go.renovcontact@gmail.com";
const PASSWORD = "Brice86180?";
const SLUG = "go-renov-00026";

async function findUserByEmail(email: string) {
  const target = email.toLowerCase();
  let page = 1;
  while (page < 10) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === target);
    if (found) return found;
    if (data.users.length < 1000) return null;
    page++;
  }
  return null;
}

async function main() {
  // 1. Vérifie la fiche pro
  const { data: pro, error: pErr } = await sb
    .from("pros")
    .select("id, name, slug, claimed_by_user_id, is_active, deleted_at")
    .eq("slug", SLUG)
    .single();
  if (pErr || !pro) {
    console.error("✗ Pro introuvable pour le slug", SLUG, pErr);
    process.exit(1);
  }
  console.log("Fiche trouvée :", pro);

  if (pro.deleted_at) {
    console.error("✗ Fiche soft-deleted, abort.");
    process.exit(1);
  }
  if (pro.claimed_by_user_id) {
    console.warn("⚠️ Fiche DÉJÀ claimed par", pro.claimed_by_user_id);
    console.log("  Je continue quand même pour mettre à jour si c'est le même user…");
  }

  // 2. Cherche ou crée l'auth user
  let user = await findUserByEmail(EMAIL);
  if (user) {
    console.log("\n→ User déjà existant :", user.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const upd: any = { password: PASSWORD, email_confirm: true };
    const { error } = await sb.auth.admin.updateUserById(user.id, upd);
    if (error) { console.error("✗ Update password failed :", error.message); process.exit(1); }
    console.log("  Mot de passe mis à jour OK");
  } else {
    console.log("\n→ Création du user…");
    const { data, error } = await sb.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error || !data.user) { console.error("✗ Create user failed :", error?.message); process.exit(1); }
    user = data.user;
    console.log("  User créé :", user.id);
  }

  // 3. Lie la fiche au user
  const nowIso = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: upErr } = await (sb.from("pros") as any)
    .update({
      claimed_by_user_id: user.id,
      claimed_at: nowIso,
      updated_at: nowIso,
    })
    .eq("slug", SLUG);
  if (upErr) { console.error("✗ Update pro failed :", upErr.message); process.exit(1); }

  // 4. Vérification finale
  const { data: after } = await sb
    .from("pros")
    .select("id, name, claimed_by_user_id, claimed_at")
    .eq("slug", SLUG)
    .single();
  console.log("\n✓ Fiche claimed !");
  console.log("  ", after);
  console.log("\n📧 Identifiants de connexion :");
  console.log("   URL      : https://workwave.fr/pro/connexion");
  console.log("   Email    :", EMAIL);
  console.log("   Password :", PASSWORD);
}

main().catch((e) => { console.error("ERREUR:", e.message); process.exit(1); });
