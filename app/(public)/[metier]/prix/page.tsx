import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PriceGuide from "@/components/seo/PriceGuide";
import { getMetierPriceGuide, getPriceGuidesByMetier } from "@/lib/queries/price-guides";
import { getCategoryBySlug } from "@/lib/queries/categories";
import { getAllDepartments } from "@/lib/queries/departments";
import { generateDepartmentSlug } from "@/lib/utils/slugs";
import { BASE_URL } from "@/lib/constants";

/**
 * Guide PRIX national d'un métier : /[metier]/prix (ex. /plombier/prix).
 * Segment statique "prix" prioritaire sur /[metier]/[location] (cf. /[metier]/guide).
 * 404 si pas de guide publié pour ce métier (pas de page vide).
 */
export const revalidate = 2592000; // 30j (15/07) : cache long sur toutes les routes SEO pour couper le cout ISR Vercel sous crawl ; donnees Sirene/prix statiques, 0 impact SEO.

type Props = { params: Promise<{ metier: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { metier } = await params;
  const guide = await getMetierPriceGuide(metier);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.meta_description ?? undefined,
    alternates: { canonical: `${BASE_URL}/${metier}/prix` },
    openGraph: { type: "article", title: guide.title, description: guide.meta_description ?? undefined, url: `${BASE_URL}/${metier}/prix` },
  };
}

export default async function MetierPriceGuidePage({ params }: Props) {
  const { metier } = await params;
  const category = await getCategoryBySlug(metier);
  if (!category) notFound();
  const guide = await getMetierPriceGuide(metier);
  if (!guide) notFound();

  const related = (await getPriceGuidesByMetier(metier, 12));

  const departments = await getAllDepartments();
  const dept = departments[0];
  const deptSlug = dept ? generateDepartmentSlug(dept) : "vienne-86";
  const deptName = dept?.name || "Vienne";

  return (
    <PriceGuide
      guide={guide}
      categoryName={category.name}
      metierSlug={metier}
      related={related.map((r) => ({ slug: r.slug, h1: r.h1 }))}
      deptSlug={deptSlug}
      deptName={deptName}
    />
  );
}
