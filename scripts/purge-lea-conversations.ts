/**
 * Purge RGPD du journal des conversations de Léa.
 *
 * Ces lignes contiennent ce que des visiteurs ont tapé — donc potentiellement
 * des données personnelles. On ne les garde que le temps utile à la
 * surveillance de l'IA : 90 jours. Au-delà, elles n'ont plus de valeur d'audit
 * et ne sont plus qu'un risque.
 *
 *   npx tsx scripts/purge-lea-conversations.ts            (aperçu)
 *   npx tsx scripts/purge-lea-conversations.ts --apply    (supprime)
 *
 * À lancer par un cron mensuel, ou à la main.
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { createClient } from "@supabase/supabase-js";

const RETENTION_JOURS = 90;

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const apply = process.argv.includes("--apply");
  const limite = new Date(Date.now() - RETENTION_JOURS * 86_400_000).toISOString();

  const { count, error } = await sb
    .from("lea_conversations")
    .select("*", { count: "exact", head: true })
    .lt("created_at", limite);
  if (error) {
    console.log("Erreur :", error.message);
    process.exit(1);
  }

  console.log(`Conservation : ${RETENTION_JOURS} jours (avant le ${limite.slice(0, 10)})`);
  console.log(`À supprimer  : ${count ?? 0} conversation(s)`);

  if (!apply) {
    console.log("\nAperçu seulement. Relancer avec --apply pour supprimer.");
    return;
  }
  if ((count ?? 0) === 0) return;

  const { error: delErr, count: supprimees } = await sb
    .from("lea_conversations")
    .delete({ count: "exact" })
    .lt("created_at", limite);
  if (delErr) {
    console.log("❌ Suppression échouée :", delErr.message);
    process.exit(1);
  }

  // On re-interroge : ne jamais conclure sur le seul retour du delete.
  const { count: restant } = await sb
    .from("lea_conversations")
    .select("*", { count: "exact", head: true })
    .lt("created_at", limite);
  console.log(`✅ ${supprimees} supprimée(s) — restant hors rétention : ${restant ?? 0}`);
  if ((restant ?? 0) !== 0) process.exit(1);
}

main().catch((e) => {
  console.error("Erreur :", e);
  process.exit(1);
});
