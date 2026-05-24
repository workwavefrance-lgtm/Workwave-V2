import Link from "next/link";
import Image from "next/image";
import type { ProWithRelations } from "@/lib/types/database";
import { buildProSummary, buildProBadges } from "@/lib/utils/pro-summary";

/**
 * Card enrichie pour les pages "Top X meilleurs [metier] a [ville]".
 *
 * Difference vs ProCard standard :
 * - Numero de rang affiche (1, 2, 3, ...)
 * - Phrase "Pourquoi choisir [pro]" auto-construite
 * - Badges visuels (RGE, anciennete, note Google si dispo)
 * - 2 CTAs distincts : "Voir la fiche" + "Demander un devis"
 *
 * Pas de logique d'affaire ici — tout est cote helpers (buildProSummary,
 * buildProBadges). Composant pur visuel.
 */
export default function TopProCard({
  pro,
  rank,
  categorySlug,
  citySlug,
}: {
  pro: ProWithRelations;
  rank: number;
  categorySlug: string;
  citySlug: string | null;
}) {
  const initial = pro.name.charAt(0).toUpperCase();
  const summary = buildProSummary(pro);
  const badges = buildProBadges(pro);

  // Lien devis avec contexte pre-rempli
  const projectHref = citySlug
    ? `/deposer-projet?categorie=${categorySlug}&ville=${citySlug}`
    : `/deposer-projet?categorie=${categorySlug}`;

  return (
    <article className="group relative bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 sm:p-6 transition-all duration-250 hover:-translate-y-1 hover:shadow-lg hover:border-[var(--accent)]">
      {/* Badge "Rang" en haut a gauche : #1, #2, #3 etc. */}
      <span
        className="absolute -top-2.5 left-5 inline-flex items-center justify-center min-w-[28px] h-[28px] px-2 rounded-full text-[12px] font-bold text-white tracking-tight"
        style={{
          background:
            "linear-gradient(135deg, #FF7A5C 0%, #FF5A36 60%, #D63916 100%)",
          boxShadow: "0 2px 6px -1px rgba(255, 90, 54, 0.4)",
        }}
        aria-label={`Classé numéro ${rank}`}
      >
        #{rank}
      </span>

      <div className="flex gap-4 mb-4">
        {/* Logo ou initiale */}
        {pro.logo_url ? (
          <Image
            src={pro.logo_url}
            alt={`Logo ${pro.name}`}
            width={56}
            height={56}
            className="w-14 h-14 rounded-full object-cover border border-[var(--card-border)] shrink-0"
          />
        ) : (
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--accent-muted)" }}
          >
            <span className="text-[var(--accent)] font-bold text-xl">
              {initial}
            </span>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-[17px] text-[var(--text-primary)] leading-tight mb-1 tracking-tight">
            <Link
              href={`/artisan/${pro.slug}`}
              className="hover:text-[var(--accent)] transition-colors"
            >
              {pro.name}
            </Link>
          </h3>

          {pro.city && (
            <p className="text-[13px] text-[var(--text-secondary)]">
              {pro.category?.name ?? "Artisan"} · {pro.city.name}
              {pro.postal_code ? ` (${pro.postal_code})` : ""}
            </p>
          )}
        </div>
      </div>

      {/* Pourquoi choisir [pro] */}
      <p className="text-[14px] text-[var(--text-primary)] leading-relaxed mb-3 line-clamp-3">
        {summary}
      </p>

      {/* Badges (RGE, certifs, anciennete, note Google) */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {badges.map((badge) => (
            <span
              key={badge}
              className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F3F4F6] dark:bg-[#1F1F23] text-[var(--text-secondary)] border border-[var(--card-border)]"
            >
              {badge}
            </span>
          ))}
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <Link
          href={`/artisan/${pro.slug}`}
          className="flex-1 inline-flex items-center justify-center h-9 px-3 text-[13px] font-medium rounded-full border border-[var(--card-border)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all duration-150"
        >
          Voir la fiche
        </Link>
        <Link
          href={projectHref}
          className="flex-1 inline-flex items-center justify-center h-9 px-3 text-[13px] font-semibold rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-all duration-150"
          style={{ boxShadow: "0 2px 8px -2px rgba(255, 90, 54, 0.4)" }}
        >
          Demander un devis
        </Link>
      </div>
    </article>
  );
}
