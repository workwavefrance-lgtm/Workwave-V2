import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin/auth";
import { getFinanceKPIs, getMrrHistory } from "@/lib/stripe/admin-finances";

export const revalidate = 60;

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [kpis, mrrHistory] = await Promise.all([
    getFinanceKPIs(),
    getMrrHistory(),
  ]);

  return NextResponse.json({ kpis, mrrHistory });
}
