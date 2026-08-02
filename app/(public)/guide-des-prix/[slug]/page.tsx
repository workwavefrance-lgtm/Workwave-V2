import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PriceGuide from "@/components/seo/PriceGuide";
import {
  getPriceGuideBySlug,
  getPriceGuidesBySlugs,
  getPriceGuidesByMetier,
} from "@/lib/queries/price-guides";
import { getCategoryBySlug } from "@/lib/queries/categories";
import { getAllDepartments } from "@/lib/queries/departments";
import { generateDepartmentSlug } from "@/lib/utils/slugs";
import { BASE_URL } from "@/lib/constants";

export const revalidate = 2592000; // 30j (15/07) : cache long sur toutes les routes SEO pour couper le cout ISR Vercel sous crawl ; donnees Sirene/prix statiques, 0 impact SEO.

// Sans generateStaticParams, Next.js classe une route dynamique en RENDU
// DYNAMIQUE : `revalidate` est ignore, la page est recalculee a CHAQUE visite
// (x-vercel-cache: MISS systematique). La liste vide = on ne prebuild rien au
// build (on ne veut pas figer les pages ici), mais la route bascule en ISR :
// 1re visite -> page generee ET mise en cache, visites suivantes -> servies du
// cache. Le HTML produit est identique : aucun impact SEO, juste moins de calcul.
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getPriceGuideBySlug(slug);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.meta_description ?? undefined,
    alternates: { canonical: `${BASE_URL}/guide-des-prix/${slug}` },
    openGraph: { type: "article", title: guide.title, description: guide.meta_description ?? undefined, url: `${BASE_URL}/guide-des-prix/${slug}` },
  };
}

export default async function PriceGuidePrestationPage({ params }: Props) {
  const { slug } = await params;
  const guide = await getPriceGuideBySlug(slug);
  if (!guide) notFound();

  const metierSlug = guide.metier_slug || "";
  const category = metierSlug ? await getCategoryBySlug(metierSlug) : null;
  const categoryName = category?.name || "Artisan";

  // Maillage : guides connexes déclarés, sinon autres prestations du métier.
  let related = guide.related_slugs?.length ? await getPriceGuidesBySlugs(guide.related_slugs) : [];
  if (related.length < 4 && metierSlug) {
    const more = (await getPriceGuidesByMetier(metierSlug, 8)).filter((g) => g.slug !== slug);
    const seen = new Set(related.map((r) => r.slug));
    for (const m of more) if (!seen.has(m.slug) && related.length < 6) { related.push(m); seen.add(m.slug); }
  }

  const departments = await getAllDepartments();
  const dept = departments[0];
  const deptSlug = dept ? generateDepartmentSlug(dept) : "vienne-86";
  const deptName = dept?.name || "Vienne";

  return (
    <PriceGuide
      guide={guide}
      categoryName={categoryName}
      metierSlug={metierSlug}
      related={related.map((r) => ({ slug: r.slug, h1: r.h1 }))}
      deptSlug={deptSlug}
      deptName={deptName}
    />
  );
}
