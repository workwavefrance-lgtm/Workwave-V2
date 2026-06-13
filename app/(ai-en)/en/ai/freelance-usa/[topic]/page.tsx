import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AiFaqSection, type FaqItem } from "@/components/ai/AiFaqSection";
import MonumentArt from "@/components/ai/MonumentArt";
import { aiAlternatesEnOnly } from "@/lib/i18n/alternates";
import { getUsaGuide, usaGuideSlugs, USA_GUIDES } from "@/lib/data/freelance-usa";

/**
 * Guide "freelance aux USA" par topic : /en/ai/freelance-usa/[topic].
 *
 * Contenu 100% SOURCÉ (lib/data/freelance-usa.ts — IRS / SBA / USCIS).
 * Disclaimer "not legal/tax advice" affiché. Indexable (SEO), ISR 24h.
 * generateStaticParams sur les topics qui ont un guide.
 */

const SITE_URL = "https://www.workwaveai.co";
export const revalidate = 604800; // 7j (13/06) : pic crawl Google 650k pages = +200% Vercel ; donnees Sirene statiques, 0 impact SEO

type Params = { topic: string };

export function generateStaticParams() {
  return usaGuideSlugs().map((topic) => ({ topic }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { topic } = await params;
  const guide = getUsaGuide(topic);
  if (!guide) return { title: "Not found" };
  const path = `/en/ai/freelance-usa/${topic}`;
  return {
    title: guide.title,
    description: guide.metaDescription,
    alternates: aiAlternatesEnOnly(path),
    openGraph: {
      title: guide.title,
      description: guide.metaDescription,
      url: `${SITE_URL}${path}`,
      siteName: "Workwave AI",
      locale: "en_US",
      type: "article",
    },
  };
}

export default async function FreelanceUsaTopicPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { topic } = await params;
  const guide = getUsaGuide(topic);
  if (!guide) notFound();

  const path = `/en/ai/freelance-usa/${topic}`;
  const otherGuides = usaGuideSlugs()
    .filter((s) => s !== topic)
    .map((s) => USA_GUIDES[s]);

  const faq: FaqItem[] = guide.faq.map((f) => ({ q: f.q, a: f.a }));

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Workwave AI", item: `${SITE_URL}/en/ai` },
      { "@type": "ListItem", position: 2, name: "Freelancing in the US", item: `${SITE_URL}/en/ai/freelance-usa` },
      { "@type": "ListItem", position: 3, name: guide.cardTitle, item: `${SITE_URL}${path}` },
    ],
  };
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.metaDescription,
    inLanguage: "en",
    dateModified: guide.lastReviewed,
    author: { "@type": "Organization", name: "Workwave AI" },
    publisher: { "@type": "Organization", name: "Workwave AI", url: `${SITE_URL}/en/ai` },
  };

  return (
    <>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
        <ol className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--ai-text-tertiary)]">
          <li><Link href="/en/ai" className="hover:text-[var(--ai-text)]">Workwave AI</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/en/ai/freelance-usa" className="hover:text-[var(--ai-text)]">Freelancing in the US</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-[var(--ai-text-secondary)]">{guide.cardTitle}</li>
        </ol>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute right-0 bottom-0 w-[45%] max-w-[420px] select-none" style={{ color: "var(--ai-accent)", opacity: 0.1 }}>
          <MonumentArt name={guide.monument} className="w-full h-[180px] sm:h-[240px]" strokeWidth={1.25} />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-8">
          <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--ai-text-tertiary)]" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
            Freelance guide
          </span>
          <h1 className="mt-3 font-black text-[var(--ai-text)] max-w-2xl" style={{ fontSize: "clamp(28px, 4.6vw, 50px)", lineHeight: 1.04, letterSpacing: "-0.03em" }}>
            {guide.title}
          </h1>
          <p className="mt-5 text-[16px] sm:text-[17px] leading-relaxed text-[var(--ai-text-secondary)]">{guide.intro}</p>
        </div>
      </section>

      {/* Disclaimer légal / fiscal */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="rounded-xl border border-[var(--ai-border)] bg-[var(--ai-bg-subtle)] p-4 text-[13px] text-[var(--ai-text-secondary)] leading-relaxed">
          <strong className="text-[var(--ai-text)]">General information, not legal or tax advice.</strong> Rules and thresholds change — last reviewed {guide.lastReviewed}. Always confirm the current requirements with the official sources listed at the bottom, and consult a licensed professional for your situation.
        </div>
      </div>

      {/* BODY */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Key points */}
        <div className="mb-10">
          <h2 className="text-[20px] font-bold text-[var(--ai-text)] mb-3">Key points</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-[15px] leading-relaxed text-[var(--ai-text-secondary)]">
            {guide.keyPoints.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>

        {/* Sections thématiques */}
        {guide.sections.map((section) => (
          <div key={section.title} className="mb-10">
            <h2 className="text-[20px] font-bold text-[var(--ai-text)] mb-3">{section.title}</h2>
            <div className="text-[15px] leading-relaxed text-[var(--ai-text-secondary)] space-y-3">
              {section.paragraphs.map((para, i) => <p key={i}>{para}</p>)}
            </div>
            {section.bullets && section.bullets.length > 0 && (
              <ul className="list-disc pl-5 space-y-1.5 mt-3 text-[15px] leading-relaxed text-[var(--ai-text-secondary)]">
                {section.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            )}
          </div>
        ))}

        {/* Steps pratiques */}
        <div className="mb-10">
          <h2 className="text-[20px] font-bold text-[var(--ai-text)] mb-3">Step by step</h2>
          <ol className="list-decimal pl-5 space-y-2 text-[15px] leading-relaxed text-[var(--ai-text-secondary)]">
            {guide.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </div>

        {/* Caveats */}
        {guide.caveats.length > 0 && (
          <div className="mb-10">
            <h2 className="text-[20px] font-bold text-[var(--ai-text)] mb-3">Good to know</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-[15px] leading-relaxed text-[var(--ai-text-secondary)]">
              {guide.caveats.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        )}

        {/* CTA Workwave */}
        <div className="rounded-2xl border border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)] p-7 my-10">
          <h2 className="text-[19px] font-bold text-[var(--ai-text)]">Find clients on Workwave AI.</h2>
          <p className="mt-2 text-[14px] text-[var(--ai-text-secondary)]">Once you&apos;re set up, create a free profile and get matched with projects — AI, development, data, design and more, with 0% commission.</p>
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <Link href="/en/ai/inscription" className="inline-flex items-center justify-center h-11 px-6 text-[14px] font-semibold rounded-full bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors">Create your free profile</Link>
            <Link href="/en/ai" className="inline-flex items-center justify-center h-11 px-6 text-[14px] font-semibold rounded-full bg-[var(--ai-text)] hover:bg-[var(--ai-primary-hover)] text-white transition-colors">Explore Workwave AI</Link>
          </div>
        </div>

        {/* Maillage : autres guides US */}
        {otherGuides.length > 0 && (
          <div className="mb-10">
            <h2 className="text-[20px] font-bold text-[var(--ai-text)] mb-3">Related guides</h2>
            <ul className="flex flex-wrap gap-2">
              {otherGuides.map((g) => (
                <li key={g.topicSlug}>
                  <Link href={`/en/ai/freelance-usa/${g.topicSlug}`} className="inline-flex items-center px-3.5 py-2 rounded-full border border-[var(--ai-border-subtle)] bg-[var(--ai-bg)] text-[13px] text-[var(--ai-text-secondary)] hover:border-[var(--ai-border-strong)] hover:text-[var(--ai-text)] transition-colors">
                    {g.cardTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sources */}
        <div className="mb-2">
          <h2 className="text-[20px] font-bold text-[var(--ai-text)] mb-3">Sources</h2>
          <ul className="space-y-1.5 text-[13px]">
            {guide.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener nofollow" className="text-[var(--ai-accent)] underline decoration-[var(--ai-accent-border)] underline-offset-2 break-words">{s.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </article>

      {/* FAQ */}
      <AiFaqSection id="faq" title="FAQ" subtitle={guide.cardTitle} questions={faq} sectionLabel="FAQ" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
    </>
  );
}
