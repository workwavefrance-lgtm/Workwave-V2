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

// Sans generateStaticParams, Next.js classe la route en RENDU DYNAMIQUE :
// `revalidate` est ignore et la page est recalculee a CHAQUE visite. La liste
// vide = on ne prebuild rien au build, mais la route bascule en ISR (1re visite
// -> generee ET mise en cache). HTML identique : aucun impact SEO.
export function generateStaticParams() {
  return [];
}


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

/**
 * Appel a l'action glisse au milieu de l'article.
 *
 * Trois formulations differentes, choisies selon la position : on ne repete
 * jamais le meme message. La premiere propose, la deuxieme rassure sur le
 * prix, la troisieme leve l'objection de l'engagement. Discret par
 * construction (fond leger, pas de gros bouton plein ecran) : au milieu d'une
 * lecture, un encart trop voyant est percu comme une interruption.
 */
function AppelDansArticle({ rang, tag }: { rang: number; tag?: string }) {
  // Elision obligatoire : « de aide administrative » ne se dit pas. Les tags
  // couvrent 197 metiers, dont « aide aux seniors », « electricien »,
  // « accompagnement handicap » — le cas voyelle est frequent, pas marginal.
  const metier = tag ? tag.toLowerCase() : null;
  const de = metier && /^[aeiouyàâéèêëîïôöûü]/.test(metier) ? `d'${metier}` : `de ${metier}`;
  const variantes = [
    {
      titre: metier ? `Un projet ${de} chez vous ?` : "Un projet de ce type chez vous ?",
      texte: "Décrivez-le en 2 minutes. Des artisans de votre secteur vous répondent.",
      bouton: "Décrire mon projet",
    },
    {
      titre: "Combien ça coûte chez vous ?",
      texte:
        "Les prix varient selon la région et l'accès au chantier. Le plus sûr reste de comparer plusieurs devis réels.",
      bouton: "Recevoir des devis gratuits",
    },
    {
      titre: "Vous n'êtes engagé à rien",
      texte:
        "Vous recevez des propositions, vous comparez, et vous choisissez — ou vous ne choisissez personne.",
      bouton: "Demander des devis",
    },
  ];
  const v = variantes[rang % variantes.length];
  return (
    <aside className="my-10 rounded-2xl border border-[var(--card-border)] bg-[var(--bg-secondary)] p-6">
      <p className="text-base font-semibold text-[var(--text-primary)]">{v.titre}</p>
      <p className="mt-1.5 text-sm text-[var(--text-secondary)]">{v.texte}</p>
      <Link
        href="/deposer-projet"
        className="mt-4 inline-block bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02]"
      >
        {v.bouton}
      </Link>
      <p className="mt-2.5 text-xs text-[var(--text-tertiary)]">
        Gratuit &middot; sans engagement &middot; artisans vérifiés au registre officiel
      </p>
    </aside>
  );
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

      {/* ── L'ARTICLE, ENTRECOUPE D'APPELS A L'ACTION ────────────────────────
          Avant : un seul bouton tout en bas. La plupart des lecteurs ne
          descendent jamais jusque-la — l'article travaille pour rien.

          TROIS inseres, pas cinq, et surtout PAS le meme bouton repete : cinq
          fois « Deposer un projet » se lit comme une publicite et fait
          decrocher. Chacun arrive apres une section qui vient d'apporter
          quelque chose au lecteur, et dit autre chose que le precedent. */}
      {(() => {
        // Decoupe aux titres de niveau 2, en gardant le titre avec sa section.
        const sections = post.content.split(/\n(?=## )/);
        // Un appel toutes les 2 sections, 3 au maximum, et jamais dans le
        // dernier tiers : le bouton final s'en charge deja.
        const positions = new Set<number>();
        for (let i = 2; i < sections.length - 1 && positions.size < 3; i += 2) {
          positions.add(i);
        }
        return (
          <div className="mt-16 pt-10 border-t border-[var(--border-color)]">
            {sections.map((bloc, i) => (
              <div key={i}>
                <SeoContent content={bloc} nu />
                {positions.has(i + 1) && (
                  <AppelDansArticle rang={[...positions].indexOf(i + 1)} tag={post.tags?.[0]} />
                )}
              </div>
            ))}
          </div>
        );
      })()}

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
