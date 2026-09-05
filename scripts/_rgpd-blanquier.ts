/**
 * RGPD — suppression des fiches de Sandrine BLANQUIER (demande du 31/08/2026).
 *
 * Sa demande : « Mon identité est correcte mais je n'exerce pas cette activité et
 * je n'ai jamais créé cette entreprise. Je ne peux pas utiliser le lien de
 * suppression car il demande un numéro de SIRET que je n'ai pas. »
 * C'est le cas « suppression complète » (art. 17), pas le cas « nullification ».
 *
 * DEUX fiches, pas une : même SIREN 838566917, deux établissements.
 *   3347507  Trèbes 11800       siret 83856691700012
 *   3439728  Carla-Bayle 09130  siret 83856691700020
 *
 * 🔴 GARDE OBLIGATOIRE (leçon du 06/08/2026 : j'ai désactivé la fiche d'un
 * homonyme innocent en me fiant à un repli `|| liste[0]`). Ici : ciblage par id
 * EXACT, et chaque ligne est relue avant écriture pour vérifier que le slug ET
 * le SIRET concordent. Au moindre écart, on s'arrête sans rien toucher.
 * Six autres BLANQUIER existent en base (Marie, Fanny, Audrey ×2, Simon, Eric,
 * Kimberly) : aucun ne doit être effleuré.
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const CIBLES = [
  { id: 3347507, slug: "sandrine-blanquier-00012", siret: "83856691700012", ville: "Trèbes" },
  { id: 3439728, slug: "sandrine-blanquier-00020", siret: "83856691700020", ville: "Carla-Bayle" },
];
const EMAIL = "sandrineblanquier@yahoo.com";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  const appliquer = process.argv.includes("--apply");

  for (const c of CIBLES) {
    const { data: f, error } = await sb
      .from("pros")
      .select("id, slug, name, siret, is_active, deleted_at")
      .eq("id", c.id)
      .single();

    if (error || !f) {
      console.log(`ARRET : fiche ${c.id} introuvable (${error?.message ?? "aucune ligne"})`);
      process.exit(1);
    }
    if (f.slug !== c.slug || f.siret !== c.siret) {
      console.log(`ARRET : la fiche ${c.id} ne concorde pas.`);
      console.log(`  attendu slug=${c.slug} siret=${c.siret}`);
      console.log(`  trouve  slug=${f.slug} siret=${f.siret}`);
      process.exit(1);
    }
    console.log(`OK  ${f.id}  ${f.name}  ${c.ville}  siret=${f.siret}`);

    if (!appliquer) {
      console.log("    (essai a blanc, rien n'est ecrit)");
      continue;
    }

    const { error: e1 } = await sb
      .from("pros")
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
        do_not_contact: true,
        phone: null,
        email: null,
        website: null,
        description: null,
        photos: [],
        logo_url: null,
      })
      .eq("id", c.id)
      .eq("slug", c.slug);

    // Un DELETE ou UPDATE Supabase qui echoue renvoie { error } SANS lever
    // d'exception : ne jamais conclure au succes sans lire ce champ
    // (lecon du 08/08/2026).
    if (e1) {
      console.log(`    ECHEC de l'ecriture : ${e1.message}`);
      process.exit(1);
    }
    console.log("    fiche desactivee et coordonnees effacees");
  }

  if (appliquer) {
    const { error: e2 } = await sb
      .from("email_blacklist")
      .upsert({ email: EMAIL, reason: "demande RGPD du 31/08/2026" }, { onConflict: "email" });
    console.log(e2 ? `  liste d'exclusion : ECHEC (${e2.message})` : "  email ajoute a la liste d'exclusion");
  }

  // Verification finale EN BASE, pas sur le journal du script.
  for (const c of CIBLES) {
    const { data } = await sb
      .from("pros")
      .select("id, is_active, deleted_at, email, phone")
      .eq("id", c.id)
      .single();
    console.log(`  etat final ${c.id} : actif=${data?.is_active} supprime=${data?.deleted_at ?? "non"} mail=${data?.email ?? "vide"}`);
  }
}

main();
