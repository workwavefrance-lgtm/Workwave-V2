import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { generateDepartmentSlug } from "@/lib/utils/slugs";
import type { Department } from "@/lib/types/database";

// Résultat unifié : commune OU département (une région tapée se "déplie" en
// ses départements, faute de page région dédiée — décision 13/06). Le `slug`
// est directement le segment d'URL `location` (/[metier]/[slug]).
export type CitySearchResult = {
  kind: "city" | "department";
  id: number;
  name: string;
  slug: string;
  postal_code: string | null;
  department_code: string;
  population: number | null;
  sublabel: string;
};

// Alias courants de régions (le nom officiel est long : "PACA" ne matche pas
// "Provence-Alpes-Côte d'Azur" en recherche naïve).
const REGION_ALIASES: Record<string, string> = {
  paca: "provence",
  idf: "ile de france",
  aura: "auvergne",
  occ: "occitanie",
  hdf: "hauts de france",
  na: "nouvelle-aquitaine",
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("q")?.trim();
  if (!raw || raw.length < 2) return NextResponse.json([]);

  const supabase = await createClient();
  const isNumeric = /^\d+$/.test(raw);
  const nq = normalize(raw);

  // 1) Communes (par CP si numérique, sinon par nom) — comportement existant.
  const cityQuery = supabase
    .from("cities")
    .select("id, name, slug, postal_code, population, departments!inner(code, country)")
    .order("population", { ascending: false, nullsFirst: false })
    .limit(8);
  const { data: cityData } = isNumeric
    ? await cityQuery.ilike("postal_code", `${raw}%`)
    : await cityQuery.ilike("name", `${raw}%`);

  // 2) Départements + régions : on charge les 101 dépts (léger) et on filtre
  //    côté JS pour gérer accents + régions + alias sans extension Postgres.
  const { data: allDepts } = await supabase
    .from("departments")
    .select("id, code, name, region, country");

  const aliasTerm = REGION_ALIASES[nq];
  const matchedDepts = (allDepts || []).filter((d) => {
    const nameN = normalize(d.name);
    const regionN = normalize(d.region || "");
    const codeN = (d.code || "").toLowerCase();
    if (isNumeric) return codeN.startsWith(raw); // "971" → Guadeloupe, "86" → Vienne
    return (
      nameN.includes(nq) || // "vienne" → Vienne, Haute-Vienne
      regionN.includes(nq) || // "provence" / "guadeloupe" → départements de la région
      (!!aliasTerm && regionN.includes(normalize(aliasTerm))) // "paca" → PACA
    );
  });

  const deptResults: CitySearchResult[] = matchedDepts
    .sort((a, b) => a.code.localeCompare(b.code))
    .slice(0, 8)
    .map((d) => {
      const isBE = (d as { country?: string }).country === "BE";
      return {
        kind: "department" as const,
        id: d.id,
        name: d.name,
        slug: generateDepartmentSlug(d as unknown as Department),
        postal_code: null,
        department_code: d.code,
        population: null,
        // Belgique : le code technique (BRU/WLG) ne parle à personne → "Belgique".
        sublabel: isBE ? "Toute la province · Belgique" : `Tout le département · ${d.code}`,
      };
    });

  const cityResults: CitySearchResult[] = (cityData || []).map((c) => {
    // @ts-expect-error - join syntax
    const dept = c.departments?.code || "";
    // @ts-expect-error - join syntax
    const isBE = c.departments?.country === "BE";
    return {
      kind: "city" as const,
      id: c.id as number,
      name: c.name as string,
      slug: c.slug as string,
      postal_code: (c.postal_code as string) || null,
      department_code: dept,
      population: (c.population as number) || null,
      sublabel: isBE
        ? `${(c.postal_code as string) || ""} · Belgique`
        : `${(c.postal_code as string) || ""} · ${dept}`,
    };
  });

  // Départements/régions d'abord (le "voir tout"), puis les communes. Max 10.
  return NextResponse.json([...deptResults, ...cityResults].slice(0, 10));
}
