import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin/auth";
import { getAdminLogs } from "@/lib/queries/admin-logs";

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl.searchParams;
  const page = parseInt(url.get("page") || "1");
  const pageSize = parseInt(url.get("pageSize") || "50");

  const result = await getAdminLogs(page, pageSize);
  return NextResponse.json(result);
}
