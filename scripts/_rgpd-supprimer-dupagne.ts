/**
 * RGPD art. 17 : suppression complete de la fiche Dupagne, Romain (BCE
 * 1039020250, Amay). Le pro refuse de figurer sur la plateforme.
 * Motif du 16/08 : "pouvez vous enlever mon entreprise de votre banque de
 * donnees je vous ai rien demande".
 *
 * GARDE (lecon du 06/08, ou un homonyme innocent a ete desactive) : on
 * relit la ligne par son ID et on exige que le slug ET le numero
 * concordent. Au moindre ecart, on n'ecrit RIEN.
 */
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });

const ID = 4318481;
const SLUG = "dupagne-romain-20250";
const NUMERO = "1039020250";
const EMAIL = "romaindupagne@gmail.com";

(async () => {
  const { data: f, error: e1 } = await sb.from("pros")
    .select("id, slug, siret, name, email").eq("id", ID).single();
  if (e1 || !f || f.slug !== SLUG || f.siret !== NUMERO) {
    console.error("GARDE DECLENCHEE : la fiche ne concorde pas. Aucune ecriture.");
    console.error({ attendu: { SLUG, NUMERO }, trouve: f });
    process.exit(1);
  }
  console.log("Garde OK, cible confirmee :", f.name);

  const { error: e2, count } = await sb.from("pros").update({
    is_active: false,
    deleted_at: new Date().toISOString(),
    do_not_contact: true,
    email: null,
    phone: null,
    website: null,
    description: null,
  }, { count: "exact" }).eq("id", ID).eq("slug", SLUG);
  if (e2) { console.error("ECHEC de la mise a jour :", e2.message); process.exit(1); }
  console.log("Fiche desactivee et coordonnees effacees. Lignes touchees :", count);

  const { error: e3 } = await sb.from("email_blacklist")
    .upsert({ email: EMAIL, reason: "demande RGPD art.17 du 16/08/2026" }, { onConflict: "email" });
  console.log(e3 ? `Liste d'exclusion : ${e3.message}` : "Email ajoute a la liste d'exclusion.");

  // CONTROLE FINAL : on relit l'etat reel en base (Regle 4).
  const { data: apres } = await sb.from("pros")
    .select("is_active, deleted_at, email, phone, website, do_not_contact").eq("id", ID).single();
  console.log("\nEtat verifie en base :", apres);
})();
