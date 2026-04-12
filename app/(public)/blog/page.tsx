import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/queries/blog";
import Pagination from "@/components/ui/Pagination";
import EmptyState from "@/components/ui/EmptyState";

export const metadata: Metadata = {
  title: "Blog - Conseils et guides pour vos projets",
  description:
    "Conseils pratiques, guides de prix et astuces pour bien choisir vos professionnels en Vienne. Articles rediges par des experts.",
  alternates: { canonical: "https://workwave.fr/blog" },
};

export const revalidate = 3600;

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function BlogPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);

  const { data: posts, totalPages } = await getPublishedPosts(page, 12);

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-3">
          Blog Workwave
        </h1>
        <p className="text-[var(--text-secondary)]">
          Conseils pratiques et guides de prix pour vos projets en Vienne.
        </p>
      </div>

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6 transition-all duration-250 hover:-translate-y-1 hover:shadow-md hover:border-[var(--accent)]"
            >
              <div className="flex flex-wrap gap-2 mb-3">
                {post.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent)" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors duration-250 mb-2 line-clamp-2">
                {post.title}
              </h2>
              <p className="text-sm text-[var(--text-secondary)] line-clamp-3 mb-3">
                {post.meta_description}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">
                {post.published_at
                  ? new Date(post.published_at).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : ""}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Aucun article pour le moment"
          message="Nos premiers articles arrivent bientot. Revenez vite !"
        />
      )}

      <Pagination currentPage={page} totalPages={totalPages} baseUrl="/blog" />
    </main>
  );
}
