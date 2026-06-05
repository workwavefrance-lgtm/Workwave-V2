import { createClient } from "@/lib/supabase/server";

export type PriceRange = { label: string; low: number | null; high: number | null; unit: string };
export type DevisExample = { label: string; total: string; detail?: string };
export type PriceGuideFaq = { q: string; a: string };

export type PriceGuide = {
  id: number;
  slug: string;
  scope: "metier" | "prestation";
  metier_slug: string | null;
  univers: string | null;
  title: string;
  h1: string;
  meta_description: string | null;
  intro_md: string | null;
  price_ranges: PriceRange[];
  price_sources: string[];
  price_retrieved_at: string | null;
  factors_md: string | null;
  devis_examples: DevisExample[];
  faq: PriceGuideFaq[];
  related_slugs: string[];
  volume_est: number | null;
  kd: number | null;
  status: string;
  source_blog_slug: string | null;
  created_at: string;
  updated_at: string;
};

const COLS =
  "id, slug, scope, metier_slug, univers, title, h1, meta_description, intro_md, price_ranges, price_sources, price_retrieved_at, factors_md, devis_examples, faq, related_slugs, volume_est, kd, status, source_blog_slug, created_at, updated_at";

/** Guide prestation par slug (publié). */
export async function getPriceGuideBySlug(slug: string): Promise<PriceGuide | null> {
  const sb = await createClient();
  const { data } = await sb
    .from("price_guides")
    .select(COLS)
    .eq("slug", slug)
    .eq("scope", "prestation")
    .eq("status", "published")
    .maybeSingle();
  return (data as PriceGuide) ?? null;
}

/** Guide PRIX national d'un métier (publié). */
export async function getMetierPriceGuide(metierSlug: string): Promise<PriceGuide | null> {
  const sb = await createClient();
  const { data } = await sb
    .from("price_guides")
    .select(COLS)
    .eq("metier_slug", metierSlug)
    .eq("scope", "metier")
    .eq("status", "published")
    .maybeSingle();
  return (data as PriceGuide) ?? null;
}

/** Prestations publiées d'un métier (maillage + hub). */
export async function getPriceGuidesByMetier(metierSlug: string, limit = 24): Promise<PriceGuide[]> {
  const sb = await createClient();
  const { data } = await sb
    .from("price_guides")
    .select(COLS)
    .eq("metier_slug", metierSlug)
    .eq("scope", "prestation")
    .eq("status", "published")
    .order("volume_est", { ascending: false, nullsFirst: false })
    .limit(limit);
  return (data as PriceGuide[]) ?? [];
}

/** Guides connexes par slugs (maillage). */
export async function getPriceGuidesBySlugs(slugs: string[]): Promise<PriceGuide[]> {
  if (!slugs.length) return [];
  const sb = await createClient();
  const { data } = await sb
    .from("price_guides")
    .select("slug, h1, title, metier_slug")
    .in("slug", slugs)
    .eq("status", "published");
  return (data as PriceGuide[]) ?? [];
}

/** Tous les guides publiés (sitemap + hub). Paginé (cap PostgREST 1000). */
export async function getAllPublishedPriceGuides(): Promise<
  Pick<PriceGuide, "slug" | "scope" | "metier_slug" | "univers" | "h1" | "volume_est" | "updated_at">[]
> {
  const sb = await createClient();
  const out: Pick<PriceGuide, "slug" | "scope" | "metier_slug" | "univers" | "h1" | "volume_est" | "updated_at">[] = [];
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    const { data } = await sb
      .from("price_guides")
      .select("slug, scope, metier_slug, univers, h1, volume_est, updated_at")
      .eq("status", "published")
      .order("id")
      .range(offset, offset + PAGE - 1);
    const rows = (data || []) as (typeof out);
    if (rows.length === 0) break;
    out.push(...rows);
    offset += rows.length;
  }
  return out;
}
