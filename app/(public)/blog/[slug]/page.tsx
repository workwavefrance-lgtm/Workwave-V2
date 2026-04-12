import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import SeoContent from "@/components/seo/SeoContent";
import { getBlogPostBySlug } from "@/lib/queries/blog";
import { toBreadcrumbSchema } from "@/lib/utils/schema";
import { BASE_URL } from "@/lib/constants";

export const revalidate = 3600;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.meta_description,
    alternates: { canonical: `${BASE_URL}/blog/${slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.meta_description,
      url: `${BASE_URL}/blog/${slug}`,
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at,
      authors: [post.author],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.meta_description,
    },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: post.title },
  ];

  const breadcrumbJsonLd = toBreadcrumbSchema(breadcrumbItems, BASE_URL);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.meta_description,
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
    datePublished: post.published_at,
    dateModified: post.updated_at,
    mainEntityOfPage: `${BASE_URL}/blog/${slug}`,
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <Breadcrumb items={breadcrumbItems} />

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
        {post.title}
      </h1>

      <div className="flex items-center gap-4 mb-8">
        <p className="text-sm text-[var(--text-tertiary)]">
          Par {post.author} —{" "}
          {post.published_at
            ? new Date(post.published_at).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent)" }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <SeoContent content={post.content} />

      {/* CTA */}
      <div className="mt-12 pt-8 border-t border-[var(--border-color)] text-center">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
          Besoin d&apos;un professionnel ?
        </h3>
        <Link
          href="/deposer-projet"
          className="inline-block bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-8 py-3 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02]"
        >
          Deposer un projet gratuitement
        </Link>
      </div>

      {/* Retour blog */}
      <div className="mt-8 text-center">
        <Link
          href="/blog"
          className="text-sm text-[var(--accent)] hover:underline"
        >
          Voir tous les articles
        </Link>
      </div>
    </main>
  );
}
