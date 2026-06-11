import Link from "next/link";
import Image from "next/image";
import type { ProCardData } from "@/lib/types/database";
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
  specialitySlug,
}: {
  pro: ProCardData;
  rank: number;
  categorySlug: string;
  citySlug: string | null;
  /** Slug de la sous-specialite si on est sur /[metier]/[specialite]/[ville] */
  specialitySlug?: string | null;
}) {
  const initial = pro.name.charAt(0).toUpperCase();
  const summary = buildProSummary(pro);
  // On retire la pastille "avis Google" des badges : elle est desormais
  // affichee dans le bloc avis dedie (etoiles + lien). Evite le doublon.
  const badges = buildProBadges(pro).filter((b) => !b.includes("avis Google"));

  // Bloc avis : on affiche la note + le nombre d'avis Google (donnee factuelle
  // qu'on a en base pour 281 pros). Lien "Voir sur Google" via google_place_id
  // = on RENVOIE vers la fiche Google (compliant, pas de republication de texte
  // d'avis scrape, ce qui violerait les CGU Google + le droit d'auteur des
  // auteurs). Le texte d'avis viendra plus tard des avis natifs Workwave.
  const rating = pro.google_rating;
  const reviewsCount = pro.google_reviews_count;
  const hasGoogleReviews = typeof rating === "number" && rating > 0 && (reviewsCount ?? 0) > 0;
  const googleReviewsUrl = pro.google_place_id
    ? `https://search.google.com/local/reviews?placeid=${pro.google_place_id}`
    : null;
  // Etoiles pleines / demi / vides pour la note (sur 5).
  const fullStars = hasGoogleReviews ? Math.floor(rating as number) : 0;
  const halfStar = hasGoogleReviews && (rating as number) - fullStars >= 0.25 && (rating as number) - fullStars < 0.75;
  const roundedUp = hasGoogleReviews && (rating as number) - fullStars >= 0.75;

  // Lien devis avec contexte pre-rempli (categorie + ville + specialite si dispo)
  const projectParams = new URLSearchParams();
  projectParams.set("categorie", categorySlug);
  if (citySlug) projectParams.set("ville", citySlug);
  if (specialitySlug) projectParams.set("specialite", specialitySlug);
  const projectHref = `/deposer-projet?${projectParams.toString()}`;

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

          {/* Badge "Fiche reclamee" : signal de confiance pour les particuliers. */}
          {pro.claimed_by_user_id && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 mb-1.5">
              <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Fiche réclamée
              </span>
            </div>
          )}

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

      {/* Bloc avis Google : etoiles + note + nombre + lien vers la fiche Google */}
      {hasGoogleReviews && (
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-0.5" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => {
              const filled = i < fullStars || (i === fullStars && roundedUp);
              const half = i === fullStars && halfStar;
              return (
                <svg key={i} className="w-[15px] h-[15px]" viewBox="0 0 20 20">
                  <defs>
                    <linearGradient id={`half-${pro.id}-${i}`}>
                      <stop offset="50%" stopColor="#FBBF24" />
                      <stop offset="50%" stopColor="#D1D5DB" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L10 14.77l-5.2 2.73.99-5.79L1.58 7.62l5.82-.85L10 1.5z"
                    fill={half ? `url(#half-${pro.id}-${i})` : filled ? "#FBBF24" : "#D1D5DB"}
                  />
                </svg>
              );
            })}
          </span>
          <span className="text-[13px] font-semibold text-[var(--text-primary)]">
            {(rating as number).toFixed(1)}
          </span>
          {googleReviewsUrl ? (
            <a
              href={googleReviewsUrl}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
            >
              {reviewsCount} avis Google →
            </a>
          ) : (
            <span className="text-[12px] text-[var(--text-secondary)]">
              {reviewsCount} avis Google
            </span>
          )}
        </div>
      )}

      {/* Badges (RGE, certifs, anciennete) */}
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
