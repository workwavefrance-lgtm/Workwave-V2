import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin/auth";
import { getAdminServiceClient } from "@/lib/admin/service-client";

/**
 * POST /api/admin/lea-journal/[id]/reviewed
 * Marque une conversation de Léa comme relue, pour ne pas repasser dessus.
 * Idempotent : on n'écrase pas une date déjà posée.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const rowId = parseInt(id, 10);
  if (isNaN(rowId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const db = getAdminServiceClient();
  const { error } = await db
    .from("lea_conversations")
    .update({ reviewed_at: new Date().toISOString() } as never)
    .eq("id", rowId)
    .is("reviewed_at", null);

  if (error) {
    console.error("[admin/lea-journal] marquage relu échec :", error.message);
    return NextResponse.json({ error: "Échec" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
