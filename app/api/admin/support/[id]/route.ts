import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin/auth";
import { getAdminServiceClient } from "@/lib/admin/service-client";

const VALID_STATUSES = ["open", "pending", "resolved", "closed"] as const;
type Status = (typeof VALID_STATUSES)[number];

/**
 * PATCH /api/admin/support/[id]
 * Change le statut d'un ticket (open | pending | resolved | closed) et
 * horodate resolved_at / closed_at en conséquence.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ticketId = parseInt(id, 10);
  if (isNaN(ticketId)) return NextResponse.json({ error: "Invalid ticket id" }, { status: 400 });

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const status = body.status as Status;
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const nowIso = new Date().toISOString();
  const updates: Record<string, unknown> = { status };
  if (status === "resolved") updates.resolved_at = nowIso;
  if (status === "closed") updates.closed_at = nowIso;

  const db = getAdminServiceClient();
  const { error } = await db
    .from("support_tickets")
    .update(updates as never)
    .eq("id", ticketId);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  await db.from("admin_logs").insert({
    admin_id: admin.id,
    action: "support.status",
    entity_type: "support_ticket",
    entity_id: ticketId,
    details: { status },
  } as never);

  return NextResponse.json({ success: true });
}
