import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin/auth";
import { getAdminPros } from "@/lib/queries/admin-pros";

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl.searchParams;
  const filters = {
    status: url.get("status") || "all",
    claimed: url.get("claimed") || "all",
    search: url.get("search") || "",
    sort: url.get("sort") || "created_at",
    order: (url.get("order") || "desc") as "asc" | "desc",
    page: parseInt(url.get("page") || "1"),
    pageSize: parseInt(url.get("pageSize") || "25"),
  };

  const result = await getAdminPros(filters);
  return NextResponse.json(result);
}
