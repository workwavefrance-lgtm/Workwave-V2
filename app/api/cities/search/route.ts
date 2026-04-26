import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export type CitySearchResult = {
  id: number;
  name: string;
  slug: string;
  postal_code: string | null;
  department_code: string;
  population: number | null;
};

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const supabase = await createClient();

  // Si l'input commence par des chiffres, on cherche par code postal.
  // Sinon par nom de ville.
  const isNumeric = /^\d+$/.test(q);

  const query = supabase
    .from("cities")
    .select("id, name, slug, postal_code, population, departments!inner(code)")
    .order("population", { ascending: false, nullsFirst: false })
    .limit(10);

  const { data } = isNumeric
    ? await query.ilike("postal_code", `${q}%`)
    : await query.ilike("name", `${q}%`);

  // Reformater pour aplatir le department_code
  const results: CitySearchResult[] = (data || []).map((c) => {
    // @ts-expect-error - join syntax
    const dept = c.departments?.code || "";
    return {
      id: c.id as number,
      name: c.name as string,
      slug: c.slug as string,
      postal_code: (c.postal_code as string) || null,
      department_code: dept,
      population: (c.population as number) || null,
    };
  });

  return NextResponse.json(results);
}
