/**
 * POST /api/agent-context
 *
 * Reçoit le pathname courant et renvoie un contexte structuré pour
 * l'agent commercial : type de page (fiche pro / listing / home /
 * autre) + données pertinentes (nom du pro, catégorie, ville).
 *
 * Utilisé par le composant <CommercialAgent /> pour adapter le
 * message d'accueil et le system prompt de Claude.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export type AgentContext =
  | {
      type: "pro_fiche";
      proName: string;
      proSlug: string;
      categoryName: string;
      categorySlug: string;
      cityName: string | null;
      citySlug: string | null;
    }
  | {
      type: "listing";
      categoryName: string;
      categorySlug: string;
      locationName: string;
      locationSlug: string;
    }
  | { type: "home" }
  // Réclamation de fiche en cours. Contexte ajouté le 20/07/2026 avec le
  // support de niveau 1 : c'est la page où se pose le motif de contact numéro
  // 1 (« je n'ai pas reçu le code »), Léa doit y arriver en le sachant.
  | { type: "claim"; proName: string | null; step: "form" | "verification" }
  | { type: "other"; pathname: string };

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  let pathname: string;
  try {
    const body = await req.json();
    pathname = typeof body?.pathname === "string" ? body.pathname : "";
  } catch {
    return NextResponse.json<AgentContext>({ type: "other", pathname: "" });
  }

  // Home
  if (pathname === "/" || pathname === "") {
    return NextResponse.json<AgentContext>({ type: "home" });
  }

  // Fiche pro : /artisan/[slug]
  // Réclamation de fiche : /pro/reclamer/[slug] et .../verification
  const claimMatch = pathname.match(/^\/pro\/reclamer\/([^/?#]+)(\/verification)?\/?$/);
  if (claimMatch) {
    const slug = claimMatch[1];
    const step = claimMatch[2] ? "verification" : "form";
    const sb = getServiceClient();
    const { data } = await sb
      .from("pros")
      .select("name")
      .eq("slug", slug)
      .eq("is_active", true)
      .is("deleted_at", null)
      .maybeSingle();
    return NextResponse.json<AgentContext>({
      type: "claim",
      proName: (data as { name: string } | null)?.name ?? null,
      step,
    });
  }

  const proMatch = pathname.match(/^\/artisan\/([^/?#]+)\/?$/);
  if (proMatch) {
    const slug = proMatch[1];
    const sb = getServiceClient();
    const { data } = await sb
      .from("pros")
      .select(
        "name, slug, category:categories(name, slug), city:cities(name, slug)"
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .is("deleted_at", null)
      .single();
    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pro = data as any;
      return NextResponse.json<AgentContext>({
        type: "pro_fiche",
        proName: pro.name,
        proSlug: pro.slug,
        categoryName: pro.category?.name ?? "",
        categorySlug: pro.category?.slug ?? "",
        cityName: pro.city?.name ?? null,
        citySlug: pro.city?.slug ?? null,
      });
    }
    return NextResponse.json<AgentContext>({ type: "other", pathname });
  }

  // Listing métier/ville : /[metier]/[location]
  const listingMatch = pathname.match(/^\/([^/?#]+)\/([^/?#]+)\/?$/);
  if (listingMatch) {
    const [, metierSlug, locationSlug] = listingMatch;
    const sb = getServiceClient();
    const { data: catData } = await sb
      .from("categories")
      .select("name, slug")
      .eq("slug", metierSlug)
      .single();
    if (catData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cat = catData as any;
      // location peut être ville ou département. On tente la ville d'abord.
      const { data: cityData } = await sb
        .from("cities")
        .select("name, slug")
        .eq("slug", locationSlug)
        .single();
      if (cityData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const city = cityData as any;
        return NextResponse.json<AgentContext>({
          type: "listing",
          categoryName: cat.name,
          categorySlug: cat.slug,
          locationName: city.name,
          locationSlug: city.slug,
        });
      }
      // Sinon département (format slug : "nom-code")
      const deptMatch = locationSlug.match(/-(\d{2,3})$/);
      if (deptMatch) {
        const { data: deptData } = await sb
          .from("departments")
          .select("name, code")
          .eq("code", deptMatch[1])
          .single();
        if (deptData) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dept = deptData as any;
          return NextResponse.json<AgentContext>({
            type: "listing",
            categoryName: cat.name,
            categorySlug: cat.slug,
            locationName: dept.name,
            locationSlug,
          });
        }
      }
    }
  }

  // Tout le reste (admin, /pro, /blog, etc.) -> contexte générique
  return NextResponse.json<AgentContext>({ type: "other", pathname });
}
