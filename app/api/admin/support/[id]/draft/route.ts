import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin/auth";
import { getAdminServiceClient } from "@/lib/admin/service-client";
import { getAdminTicketById } from "@/lib/queries/admin-support";
import { generateDraftReply } from "@/lib/support/draft-reply";

export const maxDuration = 60;

/**
 * POST /api/admin/support/[id]/draft
 * Génère un BROUILLON de réponse (IA) à partir du fil + du contexte client.
 * N'envoie RIEN et n'écrit RIEN dans le fil : le brouillon est renvoyé à
 * l'admin, qui l'édite puis clique "Envoyer au client".
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ticketId = parseInt(id, 10);
  if (isNaN(ticketId)) return NextResponse.json({ error: "Invalid ticket id" }, { status: 400 });

  const detail = await getAdminTicketById(ticketId);
  if (!detail) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });

  const draft = await generateDraftReply({
    subject: detail.ticket.subject,
    requesterName: detail.ticket.requester_name,
    category: detail.ticket.category,
    messages: detail.messages.map((m) => ({
      author_role: m.author_role,
      body: m.body,
      is_internal: m.is_internal,
    })),
    pro: detail.context.pro
      ? {
          name: detail.context.pro.name,
          category: detail.context.pro.category,
          city: detail.context.pro.city,
          subscription_status: detail.context.pro.subscription_status,
        }
      : null,
    unlocks: detail.context.unlocks,
    projectsCount: detail.context.projects.length,
  });

  if (!draft) {
    return NextResponse.json(
      { success: false, error: "Génération du brouillon indisponible pour le moment." },
      { status: 502 }
    );
  }

  // Trace l'usage (audit), sans stocker le brouillon : rien n'est envoyé.
  const db = getAdminServiceClient();
  await db.from("admin_logs").insert({
    admin_id: admin.id,
    action: "support.draft",
    entity_type: "support_ticket",
    entity_id: ticketId,
  } as never);

  return NextResponse.json({ success: true, draft });
}
