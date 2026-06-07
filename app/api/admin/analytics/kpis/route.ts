import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin/auth";
import { getAdminAnalytics } from "@/lib/queries/admin-events";
import type { DatePeriod } from "@/lib/types/admin";

function periodToDays(period: DatePeriod): number {
  if (period === "7d") return 7;
  if (period === "30d") return 30;
  if (period === "90d") return 90;
  if (period === "12m") return 365;
  return 30;
}

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const period = (request.nextUrl.searchParams.get("period") || "30d") as DatePeriod;
  const analytics = await getAdminAnalytics(periodToDays(period));
  return NextResponse.json(analytics);
}
