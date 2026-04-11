import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin/auth";
import { getAdminKPIs, getRecentActivity, getSparklineData } from "@/lib/queries/admin-kpis";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [kpis, activity, sparkline] = await Promise.all([
    getAdminKPIs(),
    getRecentActivity(),
    getSparklineData(),
  ]);

  return NextResponse.json({ kpis, activity, sparkline });
}
