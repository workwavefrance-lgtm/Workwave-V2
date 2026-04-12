import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import SeoContent from "@/components/seo/SeoContent";
import { getCategoryBySlug } from "@/lib/queries/categories";
import { getGuideBySlug } from "@/lib/queries/seo-guides";
import { getAllDepartments } from "@/lib/queries/departments";
import { generateDepartmentSlug } from "@/lib/utils/slugs";
import { toBreadcrumbSchema } from "@/lib/utils/schema";
import { BASE_URL } from "@/lib/constants";

export const revalidate = 86400; // 24h

type Props = {
  params: Promise<{ metier: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { metier } = await params;
  const guide = await getGuideBySlug(metier);
  if (!guide) return {};

  return {
    title: guide.title,
    description: guide.meta_description,
    alternates: { canonical: `${BASE_URL}/${metier}/guide` },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.meta_description,
      url: `${BASE_URL}/${metier}/guide`,
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.meta_description,
    },
  };
}

export default async function GuidePage({ params }: Props) {
  const { metier } = await params;

  const category = await getCategoryBySlug(metier);
  if (!category) notFound();

  const guide = await getGuideBySlug(metier);
  if (!guide) notFound();

  // Departement dynamique (premier disponible)
  const departments = await getAllDepartments();
  const dept = departments[0];
  const deptSlug = dept ? generateDepartmentSlug(dept) : "vienne-86";
  const deptName = dept?.name || "Vienne";

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: category.name, href: `/${category.slug}/${deptSlug}` },
    { label: "Guide" },
  ];

  const breadcrumbJsonLd = toBreadcrumbSchema(breadcrumbItems, BASE_URL);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.meta_description,
    author: {
      "@type": "Organization",
      name: "Workwave",
      url: BASE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Workwave",
      url: BASE_URL,
    },
    datePublished: guide.generated_at,
    dateModified: guide.updated_at,
    mainEntityOfPage: `${BASE_URL}/${metier}/guide`,
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <Breadcrumb items={breadcrumbItems} />

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
        Guide complet : {category.name}
      </h1>

      <p className="text-sm text-[var(--text-tertiary)] mb-8">
        Par {guide.author} — Mis a jour le{" "}
        {new Date(guide.updated_at).toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      {/* Table des matieres */}
      {guide.table_of_contents && guide.table_of_contents.length > 0 && (
        <nav className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6 mb-10">
          <h2 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-3">
            Sommaire
          </h2>
          <ol className="space-y-2">
            {guide.table_of_contents.map((item, i) => (
              <li key={i}>
                <a
                  href={`#${item.anchor}`}
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors duration-200"
                >
                  {i + 1}. {item.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Contenu */}
      <SeoContent content={guide.content} />

      {/* CTA bas de page */}
      <div className="mt-12 pt-8 border-t border-[var(--border-color)] text-center">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
          Trouvez un {category.name.toLowerCase()} pres de chez vous
        </h3>
        <Link
          href={`/${category.slug}/${deptSlug}`}
          className="inline-block bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-8 py-3 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02]"
        >
          Voir les {category.name.toLowerCase()}s en {deptName}
        </Link>
      </div>
    </main>
  );
}
