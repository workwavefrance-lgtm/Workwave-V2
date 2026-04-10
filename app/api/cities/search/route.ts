import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("cities")
    .select("id, name, postal_code")
    .ilike("name", `${q}%`)
    .order("population", { ascending: false, nullsFirst: false })
    .limit(8);

  return NextResponse.json(data || []);
}
