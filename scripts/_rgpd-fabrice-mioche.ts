/**
 * RGPD : suppression complète fiche fabrice-mioche-00027 (Garde animaux)
 * Demande d'effacement de Fabrice Mioche (mioche.fabrice@bbox.fr), 12/07/2026.
 * Activité radiée depuis 30/04/2016 (donnée obsolète) + personne physique.
 * Pattern 2 (soft-delete complet), cf. _rgpd-claire-sassella.ts.
 * APPLY : npx tsx scripts/_rgpd-fabrice-mioche.ts --apply
 */
import path from "path"; import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const SLUG = "fabrice-mioche-00027";
const EMAIL = "mioche.fabrice@bbox.fr";
const REASON = "rgpd_deletion_request_2026-07-12";
const APPLY = process.argv.includes("--apply");
(async () => {
  const { data: f } = await sb.from("pros").select("id,name,siret,is_active,deleted_at,do_not_contact,claimed_by_user_id").eq("slug", SLUG).single();
  if (!f) { console.error("Fiche introuvable"); return; }
  if (f.claimed_by_user_id) { console.error("⛔ Fiche RÉCLAMÉE : abandon"); return; }
  console.log(`Cible: #${f.id} ${f.name} (${f.siret})`);
  if (!APPLY) { console.log("[DRY-RUN] relancer avec --apply"); return; }
  const { error, count } = await sb.from("pros").update(
    { deleted_at: new Date().toISOString(), is_active: false, do_not_contact: true, phone: null, email: null, website: null },
    { count: "exact" }
  ).eq("id", f.id);
  if (error) { console.error("Erreur update:", error); return; }
  console.log(`✓ Soft-deleted (${count} ligne)`);
  const { error: be } = await sb.from("email_blacklist").upsert({ email: EMAIL, reason: REASON }, { onConflict: "email" });
  console.log(be ? `Erreur blacklist: ${be.message}` : `✓ ${EMAIL} blacklisté`);
  const { data: c } = await sb.from("pros").select("is_active,deleted_at,do_not_contact").eq("id", f.id).single();
  console.log("Vérif finale:", JSON.stringify(c));
})();
