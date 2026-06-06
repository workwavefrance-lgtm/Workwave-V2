/**
 * Endpoint public read-only des catégories actives.
 * Utilisé par le composant client <QuickProjectModalTrigger> pour alimenter
 * le ProjectForm dans la modal (sans avoir à le passer en props depuis chaque
 * layout / page server).
 *
 * Cache 1h CDN (la liste catégories bouge ~jamais).
 */
import { NextResponse } from "next/server";
import { getAllCategoriesPublic } from "@/lib/queries/home-public";

export const revalidate = 3600;

export async function GET() {
  const cats = await getAllCategoriesPublic();
  return NextResponse.json(
    cats.map((c) => ({ id: c.id, name: c.name, vertical: c.vertical })),
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
