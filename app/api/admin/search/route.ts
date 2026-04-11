import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ pros: [], projects: [] });
  }

  const supabase = await createClient();

  const [prosResult, projectsResult] = await Promise.all([
    supabase
      .from("pros")
      .select("id, name, slug")
      .or(`name.ilike.%${q}%,siret.ilike.%${q}%`)
      .limit(5),
    supabase
      .from("projects")
      .select("id, particulier_name")
      .or(`particulier_name.ilike.%${q}%,description.ilike.%${q}%`)
      .limit(5),
  ]);

  const pros = (prosResult.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
  }));

  const projects = (projectsResult.data ?? []).map((p) => ({
    id: p.id,
    first_name: p.particulier_name ?? `Projet #${p.id}`,
  }));

  return NextResponse.json({ pros, projects });
}
