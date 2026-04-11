import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin/auth";
import { detectAlerts } from "@/lib/queries/admin-alerts";

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const alerts = await detectAlerts();
  return NextResponse.json({ alerts });
}
