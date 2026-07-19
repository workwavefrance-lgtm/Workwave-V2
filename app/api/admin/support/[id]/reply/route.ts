import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin/auth";
import { getAdminServiceClient } from "@/lib/admin/service-client";
import { sendSupportReply } from "@/lib/email/send-support-reply";
import type { SupportTicket } from "@/lib/support/tickets";

/**
 * POST /api/admin/support/[id]/reply
 * Envoie une réponse publique au client (email) + l'enregistre dans le fil,
 * passe le ticket en "pending" (on attend le client). Le message n'est
 * enregistré que si l'email est PARTI (pas de faux positif dans le fil).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ticketId = parseInt(id, 10);
  if (isNaN(ticketId)) return NextResponse.json({ error: "Invalid ticket id" }, { status: 400 });

  let body: { body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const message = (body.body || "").trim();
  if (!message) return NextResponse.json({ error: "Message vide" }, { status: 400 });

  const db = getAdminServiceClient();
  const { data: row, error: fetchErr } = await db
    .from("support_tickets")
    .select("*")
    .eq("id", ticketId)
    .maybeSingle();
  if (fetchErr || !row) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });
  const ticket = row as unknown as SupportTicket;

  if (!ticket.requester_email) {
    return NextResponse.json(
      { error: "Ce ticket n'a pas d'email destinataire — répondez via une note interne." },
      { status: 400 }
    );
  }

  // 1) Envoi email (bloquant : on ne trace pas une réponse qui n'est pas partie)
  const sent = await sendSupportReply({
    to: ticket.requester_email,
    subject: ticket.subject,
    body: message,
  });
  if (!sent.ok) {
    return NextResponse.json(
      { success: false, error: `Envoi échoué : ${sent.error || "inconnu"}` },
      { status: 502 }
    );
  }

  // 2) Enregistre le message public
  const nowIso = new Date().toISOString();
  let persistWarning: string | null = null;
  const { error: msgErr } = await db.from("support_messages").insert({
    ticket_id: ticketId,
    author_role: "agent",
    body: message,
    is_internal: false,
  } as never);
  if (msgErr) {
    // L'email EST parti (le client l'a reçu). On ne bloque pas l'admin, mais on
    // ne perd PAS l'info en silence (leçon 23/05) : trace en note interne + on
    // avertit l'admin de NE PAS renvoyer.
    console.error("[support/reply] email parti mais insert message KO:", msgErr.message);
    persistWarning =
      "L'email est bien parti au client, mais n'a pas pu être enregistré dans le fil. Ne le renvoyez pas.";
    await db.from("support_messages").insert({
      ticket_id: ticketId,
      author_role: "system",
      body: `[incident] Réponse envoyée au client mais non enregistrée (erreur : ${msgErr.message}). Contenu :\n\n${message}`,
      is_internal: true,
    } as never);
  }

  // 3) Ticket : première réponse + passage en "pending" + activité
  const update: Record<string, unknown> = { last_message_at: nowIso, status: "pending" };
  if (!ticket.first_response_at) update.first_response_at = nowIso;
  await db.from("support_tickets").update(update as never).eq("id", ticketId);

  await db.from("admin_logs").insert({
    admin_id: admin.id,
    action: "support.reply",
    entity_type: "support_ticket",
    entity_id: ticketId,
  } as never);

  return NextResponse.json({ success: true, warning: persistWarning });
}
