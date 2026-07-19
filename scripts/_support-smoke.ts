/**
 * Smoke test de la Phase 1 support (tables + helper d'ingestion).
 *   npx tsx scripts/_support-smoke.ts
 *
 * 1. Vérifie que support_tickets / support_messages existent (= migration lancée).
 * 2. Ingère un email de test -> crée un ticket + message.
 * 3. Ré-ingère le MÊME email -> doit être détecté "duplicate" (idempotence).
 * 4. Nettoie (supprime le ticket de test ; cascade sur les messages).
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { createClient } from "@supabase/supabase-js";
import { ingestInboundEmailAsTicket } from "../lib/support/tickets";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // 1) Tables présentes ?
  const { error: tErr } = await sb.from("support_tickets").select("id").limit(1);
  const { error: mErr } = await sb.from("support_messages").select("id").limit(1);
  if (tErr || mErr) {
    console.log("❌ MIGRATION PAS ENCORE LANCÉE (ou erreur d'accès) :");
    if (tErr) console.log("   support_tickets:", tErr.message);
    if (mErr) console.log("   support_messages:", mErr.message);
    console.log("\n→ Lance migrations/2026-07-19_support_tickets.sql dans Supabase, puis relance ce script.");
    process.exit(1);
  }
  console.log("✅ Tables support_tickets + support_messages présentes.\n");

  const fakeEmailId = `smoke-${Date.now()}`;
  const from = "Testeur Smoke <smoke-test-support@example.invalid>";

  // 2) Ingestion #1 -> nouveau ticket
  const r1 = await ingestInboundEmailAsTicket({
    resendEmailId: fakeEmailId,
    fromRaw: from,
    subject: "Test smoke support",
    text: "Bonjour, ceci est un test automatique de la boîte de réception.",
    html: null,
  });
  console.log("Ingestion #1 :", r1);
  if (!r1 || !r1.created) {
    console.log("❌ Attendu : nouveau ticket créé.");
    process.exit(1);
  }

  const ticketId = r1.ticketId;
  const { data: msgs } = await sb
    .from("support_messages")
    .select("id, author_role, body, email_message_id")
    .eq("ticket_id", ticketId);
  console.log(`   -> ${msgs?.length ?? 0} message(s) dans le ticket #${ticketId}`);

  // 3) Ingestion #2 (même email) -> duplicate
  const r2 = await ingestInboundEmailAsTicket({
    resendEmailId: fakeEmailId,
    fromRaw: from,
    subject: "Test smoke support",
    text: "Doublon.",
    html: null,
  });
  console.log("Ingestion #2 (même email) :", r2);
  if (!r2 || !r2.duplicate) {
    console.log("❌ Attendu : duplicate=true (idempotence).");
  } else {
    console.log("   -> idempotence OK (aucun doublon).");
  }

  // 4) Nettoyage
  const { error: delErr, count } = await sb
    .from("support_tickets")
    .delete({ count: "exact" })
    .eq("id", ticketId);
  if (delErr) {
    console.log("⚠️ Nettoyage KO :", delErr.message, "-> supprime manuellement le ticket #" + ticketId);
  } else {
    console.log(`\n🧹 Ticket de test #${ticketId} supprimé (${count} row, cascade messages).`);
  }

  console.log("\n✅ SMOKE TEST OK — la Phase 1 tourne.");
}

main().catch((e) => {
  console.error("Erreur :", e);
  process.exit(1);
});
