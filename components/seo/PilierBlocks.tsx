import Link from "next/link";
import { ShieldCheckArt } from "@/components/seo/PilierArt";

/**
 * Blocs partagés des pages pilier SEO (/[metier]/urgence,
 * /[metier]/obligation, /[metier]/installation).
 *
 * Extraits de app/(public)/[metier]/urgence/page.tsx au 3e usage.
 * Tous les chiffres affichés viennent de lib/data/urgence-content.ts
 * (sourcé Perplexity) — zéro chiffre inventé, zéro promesse de délai.
 */

export function fmtEur(n: number): string {
  return n.toLocaleString("fr-FR");
}

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

type PriceRange = { label: string; low: number; high: number };

/**
 * Carte des prix constatés : fourchettes visuelles (barres min→max sur une
 * échelle commune) + bandeau sources cliquables.
 */
export function PriceRangesCard({
  heading,
  metaLabel,
  priceRanges,
  sources,
}: {
  heading: string;
  metaLabel: string;
  priceRanges: PriceRange[];
  sources: string[];
}) {
  const maxHigh = Math.max(...priceRanges.map((p) => p.high));
  return (
    <div className="rounded-2xl border border-[var(--card-border)] overflow-hidden">
      <div className="bg-[var(--bg-secondary)] px-6 py-3 border-b border-[var(--card-border)] flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">
          {heading}
        </h2>
        <span className="text-xs text-[var(--text-tertiary)]">{metaLabel}</span>
      </div>
      <div className="text-sm">
        {priceRanges.map((r, i) => {
          const left = (r.low / maxHigh) * 100;
          const width = Math.max(((r.high - r.low) / maxHigh) * 100, 4);
          return (
            <div
              key={i}
              className="px-6 py-4 border-b border-[var(--card-border)] last:border-0"
            >
              <div className="flex items-baseline justify-between gap-4 mb-2.5">
                <span className="text-[var(--text-secondary)]">{r.label}</span>
                <span className="font-semibold text-[var(--text-primary)] whitespace-nowrap">
                  {fmtEur(r.low)} € à {fmtEur(r.high)} €
                </span>
              </div>
              <div
                className="relative h-1.5 rounded-full bg-[var(--bg-secondary)]"
                aria-hidden="true"
              >
                <div
                  className="absolute top-0 h-full rounded-full"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    background:
                      "linear-gradient(90deg, var(--accent), var(--accent-hover))",
                    opacity: 0.85,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-6 py-2.5 bg-[var(--bg-secondary)] border-t border-[var(--card-border)] text-xs text-[var(--text-tertiary)]">
        Sources :{" "}
        {sources.slice(0, 4).map((u, i) => (
          <span key={i}>
            {i > 0 && ", "}
            <a
              href={u}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="underline hover:text-[var(--accent)]"
            >
              {hostnameOf(u)}
            </a>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Callout avec icône horloge (majorations / haute saison). */
export function InfoCallout({ title, text }: { title: string; text: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-[var(--card-border)] bg-[var(--bg-secondary)] p-5 flex gap-3.5">
      <svg
        className="w-5 h-5 shrink-0 mt-0.5 text-[var(--accent)]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
        <span className="font-semibold text-[var(--text-primary)]">{title}</span>{" "}
        {text}
      </p>
    </div>
  );
}

/** CTA héro — au-dessus de la ligne de flottaison. */
export function HeroCta({
  href,
  label,
  note,
}: {
  href: string;
  label: string;
  note: string;
}) {
  return (
    <div className="mb-12 flex flex-col sm:flex-row sm:items-center gap-4">
      <Link
        href={href}
        className="inline-flex items-center justify-center bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-7 py-3.5 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02] whitespace-nowrap"
        style={{ boxShadow: "0 4px 16px -4px rgba(255,90,54,0.45)" }}
      >
        {label}
      </Link>
      <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">{note}</p>
    </div>
  );
}

/** CTA contextuel post-prix — pic de confiance après les prix honnêtes. */
export function PostPriceCta({
  href,
  text,
  linkLabel,
}: {
  href: string;
  text: string;
  linkLabel: string;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-[var(--accent)]/25 bg-[var(--accent-muted)] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <p className="text-sm text-[var(--text-primary)] font-medium leading-relaxed">
        {text}
      </p>
      <Link
        href={href}
        className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-[var(--accent)] hover:underline whitespace-nowrap shrink-0"
      >
        {linkLabel}
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14" />
          <path d="M12 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

/** Liste des arnaques (cards avec icône triangle d'alerte). */
export function ScamWarningsList({ warnings }: { warnings: string[] }) {
  return (
    <ul className="space-y-3">
      {warnings.map((w, i) => (
        <li
          key={i}
          className="flex gap-3.5 rounded-2xl border border-[var(--card-border)] p-5"
        >
          <svg
            className="w-5 h-5 shrink-0 mt-0.5 text-[var(--accent)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {w.trim()}
          </p>
        </li>
      ))}
    </ul>
  );
}

/** CTA post-arnaques — pic émotionnel : on propose la voie sûre. */
export function PostScamCta({
  href,
  text,
  buttonLabel,
}: {
  href: string;
  text: string;
  buttonLabel: string;
}) {
  return (
    <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--bg-secondary)] px-5 py-4">
      <ShieldCheckArt className="w-8 h-8 shrink-0 text-[var(--text-primary)]" />
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed flex-1">
        {text}
      </p>
      <Link
        href={href}
        className="inline-flex items-center justify-center border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-250 whitespace-nowrap shrink-0"
      >
        {buttonLabel}
      </Link>
    </div>
  );
}

/** Liste numérotée des bons réflexes. */
export function GoodReflexesList({ reflexes }: { reflexes: string[] }) {
  return (
    <ul className="space-y-4">
      {reflexes.map((r, i) => (
        <li key={i} className="flex gap-4 items-start">
          <span className="w-7 h-7 shrink-0 rounded-full bg-[var(--accent-muted)] text-[var(--accent)] text-[13px] font-bold flex items-center justify-center">
            {i + 1}
          </span>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed pt-1">
            {r.trim()}
          </p>
        </li>
      ))}
    </ul>
  );
}

/** Encart "Bon à savoir" (SIRET vérifié au registre SIRENE). */
export function SiretNote({ text }: { text: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-[var(--card-border)] bg-[var(--bg-secondary)] p-5">
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
        <span className="font-semibold text-[var(--text-primary)]">
          Bon à savoir :
        </span>{" "}
        {text}
      </p>
    </div>
  );
}

/** Liste des points légaux (cards avec icône document). */
export function LegalFactsList({ facts }: { facts: string[] }) {
  return (
    <ul className="space-y-3">
      {facts.map((f, i) => (
        <li
          key={i}
          className="flex gap-3.5 rounded-2xl border border-[var(--card-border)] bg-[var(--bg-secondary)] p-5"
        >
          <svg
            className="w-5 h-5 shrink-0 mt-0.5 text-[var(--text-tertiary)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {f.trim()}
          </p>
        </li>
      ))}
    </ul>
  );
}

/** CTA principal final (carte centrée avec bouclier). */
export function FinalCtaSection({
  href,
  title,
  text,
  buttonLabel,
  footnote,
}: {
  href: string;
  title: string;
  text: string;
  buttonLabel: string;
  footnote: string;
}) {
  return (
    <section className="mb-12 rounded-2xl bg-[var(--accent-muted)] border border-[var(--accent)]/20 p-6 sm:p-8 text-center">
      <ShieldCheckArt className="w-12 h-12 mx-auto mb-4 text-[var(--text-primary)]" />
      <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
        {title}
      </h2>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-md mx-auto mb-6">
        {text}
      </p>
      <Link
        href={href}
        className="inline-flex items-center justify-center bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-8 py-3.5 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02]"
        style={{ boxShadow: "0 4px 16px -4px rgba(255,90,54,0.45)" }}
      >
        {buttonLabel}
      </Link>
      <p className="mt-3 text-xs text-[var(--text-tertiary)]">{footnote}</p>
    </section>
  );
}

/** Carte de maillage interne (grille en pied de page). */
export function MaillageCard({
  href,
  title,
  subtitle,
}: {
  href: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-[var(--card-border)] p-5 hover:border-[var(--accent)] transition-colors duration-200"
    >
      <span className="text-sm font-semibold text-[var(--text-primary)]">
        {title}
      </span>
      <span className="block text-xs text-[var(--text-tertiary)] mt-1">
        {subtitle}
      </span>
    </Link>
  );
}

/** Pills de maillage villes. */
export function VillePills({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <>
      <h2 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-3">
        {title}
      </h2>
      <ul className="flex flex-wrap gap-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="inline-flex items-center px-3.5 py-2 rounded-full border border-[var(--card-border)] text-[13px] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)] transition-colors duration-200"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
