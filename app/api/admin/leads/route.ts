import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin/auth";
import { getAdminLeads } from "@/lib/queries/admin-leads";

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl.searchParams;
  const result = await getAdminLeads({
    status: url.get("status") || "all",
    sort: url.get("sort") || "sent_at",
    order: (url.get("order") || "desc") as "asc" | "desc",
    page: parseInt(url.get("page") || "1"),
    pageSize: parseInt(url.get("pageSize") || "25"),
  });

  return NextResponse.json(result);
}
