import type { Metadata } from "next";
import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public-client";
import { SectionLabel } from "@/components/ai/ui/SectionLabel";
import { Watermark } from "@/components/ai/ui/Watermark";

export const revalidate = 21600; // 6h ISR

export const metadata: Metadata = {
  title: "Tous les freelances tech — Workwave AI",
  description:
    "Decouvrez tous les freelances tech sur Workwave AI : developpement web, IA, cloud, DevOps, no-code, data analytics, design produit. Matching IA en moins de 24h.",
  alternates: { canonical: "/ai/freelances" },
};

const TECH_VERTICAL = "tech";

export default async function FreelancesHubPage() {
  const sb = createPublicClient();

  // 1. Charge les 6 categories tech
  const { data: categories } = await sb
    .from("categories")
    .select("id, slug, name, description")
    .eq("vertical", TECH_VERTICAL)
    .order("slug");

  if (!categories) return null;

  // 2. Count freelances par categorie
  const counts = await Promise.all(
    categories.map(async (cat) => {
      const { count } = await sb
        .from("pros")
        .select("*", { count: "estimated", head: true })
        .eq("category_id", cat.id)
        .eq("source", "sirene")
        .eq("is_active", true)
        .is("deleted_at", null);
      return { ...cat, count: count || 0 };
    })
  );

  const totalCount = counts.reduce((s, c) => s + c.count, 0);

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1/2 — HERO
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-b border-[var(--ai-border-subtle)]">
        <Watermark text="FREELANCES" position="bottom" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
          <SectionLabel index={1} total={2} label="Toutes categories" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-8">
              <h1
                className="font-black text-[var(--ai-text)] uppercase mb-6"
                style={{
                  fontSize: "clamp(40px, 7vw, 80px)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.05em",
                }}
              >
                Tous les freelances
                <br />
                <span className="text-[var(--ai-text-tertiary)]">tech.</span>
              </h1>
              <p className="text-base sm:text-lg text-[var(--ai-text-secondary)] max-w-2xl leading-relaxed">
                {totalCount > 0
                  ? `Notre base compte ${totalCount.toLocaleString("fr-FR")} freelances tech actifs en France et Europe, repartis sur 6 categories.`
                  : "Notre base regroupe des freelances tech actifs en France et Europe, repartis sur 6 categories."}{" "}
                Choisissez la categorie qui matche votre besoin ou deposez directement votre brief — notre IA fait le matching.
              </p>
            </div>

            <div className="lg:col-span-4 lg:pb-4">
              <div className="flex items-baseline gap-3 mb-2">
                <svg
                  className="w-6 h-6 text-[var(--ai-accent)] flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  style={{ transform: "translateY(2px)" }}
                >
                  <path d="M7 17L17 7M17 7H9M17 7V15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span
                  className="text-4xl sm:text-5xl font-black text-[var(--ai-text)] tracking-tight"
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  {totalCount >= 1000 ? (totalCount / 1000).toFixed(0) + "k" : totalCount}
                </span>
              </div>
              <p
                className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)]"
                style={{ letterSpacing: "0.18em" }}
              >
                Freelances tech
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2/2 — CATEGORIES GRID
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[var(--ai-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
          <SectionLabel index={2} total={2} label="Categories" />

          <h2
            className="font-black text-[var(--ai-text)] uppercase mb-10"
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              lineHeight: 1,
              letterSpacing: "-0.04em",
            }}
          >
            6 categories tech
            <br />
            <span className="text-[var(--ai-text-tertiary)]">a explorer.</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {counts.map((cat) => (
              <Link
                key={cat.slug}
                href={`/ai/${cat.slug}`}
                className="group bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl p-6 hover:border-[var(--ai-text)] transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-5">
                  <div
                    className="grid grid-cols-2 grid-rows-2 gap-[2px] w-6 h-6 transition-transform duration-200 group-hover:rotate-90"
                    aria-hidden="true"
                  >
                    <div className="bg-[var(--ai-accent)] rounded-[1px]" />
                    <div className="bg-[var(--ai-text)] rounded-[1px]" />
                    <div className="bg-[var(--ai-text)] rounded-[1px]" />
                    <div className="bg-[var(--ai-accent)] rounded-[1px]" />
                  </div>
                  <span
                    className="text-[11px] font-medium text-[var(--ai-text-tertiary)] tracking-wider"
                    style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    {cat.count >= 1000
                      ? (cat.count / 1000).toFixed(1).replace(".0", "") + "k"
                      : cat.count}{" "}
                    pros
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[var(--ai-text)] mb-2 leading-tight tracking-tight">
                  {cat.name}
                </h3>

                {cat.description && (
                  <p className="text-[13px] text-[var(--ai-text-secondary)] leading-relaxed mb-4 line-clamp-2">
                    {cat.description}
                  </p>
                )}

                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ai-text)] group-hover:text-[var(--ai-accent)] transition-colors mt-2">
                  Voir les freelances
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>

          {/* CTA composite bar bottom */}
          <div className="mt-12 max-w-2xl">
            <p className="text-[12px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-4" style={{ letterSpacing: "0.18em" }}>
              Pas sur de la categorie ?
            </p>
            <Link
              href="/ai/deposer"
              className="group flex flex-col sm:flex-row items-stretch bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-xl overflow-hidden hover:border-[var(--ai-text)] hover:-translate-y-0.5 transition-all duration-200"
              style={{ boxShadow: "var(--ai-shadow-md)" }}
            >
              <div className="flex-1 flex items-center gap-3 px-5 py-4 min-w-0">
                <div
                  className="grid grid-cols-2 grid-rows-2 gap-[2px] w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:rotate-90"
                  aria-hidden="true"
                >
                  <div className="bg-[var(--ai-accent)] rounded-[1px]" />
                  <div className="bg-[var(--ai-text)] rounded-[1px]" />
                  <div className="bg-[var(--ai-text)] rounded-[1px]" />
                  <div className="bg-[var(--ai-accent)] rounded-[1px]" />
                </div>
                <span className="text-[14px] sm:text-[15px] text-[var(--ai-text-secondary)] truncate">
                  L&apos;IA matche votre brief en 60s
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-[var(--ai-accent)] group-hover:bg-[var(--ai-accent-hover)] text-white px-6 sm:px-7 py-4 transition-colors duration-200">
                <span className="text-[14px] font-semibold whitespace-nowrap tracking-tight">
                  Deposer un projet
                </span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
