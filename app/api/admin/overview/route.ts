import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin/auth";
import { getAdminKPIs, getRecentActivity, getAdminTodo } from "@/lib/queries/admin-kpis";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [kpis, activity, todo] = await Promise.all([
    getAdminKPIs(),
    getRecentActivity(),
    getAdminTodo(),
  ]);

  return NextResponse.json({ kpis, activity, todo });
}
