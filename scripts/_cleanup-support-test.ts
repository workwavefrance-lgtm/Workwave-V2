/**
 * Nettoyage des données laissées par les tests support.
 * Supprime les messages AVANT le ticket (clé étrangère), vérifie l'erreur de
 * CHAQUE suppression, puis re-interroge la base pour prouver l'état final
 * (leçon 08/06 : un DELETE Supabase qui viole une FK échoue en silence).
 *
 *   npx tsx scripts/_cleanup-support-test.ts
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEST_EMAIL = "client-test-support@workwave.fr";

async function main() {
  const { data: tickets } = await sb
    .from("support_tickets")
    .select("id, subject")
    .eq("requester_email", TEST_EMAIL);

  const list = (tickets || []) as { id: number; subject: string }[];
  if (!list.length) {
    console.log("Aucun ticket de test à supprimer.");
  }

  for (const t of list) {
    const { error: em, count: cm } = await sb
      .from("support_messages")
      .delete({ count: "exact" })
      .eq("ticket_id", t.id);
    if (em) {
      console.log(`❌ messages du ticket #${t.id} : ${em.message}`);
      process.exit(1);
    }
    console.log(`  ${cm} message(s) supprimé(s) du ticket #${t.id}`);

    const { error: et, count: ct } = await sb
      .from("support_tickets")
      .delete({ count: "exact" })
      .eq("id", t.id);
    if (et) {
      console.log(`❌ ticket #${t.id} : ${et.message}`);
      process.exit(1);
    }
    console.log(`  ticket #${t.id} supprimé (${ct}) — "${t.subject}"`);
  }

  // Preuve : on re-interroge la base, on ne se fie pas au log ci-dessus.
  const { count: restTickets } = await sb
    .from("support_tickets")
    .select("*", { count: "exact", head: true });
  const { count: restMsgs } = await sb
    .from("support_messages")
    .select("*", { count: "exact", head: true });
  const { count: restTest } = await sb
    .from("support_tickets")
    .select("*", { count: "exact", head: true })
    .eq("requester_email", TEST_EMAIL);

  console.log("\n=== ÉTAT FINAL (re-interrogé en base) ===");
  console.log(`  tickets de test restants : ${restTest}`);
  console.log(`  support_tickets total    : ${restTickets}`);
  console.log(`  support_messages total   : ${restMsgs}`);
  if (restTest !== 0) {
    console.log("❌ des données de test subsistent");
    process.exit(1);
  }
  console.log("✅ base propre");
}

main().catch((e) => {
  console.error("Erreur :", e);
  process.exit(1);
});
