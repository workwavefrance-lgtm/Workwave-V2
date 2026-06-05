import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import SeoContent from "@/components/seo/SeoContent";
import FaqAccordion from "@/components/seo/FaqAccordion";
import StickyProjectCTA from "@/components/listing/StickyProjectCTA";
import { toBreadcrumbSchema, getFaqSchema } from "@/lib/utils/schema";
import { BASE_URL } from "@/lib/constants";
import type { PriceGuide } from "@/lib/queries/price-guides";

type RelatedLink = { slug: string; h1: string };

function fmtEur(n: number): string {
  return n.toLocaleString("fr-FR");
}
function rangeLabel(low: number | null, high: number | null, unit: string): string {
  if (low != null && high != null) return `${fmtEur(low)} € à ${fmtEur(high)} €${unit ? " " + unit : ""}`;
  if (low != null) return `à partir de ${fmtEur(low)} €${unit ? " " + unit : ""}`;
  if (high != null) return `jusqu'à ${fmtEur(high)} €${unit ? " " + unit : ""}`;
  return "sur devis";
}

/** CTA réutilisable — déposer un projet (mise en relation = notre avantage). */
function DepositCTA({
  metierSlug,
  label,
  sub,
}: {
  metierSlug: string;
  label: string;
  sub?: string;
}) {
  return (
    <div className="my-10 rounded-2xl border border-[var(--card-border)] bg-[var(--bg-secondary)] p-6 sm:p-8 text-center">
      <p className="text-lg font-bold text-[var(--text-primary)] mb-1.5">{label}</p>
      {sub && <p className="text-sm text-[var(--text-secondary)] mb-5 max-w-md mx-auto">{sub}</p>}
      <Link
        href={`/deposer-projet?categorie=${metierSlug}`}
        className="inline-flex items-center justify-center bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-8 py-3.5 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02]"
        style={{ boxShadow: "0 4px 16px -4px rgba(255,90,54,0.45)" }}
      >
        Recevoir 3 devis gratuits →
      </Link>
      <p className="mt-3 text-xs text-[var(--text-tertiary)]">Gratuit · sans engagement · réponse sous 24h</p>
    </div>
  );
}

export default function PriceGuide({
  guide,
  categoryName,
  metierSlug,
  related,
  deptSlug,
  deptName,
}: {
  guide: PriceGuide;
  categoryName: string;
  metierSlug: string;
  related: RelatedLink[];
  deptSlug: string;
  deptName: string;
}) {
  const isMetier = guide.scope === "metier";
  const canonical = isMetier ? `${BASE_URL}/${metierSlug}/prix` : `${BASE_URL}/guide-des-prix/${guide.slug}`;

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Guides des prix", href: "/guide-des-prix" },
    ...(isMetier ? [] : [{ label: categoryName, href: `/${metierSlug}/prix` }]),
    { label: guide.h1 },
  ];

  const ranges = Array.isArray(guide.price_ranges) ? guide.price_ranges : [];
  const devis = Array.isArray(guide.devis_examples) ? guide.devis_examples : [];
  const faqs = (Array.isArray(guide.faq) ? guide.faq : []).map((f) => ({ question: f.q, answer: f.a }));

  // ─── Schemas ───────────────────────────────────────────────────────────
  const breadcrumbJsonLd = toBreadcrumbSchema(breadcrumbItems, BASE_URL);
  const faqJsonLd = faqs.length ? getFaqSchema(faqs) : null;
  const offerCatalog =
    ranges.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "Service",
          name: guide.h1,
          serviceType: categoryName,
          areaServed: { "@type": "Country", name: "France" },
          provider: { "@type": "Organization", name: "Workwave", url: BASE_URL },
          offers: ranges
            .filter((r) => r.low != null || r.high != null)
            .map((r) => ({
              "@type": "Offer",
              itemOffered: { "@type": "Service", name: r.label },
              priceSpecification: {
                "@type": "PriceSpecification",
                priceCurrency: "EUR",
                ...(r.low != null ? { minPrice: r.low } : {}),
                ...(r.high != null ? { maxPrice: r.high } : {}),
              },
            })),
        }
      : null;

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <JsonLd data={breadcrumbJsonLd} />
      {offerCatalog && <JsonLd data={offerCatalog} />}
      {faqJsonLd && <JsonLd data={faqJsonLd} />}
      <StickyProjectCTA
        categorySlug={metierSlug}
        categoryName={categoryName}
        citySlug={null}
        locationName="près de chez vous"
        preposition=""
      />

      <Breadcrumb items={breadcrumbItems} />

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
        {guide.h1}
      </h1>
      {guide.price_retrieved_at && (
        <p className="text-sm text-[var(--text-tertiary)] mb-6">
          Fourchettes de prix indicatives · mises à jour {new Date(guide.price_retrieved_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </p>
      )}

      {/* Badge prix "coup d'œil" — la réponse immédiate, tout en haut */}
      {ranges.length > 0 && (
        <div className="mb-8 rounded-2xl bg-[var(--accent-muted)] border border-[var(--accent)]/20 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)] mb-1">
              {ranges[0].label}
            </p>
            <p className="text-3xl sm:text-4xl font-bold text-[var(--accent)] tracking-tight">
              {rangeLabel(ranges[0].low, ranges[0].high, ranges[0].unit)}
            </p>
          </div>
          <Link
            href={`/deposer-projet?categorie=${metierSlug}`}
            className="shrink-0 inline-flex items-center justify-center bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-3 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02]"
          >
            Devis gratuit →
          </Link>
        </div>
      )}

      {/* Encart fourchette de prix — tout en haut (le réflexe travaux.com) */}
      {ranges.length > 0 && (
        <div className="rounded-2xl border border-[var(--card-border)] overflow-hidden mb-8">
          <div className="bg-[var(--bg-secondary)] px-6 py-3 border-b border-[var(--card-border)]">
            <h2 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">
              Prix moyens
            </h2>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {ranges.map((r, i) => (
                <tr key={i} className="border-b border-[var(--card-border)] last:border-0">
                  <td className="px-6 py-3 text-[var(--text-secondary)]">{r.label}</td>
                  <td className="px-6 py-3 text-right font-semibold text-[var(--text-primary)] whitespace-nowrap">
                    {rangeLabel(r.low, r.high, r.unit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {guide.price_sources?.length > 0 && (
            <div className="px-6 py-2.5 bg-[var(--bg-secondary)] border-t border-[var(--card-border)] text-xs text-[var(--text-tertiary)]">
              Sources :{" "}
              {guide.price_sources.slice(0, 3).map((u, i) => (
                <span key={i}>
                  {i > 0 && ", "}
                  <a href={u} target="_blank" rel="noopener noreferrer nofollow" className="underline hover:text-[var(--accent)]">
                    {(() => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return "source"; } })()}
                  </a>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CTA héro — convertir tout de suite */}
      <DepositCTA
        metierSlug={metierSlug}
        label={`Votre projet ${categoryName.toLowerCase()} ?`}
        sub="Décrivez votre besoin en 30 secondes, des artisans qualifiés près de chez vous vous envoient un devis gratuit."
      />

      {/* Intro */}
      {guide.intro_md && <SeoContent content={guide.intro_md} />}

      {/* Facteurs de variation */}
      {guide.factors_md && (
        <div className="mt-10">
          <SeoContent content={guide.factors_md} />
        </div>
      )}

      {/* Exemples de devis */}
      {devis.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-6">
            Exemples de devis
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {devis.map((d, i) => (
              <div key={i} className="rounded-2xl border border-[var(--card-border)] bg-[var(--bg-secondary)] p-5">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{d.label}</p>
                {d.detail && <p className="mt-1.5 text-xs text-[var(--text-secondary)] leading-relaxed">{d.detail}</p>}
                <p className="mt-3 text-lg font-bold text-[var(--accent)]">{d.total}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA milieu */}
      <DepositCTA metierSlug={metierSlug} label="Comparez les devis avant de vous décider" />

      {/* FAQ (UI + schema FAQPage déjà injecté) */}
      {faqs.length > 0 && <FaqAccordion faqs={faqs} />}

      {/* Maillage interne */}
      <div className="mt-14 pt-8 border-t border-[var(--border-color)]">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Link
            href={`/${metierSlug}/${deptSlug}`}
            className="flex-1 rounded-2xl border border-[var(--card-border)] p-5 hover:border-[var(--accent)] transition-colors duration-200"
          >
            <span className="text-sm font-semibold text-[var(--text-primary)]">Voir les {categoryName.toLowerCase()}s en {deptName}</span>
            <span className="block text-xs text-[var(--text-tertiary)] mt-1">Artisans vérifiés près de chez vous</span>
          </Link>
          {!isMetier && (
            <Link
              href={`/${metierSlug}/prix`}
              className="flex-1 rounded-2xl border border-[var(--card-border)] p-5 hover:border-[var(--accent)] transition-colors duration-200"
            >
              <span className="text-sm font-semibold text-[var(--text-primary)]">Tous les prix {categoryName.toLowerCase()}</span>
              <span className="block text-xs text-[var(--text-tertiary)] mt-1">Le guide complet des tarifs</span>
            </Link>
          )}
        </div>

        {related.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-3">
              Guides de prix connexes
            </h2>
            <ul className="flex flex-wrap gap-2">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/guide-des-prix/${r.slug}`}
                    className="inline-flex items-center px-3.5 py-2 rounded-full border border-[var(--card-border)] text-[13px] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)] transition-colors duration-200"
                  >
                    {r.h1}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* CTA bas */}
      <DepositCTA
        metierSlug={metierSlug}
        label={`Prêt à lancer votre projet ${categoryName.toLowerCase()} ?`}
        sub="Workwave met en relation avec des artisans près de chez vous. Comparez gratuitement plusieurs devis."
      />
      {/* canonical via metadata côté page */}
      <link rel="canonical" href={canonical} />
    </main>
  );
}
