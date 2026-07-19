import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin/auth";
import { getAdminServiceClient } from "@/lib/admin/service-client";

/**
 * POST /api/admin/support/[id]/note
 * Ajoute une NOTE INTERNE au fil (visible admin seulement, jamais envoyée au
 * client). Ne bump pas last_message_at (réservé à l'activité client).
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
  const note = (body.body || "").trim();
  if (!note) return NextResponse.json({ error: "Note vide" }, { status: 400 });

  const db = getAdminServiceClient();
  const { error } = await db.from("support_messages").insert({
    ticket_id: ticketId,
    author_role: "agent",
    body: note,
    is_internal: true,
  } as never);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  await db.from("admin_logs").insert({
    admin_id: admin.id,
    action: "support.note",
    entity_type: "support_ticket",
    entity_id: ticketId,
  } as never);

  return NextResponse.json({ success: true });
}
