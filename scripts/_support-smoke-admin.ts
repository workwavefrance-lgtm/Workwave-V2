/**
 * Smoke test de la couche ADMIN du support (requêtes + jointures réelles).
 *   npx tsx scripts/_support-smoke-admin.ts
 *
 * Valide ce que le build/tsc ne peut pas voir : les embeds PostgREST
 * (categories(name), cities(name)), les filtres et les counts, contre le vrai
 * schéma. Crée un ticket de test, interroge, puis nettoie.
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { createClient } from "@supabase/supabase-js";
import { ingestInboundEmailAsTicket } from "../lib/support/tickets";
import {
  getAdminTickets,
  getTicketStatusCounts,
  getAdminTicketById,
} from "../lib/queries/admin-support";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const fakeId = `smoke-admin-${Date.now()}`;
  const ing = await ingestInboundEmailAsTicket({
    resendEmailId: fakeId,
    fromRaw: "Testeur Admin <smoke-admin@example.invalid>",
    subject: "Smoke admin — jointures",
    text: "Test des requêtes admin.",
    html: null,
  });
  if (!ing?.created) {
    console.log("❌ ticket de test non créé:", ing);
    process.exit(1);
  }
  const ticketId = ing.ticketId;
  console.log(`Ticket de test #${ticketId} créé.\n`);

  let failures = 0;

  // 1) Liste (filtre statut + count + tri)
  try {
    const list = await getAdminTickets({ status: "open", page: 1, pageSize: 25 });
    console.log(`✅ getAdminTickets: ${list.data.length} ticket(s), count=${list.count}, pages=${list.totalPages}`);
    if (!list.data.some((t) => t.id === ticketId)) {
      console.log("   ⚠️ le ticket de test n'apparaît pas dans la liste 'open'");
      failures++;
    }
  } catch (e) {
    console.log("❌ getAdminTickets:", (e as Error).message);
    failures++;
  }

  // 2) Recherche (assainissement + .or ilike) — avec des caractères pièges
  try {
    const search = await getAdminTickets({ status: "all", search: "smoke-admin (test)" });
    console.log(`✅ recherche avec caractères pièges "( )" : ${search.data.length} résultat(s), pas de crash`);
  } catch (e) {
    console.log("❌ recherche:", (e as Error).message);
    failures++;
  }

  // 3) Compteurs par statut
  try {
    const counts = await getTicketStatusCounts();
    console.log("✅ getTicketStatusCounts:", counts);
  } catch (e) {
    console.log("❌ getTicketStatusCounts:", (e as Error).message);
    failures++;
  }

  // 4) Détail + jointures de contexte (LE point à risque)
  try {
    const detail = await getAdminTicketById(ticketId);
    if (!detail) {
      console.log("❌ getAdminTicketById: null");
      failures++;
    } else {
      console.log(
        `✅ getAdminTicketById: ${detail.messages.length} message(s), pro=${detail.context.pro ? detail.context.pro.name : "aucun"}, projets=${detail.context.projects.length}, unlocks=${detail.context.unlocks}, tickets passés=${detail.context.pastTickets.length}`
      );
    }
  } catch (e) {
    console.log("❌ getAdminTicketById (jointures):", (e as Error).message);
    failures++;
  }

  // 5) Nettoyage
  const { error: delErr } = await sb.from("support_tickets").delete().eq("id", ticketId);
  console.log(delErr ? `⚠️ nettoyage KO: ${delErr.message}` : `\n🧹 Ticket #${ticketId} supprimé.`);

  if (failures > 0) {
    console.log(`\n❌ ${failures} échec(s).`);
    process.exit(1);
  }
  console.log("\n✅ COUCHE ADMIN OK — requêtes et jointures valides.");
}

main().catch((e) => {
  console.error("Erreur :", e);
  process.exit(1);
});
