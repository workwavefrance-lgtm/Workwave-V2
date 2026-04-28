import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Endpoint public : retourne les derniers pros qui ont reclame leur fiche.
// Donnees retournees uniquement publiques (nom commercial + categorie +
// ville + claimed_at). Aucun email, telephone, SIRET, user_id.
//
// Les pros figurent deja publiquement sur /artisan/[slug] et au registre
// Sirene, donc afficher leur nom commercial dans une notification "social
// proof" reste de l'info publique. Aucun risque RGPD particulier.

export const revalidate = 300; // cache server 5 min

type RecentClaimRow = {
  slug: string;
  name: string;
  claimed_at: string;
  categories: { name: string } | { name: string }[] | null;
  cities: { name: string } | { name: string }[] | null;
};

function pickName(
  v: RecentClaimRow["cities"] | RecentClaimRow["categories"]
): string | null {
  if (!v) return null;
  if (Array.isArray(v)) return v[0]?.name ?? null;
  return v.name ?? null;
}

export async function GET() {
  // Service role pour bypass RLS sur cette query publique read-only.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("pros")
    .select("slug, name, claimed_at, categories(name), cities(name)")
    .not("claimed_by_user_id", "is", null)
    .not("claimed_at", "is", null)
    .order("claimed_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ items: [] }, { status: 200 });
  }

  const items = ((data ?? []) as RecentClaimRow[]).map((p) => ({
    slug: p.slug,
    name: p.name,
    category: pickName(p.categories),
    city: pickName(p.cities),
    claimed_at: p.claimed_at,
  }));

  return NextResponse.json(
    { items },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
