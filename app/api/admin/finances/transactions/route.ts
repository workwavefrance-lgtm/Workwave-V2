import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin/auth";
import { getTransactions } from "@/lib/stripe/admin-finances";

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl.searchParams;
  const page = parseInt(url.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(url.get("limit") ?? "25", 10), 100);

  const result = await getTransactions(page, limit);

  return NextResponse.json(result);
}
