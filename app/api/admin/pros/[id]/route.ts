import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin/auth";
import { getAdminProById } from "@/lib/queries/admin-pros";
import { getAdminServiceClient } from "@/lib/admin/service-client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await getAdminProById(parseInt(id));
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const db = getAdminServiceClient();

  // Only allow certain fields to be updated by admin
  const allowedFields = [
    "subscription_status",
    "is_active",
    "subscription_plan",
  ];
  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { error } = await db
    .from("pros")
    .update(updates as never)
    .eq("id", parseInt(id));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log the action
  await db.from("admin_logs").insert({
    admin_id: admin.id,
    action: "update_pro",
    entity_type: "pro",
    entity_id: parseInt(id),
    details: updates,
  } as never);

  return NextResponse.json({ success: true });
}
